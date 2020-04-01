/**
 * Attribute Service Class
 */
const log = require('../util/log');
const db = require('../../common').db;
const Invalid = require('../error/fe/InvalidError');
const Parameter = require('../model/db/Parameter');
const _ = require('../util/utility');
const notification = require('./helper/notification');
const history = require('./helper/history');
const Forbidden = require('../error/fe/ForbiddenError');
const Mysql = require('../dao/db/Mysql');

let parameterServiceMap = {
  [db.PAM_TYP_ATTRIBUTE]: './ParamDataTypeService',
  [db.PAM_TYP_INPUT]: './ParamInterfaceReqService',
  [db.PAM_TYP_OUTPUT]: './ParamInterfaceResService',
  [db.PAM_TYP_VMODEL]: './ParamTemplateService',
  [db.PAM_TYP_QUERY]: './ParamWebViewService',
  [db.PAM_TYP_PATHVAR]: './ParamInterfacePathVarService',
  [db.PAM_TYP_RPC_INPUT]: './ParamRpcReqService',
  [db.PAM_TYP_RPC_OUTPUT]: './ParamRpcResService'
};
let parentServiceMap = {
  [db.PAM_TYP_ATTRIBUTE]: './DataTypeService',
  [db.PAM_TYP_INPUT]: './InterfaceService',
  [db.PAM_TYP_OUTPUT]: './InterfaceService',
  [db.PAM_TYP_VMODEL]: './TemplateService',
  [db.PAM_TYP_QUERY]: './ViewService',
  [db.PAM_TYP_PATHVAR]: './InterfaceService',
  [db.PAM_TYP_RPC_INPUT]: './RpcService',
  [db.PAM_TYP_RPC_OUTPUT]: './RpcService',
};
let headererServiceMap = {
  [db.API_HED_REQUEST]: './HeaderReqService',
  [db.API_HED_RESPONSE]: './HeaderResService'
};
const resTypeName = {
  [db.PAM_TYP_QUERY]: 'view',
  [db.PAM_TYP_VMODEL]: 'template',
  [db.PAM_TYP_INPUT]: 'interface',
  [db.PAM_TYP_OUTPUT]: 'interface',
  [db.PAM_TYP_ATTRIBUTE]: 'datatype',
  [db.PAM_TYP_PATHVAR]: 'interface',
  [db.PAM_TYP_RPC_INPUT]: 'rpc',
  [db.PAM_TYP_RPC_OUTPUT]: 'rpc',
};

class AttributeService extends require('./ResourceService') {
  constructor(uid, context, owner, dao) {
    super(uid, context, owner);
    this._dao = new (require(dao))({context});
    this._dataTypeService = new (require('./DataTypeService'))(uid, context);
  }

  /* get param service based on param parent type.
   * e.g db.PAM_TYP_ATTRIBUTE -> ParamDataTypeService
   * @param {Number} parentType - param parent type
   * @param {Number} uid - user id
   * @param {Object} context - koa context
   * @return {Object} service
   */
  static getInstanceByParentType(parentType, uid, context) {
    let service = parameterServiceMap[parentType];
    return new (require(service))(uid, context);
  }

  /* get header service based on header parent type.
   * e.g db.API_HED_REQUEST -> HeaderReqService
   * @param {Number} parentType - header parent type
   * @param {Number} uid - user id
   * @param {Object} context - koa context
   * @return {Object} service
   */
  static getInstanceByHeaderParentType(parentType, uid, context) {
    let service = headererServiceMap[parentType];
    return new (require(service))(uid, context);
  }

  /* get parent service based on param parent type.
   * e.g db.PAM_TYP_ATTRIBUTE -> DataTypeService
   * @param {Number} parentType - param parent type
   * @param {Number} uid - user id
   * @param {Object} context - koa context
   * @return {Object} service
   */
  static getParentInstanceByParentType(parentType, uid, context) {
    let service = parentServiceMap[parentType];
    return new (require(service))(uid, context);
  }

  /**
   * format parameter list
   *
   * @protected
   * @param  {Array} list - parameter list
   * @return {Void}
   */
  _formatParamList(list) {
    // TODO
  }

  _sendParameterOpNotificaion(parentId) {
    let arg = {
      type: resTypeName[this._dao._parentType],
      ids: [parentId],
      oprType: 'update',
      uid: this._uid
    };
    this._async(notification.notify, arg);
  }

