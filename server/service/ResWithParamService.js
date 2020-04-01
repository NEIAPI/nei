/**
 * ResourceWithParam Service Class
 *
 * For:
 *     interface
 *     template
 *     datatype
 *     page
 */

const log = require('../util/log');
const db = require('../../common').db;
const Forbidden = require('../error/fe/ForbiddenError');
const history = require('./helper/history');
const _ = require('../util/utility');

const paramHash = {
  [db.RES_TYP_DATATYPE]: {
    parentType: [db.PAM_TYP_ATTRIBUTE],
    parameterDaoUrl: ['../dao/ParamDataTypeDao']
  },
  [db.RES_TYP_INTERFACE]: {
    parentType: [db.PAM_TYP_INPUT, db.PAM_TYP_OUTPUT, db.PAM_TYP_PATHVAR],
    parameterDaoUrl: ['../dao/ParamInterfaceReqDao', '../dao/ParamInterfaceResDao', '../dao/ParamInterfacePathVarDao']
  },
  [db.RES_TYP_RPC]: {
    parentType: [db.PAM_TYP_RPC_INPUT, db.PAM_TYP_RPC_OUTPUT],
    parameterDaoUrl: ['../dao/ParamRpcReqDao', '../dao/ParamRpcResDao']
  },
  [db.RES_TYP_TEMPLATE]: {
    parentType: [db.PAM_TYP_VMODEL],
    parameterDaoUrl: ['../dao/ParamTemplateDao']
  },
  [db.RES_TYP_WEBVIEW]: {
    parentType: [db.PAM_TYP_QUERY],
    parameterDaoUrl: ['../dao/ParamWebViewDao']
  }
};

const headerHash = {
  [db.RES_TYP_INTERFACE]: {
    headerParentType: [db.API_HED_REQUEST, db.API_HED_RESPONSE],
    headerDaoUrl: ['../dao/InterfaceHeaderReqDao', '../dao/InterfaceHeaderResDao']
  }
};

// datatype format -> datatype id
const _formatHash = {
  [db.MDL_FMT_STRING]: db.MDL_SYS_STRING,
  [db.MDL_FMT_NUMBER]: db.MDL_SYS_NUMBER,
  [db.MDL_FMT_BOOLEAN]: db.MDL_SYS_BOOLEAN,
  [db.MDL_FMT_FILE]: db.MDL_SYS_FILE,
  [db.MDL_FMT_ARRAY]: db.MDL_SYS_STRING,
  [db.MDL_FMT_HASHMAP]: db.MDL_SYS_STRING
};

const ResourceService = require('./ResourceService');

class ResWithParamService extends ResourceService {
  constructor(uid, context, owner, param) {
    super(uid, context, owner);
    if (param) {
      this.param = param;
    }
  }

  * _afterCreate() {
  }

  /* check whether the format is base type, if so return it's associated datatype id for default param
   * @param {Number} datatype format
   * @return {Number|undefined}
   */
  getBaseType(format) {
    return _formatHash[format];
  }

  /**
   * create resource record
   * @param {Object} obj - resource object
   * @param {Object} conflictOpt - conflict check options
   * @return
   */
  * create({name, projectId, params = [], imports = []}, conflictOpt) {
    let model = arguments[0];
    let ret = yield this._checkCreatePermission(projectId);
    model.progroupId = ret.progroupId;

    let paramRet;

    if (!conflictOpt) {
      conflictOpt = {name};
    }
    if (!conflictOpt.hasOwnProperty('uncheck')) {
      yield this._checkConflictInProject(projectId, conflictOpt, '存在冲突的资源');
    }

    yield this._beginTransaction();
    // create the resource
    ret = yield super.create(model);
    yield this._afterCreate(model, ret.id);
    let id = ret.id;
    // create params
    if (this.param) {
      let paramService = new (require(this.param))(this._uid, this._context);
      paramRet = yield paramService.create({
        parentId: id,
        params: params,
        imports: imports
      }, {sendMsg: false});
    }
    yield this._endTransaction();
    ret = yield this.findDetailById(id);
    ret.hiddenDts = [];
    if (paramRet) {
      let rec = paramRet.datatypes || [];
      ret.hiddenDts = rec.filter(it => it.type === db.MDL_TYP_HIDDEN);
    }
    return ret;
  }

