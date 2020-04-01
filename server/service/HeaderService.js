/**
 * Header Service Class
 */

const log = require('../util/log');
const db = require('../../common').db;
const history = require('./helper/history');
const Invalid = require('../error/fe/InvalidError');
const Header = require('../model/db/InterfaceHeader');

class HeaderService extends require('./AttributeService') {
  constructor(uid, context, dao) {
    super(uid, context, '../dao/InterfaceDao', dao);
    this.isHeader = true;

    this._dataTypeService = new (require('./DataTypeService'))(uid, context);
  }

  /**
   * format header object to parameter object
   *
   * @private
   * @param {Object} conf - headers config, e.g. {params:[],overwrite:[],imp0rt:[]}
   * @return {Void}
   */
  _formatParamList(conf) {
    conf.params = conf.params || [];
    conf.params.forEach(function (it, index, list) {
      it = it.toNObject();
      it.type = db.MDL_SYS_STRING;
      list[index] = it;
    });
  }

  /**
   * check import data type
   *
   * @private
   * @param  {Number} gid - project group id
   * @param  {Array}  params - parameter list
   * @param  {Array}  ids - data type id list
   * @return {Void}
   */
  * _checkImportDataType(ids, params) {
    yield super._checkImportDataType(
      ids, params
    );
    // data type attribute imported must string
    let pid = params.projectId;
    let id, hash = yield this._dataTypeService.getInProject(pid);
    ids.some(function (it) {
      let data = hash[it];
      (data.params || []).some(function (param) {
        // array type of parameter
        if (param.isArray === db.CMN_BOL_YES) {
          id = it;
          return !0;
        }
        // illegal format of parameter
        let format = (hash[param.type] || {}).format;
        if (format !== db.MDL_FMT_STRING &&
          format !== db.MDL_FMT_NUMBER &&
          format !== db.MDL_FMT_BOOLEAN) {
          id = it;
          return !0;
        }
      });
      return id != null;
    });
    if (id != null) {
      throw new Invalid(
        'only string or number or boolean hash type can be imported to header', {
          ids: ids
        }
      );
    }
  }