  /**
   * get parameters list
   *
   * @param  {Number} id - resource id
   * @param  {Object} [hash]
   * @return {Array} parameters list for resource
   */
  * getList(id, hash) {
    let map = yield this.getListBatch([id], hash);
    return map[id];
  }

  /**
   * get parameters list
   *
   * @param  {Number} ids - resources id
   * @return {Object} parameters list for resources
   * e.g. {
   *     11111: {
   *         params: []
   *     },
   *     22222: {
   *         params: [{
   *             id: 3434343,
   *             name: 'a',
   *             type: 12322
   *         }]
   *     }
   * }
   */
  * getListBatch(ids, hash) {
    if (!ids.length) {
      return {};
    }

    ids = _.toArray(ids);
    // {params:[],overwrite:[],imp0rt:[]}
    let rec = yield this._dao.getList(ids);
    this._formatParamList(rec);
    let res = yield this._owDAO.findBatch(ids);
    hash = hash || (yield this._dataTypeService.getInProject(res[0].projectId));
    let map = yield this._dataTypeService.merge(
      res, rec, this._dao._parentType, hash
    );
    return map;
  }

  /**
   * check import data type
   *
   * @private
   * @param  {Number} pid - project id
   * @param  {Array}  ids - data type id list
   * @param  {Array}  params - parameter list
   * @return {Void}
   */
  * _checkImportDataType(ids, params) {
    let pid = params.projectId;
    // check import data type existed
    if (!ids || !ids.length) {
      throw new Invalid(
        'no import data type found', {
          pid: pid,
          ids: ids
        }
      );
    }
    // check data type exist
    let msg,
      hash = yield this._dataTypeService.getInProject(pid);
    ids.some(function (it) {
      // check exist
      let data = hash[it];
      if (!data) {
        msg = `data type with id ${it} does not exist in project ${pid}`;
        return !0;
      }
      if (data.type !== db.MDL_TYP_NORMAL) {
        msg = `data type not created by user cant be imported, type of data type ${it} is ${data.type}`;
        return !0;
      }
    });
    if (msg != null) {
      throw new Invalid(
        msg, {
          ids: ids,
          pid: pid
        }
      );
    }
    // no check for empty parameters
    if (!params || !params.length) {
      return;
    }
    // check data type imported
    let ret;
    params.some(function (it) {
      let dt = it.originalDatatypeId;
      if (dt != null && ids.includes(dt)) {
        ret = it;
        return !0;
      }
    });
    if (ret) {
      throw new Invalid(
        `data type [${hash[ret.originalDatatypeId].name}] has been imported by [${ret.datatypeName}]`, {
          impFrom: ret.originalDatatypeId,
          resType: ret.parentType,
          iptTo: ret.parentId
        }
      );
    }
  }

  /**
   * import parameter to resource
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Array} ids - data type id list
   * @param  {Array} list - parameter list
   * @return {Void}
   */
  * _import(id, ids, list) {
    yield this._checkImportDataType(
      ids, list
    );
    // do import
    yield this._dao.import(
      list.progroupId, id, ids
    );
  }

  /**
   * import data type to resource parameters
   *
   * @param  {Number} id - resource id
   * @param  {Array} ids - data type id list
   * @return {Void}
   */
  * import(id, ids) {
    log.debug(
      '[%s.import] import data type %j to resource %s',
      this.constructor.name, ids, id
    );
    let list = yield this.getList(id);
    // check import illegal
    yield this._import(
      id, ids, list
    );
  }

  /**
   * check import data type
   *
   * @private
   * @param  {Array}  params - parameter list of the resource
   * @param  {Array}  list - overwrite parameter list
   * @return {Void}
   */
  * _checkOverWriteDataType(params, list) {
    // check overwrite data type existed
    if (!list || !list.length) {
      throw new Invalid('no overwrite list found');
    }
    // check parameter list
    if (!params || !params.length) {
      throw new Invalid('no parameter can be overwritten');
    }
    // check data type can be overwritten
    let ret = {};
    let ret2 = {};
    params.forEach(function (it) {
      // not imported parameter
      if (it.datatypeId == null) {
        return;
      }
      let key = it.datatypeId + '-' + it.id;
      ret[key] = it.type;
      ret2[key] = it.isArray;
      if (it.type === db.MDL_SYS_VARIABLE ||
        it.originalType === db.MDL_SYS_VARIABLE) {
        ret[key] = 0;
      }
    });
    let msg;
    list.some(function (it) {
      let key = it.datatypeId + '-' + it.id,
        lock = ret[key],
        lock2 = ret2[key];
      if (lock == null) {
        msg = `parameter to be overwrited ${it.datatypeId}-${it.id} not exist`;
        return !0;
      }
      if (lock !== 0 && ((it.type != null && it.type != lock) || (it.isArray != null && it.isArray != lock2))) {
        msg = `cant overwrite parameter ${it.datatypeId}-${it.id} with type ${lock} to ${it.type} for not Variable data type`;
        return !0;
      }
    });
    if (msg != null) {
      throw new Invalid(msg);
    }
  }

