/**
 * Rpc Service Class
 */
const db = require('../../common/config/db.json');
const dt = require('../dao/config/const.json');
const log = require('../util/log');
const history = require('./helper/history');
const _ = require('../util/utility');
const Forbidden = require('../error/fe/ForbiddenError');
const notification = require('./helper/notification');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const ResourceClientService = require('./ResourceClientService');
const ResWithParamService = require('./ResWithParamService');

class RpcService extends ResWithParamService {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._type = db.RES_TYP_RPC;
    this._dao = new (require('../dao/RpcDao'))({context});
    this._paramCombinationDao = new (require('../dao/ParameterCombinationDao'))({context});
    this._vDAO = new (require('../dao/ViewDao'))({context});
    this._paramDao = new (require('../dao/ParamDataTypeDao'))({context});
    this._pDAO = new (require('../dao/ProjectDao'))({context});
    this._uDAO = new (require('../dao/UserDao'))({context});
    this._cDAO = new (require('../dao/ConstraintDao'))({context});
    this._vDAO = new (require('../dao/ViewDao'))({context});
    this._rvDAO = new (require('../dao/ResourceVersionDao'))({context});
    this._rwDAO = new (require('../dao/ResourceWatchDao'))({context});

    this._progroupService = new (require('./ProGroupService'))(uid, context);
    this._paramRpcReqService = new (require('./ParamRpcReqService'))(uid, context);
    this._paramRpcResService = new (require('./ParamRpcResService'))(uid, context);
    this._paramServiceMap = {
      [db.PAM_TYP_RPC_INPUT]: this._paramRpcReqService,
      [db.PAM_TYP_RPC_OUTPUT]: this._paramRpcResService,
    };
    this._dataTypeService = new (require('./DataTypeService'))(uid, context);
    this._resourceVersionService = new (require('./ResourceVersionService'))(uid, context);
    this._notificationResourceService = new (require('./NotificationResourceService'))(uid, context);
    this._callApiMockService = new (require('./CallApiMockService'))(context);
  }

  /**
   * create resource record
   * @param {Object} obj - resource object
   * @param {Object} conflictOpt - conflict check options
   * @return
   */
  * create(model, conflictOpt) {
    let progroup = yield this._progroupService.getProgroupDetailByProjectId(model.projectId);
    model.statusId = db.STATUS_SYS_UNDERDEVELOPMENT;
    model.type = db.INTERFACE_TYP_RPC;

    let userIds = model.userIds;
    delete model.userIds;

    yield this._beginTransaction();
    let newPrc = yield super.create(model, conflictOpt);
    let needUpdateCache = false;
    if (userIds && userIds.length > 0) {
      yield this._rwDAO.createBatch(
        userIds.map(it => {
          return {
            resType: this._dao._type,
            resId: newPrc.id,
            projectId: model.projectId,
            progroupId: model.progroupId,
            userId: it,
          };
        })
      );
      // 更新缓存
      needUpdateCache = true;
    }
    if (progroup.apiAudit) {
      let auditRecord = yield this.createAuditRecord(newPrc.id);
      if (auditRecord !== null) { // 审核中、创建者、管理员的接口无需审核
        newPrc = yield this.update({statusId: db.STATUS_SYS_AUDITING, id: newPrc.id});
      }
    }
    yield this._endTransaction();
    if (needUpdateCache) {
      yield this._cache.remove(`${this._dao._type}${dt.RES_WATCH}${model.projectId}`);
    }
    yield this._fillWatch(newPrc);
    return newPrc;
  }

  /**
   * 审核接口
   */
  * audit(model) {
    // todo 判断此人是否有权限审核
    let auditService = new (require('./AuditService'))(this._uid, this._context);
    return yield auditService.audit(model, db.INTERFACE_TYP_RPC);
  }

  /**
   * 创建审核记录
   */
  * createAuditRecord(rpcId, recreate = false) {
    // 判断该接口不能存在未决策的审核记录
    let auditService = new (require('./AuditService'))(this._uid, this._context);
    return yield auditService.create(rpcId, db.INTERFACE_TYP_RPC, recreate);
  }

  /**
   * 重新创建审核记录
   * @param id
   */
  * reCreateAuditRecord(id) {
    let rpc = yield this.findDetailById(id);
    if (rpc.statusId !== db.STATUS_SYS_AUDIT_FAILED) {
      throw new IllegalRequestError('该接口不处在审核失败状态中，不应被重开申请');
    }

    let ret = yield this.createAuditRecord(id, true);
    yield this.update({id: rpc.id, statusId: db.STATUS_SYS_AUDITING});
    return ret;
  }

  /**
   * remove rpcs
   *
   * @param {Array} ids - rpc id list
   * @return {model/db/Rpc} rpc list
   */
  * removeBatch(ids) {
    yield this._beginTransaction();
    for (let parentId of ids) {
      yield this._paramRpcReqService.remove({parentId}, {clearAll: true, sendMsg: false});
      yield this._paramRpcResService.remove({parentId}, {clearAll: true, sendMsg: false});
    }
    let ret = yield super.removeBatch(ids);
    // 删除与接口相关的审核记录、消息通知
    let auditService = new (require('./AuditService'))(this._uid, this._context);
    yield auditService._dao.removeBatch({
      interfaceId: ids
    });
    yield this._notificationResourceService.removeByRes(ids, [db.RES_TYP_RPC, db.RES_TYP_AUDIT]);

    yield this._endTransaction();
    yield this._fillVersions(ret);

    return ret;
  }

  /**
   * import rpc from Swagger/JSON
   * @param model
   * @param {Number} model.groupId - group id
   * @param {Number} model.projectId - project id
   * @param {String} model.tag - 共同tag
   * @param {Array{*}} model.datatypes
   * @param {Array{*}} model.rpcs
   * @return {*}
   */
  * importBatch(model) {
    let permission = yield this._checkCreatePermission(model.projectId);
    let progroupId = permission.progroupId;

    // 首先导入所有需要的数据模型
    let datatypes = model.datatypes;

    yield this._beginTransaction();
    let {anonyIdToId, importDts} = yield this._dataTypeService.addList({
      projectId: model.projectId,
      groupId: model.groupId,
      items: datatypes
    }, true);
    // 这时候匿名类型都已经导入了,包括接口的. 速度大概是1.5s/100个数据模型 的样子
    // 导入所有接口

    let projectDTs = yield this._dataTypeService.getListInProject(model.projectId);
    // 建索引
    let projectDTsindex = {};
    projectDTs.forEach(cur => {
      projectDTsindex[cur.name] = cur;
    });

    model.rpcs.forEach(rpc => {
      rpc.projectId = model.projectId;
      rpc.groupId = model.groupId;
      rpc.progroupId = progroupId;
      rpc.type = db.INTERFACE_TYP_RPC;
      if (model.tag) {
        rpc.tags = rpc.tags + ',' + model.tag;
      }
    });
    let createdRpcs = yield this.createBatch(model.rpcs); // 首先批量创建接口
    let helper = function (rpcParams, parentType, parentId, projectDT, progroupId) {
      // 加上匿名类型支持， 匿名类型需要反过来将引用类型递归展开
      let result = [];
      let imports = new Set();
      for (let i = 0; i < rpcParams.length; i++) {
        let param = rpcParams[i];
        if (param.datatypeName) {
          let dat = projectDT[param.datatypeName];
          if (dat) {
            imports.add(dat.id);
            continue;
          }
        }
        if (param.type < 0) {
          param.type = anonyIdToId[param.type];
        } else {
          if (param.typeName in projectDT) {
            param.type = projectDT[param.typeName].id;
          } else if (this._dataTypeService._isSystemTypeName(param.typeName)) {
            param.type = this._dataTypeService._systemTypeNameToId(param.typeName);
          } else {
            // 未识别类型统一设置为 string，如果不设置，插入数据库的时候会报错
            param.type = db.MDL_SYS_STRING;
          }
        }
        param.adding = true;
        // todo 这里要计算position
        param.parentType = parentType;
        param.parentId = parentId;
        param.id = Date.now();
        param.progroupId = progroupId;
        result.push(param);
      }

      if (result.length || imports.size) {
        let ret = {
          params: result,
          parentId,
          parentType,
        };
        if (imports.size) {
          ret.imports = Array.from(imports).map(id => {
            return {id: id};
          });
        }
        return ret;
      } else {
        return null;
      }
    }.bind(this);
    let addParametersAll = [];
    // 这里要导入数据模型了
    // 规整数据成AttributeService要求的数据
    for (let i = 0; i < model.rpcs.length; i++) {
      let rpcOrigin = model.rpcs[i];
      let createRpc = createdRpcs.find(rpc => {
        return rpc.name === rpcOrigin.name;
      });
      if (!createRpc) {
        console.log(rpcOrigin);
      }
      let temp = helper(rpcOrigin.params.inputs, db.PAM_TYP_RPC_INPUT, createRpc.id, projectDTsindex, progroupId);
      if (temp) {
        addParametersAll.push(temp);
      }
      temp = helper(rpcOrigin.params.outputs, db.PAM_TYP_RPC_OUTPUT, createRpc.id, projectDTsindex, progroupId);
      if (temp) {
        addParametersAll.push(temp);
      }
    }
    yield this.importParamBatch(addParametersAll, progroupId); // 这里也是批量

    yield this._endTransaction();

    let rpcIds = createdRpcs.map(rpc => {
      return rpc.id;
    });
    let rpcs = yield this.findDetailByIds(rpcIds);

    return {
      datatypes: importDts,
      rpcs: rpcs
    };
  }

  /**
   * 批量导入, 专门为swagger导入优化, 其他情况请别使用该方法
   *
   * */
  * importParamBatch(items, progroupId) {
    let toInsertParams = items.map(it => it.params || []).reduce((pre, cur) => {
      return pre.concat(cur);
    }, []);

    let importParams = [];
    items.forEach(it => {
      if (it.imports) {
        importParams = importParams.concat(it.imports.map(id => {
          return {
            parentId: it.parentId,
            parentType: it.parentType,
            datatypeId: id.id,
            progroupId: progroupId
          };
        }));
      }
    });
    if (toInsertParams.length > 0) {
      yield this._paramDao.createBatch(toInsertParams);
    }
    if (importParams.length > 0) {
      yield this._paramCombinationDao.createBatch(importParams);
    }
  }

  /**
   * clone resources
   * @param {Object} obj - clone data
   * @param {Number} obj.pid - project id
   * @param {Number} obj.gid - group id
   * @param {String} obj.tag - tag
   * @param {Array} obj.copys - resource info. e.g. [{id: 1111, name: 'hello'}]
   * @param {Object} obj.version
   * retrun {Array} clone data
   */
  * clone(obj) {
    let newRpcs = yield super.clone(obj);
    if (obj.version) {
      return newRpcs;
    }
    let progroup = yield this._progroupService.getProgroupDetailByProjectId(obj.pid);
    yield this._beginTransaction();

    let retRpcs = [];
    if (progroup.apiAudit) {
      for (let i = 0; i < newRpcs.length; i++) {
        let newRpc = newRpcs[i];
        let auditRecord = yield this.createAuditRecord(newRpc.id);
        if (auditRecord !== null) { // 审核中、创建者、管理员的接口无需审核
          retRpcs.push(yield this.update({statusId: db.STATUS_SYS_AUDITING, id: newRpc.id}));
        } else {
          retRpcs.push(newRpc);
        }
      }
    }
    yield this._endTransaction();

    return newRpcs;
  }

  /**
   * update rpc
   * @param {model/db/Rpc} model - rpc
   * @return {model/db/Rpc} rpc
   */
  * update(model) {
    if (model.hasOwnProperty('name')) {
      let res = yield this._dao.find(model.id);
      yield this._checkConflictInProject(res.projectId, {name: model.name});
    }

    yield this._beginTransaction();

    let ret;

    if (model.hasOwnProperty('versionName')) {
      const interfaceVersion = yield this._resourceVersionService._dao.search({
        conds: {
          resType: db.RES_TYP_RPC,
          resId: model.id
        }
      });
      // 更新版本名
      yield this._resourceVersionService._dao.update({name: model.versionName}, {
        res_id: model.id,
        res_type: db.RES_TYP_RPC
      });
      if (interfaceVersion.length > 0) {
        const inface = yield this._dao.find(model.id);
        this._async(history.log, {
          dName: this._dao.constructor.name,
          oprType: 'update',
          uid: this._uid,
          ret: {
            id: model.id,
            _oData: {
              name: inface.name,
              versionName: interfaceVersion[0].name
            },
            _model: Object.assign({}, model)
          }
        });
      }
      delete model.versionName;
    }

    if (Object.keys(model).some(it => it !== 'id' && it !== 'userIds')) {
      ret = yield super.update(model);
    } else {
      ret = yield this.getById(model.id);
    }
    // 修改参数格式为其他格式，需要清空参数
    let delParentId = model.id;
    let progroupId = ret.progroupId;
    let projectId = ret.projectId;
    let delParentType;
    let format;
    let returnParameter;

    if (model.hasOwnProperty('reqFormat')) {
      delParentType = db.PAM_TYP_RPC_INPUT;
      format = model.reqFormat;
    } else if (model.hasOwnProperty('resFormat')) {
      delParentType = db.PAM_TYP_RPC_OUTPUT;
      format = model.resFormat;
    }

    if (delParentType && delParentId) {
      yield this._paramServiceMap[delParentType].remove({parentId: delParentId}, {
        clearAll: true,
        sendMsg: false
      });
      // 修改参数格式为其他格式，假如是基础类型的，需要追加一条参数
      ret.params = {};
      if (delParentType === db.PAM_TYP_RPC_INPUT) {
        ret.params.inputs = [];
      } else {
        ret.params.outputs = [];
      }
      let formatType = this.getBaseType(format);
      if (formatType != null) {
        if (format === db.MDL_FMT_HASHMAP) {
          // 特殊处理HASHMAP类型的初始化数据
          const formatParameter = [
            {
              name: '键',
              type: formatType,
              parentType: delParentType,
              parentId: delParentId,
              progroupId
            },
            {
              name: '值',
              type: formatType,
              parentType: delParentType,
              parentId: delParentId,
              progroupId
            }
          ];
          returnParameter = yield this._paramServiceMap[delParentType]._dao.createBatch(formatParameter);
        } else {
          let formatParameter = {
            type: formatType,
            parentType: delParentType,
            parentId: delParentId,
            progroupId
          };
          returnParameter = yield this._paramServiceMap[delParentType]._dao.create(formatParameter);
        }
      }
    }

    // 更新关注人
    if (model.hasOwnProperty('userIds')) {
      const watchList = yield this.getWatchList(model.id);
      // 删除所有关注人
      yield this._rwDAO.removeBatch({
        resType: this._dao._type,
        resId: model.id,
        projectId: projectId,
        progroupId: progroupId,
      });
      // 再添加
      if (model.userIds.length > 0) {
        yield this._rwDAO.createBatch(
          model.userIds.map(it => {
            return {
              resType: this._dao._type,
              resId: model.id,
              projectId: projectId,
              progroupId: progroupId,
              userId: it,
            };
          })
        );
      }
      // 打日志
      let difference = watchList.concat(model.userIds)
        .filter(v => !watchList.includes(v) || !model.userIds.includes(v))
        .map(id => (watchList.includes(id) ? {id, op: 'del'} : {id, op: 'add'}));
      this._async(history.log, {
        dName: this._dao.constructor.name,
        oprType: 'watchList',
        uid: this._uid,
        progroupId,
        projectId,
        resType: this._dao._type,
        resId: model.id,
        ret: {
          difference
        }
      });
      //更新缓存
      yield this._cache.remove(`${this._dao._type}${dt.RES_WATCH}${projectId}`);
    }

    yield this._endTransaction();

    if (returnParameter) {
      // 更新类型需要获取追加的参数
      let hash = yield this._dataTypeService.getInProject(projectId);
      returnParameter.typeName = hash[returnParameter.type] ? hash[returnParameter.type].name : 'String';
      if (returnParameter.parentType === db.PAM_TYP_RPC_INPUT) {
        ret.params.inputs = [returnParameter];
      } else {
        ret.params.outputs = [returnParameter];
      }
    }

    yield this._fillParams([ret]);
    yield this._fillVersionDetails(ret);
    yield this._fillVersions([ret]);
    yield this._fillAuditReason([ret]);
    return ret;
  }

  /**
   * 批量修改业务分组
   * @param {Object} obj - update data
   * @param {Object} obj.ids - ids of the resources
   * @param {Object} obj.groupId - bisgroup id to move the resources to
   * @return {Array} 资源列表
   */
  * updateBisGroupBatch(obj) {
    let ret = yield super.updateBisGroupBatch(obj);
    yield this._fillAuditReason(ret);
    return ret;
  }

  /**
   * get rpc detail with params
   * @param {Number} id - rpc id
   * @return {model/db/Rpc} rpc detail with params
   */
  * findDetailById(id) {
    let ret = yield super.findDetailById(id);
    yield this._fillParams([ret]);
    yield this._fillVersions([ret]);
    yield this._fillVersionDetails(ret);
    yield this._fillWatch(ret);
    yield this._fillAuditReason([ret]);
    return ret;
  }

  * getWatchList(id) {
    let ret = yield super.findDetailById(id);
    yield this._fillWatch(ret);
    return ret.watchList;
  }

  /**
   * get rpcs detail with params
   * @param {Number} ids - rpc ids
   * @return {Array model/db/Rpc} rpcs detail with params
   */
  * findDetailByIds(ids) {
    let permissionRet = yield this._checkBatchPermission(ids);
    yield this._checkSearchPermission(permissionRet.id);
    let ret = yield this._dao.findBatch(ids, {
      joins: [
        ...this._dao._getUserJoins(),
        ...this._dao._getStatusJoins()
      ]
    });
    yield this._fillParams(ret);
    yield this._fillVersions(ret);
    yield this._fillAuditReason(ret);
    return ret;
  }

  /**
   * fill params for the rpc. not pure!
   * @param {Array model/db/Rpc} ret - rpcs
   * @return {Void}
   */
  * _fillParams(ret, opt = {}) {
    let ids = (ret || []).map(it => it.id);
    let pids = opt.pids || ((ret || []).map(it => it.projectId).reduce((arr, next) => {
        if (!arr.includes(next)) {
          arr.push(next);
        }
        return arr;
      }, []));
    let hash = opt.dhash || (yield this._dataTypeService.getInProjects(pids));
    let [inputs, outputs] = yield [
      this._paramRpcReqService.getListBatch(ids, hash),
      this._paramRpcResService.getListBatch(ids, hash),
    ];

    for (let item of ret) {
      item.params = {
        inputs: inputs[item.id] || [],
        outputs: outputs[item.id] || [],
      };
    }
  }

  /**
   * fill input params for the rpc.
   * @param {Array model/db/Rpc} ret - rpcs
   * @return {Void}
   */
  * _fillInputParams(ret, opt = {}) {
    let ids = (ret || []).map(it => it.id);
    let pids = opt.pids || ((ret || []).map(it => it.projectId).reduce((arr, next) => {
        if (!arr.includes(next)) {
          arr.push(next);
        }
        return arr;
      }, []));
    let hash = opt.dhash || (yield this._dataTypeService.getInProjects(pids));
    let [inputs] = yield [
      this._paramRpcReqService.getListBatch(ids, hash),
    ];

    for (let item of ret) {
      item.params = {
        inputs: inputs[item.id] || [],
      };
    }
  }

  /**
   * fill history informations. NOT PURE!
   * @param ret
   * @private
   */
  * _fillVersionDetails(ret) {
    if (ret == undefined) {
      return;
    }
    let id = ret.id;
    let origin;
    let versions = yield this._resourceVersionService.getListBatch([id], db.RES_TYP_RPC);
    if (versions.length == 0) { // 说明可能没有创建过版本
      return;
    } else {
      origin = versions[0].origin;
    }
    let details = yield this._dao.search({
      sfields: Object.keys(this._dao._Model.getField()),
      joins: [{
        table: 'resource_version', fkmap: {'res_id': 'id'},
        field: ['origin', 'parent', 'name'],
        alias: 'version',
        conds: {origin: origin, resType: db.RES_TYP_RPC, resId: {op: '!=', value: id}}
      }, ...this._dao._getUserJoins(), ...this._dao._getStatusJoins()]
    });
    ret.versions = details;
  }

  /**
   * fill version informations. NOT PURE!
   * @param ret
   * @private
   */
  * _fillVersions(ret) {
    let ids = (ret || []).map(it => it.id);
    let versions = yield this._resourceVersionService.getListBatch(ids, db.RES_TYP_RPC);
    ret.forEach(item => {
      let v = versions.find(version => version.resId === item.id);
      if (v) {
        item.version = {
          parent: v.parent,
          origin: v.origin,
          name: v.name
        };
      }
    });
  }

  /**
   * get detail rpc list in project. used for project doc/tool
   * @param {Number} pid -  project id
   * @return {Array model/db/Rpc} rpcs detail with params
   */
  * getDetailListInProject(pid, opt = {}) {
    let pids = opt.pids || (yield this._getSearchPids(pid));
    let ret = yield this._dao.getListInProjects(pids);
    ret = ret.filter(it => {
      return it.statusId != db.STATUS_SYS_AUDITING && it.statusId != db.STATUS_SYS_AUDIT_FAILED;
    });
    yield this._fillParams(ret, opt);
    yield this._fillVersions(ret);
    return ret;
  }

  /**
   * 根据项目id查rpc接口列表
   *
   * @param {Number} pid - 项目id
   * @override
   * @return {Object}
   */
  * getListInProject(pid) {
    let project = yield this._pDAO.find(pid);
    if (!project) {
      throw new Forbidden('项目不存在', {pid});
    }
    let list = yield super.getListInProject(pid);
    yield this._fillVersions(list);
    yield this._fillChangeConfirmation(list);
    yield this._fillAuditReason(list);
    return list;
  }

  * findBatchWithVersion(ids) {
    let list = yield this._dao.findBatch(ids);
    yield this._fillVersions(list);
    yield this._fillWatch(list);
    return list;
  }

  * sendMsgToWatch({id, msg}) {
    yield this._checkUpdatePermission(id);
    let ret = yield this._dao.find(id);
    if (ret.respoId !== this._uid) {
      throw new Forbidden('没有发送消息的权限');
    }

    msg = `${_.escapeHtml(msg)}(来自接口 ${_.escapeHtml(ret.name)} 的负责人)`;

    let list = yield this._rwDAO.getListOfResourceWatch(ret.projectId, this._dao._type);
    if (list[id] && list[id].length) {
      let users = yield this._uDAO.findBatch(list[id]);
      let data = {
        text: msg,
        hasDomainText: msg,
        toUsers: users
      };
      this._async(notification.send, data);
    }

    return ret;
  }

  * sendApiChangeMsgToWatch({id, content}) {
    yield this._checkUpdatePermission(id);
    let ret = yield this._dao.find(id);

    let list = yield this._rwDAO.getListOfResourceWatch(ret.projectId, this._dao._type);

    if (list[id] && list[id].length) {
      let users = (yield this._uDAO.findBatch(list[id])).filter(user => {
        // 排除修改者本人
        return user.id !== this._uid;
      });

      if (!users.length) {
        return;
      }

      const url = {
        develop: `http://localhost:${this._context.app.config.port}`,
        test: process.appConfig.testDomain,
        online: process.appConfig.onlineDomain
      }[process.appConfig.mode];

      content = _.escapeHtml(content);

      let title = `接口【<a class="stateful" href="${url}/rpc/detail/?pid=${ret.projectId}&id=${ret.id}">${ret.name}</a>】的变更提醒`;
      let mailContent = `<br />${title}，需要你确认：<br />${content}<br /><a href="${url}/notification/api/">点此链接去确认</a>`;
      let paopaoContent = `接口【${ret.name}】的变更提醒，需要你确认：${content}，确认链接：${url}/notification/api/ `;

      let data = {
        id,
        title,
        content,
        mailContent,
        paopaoContent,
        users,
        creatorId: this._uid
      };

      this._async(notification.sendApiChangeMsg, data);
    }

    return ret;
  }

  * updateStatusBatch({ids = [], statusId}) {
    log.debug(
      '[%s.updateStateBatch] update state of resource %s to %d',
      this.constructor.name, ids.join(','), statusId
    );
    const list = yield this._dao.findBatch(ids);
    const auditingRpcs = list.filter(it => it.statusId === db.STATUS_SYS_AUDITING);
    if (auditingRpcs.length) {
      throw new IllegalRequestError(`您选择了正在审核中的 RPC 接口，不能直接修改它的状态，请在详情页面进行审核`);
    }
    return yield super.updateBatch({statusId}, ids);
  }

  /**
   * 过滤全局搜索结果
   *
   * @param {Array Object} list
   */
  * _filterGlobalSearchResult(list) {
    let progroups = yield this._progroupService.getProgroupsForUser();

    return list.filter(item => {
      // 根据审核状态筛选接口
      if (item.ext.status.id === db.STATUS_SYS_AUDIT_FAILED
        || item.ext.status.id === db.STATUS_SYS_AUDITING) {

        // 接口创建者有权限访问
        if (item.ext.creator.id === this._uid) {
          return true;
        }

        let progroup = progroups.find(p => p.id === item.progroupId);
        let progroupAdminIds = progroup.admins.map(admin => admin.id);
        let progroupAuditorIds = progroup.auditors.map(auditor => auditor.id);

        // 项目组的创建者、管理员、审核者有权限访问
        if (progroup.creatorId === this._uid
          || progroupAdminIds.includes(this._uid)
          || progroupAuditorIds.includes(this._uid)) {
          return true;
        }

        let project = progroup.projects.find(p => p.id === item.projectId);

        // 项目的创建者有权限访问
        if (project.creatorId === this._uid) {
          return true;
        }

        return false;
      }

      return true;
    });
  }

  /**
   * fill audit reason. NOT PURE!
   * @param list
   * @private
   */
  * _fillAuditReason(list) {
    let needAuditReasonList = list.filter(it => it.statusId === db.STATUS_SYS_AUDIT_FAILED);
    if (needAuditReasonList.length === 0) {
      return;
    }
    let needAuditReasonIdList = needAuditReasonList.map(it => it.id);

    let auditService = new (require('./AuditService'))(this._uid, this._context);

    let ret = yield auditService._dao.search({
      conds: {
        state: db.AUDIT_TYP_REJECT,
        interfaceId: needAuditReasonIdList
      },
      joins: [{
        table: 'interface',
        fkmap: {id: 'interface_id'},
        conds: {id: needAuditReasonIdList}
      }]
    });

    let hashByInterfaceId = {};
    for (let i = ret.length - 1; i > -1; i--) {
      let record = ret[i];
      if (record.interfaceId in hashByInterfaceId) {
        continue;
      }
      hashByInterfaceId[record.interfaceId] = record;
    }

    for (let i = 0; i < needAuditReasonList.length; i++) {
      const inter = needAuditReasonList[i];
      if (inter.id in hashByInterfaceId) {
        if (inter.status) {
          inter.status.reason = hashByInterfaceId[inter.id].reason;
        } else if (inter.ext.status) {
          inter.ext.status.reason = hashByInterfaceId[inter.id].reason;
        }
      }
    }
  }

  * findDetailWithHistoryById(id, history_len = 20) {
    let ret = yield this.findDetailById(id);
    yield this.fillHistory(ret, history_len);
    return ret;
  }


  /**
   * 填充历史记录
   * @param ret,非数组
   */
  * fillHistory(ret, history_len) {
    if (ret.id) {
      let activities = new (require('./ResourceHistoryService'))(this._uid, this._context);
      let his = yield activities.find({
        type: db.RES_TYP_RPC,
        id: ret.id,
        limit: history_len,
        offset: 0,
        total: true
      });
      ret.history = his.result;
    }
  }

  * getConstraints({projectIds}) {
    const constraints = yield this._cDAO.search({conds: {projectId: projectIds}});
    const retSys = yield this._cDAO.getListOfSystem();
    constraints.push(...retSys);
    return constraints;
  }

  /**
   * 根据接口id列表，查接口的响应结果参数
   * @param {Number} ids - interface ids
   * @return {Array model/db/Rpc} rpcs detail with params
   */
  * findDetailWithOutputsByIds(ids) {
    let ret = yield this._dao.findBatch(ids);
    let pids = ((ret || []).map(it => it.projectId).reduce((arr, next) => {
      if (!arr.includes(next)) {
        arr.push(next);
      }
      return arr;
    }, []));
    const datatypes = yield this._dataTypeService.getInProjects(pids);
    const outputs = yield  this._paramRpcResService.getListBatch(ids, datatypes);
    for (let item of ret) {
      item.params = {
        outputs: outputs[item.id] || [],
      };
    }
    return ret;
  }

  /**
   * 获取api的mock数据
   * @param {Object} options - 参数
   * @attribute {String} options.key -  项目的唯一key
   * @attribute {String} options.apiVersion - 接口版本
   * @attribute {Object} options.req -  请求对象
   * @attribute {String} options.isFromProgroup - 是否从项目组中查所有接口
   * @return {Object} 接口的 Mock 数据
   */
  * getApiMockData({key, apiVersion, req, isFromProgroup}) {
    let rpcs = [];
    let matchedRpc = null;

    function findMatchedRpc() {
      return rpcs.find(rpc => {
        const apiPathParts = rpc.className.split('.');
        apiPathParts.push(rpc.path);
        if (apiPathParts.join('-').toLowerCase() === req.apiPath) {
          if (apiVersion) {
            if (!rpc.version || rpc.version.name !== apiVersion) {
              return false;
            }
          }
          // 检查参数的名称和类型是否一致，只检查第一层，主要是考虑到函数重载的问题
          const reqBody = req.body;
          for (let i = 0; i < rpc.params.inputs.length; i++) {
            const param = rpc.params.inputs[i];
            // todo: 只验证名称，重载应该不会对值的类型重载吧？比如一个函数中的 name 是字符串，另外一个重载函数中的 name 是数值，应该不太可能
            if (!reqBody.hasOwnProperty(param.name)) {
              return false;
            }
          }
          return true;
        }
      });
    }

    if (isFromProgroup) {
      const progroups = yield this._pgDAO.search({conds: {toolKey: key}});
      if (!progroups.length) {
        throw new Forbidden('项目组不存在，请检查项目组的 key 是否正确');
      }
      const progroupId = progroups[0].id;
      const projects = yield this._pDAO.search({
        conds: {
          progroupId: progroupId
        }
      });
      const projectIds = projects.map(project => project.id);
      for (let i = 0; i < projectIds.length; i++) {
        rpcs = yield this._dao.getListInProject(projectIds[i]);
        yield this._fillInputParams(rpcs);
        if (apiVersion) {
          // 如果是按照版本查接口，就填充版本信息，否则就不需要走这个过程，节省时间
          yield this._fillVersions(rpcs);
        }
        matchedRpc = findMatchedRpc();
        // 找到匹配的就退出
        if (matchedRpc) {
          break;
        }
      }
      if (!matchedRpc) {
        throw new Forbidden('找不到对应接口，请检查接口的类名、方法名、参数名称、版本等信息是否正确');
      }
    } else {
      const projects = yield this._pDAO.search({conds: {toolKey: key}});
      if (!projects.length) {
        throw new Forbidden('项目不存在，请检查项目的 key 是否正确');
      }
      const projectId = projects[0].id;
      // 获取项目中的接口列表，包含公共资源库中的接口
      rpcs = yield this._dao.getListInProject(projectId);
      yield this._fillInputParams(rpcs);
      if (apiVersion) {
        // 如果是按照版本查接口，就填充版本信息，否则就不需要走这个过程，节省时间
        yield this._fillVersions(rpcs);
      }
      matchedRpc = findMatchedRpc();
      if (!matchedRpc) {
        throw new Forbidden('找不到对应接口，请检查接口的类名、方法名、参数名称、版本等信息是否正确');
      }
    }
    const rpcId = matchedRpc.id;
    // 如果MockStoreService在顶部引入，会产生循环依赖的问题，因为在MockStoreService中又引入了InterfaceService
    const mockStoreService = new (require('./MockStoreService'))(this._uid, this._context);
    const result = yield mockStoreService.crudInterface({itf: matchedRpc, req});
    // 生成调用记录
    yield this._callApiMockService.create({
      interfaceId: rpcId
    });
    if (matchedRpc.mockDelay) {
      yield this.delay(matchedRpc.mockDelay);
    }
    return result;
  }
}

module.exports = RpcService;
