const log = require('../util/log');
const db = require('../../common').db;

class AttributeDao extends require('./ResourceDao') {
  constructor(parentType, sqlOpt) {
    super({
      type: db.RES_TYP_PARAMETER
    }, sqlOpt);
    this._parentType = parentType;
  }

  /**
   * get parameters list for resource
   *
   * @protected
   * @param  {Number} id - parent id
   * @param  {Number} type - parent type
   * @return {Object} parameter result object, e.g. { params:[], overwrite:[], imp0rt:[]}
   */
  * _getListWithType(id, type) {
    let opt = {
      conds: {
        parent_id: id,
        parent_type: type
      }
    };
    if (type == null) {
      opt = {conds: id};
    }
    // get parameter list
    let ret = {
      params: this.search(opt),
    };
    for (let i = 0, conf; conf = this._expModels[i]; i++) {
      let dao = conf.Dao;
      ret[conf.key] = dao.search(opt);
    }
    ret = yield ret;
    for (let i = 0, conf; conf = this._expModels[i]; i++) {
      let list = ret[conf.key];
      list.forEach(function (it, index, list) {
        list[index] = new conf.Model(it);
      });
      ret[conf.key] = list;
    }
    return ret;
  }

  /**
   * get parameters list for resource
   *
   * @param  {Number} id - resource id
   * @param  {Object} parameter result object, e.g. {params:[], overwrite:[], imp0rt:[]}
   */
  * getList(id) {
    log.debug(
      '[%s.getList] get parameter list for resource %s with type %s',
      this.constructor.name, id, this._parentType
    );
    return yield this._getListWithType(
      id, this._parentType
    );
  }

  /**
   * get parent id list of the datatypes
   *
   * @param  {Array} ids - data type id list
   * @return {Array} parent id list
   */
  * getParentListByDataType(ids) {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    // build search conditions
    let conds = [null, null];
    if (this._Model.getField('type')) {
      // for parameter and overwrite
      conds = [{type: ids}, {type: ids}];
    }
    // for import
    conds.push({datatype_id: ids});
    // build Model list
    let arr = [{Dao: this}];
    arr.push(...this._expModels);
    // search result
    let rtn = [];
    for (let i = 0, it, cnds; it = arr[i]; i++) {
      cnds = conds[i];
      if (!cnds) {
        continue;
      }
      cnds.parent_type = this._parentType;
      let rec = yield it.Dao.search({
        conds: cnds,
        field: {parent_id: 'DISTINCT'}
      });
      (rec || []).forEach((it) => {
        let id = it.parentId;
        if (!rtn.includes(id)) {
          rtn.push(id);
        }
      });
    }
    return rtn;
  }

  /**
   * clear all parameters  with type
   *
   * @protected
   * @param  {Array} ids - resource/parent ids
   * @param  {Number} type - resource/parent type
   * @return {Void}
   */
  * _clearParametersWithType(ids, type) {
    yield this._beginTransaction();
    // clear overwrite parameters
    // clear import parameters
    // clear parameters
    let arr = this._expModels.concat({
      Dao: this
    });
    for (let i = 0, it; it = arr[i]; i++) {
      let dao = it.Dao;
      yield dao.removeBatch({
        parent_id: ids,
        parent_type: type
      });
    }
    yield this._endTransaction();
  }

  /**
   * clear all parameters
   *
   * @param  {Array} ids - resource/parent ids
   * @return {Void}
   */
  * clearParameters(ids) {
    log.debug(
      '[%s.clearParameters] clear parameter in resource %s with type %s',
      this.constructor.name, ids, this._parentType
    );
    yield this._clearParametersWithType(
      ids, this._parentType
    );
  }

  /**
   * import data type to parameters with type
   *
   * @protected
   * @param  {Number} pgid - progroup id
   * @param  {Number} id  - resource/parent id
   * @param  {Array}  ids - data type id list
   * @param  {Number} type - parent type
   * @return {Void}
   */
  * _importParamWithType(pgid, id, ids, type) {
    let ret = [],
      Dao = this._expModels[1].Dao;
    ids.forEach(it => {
      ret.push({
        datatypeId: it,
        parentId: id,
        progroupId: pgid,
        parentType: type
      });
    });
    yield Dao.createBatch(ret);
  }