  /**
   * overwrite parameter to resource
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Array} params - parameter list of the resource
   * @param  {Array} list - overwrite parameter list
   * @return {Void}
   */
  * _overwrite(id, params, list) {
    yield this._checkOverWriteDataType(
      params, list
    );
    // do overwrite
    yield this._dao.overwrite(
      params.progroupId, id, list
    );
  }

  /**
   * overwrite resource parameters
   *
   * @param  {Number} id   - resource id
   * @param  {Array}  list - overwrite information. e.g. [{id: $parameterId, datatypeId: $datatypeId, defaultValue: 'hi'}]
   * @return {Void}
   */
  * overwrite(id, list) {
    log.debug(
      '[%s.overwrite] overwrite parameters for resource %s',
      this.constructor.name, id
    );
    // check illegal overwrite
    let params = yield this.getList(id);
    yield this._overwrite(id, params, list);
  }

  * checkInnerDt(param, projectId, progroupId, hiddenDTs, typeName) {
    if (param.params || param.imports) {
      let hiddenDt = {
        name: typeName || '',
        progroupId,
        projectId,
        params: param.params || [],
        imports: param.imports || [],
        type: db.MDL_TYP_HIDDEN
      };
      let hidden = yield this._dataTypeService.create(hiddenDt, {uncheck: true});
      param.type = hidden.id;
      let datatypes = hidden.hiddenDts;
      datatypes.forEach(item => {
        hiddenDTs.push(item.id);
      });
    }
  }

  static * createBatch({items = []}, uid, context) {
    let returnParams = [];
    let returnDatatypes = [];

    yield Mysql.beginTransaction(context);
    for (let item of items) {
      let parentType = item.parentType;
      let serviceUrl = parameterServiceMap[parentType];
      // todo 优化这里
      let service = new (require(serviceUrl))(uid, context);
      let {params = [], datatypes = []} = yield service.create(item, {});
      returnParams = returnParams.concat(params);
      returnDatatypes = returnDatatypes.concat(datatypes);
    }
    yield Mysql.endTransaction(context);

    return {
      params: returnParams,
      datatypes: returnDatatypes
    };
  }