  /**
   * get detail data for the resource by id, including params
   * @param {Number} id - resource id
   * @return {model/db/Template|Interface|View|Datatype}
   */
  * findDetailById(id) {
    log.debug('[%s.findDetailById] - get resource by id：%s', this.constructor.name, id);
    yield this._checkSearchPermission(id);
    let ret = yield this._dao.find(id, {
      joins: [
        ...this._dao._getUserJoins(),
        ...this._dao._getStatusJoins()
      ]
    });
    return ret;
  }

  /**
   * get parent and dao info by given resource type
   * @return {Object}
   *
   * e.g. For Interface
   *
   * {
   *     parentType: [db.PAM_TYP_INPUT, db.PAM_TYP_OUTPUT],
   *     parameterDaoUrl: ['../dao/ParamInterfaceReqDao', '../dao/ParamInterfaceResDao']
   *     headerParentType: [db.API_HED_REQUEST, db.API_HED_RESPONSE],
   *     headerDaoUrl: ['../dao/InterfaceHeaderReqDao', '../dao/InterfaceHeaderResDao']
   * }
   */
  _getResParentMapAndDaoUrl() {
    let daoType = this._dao._type;
    let {parentType, parameterDaoUrl} = paramHash[daoType];
    if (!parentType || !parameterDaoUrl) {
      throw new Forbidden('该类型资源不能复制');
    }
    let {headerParentType, headerDaoUrl} = (headerHash[daoType] || {});
    return {
      parentType,
      parameterDaoUrl,
      headerParentType,
      headerDaoUrl
    };
  }

  /**
   * check resource parameters
   *
   * @param {Object} obj - resource data
   * @param {Number} obj.progroupId - target progroup id
   * @param {Number} obj.oldProgroupId - old progroup id
   * @param {Array} obj.ids -resource id list
   * @return
   */
  * _checkResParamsQuotes({
    ids,
    progroupId,
    oldProgroupId,
    projectId,
    oldProjectId,
    oldPubProjectId,
    groupId
  }) {
    let dtService = new (require('./DataTypeService'))(this._uid, this._context);
    let newHash = yield dtService.getInProject(projectId);
    let oldHash = yield dtService.getInProject(oldProjectId);

    let relationIds = [];
    let datatypeMap = {};
    let parameterMap = {};

    //获取资源相关的数据类型
    let {
      parentType,
      parameterDaoUrl,
      headerParentType,
      headerDaoUrl
    } = this._getResParentMapAndDaoUrl();

    let AttributeService = require('./AttributeService');
    let params = [];
    for (let type of parentType) {
      let paremeterService = AttributeService.getInstanceByParentType(type, this._uid, this._context);
      let rec = yield paremeterService.getListBatch(ids);
      Object.keys(rec).forEach(rid => {
        params = params.concat(rec[rid] || []);
      });
    }
    if (headerParentType) {
      for (let type of headerParentType) {
        let paremeterService = AttributeService.getInstanceByHeaderParentType(type, this._uid, this._context);
        let rec = yield paremeterService.getListBatch(ids);
        Object.keys(rec).forEach(rid => {
          params = params.concat(rec[rid] || []);
        });
      }
    }
    let tmpRelationIds = yield dtService.getListInDataType(oldProjectId, {params});

    //跨项目复制 需要复制引用和导入的数据类型
    if (oldProjectId != projectId) {
      //跨项目复制
      for (let id of tmpRelationIds) {
        let datatype = oldHash[id];
        //判断是否需要插入新的数据模型 同项目组内并且该数据模型属于公共资源库，则不需要复制
        if (datatype.type == db.MDL_TYP_HIDDEN) {
          if (relationIds.indexOf(id) == -1) {
            relationIds.push(id);
          }
        } else if (!(datatype.projectId == oldPubProjectId && oldProgroupId == progroupId)) {
          //同名检查
          let _pDAO = new (require('../dao/ProjectDao'))({context: this._context});
          let pids = yield _pDAO.getRelationPids(projectId);
          let sameDatatypes = yield dtService._dao.search({
            conds: {
              name: datatype.name,
              projectId: pids
            }
          });
          if (sameDatatypes.length) {
            //添加映射
            datatypeMap[id] = sameDatatypes[0].id;
          } else {
            if (relationIds.indexOf(id) == -1) {
              relationIds.push(id);
            }
          }
        }
      }
    } else {
      //同一个项目复制匿名类型
      for (let id of tmpRelationIds) {
        let datatype = oldHash[id];
        if (datatype.type == db.MDL_TYP_HIDDEN) {
          if (relationIds.indexOf(id) == -1) {
            relationIds.push(id);
          }
        }
      }
    }
    return {
      ids,
      progroupId,
      oldProgroupId,
      projectId,
      groupId,
      newHash,
      oldHash,
      parentType,
      parameterDaoUrl,
      headerParentType,
      headerDaoUrl,
      relationIds,
      datatypeMap,
      parameterMap
    };
  }