  /**
   * import data type to resource
   *
   * @param  {Number} pgid - project group id
   * @param  {Number} id  - resource id
   * @param  {Array}  ids - data type id list
   * @return {Void}
   */
  * import(pgid, id, ids) {
    yield this._importParamWithType(
      pgid, id, ids, this._parentType
    );
  }

  // TODO: move to ParameterCombinationDao?
  * updateImport(data, conds) {
    let Dao = this._expModels[1].Dao;
    return yield Dao.update(data, conds);
  }

  /**
   * overwrite parameters for resource
   *
   * @protected
   * @param  {Number} pgid  - progroup id
   * @param  {Number} id   - resource id
   * @param  {Array}  list - overwrite list
   * @param  {Number} type - resource type
   * @return {Void}
   */
  * _overwriteParamWithType(pgid, id, list, type) {
    let Dao = this._expModels[0].Dao,
      conds = {
        parentId: id,
        progroupId: pgid,
        parentType: type
      };
    list.forEach((it) => {
      Object.assign(it, conds, {
        parameterId: it.id
      });
      delete it.id;
    });
    let rec = yield Dao.search({
      conds
    });
    // map exist recorder
    let map = {};
    (rec || []).forEach((it) => {
      map[it.datatypeId + '-' + it.parameterId] = true;
    });
    // filter model
    let arr = [], urr = [];
    list.forEach((model) => {
      if (map[model.datatypeId + '-' + model.parameterId]) {
        urr.push(model);
        delete model.progroupId;
      } else {
        arr.push(model);
      }
    });
    // do add or update
    if (arr.length > 0) {
      yield Dao.createBatch(arr);
    }
    if (urr.length > 0) {
      list.forEach((it) => {
        it._conds = conds;
        it._conds.parameterId = it.parameterId;
      });
      yield Dao.updateBatchModels(list);
    }
  }

  /**
   * overwrite parameter for resource
   *
   * @param  {Number} pgid  - progroup id
   * @param  {Number} id   - resource/parent id
   * @param  {Array}  list - overwrite list
   * @return {Void}
   */
  * overwrite(pgid, id, list) {
    log.debug(
      '[%s.overwrite] overwrite resource %s with type %s parameters in project group %s',
      this.constructor.name, id, this._parentType, pgid
    );
    yield this._overwriteParamWithType(
      pgid, id, list, this._parentType
    );
  }

  /**
   * remove parameters for resource
   *
   * @param  {Number} id  - parent id
   * @param  {Array}  ids - parameter id list
   * @return {Void}
   */
  * remove(id, ids) {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    yield this.removeBatch({
      id: ids,
      parent_id: id,
      parent_type: this._parentType
    });
  }

  /**
   * remove import parameters for resource
   *
   * @param  {Number} id  - parent id
   * @param  {Array}  ids - data type id list
   * @return {Void}
   */
  * removeImport(id, ids) {
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
    // remove from import and overwrite table
    yield this._beginTransaction();
    for (let i = 0, it; it = this._expModels[i]; i++) {
      let Dao = it.Dao;
      yield Dao.removeBatch({
        parent_id: id,
        datatype_id: ids,
        parent_type: this._parentType
      });
    }
    yield this._endTransaction();
  }