  /**
   * create parameter records
   * @param {Object} obj - parameter object
   * @param {Number} obj.parentId - parent id of the parameter
   * @param {Array Object} obj.params - params data
   * @param {Array Object} obj.imports - import/overwrite data
   * @return {model/db/Parameter} parameter objects to be created
   */
  * create({parentId, params = [], imports = []}, {sendMsg = true} = {}) {
    let parentType = this._dao._parentType;
    // check owner creation permission
    let ret = yield this._checkCreatePermission(
      parentId
    );
    let progroupId = ret.progroupId;
    let projectId;
    if (this._owDAO) {
      let parent = yield this._owDAO.find(parentId);
      if (parent && parent.projectId) {
        projectId = parent.projectId;
      } else {
        throw new Forbidden(`找不到资源所在的项目 parentId：${parentId}`, {parentId});
      }
    }
    let hash = yield this._dataTypeService.getInProject(projectId);

    let datatypeIdSet = new Set(),
      importIdList = [],
      overwriteList = [];

    // 自身参数处理
    for (let item of params) {
      item.progroupId = progroupId;
      item.parentType = parentType;
      item.parentId = parentId;
      datatypeIdSet.add(item.type);
    }

    // 导入参数处理
    for (let item of imports) {
      let importId = item.id;
      importIdList.push(importId);
      datatypeIdSet.add(importId);
      for (let varitem of (item.vars || [])) {
        varitem = Object.assign(varitem, {
          datatypeId: importId
        });
        overwriteList.push(varitem);
        if (varitem.type) {
          datatypeIdSet.add(varitem.type);
        }
      }
    }

    // 检验所有涉及到的数据类型
    let datatypeIdList = Array.from(datatypeIdSet);
    datatypeIdList = datatypeIdList.filter(it => it !== db.MDL_SYS_OBJECT);
    yield this._dataTypeService._checkCanAccess(projectId, datatypeIdList);

    let returnParams = [],
      returnDatatypes = [],
      hiddenDTs = [],
      addParams = [];

    yield this._beginTransaction();
    //匿名类型递归处理
    for (let param of params) {
      yield this.checkInnerDt(param, projectId, progroupId, hiddenDTs);
    }
    for (let imp0rt of imports) {
      let vars = imp0rt.vars || [];
      for (let varsItem of vars) {
        yield this.checkInnerDt(varsItem, projectId, progroupId, hiddenDTs);
      }
    }

    if (params.length) {
      let parameterModels = params.map(item => new Parameter(item));
      addParams = yield this._dao.createBatch(parameterModels);
      addParams.forEach(item => {
        item.typeName = hash[item.type] ? hash[item.type].name : '';
      });
      returnParams = addParams;
    }
    if (importIdList.length) {
      yield this.import(parentId, importIdList, projectId);
      if (parentType === db.PAM_TYP_ATTRIBUTE) {
        yield this._dataTypeService.clearCache({pids: projectId});
      }
      for (let id of importIdList) {
        let d = hash[id];
        d.params.forEach((item) => {
          item.datatypeId = d.id;
          item.datatypeName = d.name;
          item.parentId = parentId;
          item.parentType = parentType;
        });
        returnParams = returnParams.concat(d.params);
      }
    }
    if (overwriteList.length) {
      yield this.overwrite(parentId, overwriteList);
    }
    yield this._endTransaction();

    if (parentType === db.PAM_TYP_ATTRIBUTE || hiddenDTs.length > 0) {
      yield this._dataTypeService.clearCache({pids: projectId, detailOnly: !hiddenDTs.length});
    }
    let datatypeListUsedByDatatype = [];
    if (parentType === db.PAM_TYP_ATTRIBUTE) {
      //查找相关的数据类型
      datatypeListUsedByDatatype = yield this._dataTypeService.getListUsedByDataType(parentId);
      returnDatatypes = returnDatatypes.concat(datatypeListUsedByDatatype);
    }
    if (hiddenDTs.length > 0) {
      //查找匿名类型
      hiddenDTs = yield this._dataTypeService.findDetailByIds(hiddenDTs);
      returnDatatypes = returnDatatypes.concat(hiddenDTs);
    }

    if (sendMsg) {
      if (params.length) {
        const children = yield this._dao.findBatch(addParams.map(param => param.id));
        const ret = addParams.map(item => {
          item._parentId = item.parentId;
          item._childrenId = [item.id];
          return item;
        });
        this._async(history.log, {
          dName: this._dao.constructor.name,
          oprType: 'add',
          uid: this._uid,
          ret,
          children
        });
      }

      if (importIdList.length) {
        this._async(history.log, {
          dName: this._dao.constructor.name,
          oprType: 'add',
          uid: this._uid,
          ret: {_parentId: parentId, _childrenIds: importIdList},
          isImport: true
        });
      }
      this._sendParameterOpNotificaion(parentId);
    }
    // 方便一些更新操作之后要做其他操作，比如http接口响应参数添加字段后，需要更新mock数据
    yield this._afterCreate({parentId, parentType, createdParams: returnParams, datatypeListUsedByDatatype});
    return {
      params: returnParams,
      datatypes: returnDatatypes
    };
  }

