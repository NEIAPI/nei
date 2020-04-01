/**
 * Interface Service Class
 */
const db = require('../../common/config/db.json');
const dt = require('../dao/config/const.json');
const log = require('../util/log');
const _ = require('../util/utility');
const resourceUtil = require('../util/resource_util');
const Forbidden = require('../error/fe/ForbiddenError');
const pathToRegExp = require('path-to-regexp');
const notification = require('./helper/notification');
const mockDataWork = require('../util/mock_data_worker');
const url = require('url');
const querystring = require('querystring');
const history = require('./helper/history');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const ResourceClientService = require('./ResourceClientService');
const ResWithParamService = require('./ResWithParamService');
const AttributeService = require('./AttributeService');

/**
 * get params from url
 * @param {string} url
 * @return string[]
 */
function getParamsFromUrl(url) {
  const params = [];
  const urlParts = url.split('?');
  const paths = urlParts[0].split('/');

  function getParam(str) {
    if (/^:.*/.test(str)) {
      params.push(str.substr(1));
    } else if (/^\{.*\}$/.test(str)) {
      params.push(str.substr(1, str.length - 2));
    }
  }

  for (let path of paths) {
    // 匹配形如 /:a/{b} 的 url
    getParam(path);
  }
  // url 不一定都有 ? 号
  if (urlParts[1]) {
    const queries = urlParts[1].split('&');
    let queryValue;
    for (let query of queries) {
      // 匹配形如 a=:a&b={b} 的查询参数
      queryValue = query.split('=')[1];
      getParam(queryValue);
    }
  }
  return params;
}

class InterfaceService extends ResWithParamService {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._type = db.RES_TYP_INTERFACE;
    this._dao = new (require('../dao/InterfaceDao'))({context});
    this._paramCombinationDao = new (require('../dao/ParameterCombinationDao'))({context});
    this._cliDAO = new (require('../dao/ClientDao'))({context});
    this._pmReqDAO = new (require('../dao/ParamInterfaceReqDao'))({context});
    this._pmResDAO = new (require('../dao/ParamInterfaceResDao'))({context});
    this._ihReqDAO = new (require('../dao/InterfaceHeaderReqDao'))({context});
    this._ihResDAO = new (require('../dao/InterfaceHeaderResDao'))({context});
    this._dDAO = new (require('../dao/DataTypeDao'))({context});
    this._vDAO = new (require('../dao/ViewDao'))({context});
    this._tDAO = new (require('../dao/TemplateDao'))({context});
    this._paramDao = new (require('../dao/ParamDataTypeDao'))({context});
    this._cDAO = new (require('../dao/ConstraintDao'))({context});
    this._pDAO = new (require('../dao/ProjectDao'))({context});
    this._bgDAO = new (require('../dao/BisGroupDao'))({context});
    this._uDAO = new (require('../dao/UserDao'))({context});
    this._vDAO = new (require('../dao/ViewDao'))({context});
    this._rvDAO = new (require('../dao/ResourceVersionDao'))({context});
    this._pmDAO = new (require('../dao/ParameterDao'))(0, {context});
    this._ihDAO = new (require('../dao/InterfaceHeaderDao'))(0, {context});
    this._rwDAO = new (require('../dao/ResourceWatchDao'))({context});

    this._projectService = new (require('./ProjectService'))(uid, context);
    this._progroupService = new (require('./ProGroupService'))(uid, context);
    this._progroupApiSpecService = new (require('./ProGroupApiSpecService'))(uid, context);
    this._paramInterfaceReqService = new (require('./ParamInterfaceReqService'))(uid, context);
    this._paramInterfaceResService = new (require('./ParamInterfaceResService'))(uid, context);
    this._paramInterfacePathVarService = new (require('./ParamInterfacePathVarService'))(uid, context);
    this._paramTemplateService = new (require('./ParamTemplateService'))(uid, context);
    this._paramServiceMap = {
      [db.PAM_TYP_INPUT]: this._paramInterfaceReqService,
      [db.PAM_TYP_OUTPUT]: this._paramInterfaceResService,
    };
    this._headerReqService = new (require('./HeaderReqService'))(uid, context);
    this._headerResService = new (require('./HeaderResService'))(uid, context);
    this._dataTypeService = new (require('./DataTypeService'))(uid, context);
    this._resourceVersionService = new (require('./ResourceVersionService'))(uid, context);
    this._notificationResourceService = new (require('./NotificationResourceService'))(uid, context);
    this._constraintService = new (require('./ConstraintService'))(uid, context);
    this._resourceClientService = new ResourceClientService(uid, context);
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
    let progroupSpec = yield this._progroupApiSpecService.getSpecByProgroupId(progroup.id);
    model.statusId = db.STATUS_SYS_UNDERDEVELOPMENT;
    yield this._beginTransaction();

    let userIds = model.userIds;
    delete model.userIds;

    let newInterface = yield super.create(model, conflictOpt);
    // 暂不开放数据类型的批量添加关注人
    let needUpdateCache = false;
    if (userIds && userIds.length > 0) {
      yield this._rwDAO.createBatch(
        userIds.map(it => {
          return {
            resType: this._dao._type,
            resId: newInterface.id,
            projectId: model.projectId,
            progroupId: model.progroupId,
            userId: it,
          };
        })
      );
      //更新缓存
      needUpdateCache = true;
    }
    if (progroup.apiAudit) {
      let auditRecord = yield this.createAuditRecord(newInterface.id);
      if (auditRecord !== null) { // 审核中、创建者、管理员的接口无需审核
        yield this.update({statusId: db.STATUS_SYS_AUDITING, id: newInterface.id});
        // 更新完后，会丢失 newInterface.ext 信息，里面有 creator、group、status等信息
        // 这里再重新查一遍最新的数据
        newInterface = yield this.findDetailById(newInterface.id);
      }
    }

