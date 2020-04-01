/**
 * DataType Service Class
 */
let log = require('../util/log');
let _ = require('../util/utility');
let dbMap = require('../../common/config/db.json');
let notification = require('./helper/notification');
let Forbidden = require('../error/fe/ForbiddenError');

const DATATYPE_OVERWRITE_FIELDS = [
  'type', 'isArray', 'valExpression',
  'genExpression', 'description', 'defaultValue',
  'required', 'ignored'
];

const DATATYPE_OVERWRITE_RESET_FIELDS = [
  'isArray', 'ignored', 'required'
];

const SwaggerSysTypeNameToNEITypeId = {
  'string': dbMap.MDL_SYS_STRING,
  'integer': dbMap.MDL_SYS_NUMBER,
  'boolean': dbMap.MDL_SYS_BOOLEAN,
  'number': dbMap.MDL_SYS_NUMBER,
  'long': dbMap.MDL_SYS_NUMBER
};

const ResWithParamService = require('./ResWithParamService');

class DataTypeService extends ResWithParamService {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao', './ParamDataTypeService');
    this._type = dbMap.RES_TYP_DATATYPE;
    this._dao = new (require('../dao/DataTypeDao'))({context});
    this._rvDAO = new (require('../dao/ResourceVersionDao'))({context});
    this._pmDAO = new (require('../dao/ParamDataTypeDao'))({context});
    this._bgDAO = new (require('../dao/BisGroupDao'))({context});
    this._pDAO = new (require('../dao/ProjectDao'))({context});
    this._iDAO = new (require('../dao/InterfaceDao'))({context});
    this._rpcDAO = new (require('../dao/RpcDao'))({context});
    this._pmtDAO = new (require('../dao/ParamTemplateDao'))({context});
    this._tDAO = new (require('../dao/TemplateDao'))({context});
    this._pmvDAO = new (require('../dao/ParamWebViewDao'))({context});
    this._vDAO = new (require('../dao/ViewDao'))({context});

    this._resourceVersionService = new (require('./ResourceVersionService'))(uid, context);

    this._interfaceDAOList = [
      new (require('../dao/ParamInterfaceReqDao'))({context}),
      new (require('../dao/ParamInterfaceResDao'))({context}),
      new (require('../dao/InterfaceHeaderReqDao'))({context}),
      new (require('../dao/InterfaceHeaderResDao'))({context})
    ];