  /**
   * 删除参数
   * @param {Object} obj - 删除数据对象
   * @return {Array} 被删除的数据列表
   */
  * remove({parentId, params = [], imports = []}, {clearAll = false, sendMsg = true} = {}) {
    log.debug('[%s.remove] - remove parameter ', this.constructor.name);

    let parentType = this._dao._parentType;
    let parentService = AttributeService.getParentInstanceByParentType(parentType, this._uid, this._context);
    yield parentService._checkRemovePermission(parentId);
    let projectId;
    if (this._owDAO) {
      let parent = yield this._owDAO.find(parentId);
      if (parent && parent.projectId) {
        projectId = parent.projectId;
      }
    }
    if (!projectId) {
      throw new Forbidden(`找不到资源所在的项目 parentId：${parentId}`, {parentId});
    }
    let parameters = [];

    if (clearAll) {
      let pramsObj = yield this._dao.getList(parentId);
      if (pramsObj) {
        params = (pramsObj.params || []).map(item => item.id);
        imports = (pramsObj.imp0rt || []).map(item => item.datatypeId);
      }
    }

    if (params.length) {
      parameters = yield this._dao.findBatch(params);
      const idParam = parameters.find(param => param.name === 'id');
      if (parentType === db.PAM_TYP_ATTRIBUTE && idParam) {
        const datatypeListUsedByDatatype = yield this._dataTypeService.getListUsedByDataType(parentId);
        // 如果是在删除数据模型的 id 字段，则要检查这个数据模型是否被接口关联，如果关联了接口，则不允许删除
        const connectedInterfaces = yield this._dataTypeService.getConnectedInterfaces({datatypeIds: datatypeListUsedByDatatype.map(dt => dt.id)});
        // 不能光从名称为 id 来判断，因为它可能是 Object 类型的 id 字段，不是数据模型自已的
        const connectedInterfaceIds = connectedInterfaces.map(itf => itf.id);
        if (connectedInterfaceIds.find(id => id === parentId)) {
          throw new Forbidden(`数据模型已经和接口关联，不能删除 id 字段`, {parentId});
        }
      }
    }

    //删除相关的匿名类型
    let datatypeMap = yield this._dataTypeService.getInProject(projectId);
    let sys = yield this._dataTypeService._dao.getListOfSystem();
    let sysMap = {};
    sys.forEach((item) => {
      sysMap[item.id] = true;
    });

    let datatypeIdSet = new Set();
    if (parameters.length) {
      //查找匿名类
      for (let param of parameters) {
        if (!sysMap[param.type]) {
          let innerDatatype = datatypeMap[param.type];
          if (!innerDatatype) {
            innerDatatype = yield this._dataTypeService._dao.find(param.type);
          }
          if (innerDatatype && innerDatatype.type === db.MDL_TYP_HIDDEN) {
            datatypeIdSet.add(param.type);
          }
        }
      }
    }
    if (imports.length) {
      // 查找该数据模型中的所有匿名类型
      var list = Array.isArray(imports) ? imports : [imports];
      for (let ipts of list) {
        let datatype = datatypeMap[ipts];
        if (datatype) {
          // 保存check过的数据模型id，防止递归爆栈
          var checkIds = [];
          datatype.params.forEach(function findDeleteIds(param) {
            var dt = datatypeMap[param.type];
            if (checkIds.indexOf(dt.id) !== -1) {
              return;
            } else {
              checkIds.push(dt.id);
            }
            // 只删除原来的数据是Variable的情况
            if (dt && param.datatypeId > 0) {
              var judgeDatatype = datatypeMap[param.datatypeId];
              var p = (judgeDatatype.params || []).find(pam => pam.id === param.id);
              if (p && p.type === db.MDL_SYS_VARIABLE && dt.type === 2) {
                datatypeIdSet.add(dt.id);
              }
            } else {
              if (dt && dt.params && dt.params.length) {
                dt.params.forEach(p => {
                  findDeleteIds(p);
                });
              }
            }
          });
        }
        let overwrites = yield this._dao._expModels[0].Dao.search({
          conds: {
            datatypeId: ipts,
            parentId,
            parentType
          }
        });
        for (let overwrite of overwrites) {
          if (!sysMap[overwrite.type]) {
            let innerDatatype = datatypeMap[overwrite.type];
            if (!innerDatatype) {
              innerDatatype = yield this._dataTypeService._dao.find(overwrite.type);
            }
            if (innerDatatype && innerDatatype.type === db.MDL_TYP_HIDDEN) {
              datatypeIdSet.add(overwrite.type);
            }
          }
        }
      }
    }
    let innerDatatypeIds = Array.from(datatypeIdSet);

    yield this._beginTransaction();
    // 删除自身参数
    let removeParams = [];
    if (params.length) {
      removeParams = yield this._dao.findBatch(params);
      yield this._dao.remove(parentId, params);
    }
    // 删除导入类型
    if (imports.length) {
      yield this._dao.removeImport(parentId, imports);
    }

    if (innerDatatypeIds.length) {
      //删除匿名类型
      yield this._dataTypeService.removeBatch(innerDatatypeIds, true);
    }
    yield this._endTransaction();

    if (parentType === db.PAM_TYP_ATTRIBUTE && (params.length || imports.length)) {
      // 清空缓存
      yield this._dataTypeService.clearCache({pids: projectId});
    }

    let returnParams = [];
    let returnDatatypes = [];
    let returnImports = [];
    let datatypeListUsedByDatatype = [];
    if (parentType === db.PAM_TYP_ATTRIBUTE) {
      datatypeListUsedByDatatype = yield this._dataTypeService.getListUsedByDataType(parentId);
      returnDatatypes = datatypeListUsedByDatatype;
    } else {
      if (params.length) {
        returnParams = params;
      } else if (imports.length) {
        returnImports = imports;
      } else if (innerDatatypeIds.length) {
        returnDatatypes = innerDatatypeIds;
      }
    }

    if (sendMsg) {
      this._sendParameterOpNotificaion(parentId);

      if (params.length) {
        this._async(history.log, {
          dName: this._dao.constructor.name,
          oprType: 'del',
          uid: this._uid,
          ret: {_parentId: parentId, _children: removeParams}
        });
      }

      if (imports.length) {
        this._async(history.log, {
          dName: this._dao.constructor.name,
          oprType: 'del',
          uid: this._uid,
          ret: {_parentId: parentId, _childrenIds: imports},
          isImport: true
        });
      }
    }
    // 方便一些更新操作之后要做其他操作，比如http接口响应参数删除字段后，需要更新mock数据
    yield this._afterRemove({
      parentId,
      parentType,
      removedParams: removeParams,
      removedImports: imports,
      clearAll,
      datatypeListUsedByDatatype
    });

    return {
      params: returnParams,
      datatypes: returnDatatypes,
      imports: returnImports
    };
  }