  /**
   * check resource parameters for move action
   *
   * @param {Object} obj - resource data
   * @param {Array Number} obj.ids - resource ids
   * @param {Number} obj.progroupId - target progroup id
   * @param {Number} obj.oldProjectId - old project id
   * @param {Number} obj.projectId - target project id
   * @param {Number} obj.groupId - group id
   * @param {String} obj.tag
   * @return {Void}
   */
  * _checkResParamsMoveQuotes({
    ids,
    progroupId,
    oldProjectId,
    projectId,
    groupId,
    tag
  }) {
    let dtService = new (require('./DataTypeService'))(this._uid, this._context);
    let oldHash = yield dtService.getInProject(oldProjectId);

    let relationIds = [];
    //获取资源相关的数据类型
    let {
      parentType,
      headerParentType,
    } = this._getResParentMapAndDaoUrl();

    let AttributeService = require('./AttributeService');
    let params = [];
    for (let type of parentType) {
      let parameterService = AttributeService.getInstanceByParentType(type, this._uid, this._context);
      let rec = yield parameterService.getListBatch(ids);
      Object.keys(rec).forEach(rid => {
        params = params.concat(rec[rid] || []);
      });
    }
    if (headerParentType) {
      for (let type of headerParentType) {
        let parameterService = AttributeService.getInstanceByHeaderParentType(type, this._uid, this._context);
        let rec = yield parameterService.getListBatch(ids);
        Object.keys(rec).forEach(rid => {
          params = params.concat(rec[rid] || []);
        });
      }
    }
    let tmpRelationIds = yield dtService.getListInDataType(oldProjectId, {params});
    let _pDAO = new (require('../dao/ProjectDao'))({context: this._context});
    let refProjectIds = yield _pDAO.getRelationPids(projectId);
    for (let id of tmpRelationIds) {
      let datatype = oldHash[id];
      let sameDatatypes = yield dtService._dao.search({conds: {name: datatype.name, projectId: refProjectIds}});
      if (sameDatatypes.length &&
        datatype.type !== db.MDL_TYP_HIDDEN &&
        sameDatatypes.some(item => {
          return item.id !== id;
        })
      ) {
        throw new Forbidden('接口引用的数据模型在目标项目存在同名冲突', {id});
      }
      if (!relationIds.includes(id)) {
        relationIds.push(id);
      }
    }
    if (relationIds.length) {
      let resTypeMapWithS = {
        [db.RES_TYP_WEBVIEW]: 'pages',
        [db.RES_TYP_TEMPLATE]: 'templates',
        [db.RES_TYP_INTERFACE]: 'interfaces',
        [db.RES_TYP_RPC]: 'rpcs',
        [db.RES_TYP_DATATYPE]: 'datatypes'
      };
      //判断数据模型是否被非目标项目内的资源引用
      let map = yield dtService.getQuotes(relationIds);
      Object.keys(map).forEach(key => {
        let items = map[key];
        if (Array.isArray(items) && items.length) { // filter out 'hasQuotes'
          items.forEach(item => {
            if (!(
              item.projectId === projectId ||
              (key === resTypeMapWithS[db.RES_TYP_DATATYPE] && relationIds.includes(item.id)) ||
              (key === resTypeMapWithS[this._dao._type] && ids.includes(item.id)))) {
              throw new Forbidden('移动失败，接口引用的数据模型已被其他资源引用，无法移动，请确认', {ids});
            }
          });
        }
      });
    }

    return {
      ids,
      progroupId,
      projectId,
      groupId,
      relationIds,
      tag
    };
  }