  /**
   * clone params
   * @param {Object} data
   * @return {Void}
   */
  * cloneParametersAndImports({
    progroupId,
    parentId,
    parentMap,
    datatypeMap,
    parameterMap,
    newHash,
    oldHash
  }) {
    let ret = yield this.getList(parentId);
    //clone self params
    if (ret.params && ret.params.length) {
      for (let item of ret.params) {
        let oldId = item.id;
        delete item.createTime;
        delete item.id;
        item.progroupId = progroupId;
        //查找映射
        if (parentMap[item.parentId]) {
          item.parentId = parentMap[item.parentId];
        }
        if (datatypeMap[item.type]) {
          item.type = datatypeMap[item.type];
        }
        let ret = yield this.create(item);
        parameterMap[oldId] = ret.id;
      }
    }
    //clone import params
    if (ret.imp0rt && ret.imp0rt.length) {
      let Model = this._expModels[1].Model;

      let imports = ret.imp0rt.map((item) => {
        delete item.createTime;
        item.progroupId = progroupId;
        //查找映射
        if (parentMap[item.parentId]) {
          item.parentId = parentMap[item.parentId];
        }
        if (datatypeMap[item.datatypeId]) {
          item.datatypeId = datatypeMap[item.datatypeId];
        }
        return new Model(item);
      });
      if (imports.length) {
        yield this.createBatch(imports);
      }
    }

    //clone overwrite params
    if (ret.overwrite && ret.overwrite.length) {
      let tmpOverwrites = [],
        Model = this._expModels[0].Model;
      ret.overwrite.forEach((item) => {
        delete item.createTime;
        item.progroupId = progroupId;
        let datatypeId = item.datatypeId;
        let parameterId = item.parameterId;
        //查找映射
        if (parentMap[item.parentId]) {
          item.parentId = parentMap[item.parentId];
        }
        if (datatypeMap[item.datatypeId]) {
          item.datatypeId = datatypeMap[item.datatypeId];
        }
        if (datatypeMap[item.type]) {
          item.type = datatypeMap[item.type];
        }

        //查找parameterId
        if (parameterMap[item.parameterId]) {
          //在普通复制的数据模型中查找
          item.parameterId = parameterMap[item.parameterId];
          tmpOverwrites.push(new Model(item));
        } else if (datatypeMap[datatypeId]) {
          //在目标项目已有的数据模型中查找
          let newDatatypeId = datatypeMap[datatypeId];
          let newDatatype = newHash[newDatatypeId];
          let oldDatatype = oldHash[datatypeId];
          //查找参数
          if (newDatatype && oldDatatype) {
            let targetOld = oldDatatype.params.filter(param => param.id === parameterId);
            if (targetOld.length) {
              let oldParam = targetOld[0];
              let targetNew = newDatatype.params.filter(param => param.name === oldParam.name);
              if (targetNew.length) {
                //查找到新旧数据模型中的同名参数
                let newParam = targetNew[0];
                if (newParam.type !== db.MDL_SYS_VARIABLE && newParam.originalType !== db.MDL_SYS_VARIABLE) {
                  //禁止覆写类型
                  item.type = newParam.type;
                  item.isArray = newParam.isArray;
                }
                item.parameterId = newParam.id;
                tmpOverwrites.push(new Model(item));
              }
            }
          }
        } else {
          //当前项目组或项目复制 不需要映射
          tmpOverwrites.push(new Model(item));
        }
      });
      if (tmpOverwrites.length) {
        yield this.createBatch(tmpOverwrites);
      }
    }
  }

  /**
   * clone params
   * @param {Object} model - parameter data
   * @return {model/db/Parameter}
   */
  * moveParametersAndImports({
    parentId,
    datatypeMap,
    parameterMap
  }) {
    let ret = yield this.getList(parentId);
    //移动自身参数
    if (ret.params && ret.params.length) {
      let tmpParams = [];
      for (let item of ret.params) {
        if (datatypeMap[item.type]) {
          item.type = datatypeMap[item.type];
          tmpParams.push(item);
        }
      }
      if (tmpParams.length) {
        yield this.update(tmpParams);
      }
    }
    //移动导入参数
    if (ret.imp0rt && ret.imp0rt.length) {
      let Model = this._expModels[1].Model;
      for (let item of ret.imp0rt) {
        if (datatypeMap[item.datatypeId]) {
          let conds = {
            parentId: item.parentId,
            parentType: item.parentType,
            datatypeId: item.datatypeId
          };
          item.datatypeId = datatypeMap[item.datatypeId];
          let model = new Model(item);
          yield this.update(model, conds);
        }
      }
    }
    //移动覆写参数
    if (ret.overwrite && ret.overwrite.length) {
      let Model = this._expModels[0].Model;
      for (let item of ret.overwrite) {
        let conds = {
          parentId: item.parentId,
          parentType: item.parentType,
          datatypeId: item.datatypeId,
          parameterId: item.parameterId
        };
        if (datatypeMap[item.datatypeId] || datatypeMap[item.type] || parameterMap[item.parameterId]) {
          if (datatypeMap[item.datatypeId]) {
            item.datatypeId = datatypeMap[item.datatypeId];
          }
          if (datatypeMap[item.type]) {
            item.type = datatypeMap[item.type];
          }
          if (parameterMap[item.parameterId]) {
            item.parameterId = parameterMap[item.parameterId];
          }
          let model = new Model(item);
          yield this.update(model, conds);
        }
      }
    }
  }
}

module.exports = AttributeDao;