  /**
   * update parameters. update self params or overwrite params
   * @param {Object} model - parameter data
   * @return {model/db/Parameter}
   */
  * update(model) {
    let ret = yield this._checkUpdatePermission(model.id);
    let progroupId = ret.progroupId;

    let parentId = model.parentId;
    let parentType = this._dao._parentType;

    let projectId;
    if (this._owDAO) {
      let parent = yield this._owDAO.find(parentId);
      if (parent && parent.projectId) {
        projectId = parent.projectId;
        if (this._dao._parentType === db.PAM_TYP_OUTPUT && model.hasOwnProperty('required')) {
          let pDAO = new (require('../dao/ProjectDao'))({context: this._context});
          let project = yield pDAO.find(projectId);
          if (!project.resParamRequired) {
            throw new Forbidden(`该项目不支持修改响应信息返回结果的参数是否必需属性`, {parentId});
          }
        }
      }
    }
    if (!projectId) {
      throw new Forbidden(`找不到资源所在的项目 parentId：${parentId}`, {parentId});
    }

    const oldParam = yield this._dao.find(model.id);
    // 取旧参数的详细信息，之后更新mongo中的mock数据会用到，oldParamDetail 并不是mysql中的存储数据，是经过处理的
    // 比如被导入的数据模型的可变字段，它的type已经是实际数据类型，不会是定义时的可变类型
    const oldParams = yield this.getList(parentId);
    const oldParamDetail = oldParams.find(item => item.id === model.id);

    // 更新数据模型时，如果数据模型有关联的接口，此时不能更改数据模型的id字段的名称，并且id字段的类型只能为string或者number，也不能为数组
    if (parentType === db.PAM_TYP_ATTRIBUTE && oldParam.name === 'id' && (model.hasOwnProperty('name') || model.hasOwnProperty('type'))) {
      const datatypeListUsedByDatatype = yield this._dataTypeService.getListUsedByDataType(parentId);
      const connectedInterfaces = yield this._dataTypeService.getConnectedInterfaces({datatypeIds: datatypeListUsedByDatatype.map(dt => dt.id)});
      if (connectedInterfaces.length) {
        if (model.hasOwnProperty('name') && model.name !== 'id') {
          throw new Forbidden(`数据模型已经和接口关联，必须要有 id 字段`, {parentId});
        } else if (model.hasOwnProperty('type') && (model.type !== db.MDL_SYS_STRING && model.type !== db.MDL_SYS_NUMBER) || model.isArray) {
          throw new Forbidden(`数据模型已经和接口关联，id 字段的类型必须是String或者Number`, {parentId});
        }
      }
    }
    let oldParameter;
    let returnDatatypes = [];
    let returnParams = [];

    yield this._beginTransaction();
    let hiddenDTs = [];
    yield this.checkInnerDt(model, projectId, progroupId, hiddenDTs, model.typeName);
    let innerDatatypeSet = new Set();
    if (model.type) {
      //检查类型
      yield this._dataTypeService._checkCanAccess(projectId, model.type);
      if (!oldParam) {
        throw new Forbidden(`找不到对应的参数id: ${model.id}`);
      }
      //删除相关的匿名类型
      let datatypeMap = yield this._dataTypeService.getInProject(projectId);
      let sys = yield this._dataTypeService._dao.getListOfSystem();
      let sysMap = {};
      sys.forEach((item) => {
        sysMap[item.id] = true;
      });

      let innerDatatype = datatypeMap[oldParam.type];
      if (!sysMap[oldParam.type]) {
        if (!innerDatatype) {
          innerDatatype = yield this._dataTypeService._dao.find(oldParam.type);
        }
        if (innerDatatype && innerDatatype.type === db.MDL_TYP_HIDDEN) {
          innerDatatypeSet.add(oldParam.type);
        }
      }
      // Variable 的逻辑不太一样
      if (innerDatatype && innerDatatype.id === db.MDL_SYS_VARIABLE && model.datatypeId) {
        let overwrites = yield this._dao._expModels[0].Dao.search({
          conds: {
            datatypeId: model.datatypeId,
            parentId: model.parentId,
            parentType: model.parentType
          }
        });
        for (let overwrite of overwrites) {
          if (!sysMap[overwrite.type]) {
            innerDatatype = datatypeMap[overwrite.type];
            if (!innerDatatype) {
              innerDatatype = yield this._dataTypeService._dao.find(overwrite.type);
            }
            if (innerDatatype && innerDatatype.type === db.MDL_TYP_HIDDEN) {
              innerDatatypeSet.add(overwrite.type);
            }
          }
        }
      }
    }

    if (model.datatypeId) {
      if (model.type && oldParam.type !== db.MDL_SYS_VARIABLE) {
        throw new Forbidden(`参数原类型不是可变类型，不允许修改type`);
      }
      let oldParams = yield this.getList(parentId);
      oldParameter = oldParams.find(item => item.id === model.id);
      //overwrite params
      yield this.overwrite(parentId, [model]);

      this._sendParameterOpNotificaion(parentId);
    } else {
      yield this._dao.update(model); //self params
    }

    let innerDatatypeIds = Array.from(innerDatatypeSet);
    //删除匿名类
    if (innerDatatypeIds.length) {
      yield this._dataTypeService.removeBatch(innerDatatypeIds, true);
    }

    yield this._endTransaction();

    if (parentType === db.PAM_TYP_ATTRIBUTE || hiddenDTs.length > 0) {
      yield this._dataTypeService.clearCache({pids: projectId, detailOnly: !hiddenDTs.length});
    }
    let datatypeListUsedByDatatype = [];
    if (parentType === db.PAM_TYP_ATTRIBUTE) {
      // 不能用前面的查询结果，因为数据模型属性的名称或者类型已经被修改过了
      datatypeListUsedByDatatype = yield this._dataTypeService.getListUsedByDataType(parentId);
      returnDatatypes = datatypeListUsedByDatatype;
    }

    if (hiddenDTs.length > 0) {
      //查找匿名类型
      let hiddens = yield this._dataTypeService.findDetailByIds(hiddenDTs);
      returnDatatypes = returnDatatypes.concat(hiddens);
    }
    let list = yield this.getList(parentId);
    if (model.hasOwnProperty('datatypeId')) {
      list.forEach(param => {
        if (param.id === model.parameterId && param.datatypeId === model.datatypeId) {
          returnParams.push(param);
        }
      });
    } else {
      list.forEach(param => {
        if (param.id === model.id) {
          returnParams.push(param);
        }
      });
    }
    // 方便一些更新操作之后要做其他操作，比如http接口响应参数修改后，需要更新mock数据
    yield this._afterUpdate({
      parentId: model.parentId,
      parentType,
      newParam: returnParams[0],
      oldParam: oldParamDetail,
      datatypeListUsedByDatatype
    });

    this._async(history.log, {
      dName: this._dao.constructor.name,
      oprType: 'update',
      uid: this._uid,
      ret: {
        id: model.id,
        // 导入参数的旧值为oldParameter
        _oData: model.datatypeId ? oldParameter : oldParam,
        _model: model,
        _parentId: parentId
      }
    });

    return {
      params: returnParams,
      datatypes: returnDatatypes
    };
  }