    this._rpcDAOList = [
      new (require('../dao/ParamRpcReqDao'))({context}),
      new (require('../dao/ParamRpcResDao'))({context}),
    ];
  }

  get _paramService() {
    if (!this._paramDatatypeService) {
      this._paramDatatypeService = new (require('./ParamDataTypeService'))(this._uid, this._context);
    }
    return this._paramDatatypeService;
  }

  * _afterCreate({projectId}) {
    yield this.clearCache({pids: projectId});
  }

  /**
   * remove datatypes
   * @param {Array} ids - datatype id list
   * @return {model/db/DataType} datatype list
   */
  * removeBatch(ids, unCheckQuotes = false) {
    let ret = yield this._checkBatchPermission(ids);
    ret = yield this._checkRemovePermission(ret.id);
    let projectId = yield this._dao.getProjects(ids);

    if (!unCheckQuotes) {
      yield this._checkQuotes(ids);
    }

    yield this._beginTransaction();
    for (let parentId of ids) {
      yield this._paramService.remove({parentId}, {clearAll: true, sendMsg: false});
    }
    ret = yield super.removeBatch(ids);
    yield this._endTransaction();
    yield this.clearCache({pids: projectId});
    return ret;
  }

  /**
   * check whether the datatypes have been quoted/referenced
   *
   * @param {Array} ids - datatype id list
   * @return {void}
   */
  * _checkQuotes(ids) {
    let quotes = yield this.getQuotes(ids);
    if (quotes.hasQuotes) {
      throw new Forbidden(`数据类型被引用 id：${ids}`, {id: ids});
    }

    let childVersions = yield this._rvDAO.search({
      conds: {parent: ids, resType: this._type}
    });
    if (childVersions.length) {
      throw new Forbidden(`数据模型存在被派生的版本,名为${childVersions[0].name}`);
    }
  }

  /**
   * update datatype
   * @param {model/db/DataType} model - datatype model
   * @return {model/db/DataType} datatype model
   */
  * update(model) {
    let datatypeobj = yield this._dao.find(model.id);
    let projectId = datatypeobj.projectId;

    if (model.hasOwnProperty('name')) {
      yield this._checkConflictInProject(projectId, {name: model.name}, '存在同名的数据模型');
    }
    let returnParameter;

    if (model.hasOwnProperty('versionName')) {// 更新版本名
      yield this._resourceVersionService._dao.update({name: model.versionName}, {
        res_id: model.id,
        res_type: dbMap.RES_TYP_DATATYPE
      });
      delete model.versionName;
    }

    if (model.hasOwnProperty('format') && datatypeobj.format !== model.format) {
      let quotes = yield this.getQuotes(model.id);
      if (quotes.hasQuotes) {
        throw new Forbidden(`数据类型被引用 id：${model.id}`);
      }

      yield this._paramService.remove({parentId: model.id}, {clearAll: true, sendMsg: false});
      // 修改参数格式为其他格式，假如是基础类型的，需要追加一条参数
      let formatType = this.getBaseType(model.format);
      if (formatType != null) {
        if (model.format === dbMap.MDL_FMT_HASHMAP) {
          // 特殊处理HASHMAP类型的初始化数据
          const formatParameter = [
            {
              name: '键',
              type: formatType,
              parentType: dbMap.PAM_TYP_ATTRIBUTE,
              parentId: model.id,
              progroupId: datatypeobj.progroupId
            },
            {
              name: '值',
              type: formatType,
              parentType: dbMap.PAM_TYP_ATTRIBUTE,
              parentId: model.id,
              progroupId: datatypeobj.progroupId
            }
          ];
          returnParameter = yield this._pmDAO.createBatch(formatParameter);
        } else {
          let formatParameter = {
            type: formatType,
            parentType: dbMap.PAM_TYP_ATTRIBUTE,
            parentId: model.id,
            progroupId: datatypeobj.progroupId
          };
          let rec = yield this._pmDAO.create(formatParameter);
          returnParameter = [rec];
        }
      } else {
        returnParameter = [];
      }
    }
    let ret;
    if (Object.keys(model).some(it => it != 'id')) {
      ret = yield super.update(model);
    } else {
      ret = yield this.getById(model.id);
    }
    yield this.clearCache({pids: projectId});
    if (returnParameter) {
      ret.params = returnParameter;
    }
    yield this._fillVersions({[ret.id]: ret});
    return ret;
  }

  * addList({projectId, groupId, items = [], tag = ''}, needAnnoy = false) {
    if (!Array.isArray(items) || items.length === 0) {
      if (needAnnoy) {
        return {
          anonyIdToId: {},
          importDts: []
        };
      }
      return [];
    }
    let typeNamesToIds = {};
    let anonyIdToIndex = {};
    let permission = yield this._checkCreatePermission(projectId);
    let progroupId = permission.progroupId;
    let ids = []; // 存储所有添加的接口，返回数据用
    let index = 0;
    let toCreateDatatypes = [];
    // todo 加入分组
    // add datatypes first
    yield this._beginTransaction();
    for (let item of items) {
      let name = item.name;
      if (name == '' && item.id > 0) { //匿名类型且id为正，解析错误，直接忽略
        continue;
      }
      if (item.id && item.id < 0) {
        // 对匿名类型进行处理
        anonyIdToIndex[item.id] = index;
        toCreateDatatypes.push({
          name,
          projectId,
          groupId,
          progroupId,
          format: item.format || 0,
          tag,
          description: item.description || '',
          type: dbMap.MDL_TYP_HIDDEN // 匿名
        });
        index++;
      } else if (item.id) {
        // 显然，更新的一般不会太多，因为更新都是javabean之类的来做的，swagger导入不会到这里,
        // 所以没必要做成批量的
        let delParentId = item.id;
        typeNamesToIds[name] = delParentId;
        ids.push(item.id);
        yield this._paramService.remove({parentId: delParentId}, {clearAll: true, sendMsg: false});
        // 增加操作记录
        //history.addHistoryByUpdate('datatype', {name, id: delParentId, progroupId, projectId}, userId, 'DATATYPE_OVERWRITE');
      } else {
        toCreateDatatypes.push({
          name,
          projectId,
          groupId,
          progroupId,
          format: item.format || 0,
          tag,
          description: item.description || ''
        });
        index++;
      }
    }

    // 批量创建数据模型
    let dts = [];
    if (toCreateDatatypes.length) {
      dts = yield super.createBatch(toCreateDatatypes);
    }

    // 获取typeName到id的映射
    dts.filter(it => it.type !== dbMap.MDL_TYP_HIDDEN).forEach(it => {
      typeNamesToIds[it.name] = it.id;
    });
    ids = ids.concat(dts.map(it => it.id)); // 添加所有增加的数据类型id到返回id数组

    // 获取伪id(小于0)到真实id的映射
    let anonyIdToId = {};
    for (let id in anonyIdToIndex) {
      let index = anonyIdToIndex[id];
      anonyIdToId[id] = dts[index].id;
    }

    let projectDTs = yield this.getListInProject(projectId);
    // update parameters
    let insertParams = [];
    for (let datatype of items) {
      let params = datatype.params || [];
      let datatypeId;
      if (datatype.name === '' && datatype.id < 0) {
        datatypeId = anonyIdToId[datatype.id];
      } else {
        datatypeId = typeNamesToIds[datatype.name];
      }
      let imports = [];
      let importIds = new Set();
      for (let item of params) {
        let typeId = item.type || typeNamesToIds[item.typeName];
        if (!typeId) {
          let foundDts = projectDTs.filter((tempDT) => {
            return tempDT.name === item.typeName || tempDT.name === item.datatypeName;
          });
          if (foundDts.length) {
            typeId = foundDts[0] && foundDts[0].id;
          } else {
            typeId = this._systemTypeNameToId(item.typeName);
            // 这里要报错,信息提示友好
          }
        } else if (typeId < 0) {
          typeId = anonyIdToId[typeId];
        }
        let param = {};
        if (!!typeId && !(imports.some((imp0rt) => {
            return imp0rt.datatypeId === typeId;
          }))) {
          param = {
            type: typeId,
            name: item.name,
            parentType: dbMap.PAM_TYP_ATTRIBUTE,
            isArray: item.isArray || 0,
            required: ('required' in item) ? item.required : true,
            progroupId,
            parentId: datatypeId,
            defaultValue: item.defaultValue || '',
            description: item.description || '',
          };
        } else if (!typeId) {
          item.type = dbMap[item.typeName];
          delete item.typeName;
          item.parentId = datatypeId;
          item.progroupId = progroupId;
          item.isArray = item.isArray || 0;
          item.required = ('required' in item) ? item.required : true;
          item.parentType = dbMap.PAM_TYP_ATTRIBUTE;
          param = item;
        }
        // 从datatypeName获取datatypeId
        if (item.datatypeName) {
          importIds.add(typeNamesToIds[item.datatypeName]);
        } else {
          insertParams.push(param);
        }
      }
      if (importIds.size) { // 下一步优化，这里也可以做成批量的
        yield this._paramService.import(datatypeId, Array.from(importIds));
      }
    }
    if (!!insertParams.length) {
      yield this._pmDAO.createBatch(insertParams);
    }

    yield this._endTransaction();

    let ret = [];
    if (ids.length) {
      yield this.clearCache({pids: projectId});
    }
    if (ids.length) {
      ret = yield this.findDetailByIds(ids);
    }
    if (needAnnoy) {
      return {anonyIdToId, importDts: ret};
    }
    return ret;
  }

  /**
   * share all datatypes that have been used in the given datatype.
   * @param {Object} - datatype data
   * @return {model/db/Datatype} datatype data
   */
  * _afterShare(shareInfo, oldData) {
    let {id: did, projectId, groupId} = shareInfo;
    let datatypeIdList = yield this.getListInDataType(oldData.projectId, did);
    let datatypes = [];
    if (datatypeIdList.length) {
      datatypes = yield this._dao.updateBatch({
        projectId,
        groupId
      }, datatypeIdList);
    }

    yield this.clearCache({pids: projectId});
    return datatypes;
  }

  /**
   * get datatype detail by id
   * @param {Number} id - datatype id
   * @return {model/db/Datatype}
   */
  * findDetailById(id) {
    let ret = yield super.findDetailById(id);
    let projectId = ret.projectId;
    let hash = yield this.getInProject(projectId);
    let r = hash[id];
    yield this._fillVersions({[id]: r});
    yield this._fillVersionDetails(r);
    return r;
  }

  * findDetailByIds(ids) {
    let projectIds = yield this._dao.getProjects(ids);
    //todo 优化，这里为什么是先查所有的，在匹配？
    let hash = yield this.getInProjects(projectIds);
    let ret = {};
    ids.forEach(id => ret[id] = hash[id]);
    yield this._fillVersions(ret);
    return ids.map(id => ret[id]);
  }

  * getListInProject(pid) {
    log.debug(
      '[%s.getListInProject] get data type list in project %s',
      this.constructor.name, pid
    );

    let projectService = new (require('./ProjectService'))(this._uid, this._context);
    yield projectService._checkSearchPermission(pid);
    let pids = yield this._getSearchPids(pid);
    let hash = yield this.getInProjects(pids);
    let ret = Object.keys(hash).map(key => {
      let dt = hash[key];
      if (dt['_merged'] != null) {
        delete dt['_merged'];
      }
      return dt;
    });
    yield this._fillWatch(ret);
    yield this._fillVersions(ret, true);
    this._fillVersionsDetailsBatch(ret);
    return ret;
  }

  /**
   * 在列表页中返回version详情
   * @param ret
   * @private
   */
  _fillVersionsDetailsBatch(ret) {
    let ret_v = ret.filter(it => it.version);
    let group = {};
    ret_v.forEach((cur) => {
      const origin = cur.version.origin;
      if (origin in group) {
        group[origin].push(Object.assign({}, cur));
      } else {
        group[origin] = [cur];
      }
    });

    ret_v.forEach(it => {
      it.versions = group[it.version.origin].filter(v => v.id != it.id);
    });
  }

  * getConnectedInterfaces({datatypeIds}) {
    return yield this._iDAO.search({
      conds: {
        connect_id: datatypeIds
      }
    });
  }

  /**
   * get datatype quote list
   * @param {Number} ids - id
   * @return {Object} reference list object
   */
  * getQuotes(ids) {
    ids = _.toArray(ids);
    let ret = yield this._checkBatchPermission(ids);
    ret = yield this._checkSearchPermission(ret.id);
    let progroupId = ret.progroupId;

    let projectIds = yield this._pDAO.getPidsInProGroup(progroupId);
    //获得引用该数据类型的数据类型
    let datatypeList = yield this.getListUsedByDataTypes(ids);
    let datatypeIds = [];
    datatypeList.forEach((item) => datatypeIds.push(item.id));
    ids.forEach(id => {
      if (!datatypeIds.includes(id)) {
        datatypeIds.push(id);
      }
    });
    datatypeList = datatypeList.filter(item => !ids.includes(item.id));

    //获得引用改数据类型的接口
    let interfaceIdList = [];

    for (let dao of this._interfaceDAOList) {
      let interfaceIds = yield dao.getParentListByDataType(datatypeIds);
      interfaceIds.forEach(function (item) {
        if (!interfaceIdList.includes(item)) {
          interfaceIdList.push(item);
        }
      });
    }
    // 查找和数据模型关联的http接口
    const connectedInterfaces = yield this.getConnectedInterfaces({datatypeIds});
    connectedInterfaces.forEach(itf => {
      interfaceIdList.push(itf.id);
    });

    //获得引用改数据类型的模板
    let templateIds = yield this._pmtDAO.getParentListByDataType(datatypeIds);
    //获得引用改数据类型的页面
    let viewIds = yield this._pmvDAO.getParentListByDataType(datatypeIds);

    // 为了解决循环依赖，不能在构造函数中初始化
    if (!this._interfaceService) {
      this._interfaceService = new (require('./InterfaceService'))(this._uid, this._context);
    }

    ret = yield {
      datatypes: datatypeList,
      interfaces: this._interfaceService.findBatchWithVersion(interfaceIdList),
      templates: this._tDAO.findBatch(templateIds),
      pages: this._vDAO.findBatch(viewIds)
    };

    let arr = [];
    Object.keys(ret).forEach((item) => {
      ret[item] = (ret[item] || []).filter((item) => {
        return projectIds.includes(item.projectId);
      });
      ret[item] = ret[item] || [];
      arr.push(...ret[item]);
    });

    return Object.assign(ret, {hasQuotes: !!arr.length});
  }

  // 只查响应参数中引用该数据类型的http接口列表，不包括和数据模型关联(connectId)的接口
  * getQuotesForInterfaceResponse(ids, datatypeListUsedByDatatype) {
    ids = _.toArray(ids);
    let ret = yield this._checkBatchPermission(ids);
    ret = yield this._checkSearchPermission(ret.id);
    let progroupId = ret.progroupId;

    let projectIds = yield this._pDAO.getPidsInProGroup(progroupId);
    let datatypeIds = [];
    datatypeListUsedByDatatype.forEach((item) => datatypeIds.push(item.id));
    ids.forEach(id => {
      if (!datatypeIds.includes(id)) {
        datatypeIds.push(id);
      }
    });

    //获得引用该数据模型的接口
    let interfaceIdList = [];
    for (let dao of this._interfaceDAOList) {
      if (dao.constructor.name === 'ParamInterfaceResDao') {
        const interfaceIds = yield dao.getParentListByDataType(datatypeIds);
        interfaceIds.forEach(function (item) {
          if (!interfaceIdList.includes(item)) {
            interfaceIdList.push(item);
          }
        });
      }
    }
    // 为了解决循环依赖，不能在构造函数中初始化
    if (!this._interfaceService) {
      this._interfaceService = new (require('./InterfaceService'))(this._uid, this._context);
    }
    ret = yield {
      interfaces: this._iDAO.findBatch(interfaceIdList),
    };
    ret.interfaces = (ret.interfaces || []).filter((item) => {
      return projectIds.includes(item.projectId);
    });

    return ret.interfaces || [];
  }

  // 只查响应参数中引用该数据类型的rpc接口列表，不包括和数据模型关联(connectId)的接口
  * getQuotesForRpcResponse(ids, datatypeListUsedByDatatype) {
    ids = _.toArray(ids);
    let ret = yield this._checkBatchPermission(ids);
    ret = yield this._checkSearchPermission(ret.id);
    let progroupId = ret.progroupId;

    let projectIds = yield this._pDAO.getPidsInProGroup(progroupId);
    let datatypeIds = [];
    datatypeListUsedByDatatype.forEach((item) => datatypeIds.push(item.id));
    ids.forEach(id => {
      if (!datatypeIds.includes(id)) {
        datatypeIds.push(id);
      }
    });

    //获得引用该数据模型的rpc接口
    let rpcIdList = [];
    for (let dao of this._rpcDAOList) {
      if (dao.constructor.name === 'ParamRpcResDao') {
        const rpcIds = yield dao.getParentListByDataType(datatypeIds);
        rpcIds.forEach(function (item) {
          if (!rpcIdList.includes(item)) {
            rpcIdList.push(item);
          }
        });
      }
    }
    // 为了解决循环依赖，不能在构造函数中初始化
    if (!this._rpcService) {
      this._rpcService = new (require('./RpcService'))(this._uid, this._context);
    }
    ret = yield {
      rpcs: this._rpcDAO.findBatch(rpcIdList),
    };
    ret.rpcs = (ret.rpcs || []).filter((item) => {
      return projectIds.includes(item.projectId);
    });

    return ret.rpcs || [];
  }

  /**
   * check whether datatypes can be used in the given project
   *
   * @private
   * @param  {Number} pid - project id
   * @param  {Object} dtIds - data type id list
   * @return {Void}
   */
  * _checkCanAccess(pid, dtIds) {
    dtIds = _.toArray(dtIds);
    let hash = yield this.getInProject(pid);
    dtIds.filter(id => id >= 0).forEach(id => {
      let datatype = hash[id];
      if (!datatype) {
        throw new Forbidden(`没有访问权限 id：${id}`);
      }
    });
  }

  /**
   * init attribute list
   *
   * @private
   * @param  {Number} pids - project ids
   * @param  {Object} hash - data type hash map
   * @return {Object} attribute config object
   */
  * _mergeAttributeList(pids, hash) {
    let ret = yield this._pmDAO.getListInProjects(pids); // {params:[], overwrite:[], imp0rt:[]}
    // merge params
    (ret.params || []).forEach((it) => {
      it.datatypeId = 0;
      it.datatypeName = '';
      it.ignored = 0;
      let type = hash[it.type];
      if (type) {
        it.typeName = hash[it.type].name;
      } else {
        it.type = dbMap.MDL_SYS_STRING;
        it.typeName = 'String';
      }

      // add self params to the datatype
      let datatype = hash[it.parentId];
      if (!datatype) {
        return;
      }
      let clone = {};
      Object.keys(it).forEach(key => {
        if (key !== 'ext') {
          clone[key] = it[key];
        }
      });
      datatype.params.push(clone);
    });
    // merge imp0rt and overwrite params
    let cycle = {ids: []};
    let parentIds = (ret.imp0rt || []).map(it => it.parentId);
    (ret.imp0rt || []).forEach(it => {
      // import src into dst
      let dst = hash[it.parentId];
      let src = hash[it.datatypeId];
      this._dumpDatatype(dst, src, ret, parentIds, hash, cycle);
    });
    return ret;
  }

  /**
   * merge imp0rts and overwrites params for datatype
   *
   * @private
   * @param {Object} dst - dst datatype
   * @param {Object} src - src datatype
   * @param {Object} conf - params config, e.g. {params:[],overwrite:[],imp0rt:[]}
   * @param {Array Number} parentIds - parent ids (i.e. datatype ids which have imports)
   * @param  {Object} hash - data type hash map
   * @return {Void}
   */
  _dumpDatatype(dst, src, conf, parentIds, hash, cycle) {
    if (!dst || !src) {
      return;
    }
    cycle.ids.push(dst.id);
    if (parentIds.includes(src.id) && !src._merged) {
      // if src has imports and has not been built/dumped
      let imp0rtsOfSrc = conf.imp0rt.filter(it => {
        return it.parentId === src.id;
      }).map(it => {
        return it.datatypeId;
      });
      (imp0rtsOfSrc || []).forEach(dtId => {
        if (cycle.ids.includes(dtId)) {
          // import in recycle, marked as fully merged
          hash[dtId]['_merged'] = true;
        } else {
          this._dumpDatatype(src, hash[dtId], conf, parentIds, hash, cycle);
        }
      });
    }
    let data = {
      [dst.id]: {
        id: dst.id,
        params: (conf.params || []).filter(it => {
          return it.parentId === dst.id;
        })
      }
    };
    // merge import params
    this._mergeParamImport(data, conf.imp0rt, hash);
    // merge refactor params
    this._mergeParamRefactor(data, hash);
    // merge overwrite params
    this._mergeParamOverwrite(data, conf.overwrite, hash);
    hash[dst.id]['params'] = data[dst.id]['params'];
    hash[dst.id]['_merged'] = true;
    cycle.ids = cycle.ids.filter(id => id !== dst.id);
  }

  /**
   * build data type in project
   *
   * ```javascript
   * {
   *      datype_id: {
   *          id: 12132,
   *          name: 'A',
   *          type: 1,
   *          ...
   *          params: [
   *                  {
   *                      id: 23234,
   *                      name: 'a',
   *                      type: 12323,
   *                      isArray: 1
   *                  },
   *                  ...
   *          ]
   *      },
   *      ...
   * }
   * ```
   *
   * @private
   * @param  {Number} pids - project id
   * @return {Object} data type list
   */
  * _buildDataTypeAndCacheResult(pid, hash) {
    let pubProject = yield this._pDAO.getSharedByProject(pid);
    if (pubProject.id !== pid) {
      // not public project. populate shared data types first
      yield this.getInProject(pubProject.id, hash);
    }
    // populate datatype hash
    yield this._dao.getListInProjects([pid], hash);
    // dump data type attributes
    yield this._mergeAttributeList([pid], hash);
    return hash;
  }

  /**
   * get datatype hash map in progroup.
   *
   * @param  {Number} pgid - progroup id
   * @return {Object} data type hash map
   */
  * getInProGroup(pgid, hash = {}) {
    let pids = yield this._pDAO.getPidsInProGroup(pgid);
    let ret = yield this.getInProjects(pids, hash);
    return ret;
  }

  * getInProjects(pids, hash = {}) {
    if (!pids.length) {
      return {};
    }
    //load common project
    let pubProject = yield this._pDAO.getSharedByProject(pids[0]);
    yield this.getInProject(pubProject.id, hash);

    let ret = yield pids.map(pid => {
      return this.getInProject(pid, hash);
    });
    return _.mergeDTs(ret);
  }

  /**
   * get datatypes in project
   *
   * @param {Number} pid - project id
   * @param {Object} hash - datatype map holder
   * @return {Array} data type list
   */
  * getInProject(pid, hash = {}) {
    let ret = yield this._dao._getInProject(
      pid,
      this._buildDataTypeAndCacheResult.bind(this),
      hash
    );
    Object.assign(hash, ret);
    return ret;
  }

  /**
   * get datatype list used in type
   *
   * @param  {Number} pid - project id
   * @param  {Number|Object} id  - data type id or type object {params:[{id:1234567, type:22222, name:'hello'}]}
   * @return {Array}  data type id list
   */
  * getListInDataType(pid, dtype) {
    log.debug(
      '[%s.getListInDataType] get data type id list used in data type in project %s',
      this.constructor.name, pid, dtype
    );
    let ret = [];
    // check data illegal
    let hash = yield this.getInProject(pid),
      data = hash[dtype] || dtype;
    if (!data) {
      log.warn(
        '[%s.getListInDataType] not found data type in project  %s',
        this.constructor.name, pid, dtype
      );
      return ret;
    }
    // check parameters
    if (!data.params) {
      return ret;
    }
    // dump data type list
    let dump = function (data) {
      // save data type list
      let save = function (data) {
        if (!data) {
          return;
        }
        let type = data.id,
          sys = this.isSystemType(hash[type]);
        if (type != null && !sys && !ret.includes(type)) {
          ret.push(type);
          dump.call(this, data);
        }
      };
      if (!data || !data.params || !data.params.length) {
        return;
      }
      data.params.forEach(function (it) {
        save.call(this, hash[it.type]); // self parameter
        save.call(this, hash[it.datatypeId]); // parameter combination and overwrite
        save.call(this, hash[it.originalDatatypeId]);
      }, this);
    };
    dump.call(this, data);
    // save self type
    if (data.id != null && !ret.includes(data.id)) {
      ret.push(data.id);
    }
    return ret;
  }

  /**
   * get datatype list used in type
   *
   * @param  {Array} pids  - project ids
   * @return {Array} data type id list
   */
  * getListInDataTypes(pids, ids) {
    let idSet = new Set();
    for (let id of ids) {
      let ret = yield this.getListInDataType(pid, id);
      ret.forEach(it => {
        idSet.add(it);
      });
    }
    return Array.from(idSet);
  }

  /**
   * get datatype list that uses the given data type
   * @param  {Number} id - given data type id
   * @return {Array} data type list
   */
  * getListUsedByDataType(id) {
    log.debug(
      '[%s.getListUsedByDataType] get data type id list used by data type %s',
      this.constructor.name, id
    );
    let ret = [];
    let dt = yield super.findDetailById(id);

    //按需查找pids
    let parentIds = yield this._paramService._dao.getParentListByDataType(id);
    let projectIds = yield this._dao.getProjects(parentIds);
    if (!projectIds.includes(dt.projectId)) {
      projectIds.push(dt.projectId);
    }

    // 过滤不存在的 projectIds
    // todo：有一个比较严重的问题，别的非公共资源库的项目会来引用这个数据模型，初步推断是导入时建立引用关系时没有判断是否在同个项目中
    const realProjects = yield this._pDAO.getListByProgroupId(dt.progroupId);
    // 要么是公共资源库，要么是自己所在项目
    projectIds = realProjects.filter(project => {
      return projectIds.includes(project.id) && project.type === dbMap.PRO_TYP_COMMON || project.id === dt.projectId;
    }).map(project => project.id);

    let hash = yield this.getInProjects(projectIds);
    if (!hash[id]) {
      log.warn(
        '[%s.getListUsedByDataType] data type %s not exist',
        this.constructor.name, id
      );
      return ret;
    }
    let hasType = function (it, map) {
      // lock circular reference
      if (map[it]) {
        return;
      }
      map[it] = !0;
      // check data type parameters
      let data = hash[it];
      if (!data || !data.params || !data.params.length) {
        return !1;
      }
      // check parameter type
      let rec;
      data.params.some(function (param) {
        let type = param.type;
        let datatypeId = param.datatypeId;
        rec = type === id ||
          ret.includes(type) ||
          hasType(type, map) ||
          datatypeId === id ||
          ret.includes(datatypeId) ||
          hasType(datatypeId, map);
        return rec;
      });
      return rec;
    };
    Object.keys(hash).forEach(function (it) {
      if (hasType(it, {})) {
        ret.push(hash[it].id);
      }
    });
    //加入自己
    ret.push(id);
    // fill data type list
    ret.forEach(function (it, index, list) {
      list[index] = hash[it];
    });
    return ret;
  }

  * getListUsedByDataTypes(ids) {
    let retMap = {};
    for (let id of ids) {
      let rec = yield this.getListUsedByDataType(id);
      rec.forEach(it => {
        retMap[it.id] = it;
      });
    }
    let ret = Object.keys(retMap).map(key => retMap[key]);
    return ret;
  }

  /**
   * merge import data type list
   *
   * @private
   * @param  {Object} data - data type with parameters list. {id: 12345, params: [{id: 23234, name: 'a', type: 12323}]}
   * @param  {Array}  imp0rt - import data type list
   * @param  {Object} hash - data type hash map
   * @return {Void}
   */
  _mergeParamImport(data, imp0rt, hash, parentType = dbMap.PAM_TYP_ATTRIBUTE) {
    // do nothing for empty import
    if (!imp0rt || !imp0rt.length) {
      return;
    }
    // calculate import data type map
    // src -> dst ----> dst: [src1,src2,src3]
    let imap = {};
    let importObjMap = {};
    imp0rt.forEach((it) => {
      importObjMap[`${it.parentId}_${it.datatypeId}`] = it;
      // check illegal import
      let dst = data[it.parentId],
        src = hash[it.datatypeId];
      if (!dst || !src) {
        // todo: 在某种项目中（初步判断是有循环引用的数据模型），导入数据模型的时候，就会发生错误，导致错误日志非常多，先删除吧
        // log.warn(
        //   '[%s.mergeParamImport] illegal data type import from %s[%s] to %s[%s]',
        //   this.constructor.name, it.datatypeId, !!src, it.parentId, !!dst
        // );
        return;
      }
      // merge import result
      let arr = imap[it.parentId];
      if (!arr) {
        arr = [];
        imap[it.parentId] = arr;
      }
      arr.push(it.datatypeId);
    });
    // merge import data type
    let dump = function (type) {
      let list = imap[type]; // datatype ids list
      if (!list || !list.length) {
        return;
      }
      delete imap[type];
      list.forEach(function (it) {
        let importObj = importObjMap[`${type}_${it}`];
        let position = importObj ? importObj.position : 0;
        dump(it);
        // type(dst) <--- it(src)
        // merge attributes
        let dst = data[type].params,
          src = _.clone(hash[it].params);
        src.forEach(function (attr) {
          attr.position = position;
          attr.datatypeId = it;
          attr.datatypeName = hash[it].name;
          attr.parentType = parentType;
        });
        dst.push(...src);
      });
    };
    Object.keys(imap).forEach(dump);
  }

  /**
   * refactor parameters
   *
   * @private
   * @param  {Object} data - data type with parameters list
   * @param  {Object} hash - data type hash map
   * @return {Void}
   */
  _mergeParamRefactor(data, hash, parentType = dbMap.PAM_TYP_ATTRIBUTE) {
    // refactor parameters list
    let isdt = (parentType === dbMap.PAM_TYP_ATTRIBUTE);
    Object.keys(data).forEach(it => {
      it = data[it];
      if (!it || !it.params) {
        return;
      }
      // complete data type
      it.params.forEach(param => {
        let type = hash[param.type];
        if (!type) {
          type = hash[dbMap.MDL_SYS_STRING];
          param.type = type.id;
        }
        param.typeName = type.name;
        if (isdt && !param.originalDatatypeId) {
          param.originalDatatypeId = param.parentId;
        }
        param.parentId = it.id;
      });
    });
  }

  /**
   * merge overwrite data type list
   *
   * @private
   * @param  {Object} data - data type with parameters list
   * @param  {Array}  list - overwrite data type list
   * @param  {Object} hash - data type hash map
   * @return {Void}
   */
  _mergeParamOverwrite(data, list, hash) {
    // do nothing for empty overwrite
    if (!list || !list.length) {
      return;
    }
    list.forEach(function (it) {
      let ret = data[it.parentId];
      if (!ret || !ret.params) {
        return;
      }
      ret.params.some(function (param) {
        if (it.datatypeId === param.datatypeId &&
          it.parameterId === param.id) {
          param.originalType = param.type;
          DATATYPE_OVERWRITE_FIELDS.forEach(function (key) {
            if (!param.hasOwnProperty(key)) {
              return;
            }
            if (DATATYPE_OVERWRITE_RESET_FIELDS.includes(key)) { // boolean type field
              if (it[key] === dbMap.PAM_OVERWRITE_RESET_FLAG) {
                return;
              }
              param[key] = it[key];
            } else {
              param[key] = it[key] || param[key];
            }
          });
          let type = hash[param.type];
          if (!type) {
            param.type = dbMap.MDL_SYS_STRING;
            type = hash[dbMap.MDL_SYS_STRING];
          }
          param.typeName = type.name;
          return true;
        }
      });
    });
  };

  /**
   * merge parameters in project group data type
   *
   * @param {Array} res - resources, should be in the same project
   * @param {Object} conf - params config, e.g. {params:[],overwrite:[],imp0rt:[]}
   * @param {Number} parentType
   * @return {Object} parameter object list
   * e.g.
   * {
   *     11111: {
   *         params: [
   *             {
   *                 id: 23234,
   *                 name: 'a',
   *                 type: 12323,
   *                 isArray: 1
   *             }
   *         ]
   *     },
   *     22222: {
   *         params: [
   *             {
   *                  id: 56567,
   *                  name: 'b',
   *                  type: 33323,
   *                  isArray: 1
   *             }
   *         ]
   *     }
   * }
   *
   */
  * merge(res, conf, parentType, hash) {
    log.debug(
      '[%s.merge] merge parameters for resource',
      this.constructor.name, {parentType}
    );
    if (!res.length) {
      return;
    }
    // dump data type in progroup
    hash = hash || (yield this.getInProject(res[0].projectId));
    if (parentType === dbMap.PAM_TYP_ATTRIBUTE) {
      let map = {};
      (res || []).forEach(it => {
        if (hash[it.id]) {
          map[it.id] = hash[it.id].params || [];
        }
      });
      return map;
    }
    let map = {};
    (res || []).forEach(it => {
      let data = {
        [it.id]: {
          id: it.id,
          params: conf.params.filter(param => {
            return param.parentId === it.id;
          })
        }
      };
      // merge import params
      this._mergeParamImport(data, (conf.imp0rt || []).filter(imp0rt => {
        return imp0rt.parentId === it.id;
      }), hash, parentType);
      // merge refactor params
      this._mergeParamRefactor(data, hash, parentType);
      // merge overwrite params
      this._mergeParamOverwrite(data, (conf.overwrite || []).filter(overwrite => {
        return overwrite.parentId === it.id;
      }), hash);
      // dump result
      let list = data[it.id].params || [];
      list.progroupId = it.progroupId;
      list.projectId = it.projectId;
      map[it.id] = list;
    });
    return map;
  }

  /**
   * fill version informations. NOT PURE!
   * @param ret
   * @private
   */
  * _fillVersions(hash, isArray = false) {
    let ids;
    if (isArray) {
      let temp = {};
      (hash || []).map(it => temp[it.id] = it);
      hash = temp;
    }
    ids = Object.keys(hash || []).map(it => hash[it].id);
    let versions = yield this._resourceVersionService.getListBatch(ids, dbMap.RES_TYP_DATATYPE);
    versions.forEach(version => {
      let t = hash[version.resId];
      t.version = {
        parent: version.parent,
        origin: version.origin,
        name: version.name
      };
    });
  }

  * _fillVersionDetails(ret) {
    if (ret == undefined) {
      return;
    }
    let id = ret.id;
    let origin;
    let versions = yield this._resourceVersionService.getListBatch([id], dbMap.RES_TYP_DATATYPE);
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
        conds: {origin: origin, resType: dbMap.RES_TYP_DATATYPE, resId: {op: '!=', value: id}}
      }, ...this._dao._getUserJoins()]
    });
    ret.versions = details;
  }

  /**
   * check whether data type is system type
   *
   * @param  {Object} data - data type
   * @return {Boolean} is system type
   */
  isSystemType(data) {
    return data && data.type === dbMap.MDL_TYP_SYSTEM;
  }

  * sendChangeMsgToWatch({id, content}) {
    yield this._checkUpdatePermission(id);
    let ret = yield this._dao.find(id);

    let interfaceList = (yield this.getQuotes(id)).interfaces.filter(interf => {
      // 只给“已发布”，“开发中”，“测试中”三种状态的发消息
      return [
        dbMap.STATUS_SYS_TESTING,
        dbMap.STATUS_SYS_DEVELOPING,
        dbMap.STATUS_SYS_PUBLISHED
      ].includes(interf.statusId);
    });

    // 为了解决循环依赖，不能在构造函数中初始化
    if (!this._interfaceService) {
      this._interfaceService = new (require('./InterfaceService'))(this._uid, this._context);
    }

    for (let i = 0, j = interfaceList.length; i < j; i++) {
      let interf = interfaceList[i];
      let userIds = yield this._interfaceService.getWatchList(interf.id);

      if (userIds && userIds.length) {
        let users = (yield this._uDAO.findBatch(userIds)).filter(user => {
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

        let title = `数据模型【<a class="stateful" href="/datatype/detail/?pid=${ret.projectId}&id=${ret.id}">${ret.name}</a>】的变更提醒`
          + `（来自接口【<a class="stateful" href="/interface/detail/?pid=${interf.projectId}&id=${interf.id}">${interf.name}</a>】）`;
        let mailContent = `<br /> ${title}，需要你确认：<br />${content}<br /><a href="${url}/notification/api/">点此链接去确认</a>`;
        let paopaoContent = `数据模型【${ret.name}】的变更提醒（来自接口【${interf.name}】），需要你确认：${content}，确认链接：${url}/notification/api/ `;

        let data = {
          id: interf.id,
          title,
          content,
          mailContent,
          paopaoContent,
          users,
          creatorId: this._uid
        };

        this._async(notification.sendApiChangeMsg, data);
      }
    }

    return ret;
  }

  _isSystemTypeName(typeName) {
    return typeName in SwaggerSysTypeNameToNEITypeId;
  }

  _systemTypeNameToId(typeName) {
    return SwaggerSysTypeNameToNEITypeId[typeName];
  }
}

module.exports = DataTypeService;