  /**
   * copy datatypes
   *
   * @param {Object} obj - resource data
   * @return
   */
  * _copyDataTypes({
    relationIds,
    datatypeMap,
    parameterMap,
    newHash,
    oldHash,
    progroupId,
    projectId,
    groupId
  }) {
    let dtService = new (require('./DataTypeService'))(this._uid, this._context);
    //复制数据模型
    for (let item of relationIds) {
      let datatype = oldHash[item];
      //复制并添加映射
      _.filterObj(datatype, ['id', 'creator', 'group', 'params', 'createTime']);
      datatype.progroupId = progroupId;
      datatype.projectId = projectId;
      datatype.groupId = groupId;

      let ret = yield dtService._dao.create(datatype);
      let id = ret.id;
      datatypeMap[item] = id;

      this._async(history.log, {
        dName: dtService._dao.constructor.name,
        oprType: 'add',
        uid: this._uid,
        ret
      });
    }
    //复制参数
    let pmDao = new (require('../dao/ParamDataTypeDao'))({context: this._context});
    yield pmDao.cloneParametersAndImports({
      progroupId,
      parentId: relationIds,
      parentMap: datatypeMap,
      datatypeMap,
      parameterMap,
      newHash,
      oldHash
    });
  }

  /**
   * copy params
   *
   * @param {Object} obj - resource data
   * @return
   */
  * _copyParams({
    ids,
    progroupId,
    newHash,
    oldHash,
    parameterDaoUrl,
    headerParentType,
    headerDaoUrl,
    datatypeMap,
    parameterMap,
    cloneResourceMap
  }) {
    if (ids.length) {
      for (let daoUrl of parameterDaoUrl) {
        let pmDao = new (require(daoUrl))({context: this._context});
        yield pmDao.cloneParametersAndImports({
          progroupId,
          parentId: ids,
          parentMap: cloneResourceMap,
          datatypeMap,
          parameterMap,
          newHash,
          oldHash
        });
      }
      //复制接口请求头
      if (headerParentType) {
        for (let daoUrl of headerDaoUrl) {
          let pmDao = new (require(daoUrl))({context: this._context});
          yield pmDao.cloneParametersAndImports({
            progroupId,
            parentId: ids,
            parentMap: cloneResourceMap,
            datatypeMap,
            parameterMap,
            newHash,
            oldHash
          });
        }
      }
    }
  }

  /**
   * copy resource parameters
   *
   * @param {Object} obj - resource data
   * @return
   */
  * _copyResParamsQuotesData({
    ids,
    progroupId,
    projectId,
    groupId,
    newHash,
    oldHash,
    parameterDaoUrl,
    headerParentType,
    headerDaoUrl,
    relationIds,
    datatypeMap,
    parameterMap
  }, cloneResourceMap) {
    //去重 & 添加数据模型映射
    if (this._dao._type === db.RES_TYP_DATATYPE) {
      relationIds = relationIds.filter(id => !cloneResourceMap[id]);
      Object.assign(datatypeMap, cloneResourceMap);
    }
    //复制数据模型
    if (relationIds.length) {
      yield this._copyDataTypes({
        relationIds,
        datatypeMap,
        parameterMap,
        newHash,
        oldHash,
        progroupId,
        projectId,
        groupId
      });
    }

    //复制资源参数
    yield this._copyParams({
      ids,
      progroupId,
      newHash,
      oldHash,
      parameterDaoUrl,
      headerParentType,
      headerDaoUrl,
      datatypeMap,
      parameterMap,
      cloneResourceMap
    });
  }

  /**
   * move resource parameters
   *
   * @param {Object} obj - resource data
   * @return
   */
  * _moveResParamsQuotesData({
    projectId,
    groupId,
    relationIds,
    tag
  }) {
    if (!relationIds || !relationIds.length) {
      return;
    }
    //移动数据模型
    let dtService = new (require('./DataTypeService'))(this._uid, this._context);
    yield dtService.updateBatch({projectId, groupId, tag}, relationIds);
    //移动操作历史
    let rhDAO = new (require('../dao/ResourceHistoryDao'))({context: this._context});
    yield rhDAO.update({projectId}, {resType: db.RES_TYP_DATATYPE, resId: relationIds});
  }
}

module.exports = ResWithParamService;