  * hiddenDtBatchOpt({datatypeId: parentId, params = [], imports = []}) {
    let parentType = this._dao._parentType;
    //权限验证
    let parentService = AttributeService.getParentInstanceByParentType(parentType, this._uid, this._context);
    let ret = yield parentService._checkUpdatePermission(parentId);
    let progroupId = ret.progroupId;
    //根据parameter table 找parent

    let addObj = {
      parentId,
      params: [],
      imports: []
    };
    let deleteObj = {
      parentId,
      params: [],
      imports: []
    };

    let updateObj = {
      parentId,
      params: [],
      imports: []
    };

    for (let item of params) {
      if (item.action === 'add') {
        addObj.params.push(item);
      } else if (item.action === 'update') {
        updateObj.params.push(item);
      } else if (item.action === 'delete') {
        deleteObj.params.push(item.id);
      }
    }
    for (let item of imports) {
      if (item.action === 'add') {
        addObj.imports.push(item);
      } else if (item.action === 'update') {
        updateObj.imports.push(item);
      } else if (item.action === 'delete') {
        deleteObj.imports.push(item.id);
      }
    }

    let returnDatatypes = [];
    let returnDatatypeMap = {};

    yield this._beginTransaction();

    if (addObj.params.length || addObj.imports.length) {
      let ret = yield this.create(addObj);
      for (let item of ret.datatypes || []) {
        returnDatatypeMap[item.id] = item;
      }
    }
    if (deleteObj.params.length || deleteObj.imports.length) {
      let ret = yield this.remove(deleteObj);
      for (let item of ret.datatypes || []) {
        returnDatatypeMap[item.id] = item;
      }
    }
    if (updateObj.params.length || updateObj.imports.length) {
      for (let item of updateObj.params) {
        item.parentId = parentId;
        yield this.update(item);
      }
      for (let item of updateObj.imports) {
        for (let paramItem of item.vars) {
          paramItem.parentId = parentId;
          paramItem.datatypeId = item.id;
          yield this.update(paramItem);
        }
      }
    }

    yield this._endTransaction();

    let hash = yield this._dataTypeService.getInProGroup(progroupId);
    Object.keys(returnDatatypeMap).forEach(key => {
      returnDatatypes.push(hash[key]);
    });
    let hidden = yield this._dataTypeService.findDetailById(parentId);
    returnDatatypes.push(hidden);

    return {
      params: [],
      datatypes: returnDatatypes
    };
  }