    if (needUpdateCache) {
      yield this._cache.remove(`${this._dao._type}${dt.RES_WATCH}${model.projectId}`);
    }
    yield this._fillWatch(newInterface);
    yield this._fillTestcases([newInterface]);
    // pathParams
    const urlParams = getParamsFromUrl(newInterface.path);
    if (urlParams.length > 0) {
      yield this._paramInterfacePathVarService.build(newInterface.id, urlParams);
      yield this._fillParams([newInterface]);
    }
    try {
      if (
        newInterface.schema
        && progroupSpec.length > 0
        && progroupSpec[0]
        && progroupSpec[0].interfaceSchema
      ) {
        const curSchema = JSON.parse(progroupSpec[0].interfaceSchema)[newInterface.schema];
        let datatypes = [];
        if (curSchema.req || curSchema.res) {
          const datatypeMap = yield this._dataTypeService.getInProject(newInterface.projectId);
          datatypes = Object.keys(datatypeMap).map(id => datatypeMap[id]);
        }
        if (curSchema.req) {
          const newParams = _.jsonSchemaToParams(curSchema.req, datatypes, newInterface.id, db.PAM_TYP_INPUT);
          if (newParams.length > 0) {
            yield AttributeService.createBatch({
              items: [{
                params: newParams,
                parentType: db.PAM_TYP_INPUT,
                parentId: newInterface.id
              }]
            }, this._uid, this._context);
          }
        }
        if (curSchema.res) {
          const newParams = _.jsonSchemaToParams(curSchema.res, datatypes, newInterface.id, db.PAM_TYP_OUTPUT);
          if (newParams.length > 0) {
            yield AttributeService.createBatch({
              items: [{
                params: newParams,
                parentType: db.PAM_TYP_OUTPUT,
                parentId: newInterface.id
              }]
            }, this._uid, this._context);
          }
        }
        yield this._fillParams([newInterface]);
      }
    } catch (e) {
      log.debug('[InterfaceService.create]: add default params', e);
      throw new IllegalRequestError(e);
    }
    yield this._endTransaction();
    return newInterface;
  }

  /**
   * 审核接口
   */
  * audit(model) {
    // todo 判断此人是否有权限审核
    let auditService = new (require('./AuditService'))(this._uid, this._context);
    return yield auditService.audit(model, db.INTERFACE_TYP_HTTP);
  }

  /**
   * 创建审核记录
   */
  * createAuditRecord(interfaceId, recreate = false) {
    // 判断该接口不能存在未决策的审核记录
    let auditService = new (require('./AuditService'))(this._uid, this._context);
    return yield auditService.create(interfaceId, db.INTERFACE_TYP_HTTP, recreate);
  }

  /**
   * 重新创建审核记录
   * @param id
   */
  * reCreateAuditRecord(id) {
    let inter = yield this.findDetailById(id);
    if (inter.statusId !== db.STATUS_SYS_AUDIT_FAILED) {
      throw new IllegalRequestError('该接口不处在审核失败状态中，不应被重开申请');
    }

    let ret = yield this.createAuditRecord(id, true);
    yield this.update({id: inter.id, statusId: db.STATUS_SYS_AUDITING});
    return ret;
  }

  /**
   * remove interfaces
   *
   * @param {Array} ids - interface id list
   * @return {model/db/Interface} interface list
   */
  * removeBatch(ids) {
    yield this._checkQuotes(ids);
    yield this._beginTransaction();
    for (let parentId of ids) {
      yield this._paramInterfaceReqService.remove({parentId}, {clearAll: true, sendMsg: false});
      yield this._paramInterfaceResService.remove({parentId}, {clearAll: true, sendMsg: false});
    }
    let ret = yield super.removeBatch(ids);
    // 删除与接口相关的审核记录、消息通知
    let auditService = new (require('./AuditService'))(this._uid, this._context);
    yield auditService._dao.removeBatch({
      interfaceId: ids
    });
    yield this._notificationResourceService.removeByRes(ids, [db.RES_TYP_INTERFACE, db.RES_TYP_AUDIT]);

    yield this._endTransaction();
    yield this._fillClients(ret);
    yield this._fillVersions(ret);

    return ret;
  }

  /**
   * import interface from Swagger/JSON
   * @param model
   * @param {Number} model.groupId - group id
   * @param {Number} model.projectId - project id
   * @param {String} model.tag - 共同tag
   * @param {Array{*}} model.datatypes
   * @param {Array{*}} model.interfaces
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

    model.interfaces.forEach(inter => {
      inter.projectId = model.projectId;
      inter.groupId = model.groupId;
      inter.progroupId = progroupId;
      inter.type = db.INTERFACE_TYP_HTTP;
      if (model.tag) {
        inter.tags = inter.tags + ',' + model.tag;
      }
    });
    let createdInterfaces = yield this.createBatch(model.interfaces); // 首先批量创建接口
    let helper = function (interParams, parentType, parentId, projectDT, progroupId) {
      // 加上匿名类型支持， 匿名类型需要反过来将引用类型递归展开
      let result = [];
      let imports = new Set();
      for (let i = 0; i < interParams.length; i++) {
        let param = interParams[i];
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
    for (let i = 0; i < model.interfaces.length; i++) {
      let interOrigin = model.interfaces[i];
      let createInterface = createdInterfaces.find(int => {
        return int.name === interOrigin.name;
      });
      if (!createInterface) {
        console.log(interOrigin);
      }
      let temp = helper(interOrigin.params.inputs, db.PAM_TYP_INPUT, createInterface.id, projectDTsindex, progroupId);
      if (temp) {
        addParametersAll.push(temp);
      }
      temp = helper(interOrigin.params.outputs, db.PAM_TYP_OUTPUT, createInterface.id, projectDTsindex, progroupId);
      if (temp) {
        addParametersAll.push(temp);
      }
    }
    yield this.importParamBatch(addParametersAll, progroupId); // 这里也是批量

    yield this._endTransaction();

    let interIds = createdInterfaces.map(inter => {
      return inter.id;
    });
    let inters = yield this.findDetailByIds(interIds);
    yield this._fillTestcases(inters);

    return {
      datatypes: importDts,
      interfaces: inters
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
   * 拓扑排序, Kahn算法
   * @private
   */
  _topologySortDatatypes(datatypes) {
    let ret = [];
    let hasSeendatatypes = new Set();
    let dealDatatype = JSON.parse(JSON.stringify(datatypes)); // 深拷贝
    dealDatatype.forEach(item => {
      hasSeendatatypes.add(item.name);
    });

    let helper = function (dt, ht) {
      let zeroDegree = [];
      let others = [];
      dt.forEach(item => {
        let temp = item.params.filter(param => {
          return param.typeName && ht.has(param.typeName); // 统计入度
        });
        if (temp.length > 0) {
          others.push(item);
        } else {
          zeroDegree.push(item);
        }
      });
      return {zeroDegree, others};
    };
    // 统计入度为0的节点
    let {zeroDegree: listOfZeroIndgree, others: others} = helper(dealDatatype, hasSeendatatypes);

    while (listOfZeroIndgree.length > 0) {
      listOfZeroIndgree.forEach(item => {
        hasSeendatatypes.delete(item.name);// 不再存在这个节点
      });
      ret.push(listOfZeroIndgree);
      let result = helper(others, hasSeendatatypes);
      listOfZeroIndgree = result.zeroDegree;
      others = result.others;
    }
    // 循环引用检测
    if (hasSeendatatypes.size != 0) {
      console.log('存在环');
    }
    return ret;
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
    let newInterfaces = yield super.clone(obj);
    if (obj.version) {
      return newInterfaces;
    }
    let progroup = yield this._progroupService.getProgroupDetailByProjectId(obj.pid);
    yield this._beginTransaction();

    let retInterfaces = [];
    if (progroup.apiAudit) {
      for (let i = 0; i < newInterfaces.length; i++) {
        let newInterface = newInterfaces[i];
        let auditRecord = yield this.createAuditRecord(newInterface.id);
        if (auditRecord !== null) { // 审核中、创建者、管理员的接口无需审核
          retInterfaces.push(yield this.update({statusId: db.STATUS_SYS_AUDITING, id: newInterface.id}));
        } else {
          retInterfaces.push(newInterface);
        }
      }
    }
    yield this._endTransaction();

    return newInterfaces;
  }

  /**
   * check whether the interfaces have been quoted/referenced
   *
   * @param {Array} ids - interface id list
   * @return {void}
   */
  * _checkQuotes(ids) {
    let quotes = yield this._vDAO.getListByInterface(ids);
    if (quotes.length) {
      throw new Forbidden(`接口被引用 id：${ids}`);
    }
    // check versions
    let childVersions = yield this._rvDAO.search({
      conds: {parent: ids, resType: this._type}
    });
    childVersions.forEach(item => {
      if (item.resId != item.parent) {
        throw new Forbidden(`接口存在被派生的版本,名为${item.name}`);
      }
    });
  }

  /**
   * update interface
   * @param {Object/Interface} model - interface
   * @return {model/db/Interface} interface
   */
  * update(model) {
    if (model.hasOwnProperty('name')) {
      // 检查名称是否冲突
      let res = yield this._dao.find(model.id);
      yield this._checkConflictInProject(res.projectId, {name: model.name});
    } else if (model.hasOwnProperty('connectId') && model.connectId !== 0) {
      const itf = yield this._dao.find(model.id);
      const datatypes = yield this._dataTypeService.getListInProject(itf.projectId);
      const connectingDatatype = datatypes.find(dt => dt.id === model.connectId);
      const checkValidResult = resourceUtil.isDatatypeValidForConnect(connectingDatatype, datatypes);
      if (checkValidResult !== true) {
        // 和不是当前项目中的数据模型或者是不存在的数据模型进行关联
        throw new Forbidden(checkValidResult);
      }
    }

    yield this._beginTransaction();

    let clientIds = [], ret, hasClients = false, clients = [];
    if (model.hasOwnProperty('clientIds')) {
      hasClients = true;
      clientIds = model.clientIds;
      delete model.clientIds;
    }

    if (model.hasOwnProperty('versionName')) {
      const interfaceVersion = yield this._resourceVersionService._dao.search({
        conds: {
          resType: db.RES_TYP_INTERFACE,
          resId: model.id
        }
      });
      yield this._resourceVersionService._dao.update({name: model.versionName}, {
        res_id: model.id,
        res_type: db.RES_TYP_INTERFACE
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

    // path urlParams变化需重建pathParams
    if (model.hasOwnProperty('path')) {
      const urlParams = getParamsFromUrl(model.path);
      const {path: oldPath} = yield this.getById(model.id);
      if (urlParams.toString() !== getParamsFromUrl(oldPath).toString()) {
        yield this._paramInterfacePathVarService.build(model.id, urlParams);
      }
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
      delParentType = db.PAM_TYP_INPUT;
      format = model.reqFormat;
    } else if (model.hasOwnProperty('resFormat')) {
      delParentType = db.PAM_TYP_OUTPUT;
      format = model.resFormat;
    }

    if (delParentType && delParentId) {
      yield this._paramServiceMap[delParentType].remove({parentId: delParentId}, {
        clearAll: true,
        sendMsg: false
      });
      // 修改参数格式为其他格式，假如是基础类型的，需要追加一条参数
      ret.params = {};
      if (delParentType === db.PAM_TYP_INPUT) {
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
          console.log('formatParameter', formatParameter);
          returnParameter = yield this._paramServiceMap[delParentType]._dao.create(formatParameter);
        }
      }
    }

    // 更新clientIds
    if (hasClients) {
      clients = yield this._resourceClientService.setClients({
        res_id: model.id,
        client_ids: clientIds,
        project_id: projectId,
        res_type: db.RES_TYP_INTERFACE,
        progroup_id: progroupId
      });
    }
    ret.clients = clients;
    // todo 权限管理

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
      // 更新缓存
      yield this._cache.remove(`${this._dao._type}${dt.RES_WATCH}${projectId}`);
    }

    yield this._endTransaction();

    if (returnParameter) {
      // 更新请求或者响应参数的类别时需要获取追加的参数
      let hash = yield this._dataTypeService.getInProject(projectId);
      returnParameter.typeName = hash[returnParameter.type] ? hash[returnParameter.type].name : 'String';
      if (returnParameter.parentType === db.PAM_TYP_INPUT) {
        ret.params.inputs = [returnParameter];
      } else {
        ret.params.outputs = [returnParameter];
      }
    }

    if (model.hasOwnProperty('resFormat')) {
      // 如果是更新了响应结果的类别，则需要清空Mock数据
      const mockStoreService = new (require('./MockStoreService'))(this._uid, this._context);
      yield mockStoreService.removeInterface({interfaceId: ret.id});
    }

    yield this._fillParams([ret]);
    yield this._fillVersionDetails(ret);
    yield this._fillVersions([ret]);
    yield this._fillAuditReason([ret]);
    return ret;
  }

  /**
   * share all datatypes that have been used in the given interface.
   * @param {Object} - share info
   * @return {model/db/Datatype} datatype data
   */
  * _afterShare(shareInfo, oldData) {
    let {id, projectId, groupId} = shareInfo;
    //获得需要分享的数据类型
    let paramsGroupList = yield [
      this._paramInterfaceReqService.getList(id),
      this._paramInterfaceResService.getList(id),
      this._headerReqService.getList(id),
      this._headerResService.getList(id)
    ];
    let paramsList = [];
    paramsGroupList.forEach(function (group) {
      (group || []).forEach(function (param) {
        paramsList.push(param);
      });
    });
    //获得所有引用的数据类型
    let datatypeIdList = yield this._dataTypeService.getListInDataType(oldData.projectId, {params: paramsList});

    let datatypes = [];
    if (datatypeIdList.length) {
      datatypes = yield this._dataTypeService.updateBatch({
        projectId,
        groupId
      }, datatypeIdList);

      yield this._dataTypeService.clearCache({pids: projectId});
    }
    return datatypes;
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
   * get quote list for interface. only view/page can quote interface for now
   * @param {Array Number} ids - interface id list
   * @return {Object}
   */
  * getQuotes(ids) {
    log.debug('[InterfaceService.getQuote] - get interface quotes by ids:%s', ids);
    ids = _.toArray(ids);
    let ret = yield this._checkBatchPermission(ids);
    yield this._checkSearchPermission(ret.id);
    let [pagesQuotes, clientsQuotes] = yield [this._vDAO.getListByInterface(ids), this._cliDAO.getListByResource(ids, db.RES_TYP_INTERFACE)];

    return {pages: pagesQuotes, clients: clientsQuotes};
  }

  /**
   * get interface detail with params
   * @param {Number} id - interface id
   * @return {model/db/Interface} interface detail with params
   */
  * findDetailById(id) {
    let ret = yield super.findDetailById(id);
    if (!ret) {
      throw new Forbidden('接口不存在');
    }
    yield this._fillParams([ret]);
    yield this._fillVersions([ret]);
    yield this._fillVersionDetails(ret);
    yield this._fillClients([ret]);
    yield this._fillWatch(ret);
    yield this._fillAuditReason([ret]);
    yield this._fillTestcases([ret]);
    return ret;
  }

  * findDetailWithHistoryById(id, history_len) {
    let ret = yield this.findDetailById(id);
    yield this.fillHistory(ret);
    return ret;
  }

  * getWatchList(id) {
    let ret = yield super.findDetailById(id);
    yield this._fillWatch(ret);
    return ret.watchList;
  }

  /**
   * get interfaces detail with params
   * @param {Number} ids - interface ids
   * @return {Array model/db/Interface} interfaces detail with params
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
    yield this._fillClients(ret);
    yield this._fillAuditReason(ret);
    return ret;
  }

  /**
   * 根据接口id列表，查接口的响应结果参数
   * @param {Number} ids - interface ids
   * @return {Array model/db/Interface} interfaces detail with params
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
    const outputs = yield  this._paramInterfaceResService.getListBatch(ids, datatypes);
    for (let item of ret) {
      item.params = {
        outputs: outputs[item.id] || [],
      };
    }
    return ret;
  }

  /**
   * fill params for the interface. not pure!
   * @param {Array model/db/Interface} ret - interfaces
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
    const inputs = yield this._paramInterfaceReqService.getListBatch(ids, hash);
    const outputs = yield this._paramInterfaceResService.getListBatch(ids, hash);
    const reqHeaders = yield this._headerReqService.getListBatch(ids, hash);
    const resHeaders = yield this._headerResService.getListBatch(ids, hash);
    const pathParameters = yield this._paramInterfacePathVarService.getListBatch(ids, hash);

    for (let item of ret) {
      item.params = {
        inputs: inputs[item.id] || [],
        outputs: outputs[item.id] || [],
        reqHeaders: reqHeaders[item.id] || [],
        resHeaders: resHeaders[item.id] || [],
        pathParams: pathParameters[item.id] || [],
      };
    }
  }

  /**
   * fill client informations. NOT PURE!
   * @param ret
   * @private
   */
  * _fillClients(ret) {
    let ids = (ret || []).map(it => it.id);
    let clients = yield this._resourceClientService.getListBatch(ids, db.RES_TYP_INTERFACE);
    ret.forEach(item => {
      item.clients = {};
      let v = clients.filter(client => client.ext.resource_client.resId == item.id);
      if (v) {
        item.clients = v;
      }
    });
  };

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
    let versions = yield this._resourceVersionService.getListBatch([id], db.RES_TYP_INTERFACE);
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
        conds: {origin: origin, resType: db.RES_TYP_INTERFACE, resId: {op: '!=', value: id}}
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
    let versions = yield this._resourceVersionService.getListBatch(ids, db.RES_TYP_INTERFACE);
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
   * get detail interface list in project. used for project doc/tool
   * @param {Number} pid -  project id
   * @return {Array model/db/Interface} interfaces detail with params
   */
  * getDetailListInProject(pid, opt = {}) {
    let pids = opt.pids || (yield this._getSearchPids(pid));
    let ret = yield this._dao.getListInProjects(pids);
    // 统计数据的时候不用过滤接口
    if (opt && opt.filter !== false) {
      ret = ret.filter(it => {
        return it.statusId !== db.STATUS_SYS_AUDITING && it.statusId !== db.STATUS_SYS_AUDIT_FAILED;
      });
    }
    yield this._fillParams(ret, opt);
    yield this._fillVersions(ret);
    yield this._fillClients(ret);
    return ret;
  }

  /**
   * 根据项目id查HTTP 接口列表
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
    if (!list.length) {
      return list;
    }
    yield this._fillVersions(list);
    yield this._fillChangeConfirmation(list);
    yield this._fillAuditReason(list);
    yield this._fillTestcases(list);
    return list;
  }

  * findBatchWithVersion(ids) {
    let list = yield this._dao.findBatch(ids);
    yield this._fillVersions(list);
    yield this._fillWatch(list);
    return list;
  }

  /**
   * crud
   * @param {Object} opt
   * @param {Number} opt.pid - project id
   * @param {Number} opt.mid 统一的返回数据模型
   * @param {Array<Object>} opt.items
   * e.g. [{datatypeId: 14282, gid:12123, interfaces: [name:'hello', method:'GET', 'path': 'api/hh', type:4]}]
   * @return {Array<model/db/Interface>}
   */
  * crud({pid: projectId, mid, items = []}) {
    const checkPermissionResult = yield this._checkCreatePermission(projectId);
    const progroupId = checkPermissionResult.progroupId;
    const datatypeIds = items.map(item => item.datatypeId);
    const datatypes = yield this._dataTypeService.getListInProject(projectId);
    const datatypesOfCruding = datatypes.filter(dt => datatypeIds.includes(dt.id));
    // 检查 datatype 是否符合要求
    const checkResult = datatypesOfCruding.map(datatype => {
      return resourceUtil.isDatatypeValidForConnect(datatype, datatypes);
    });
    const checkResultError = checkResult.filter(result => result !== true);
    if (checkResultError.length) {
      throw new Forbidden(`数据模型不符合要求：${JSON.stringify(checkResultError)}`);
    }

    //检查数据模型
    let returnParameterId;
    let parameters = [];
    let imports = [];
    let overwrites = [];
    let headers = [];
    //检查返回模型
    if (mid) {
      let datatype = datatypes.find(dt => dt.id === mid);
      if (!datatype) {
        throw new Forbidden(`您选择的返回模型不存在`);
      }
      let ret = (datatype.params || []).filter(item => item.type === db.MDL_SYS_VARIABLE);
      if (ret.length !== 1) {
        throw helper.buildError('FORBIDDEN', 'ForbiddenError', '您选择的返回模型参数有误');
      }
      returnParameterId = ret[0].id;
    }
    let interfaceInfos = [];
    items.forEach(item => {
      item.interfaces.forEach(interfceObj => {
        interfaceInfos.push(Object.assign(interfceObj, {datatypeId: item.datatypeId}));
      });
      interfaceInfos.push(...item.interfaces);
    });

    yield this._beginTransaction();

    //组装接口数据
    let interdfaceList = [];
    for (let item of items) {
      let tag = item.tag;
      let groupId = item.gid;
      let interfaceInfos = item.interfaces;
      interfaceInfos.forEach((item) => {
        let interfaceItem = {
          name: item.name,
          method: item.method,
          path: item.path,
          connectId: item.connectId,
          connectType: item.connectType,
          tag,
          groupId,
          projectId,
          progroupId,
        };
        interdfaceList.push(interfaceItem);
      });
    }

    //插入接口数据
    let ret = [];
    if (interdfaceList.length) {
      ret = yield this.createBatch(interdfaceList);
      //添加默认请求头
      for (let item of ret) {
        headers.push({
          parentId: item.id,
          parentType: db.API_HED_REQUEST,
          progroupId,
          name: 'content-type',
          defaultValue: 'application/json'
        });
        headers.push({
          parentId: item.id,
          parentType: db.API_HED_RESPONSE,
          progroupId,
          name: 'content-type',
          defaultValue: 'application/json'
        });
      }

      //添加默认参数
      for (let item of ret) {
        let info = interfaceInfos.find(info => info.name === item.name);
        if (!info) {
          continue;
        }
        let type = info.type;
        let datatypeId = info.datatypeId;
        //添加请求参数
        if ([db.API_MDL_CRUD_POST, db.API_MDL_CRUD_PATCH].includes(type)) {
          imports.push({
            parentId: item.id,
            parentType: db.PAM_TYP_INPUT,
            datatypeId,
            progroupId
          });
        } else if ([db.API_MDL_CRUD_BAT_DELETE].includes(type)) {
          parameters.push({
            parentId: item.id,
            parentType: db.PAM_TYP_INPUT,
            progroupId,
            name: 'ids',
            type: db.MDL_SYS_STRING,
            description: '要操作的id列表，以逗号分隔'
          });
        }
        // pathParams
        const urlParams = getParamsFromUrl(item.path);
        if (urlParams.length > 0) {
          yield this._paramInterfacePathVarService.build(item.id, urlParams);
          yield this._fillParams([item]);
        }
        if (mid) {
          let returnImportObj = {
            parentId: item.id,
            parentType: db.PAM_TYP_OUTPUT,
            datatypeId: mid,
            progroupId
          };
          let returnOverwriteObj = {
            parentId: item.id,
            parentType: db.PAM_TYP_OUTPUT,
            datatypeId: mid,
            parameterId: returnParameterId,
            progroupId,
            type: datatypeId,
            isArray: db.CMN_BOL_NO
          };
          if ([db.API_MDL_CRUD_BAT_DELETE, db.API_MDL_CRUD_BAT_GET].includes(type)) {
            returnOverwriteObj.isArray = db.CMN_BOL_YES;
          }
          //添加返回参数
          imports.push(returnImportObj);
          overwrites.push(returnOverwriteObj);
        }
      }
    }
    if (parameters.length) {
      yield this._pmDAO.createBatch(parameters);
    }
    if (imports.length) {
      yield this._pmDAO._expModels[1].Dao.createBatch(imports);
    }
    if (overwrites.length) {
      yield this._pmDAO._expModels[0].Dao.createBatch(overwrites);
    }
    if (headers.length) {
      yield this._ihDAO.createBatch(headers);
    }
    yield this._endTransaction();

    return ret;
  }

  * getMockData({id, key, path, method, type}) {
    const INTERFACE_TYPE = 3;
    const TEMPLATE_TYPE = 1;

    let projectId;
    let progroupId;
    let parameters;
    let resFormat;

    let projects = yield this._pDAO.search({conds: {toolKey: key}});
    if (!projects.length) {
      throw new Forbidden('没有权限');
    }

    let projectIds = yield this._getSearchPids(projects[0].id);

    // 接口对象
    let itf;
    if (type == INTERFACE_TYPE) {
      if (id) {
        itf = yield this._dao.find(id);
      } else {
        if (!path || !method) {
          throw new Forbidden('缺少查询条件 path or method');
        }
        let pathname = url.parse(path).pathname;
        let interfaces = yield this._dao.search({conds: {path: pathname, method, projectId: projectIds}});
        if (interfaces.length) {
          itf = interfaces[0];
        } else {
          interfaces = yield this._dao.search({conds: {method, projectId: projectIds}});
          itf = interfaces.find(item => {
            let re = pathToRegExp(item.path);
            return re.test(pathname);
          });
        }
      }
      if (!itf) {
        throw new Forbidden('找不到对应接口');
      }
      id = itf.id;
      resFormat = itf.resFormat;
      projectId = itf.projectId;
      progroupId = itf.progroupId;
      parameters = yield this._paramInterfaceResService.getList(id);
    } else if (type === TEMPLATE_TYPE) {
      let template;
      if (id) {
        template = yield this._tDAO.find(id);
      } else {
        if (!path) {
          throw new Forbidden('缺少查询条件 path');
        }
        let templates = yield this._tDao.search({conds: {path, projectId: projectIds}});
        if (templates.length) {
          template = templates[0];
        } else {
          templates = yield this._tDao.search({conds: {projectId: projectIds}});
          template = templates.find(item => {
            let re = pathToRegExp(item.path);
            return re.test(path);
          });
        }
      }
      if (!template) {
        throw new Forbidden('找不到对应模板');
      }
      resFormat = db.MDL_FMT_HASH;
      id = template.id;
      projectId = template.projectId;
      progroupId = template.progroupId;
      parameters = yield this._paramTemplateService.getList(id);
    }
    if (!projectId || !progroupId || !parameters || resFormat == undefined) {
      throw new Forbidden('找不到对应参数');
    }
    if (!projectIds.includes(projectId)) {
      throw new Forbidden('没有权限');
    }

    //查找规则函数
    const constraints = yield this.getConstraints({projectIds});
    //查找数据模型
    const datatypes = yield this._dataTypeService.getListInProject(projectId);
    //生成mock数据
    return mockDataWork.getParameterMockData(constraints, resFormat, parameters, datatypes);
  }

  * getConstraints({projectIds}) {
    const constraints = yield this._cDAO.search({conds: {projectId: projectIds}});
    const retSys = yield this._cDAO.getListOfSystem();
    constraints.push(...retSys);
    return constraints;
  }

  /**
   * 获取api的mock数据
   * @param {Object} options - 参数
   * @attribute {String} options.key -  项目的唯一key
   * @attribute {String} options.apiVersion - 接口版本
   * @attribute {Object} options.req -  请求对象
   * @attribute {Object} options.req.query - 接口的查询参数对象
   * @attribute {String} options.req.method - 接口方法
   * @attribute {String} options.isFromProgroup - 是否从项目组中查所有接口
   * @return {Object} 接口的 Mock 数据
   */
  * getApiMockData({key, apiVersion, req, isFromProgroup}) {
    const reqQuery = req.query;
    const reqMethod = req.method;
    let interfaces = [];
    let matchedInterfaces = [];

    function findMatchedInterfaces() {
      // 记录路径参数的值，后续可能需要用到id参数
      req.apiPathVars = {};
      // 判断请求url是否和定义的一致，这里要考虑查询参数的问题：
      // 1. 只匹配接口定义的 path 字段
      // 2. 如果接口定义的 path 包含查询参数(类似 `/api/users/:id?lock`)，则真实请求中的查询参数必须包含接口定义中的查询参数，而且只能多不能少
      function isPathMatched(apiPath) {
        const parsedItfPath = url.parse(apiPath);

        function isQueryExist(query) {
          return reqQuery[query] !== undefined;
        }

        let result = req.apiPath.match(pathToRegExp(parsedItfPath.pathname || ''));
        if (result) {
          if (parsedItfPath.query) {
            if (reqQuery) {
              const queryObj = querystring.parse(parsedItfPath.query);
              result = Object.keys(queryObj).every(isQueryExist);
            } else {
              result = false;
            }
          }
          // 计算路径参数并保存到一个哈希对象中
          const pathVars = getParamsFromUrl(parsedItfPath.pathname);
          pathVars.forEach((pathVar, idx) => {
            req.apiPathVars[pathVar] = result[idx + 1];
          });
        }
        return result;
      }

      // 优先精确匹配，比如定义了两个接口 `/juncface/device/factory/:functionalId` 和 `/juncface/device/factory/list`，则在请求第二个接口时应该要匹配第二个接口
      var foundInterface = interfaces.find(itf => {
        if ((itf.path === req.apiPath) && (itf.method === reqMethod)) {
          if (apiVersion) {
            return itf.version.name === apiVersion;
          } else {
            return true;
          }
        }
      });
      if (foundInterface) {
        return [foundInterface];
      }

      // 获取符合要求的接口，即匹配 method 和 path，其中 path 需要考虑路径参数的问题
      return interfaces.filter(itf => {
        if (itf.method === reqMethod) {
          if (apiVersion) {
            if (!itf.version || itf.version.name !== apiVersion) {
              return false;
            }
          }
          return isPathMatched(itf.path);
        }
      });
    }

    if (isFromProgroup) {
      const progroups = yield this._pgDAO.search({conds: {toolKey: key}});
      if (!progroups.length) {
        throw new Forbidden('项目组不存在，请检查项目组的 key 是否正确');
      }
      const progroupId = progroups[0].id;
      // 优先模糊查找，因为 path 已经建了索引，查询速度比较快的
      // 但这种查寻对路径参数是无效的
      matchedInterfaces = yield this._dao.search({
        conds: {
          path: {
            op: 'like',
            value: `${req.apiPath}%`
          },
          progroupId,
          method: reqMethod
        }
      });
      if (!matchedInterfaces.length) {
        const projects = yield this._pDAO.search({
          conds: {
            progroupId: progroupId
          }
        });
        const projectIds = projects.map(project => project.id);
        for (let i = 0; i < projectIds.length; i++) {
          interfaces = yield this._dao.getListInProject(projectIds[i]);
          if (apiVersion) {
            // 如果是按照版本查接口，就填充版本信息，否则就不需要走这个过程，节省时间
            yield this._fillVersions(interfaces);
          }
          matchedInterfaces = findMatchedInterfaces();
          // 找到匹配的就退出
          if (matchedInterfaces.length) {
            break;
          }
        }
        if (!matchedInterfaces.length) {
          throw new Forbidden('找不到对应接口，请检查接口的请求方式、路径或者版本号是否正确');
        }
      } else {
        interfaces = matchedInterfaces;
        matchedInterfaces = findMatchedInterfaces();
        if (apiVersion) {
          // 如果是按照版本查接口，就填充版本信息，否则就不需要走这个过程，节省时间
          yield this._fillVersions(interfaces);
        }
      }
    } else {
      const projects = yield this._pDAO.search({conds: {toolKey: key}});
      if (!projects.length) {
        throw new Forbidden('项目不存在，请检查项目的 key 是否正确');
      }
      const projectId = projects[0].id;
      // 获取项目中的接口列表，包含公共资源库中的接口
      interfaces = yield this._dao.getListInProject(projectId);
      if (apiVersion) {
        // 如果是按照版本查接口，就填充版本信息，否则就不需要走这个过程，节省时间
        yield this._fillVersions(interfaces);
      }
      matchedInterfaces = findMatchedInterfaces();
      if (!matchedInterfaces.length) {
        throw new Forbidden('找不到对应接口，请检查接口的请求方式、路径或者版本号是否正确');
      }
    }

    let matchedInterface = matchedInterfaces[0];
    if (matchedInterfaces.length > 1) {
      // 如果找到多个匹配的接口，则那个 path 最长的接口胜出
      matchedInterface = matchedInterfaces.reduce((a, b) => {
        return a.path.length > b.path.length ? a : b;
      });
    }
    const interfaceId = matchedInterface.id;
    // 如果MockStoreService在顶部引入，会产生循环依赖的问题，因为在MockStoreService中又引入了InterfaceService
    const mockStoreService = new (require('./MockStoreService'))(this._uid, this._context);
    const result = yield mockStoreService.crudInterface({itf: matchedInterface, req});
    // 设置用户定义的响应头信息
    const resHeadersParams = yield this._headerResService.getList([interfaceId]);
    if (resHeadersParams.length) {
      const resHeaders = {};
      resHeadersParams.forEach(param => {
        resHeaders[param.name] = param.defaultValue;
      });
      this._context.response.set(resHeaders);
    }
    // 生成调用记录
    yield this._callApiMockService.create({
      interfaceId
    });
    if (matchedInterface.mockDelay) {
      yield this.delay(matchedInterface.mockDelay);
    }
    return result;
  }

  * getApiMockCallTimes() {
    return yield this._callApiMockService.getCallTimes();
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

      let title = `接口【<a class="stateful" href="${url}/interface/detail/?pid=${ret.projectId}&id=${ret.id}">${ret.name}</a>】的变更提醒`;
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
    const auditingInterfaces = list.filter(it => it.statusId === db.STATUS_SYS_AUDITING);
    if (auditingInterfaces.length) {
      throw new IllegalRequestError(`您选择了正在审核中的 HTTP 接口，不能直接修改它的状态，请在详情页面进行审核`);
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
    if (needAuditReasonList.length == 0) {
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

    let hashByInterId = {};
    for (let i = ret.length - 1; i > -1; i--) {
      let record = ret[i];
      if (record.interfaceId in hashByInterId) {
        continue;
      }
      hashByInterId[record.interfaceId] = record;
    }

    for (let i = 0; i < needAuditReasonList.length; i++) {
      const inter = needAuditReasonList[i];
      if (inter.id in hashByInterId) {
        if (inter.status) {
          inter.status.reason = hashByInterId[inter.id].reason;
        } else if (inter.ext.status) {
          inter.ext.status.reason = hashByInterId[inter.id].reason;
        }
      }
    }
  }

  // 填充测试用例，在列表页面展示
  * _fillTestcases(list) {
    const interfaceIds = list.map(it => it.id);
    const testcaseDao = new (require('../dao/TestcaseDao'))({context: this._context});
    const testcases = yield testcaseDao.search({
      conds: {interface_id: interfaceIds}
    });
    list.forEach(item => {
      const tcs = testcases.filter(it => it.interfaceId === item.id);
      const count = tcs.length;
      let todoCount = 0;
      let passCount = 0;
      let failedCount = 0;
      let disabledCount = 0;
      tcs.forEach(it => {
        switch (it.state) {
          case db.API_TST_TODO:
            todoCount++;
            break;
          case db.API_TST_PASS:
            passCount++;
            break;
          case db.API_TST_FAILED:
            failedCount++;
            break;
          case db.API_TST_DISABLED:
            disabledCount++;
            break;
        }
      });
      item.testcaseInfo = {
        count,
        todoCount,
        passCount,
        failedCount,
        disabledCount,
      };
    });
  }

  /**
   * 填充历史记录
   * @param ret,非数组
   */
  * fillHistory(ret) {
    if (ret.id) {
      let activities = new (require('./ResourceHistoryService'))(this._uid, this._context);
      let his = yield activities.find({
        type: db.RES_TYP_INTERFACE,
        id: ret.id,
        limit: 20,
        offset: 0,
        total: true
      });
      ret.history = his.result;
    }
  }

  /**
   * 移动接口后，也要移动接口的响应结果的Mock数据
   */
  * _afterMove({oldProjectId, projectId, ids}) {
    const mockStoreService = new (require('./MockStoreService'))(this._uid, this._context);
    yield mockStoreService.moveInterface({oldProjectId, projectId, ids});
  }
}

module.exports = InterfaceService;