  /**
   * Create parameter records
   * @param {Object} obj - parameter object
   * @param {Number} obj.parentId - parent id of the parameter
   * @param {Array Object} obj.params - params data
   * @param {Array Object} obj.imports - import/overwrite data
   * @return {model/db/Parameter} parameter objects to be created
   */
  * create({
    parentId,
    params: headers = [],
    imports = []
  }, {sendMsg = true} = {}) {
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
      }
    }
    if (!projectId) {
      throw new Forbidden(`找不到资源所在的项目 parentId：${parentId}`, {parentId});
    }
    let hash = yield this._dataTypeService.getInProject(projectId);

    //整合参数
    let datatypeIdSet = new Set(); // 关联数据模型id集合
    let importIdList = []; // 要导入id列表

    // 自身参数处理
    let headerModels = [];
    for (let item of headers) {
      item.progroupId = progroupId;
      item.parentType = parentType;
      item.parentId = parentId;
      headerModels.push(new Header(item));
    }

    let overwriteList = [];
    // 导入参数处理
    for (let item of imports) {
      let importId = item.id;
      // 导入类型id收集
      importIdList.push(importId);
      datatypeIdSet.add(importId);
      for (let varitem of (item.vars || [])) {
        varitem = Object.assign({
          datatypeId: importId
        }, varitem);
        overwriteList.push(varitem);
      }
    }

    // 检验所有涉及到的数据类型
    let datatypeIdList = Array.from(datatypeIdSet);
    yield this._dataTypeService._checkBatchPermission(datatypeIdList);

    let returnData = [];
    yield this._beginTransaction();
    if (headers.length) {
      returnData = yield this._dao.createBatch(headerModels);
    }
    if (importIdList.length) {
      yield this.import(parentId, importIdList);
    }
    if (overwriteList.length) {
      yield this.overwrite(parentId, overwriteList);
    }
    yield this._endTransaction();

    if (imports.length) {
      let ids = [];
      imports.forEach((item) => {
        ids.push(item.id);
      });
      for (let id of ids) {
        let d = hash[id];
        d.params.forEach((item) => {
          item.datatypeId = d.id;
          item.datatypeName = d.name;
          item.parentId = parentId;
          item.parentType = parentType;
        });
        returnData = returnData.concat(d.params);
      }
    }
    ret = {};
    ret.params = returnData;

    if (sendMsg) {
      this._sendParameterOpNotificaion(parentId);
      if (headers.length) {
        this._async(history.log, {
          dName: this._dao.constructor.name,
          oprType: 'add',
          uid: this._uid,
          ret: {_parentId: parentId, _children: returnData}
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
    }
    return ret;
  }

  /**
   * 删除参数
   * @param {Object} obj - 删除数据对象
   * @return {Array} 被删除的数据列表
   */
  * remove(obj, {sendMsg = true} = {}) {
    log.debug('[%s.remove] - remove parameter ', this.constructor.name);

    let parentId = obj.parentId;
    let parentType = this._dao._parentType;
    let params = obj.params || [];
    let imports = obj.imports || [];
    //权限验证
    let parentService = HeaderService.getParentInstanceByParentType(db.PAM_TYP_OUTPUT, this._uid, this._context);
    let ret = yield parentService._checkUpdatePermission(parentId);
    let progroupId = ret.progroupId;

    yield this._beginTransaction();
    let removeParams = [];
    // 删除自身参数
    if (params.length) {
      removeParams = yield this._dao.findBatch(params);
      yield this._dao.remove(parentId, params);
    }
    // 删除导入类型
    if (imports.length) {
      yield this._dao.removeImport(parentId, imports);
    }
    yield this._endTransaction();

    let returnParams = [];
    let returnDatatypes = [];
    let retrunImports = [];

    if (params.length) {
      returnParams = params;
    } else if (imports.length) {
      retrunImports = imports;
    }

    ret = {};
    ret.params = returnParams;
    ret.datatypes = returnDatatypes;
    ret.imports = retrunImports;
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
    return ret;
  }

  /**
   * update parameters. update self params or overwrite params
   * @param {Object} model - parameter data
   * @return {model/db/Parameter}
   */
  * update(model) {

    let parentId = model.parentId;
    let parentType = this._dao._parentType;

    let parentService = HeaderService.getParentInstanceByParentType(db.PAM_TYP_OUTPUT, this._uid, this._context);
    let ret = yield parentService._checkUpdatePermission(parentId);
    let progroupId = ret.progroupId;

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

    let returnParams = [];

    yield this._beginTransaction();

    if (model.hasOwnProperty('datatypeId')) {
      let oldParams = yield this.getList(parentId);
      let oldParam = oldParams.filter(param => (param.id === model.id && param.datatypeId === model.datatypeId))[0];
      //overwrite params
      yield this.overwrite(parentId, [model]);
      let list = yield this.getList(parentId);
      list.forEach(param => {
        if (param.id == model.parameterId && param.datatypeId == model.datatypeId) {
          returnParams.push(param);
        }
      });
      this._sendParameterOpNotificaion(parentId);
      this._async(history.log, {
        dName: this._dao.constructor.name,
        oprType: 'update',
        uid: this._uid,
        ret: {
          id: model.parameterId,
          _oData: oldParam,
          _model: model,
          _parentId: parentId
        }
      });
    } else {
      let paramItem = yield super.update(model); //self params
      // 这里调用上级的 update，返回结果已经是 {datatypes:[],params:{...}} 的形式了，直接push会导致前端多出一层，故做此处理
      returnParams = returnParams.concat(paramItem.params);
    }
    yield this._endTransaction();

    ret = {};
    ret.params = returnParams;
    ret.datatypes = [];
    return ret;
  }

}

module.exports = HeaderService;