  * updatePosition(obj, {sendMsg = true} = {}) {
    log.debug('[%s.updatePosition] - update position ', this.constructor.name);
    let parentId = obj.parentId;
    let parentType = this._dao._parentType;
    let params = obj.params || [];
    //权限验证
    //用于将参数和请求头统一处理
    let realParentType = parentType;
    if (this.isHeader) {
      realParentType = db.PAM_TYP_OUTPUT;
    }
    let parentService = AttributeService.getParentInstanceByParentType(realParentType, this._uid, this._context);
    yield parentService._checkUpdatePermission(parentId);

    yield this._beginTransaction();
    for (let item of params) {
      if (item.id) {
        //更新自身参数position
        yield this._dao.update({id: item.id, position: item.position});
      } else if (item.datatypeId) {
        //更新导入参数position
        yield this._dao.updateImport({position: item.position}, {
          datatypeId: item.datatypeId,
          parentId,
          parentType
        });
      }
    }
    yield this._endTransaction();
    if (realParentType === db.PAM_TYP_ATTRIBUTE) {
      // 清空缓存
      let projectId = yield this._dataTypeService._dao.getProjects(parentId);
      yield this._dataTypeService.clearCache({pids: projectId});
    }
    if (sendMsg) {
      this._async(history.log, {
        dName: this._dao.constructor.name,
        oprType: 'update',
        uid: this._uid,
        ret: {
          _model: {
            position: true
          },
          _oData: {
            position: true
          },
          _parentId: parentId
        }
      });
    }
    return obj;
  }
}

module.exports = AttributeService;
