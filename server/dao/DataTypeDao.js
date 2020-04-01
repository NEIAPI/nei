const log = require('../util/log');
const dt = require('./config/const.json');
const db = require('../../common').db;

const ResourceDao = require('./ResourceDao');

class DataTypeDao extends ResourceDao {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_DATATYPE
    }, sqlOpt);
    this._Model = require('../model/db/Datatype');
  }

  /**
   * get system data type list
   *
   * @return {model/db/Datatype} data type list
   */
  * getListOfSystem() {
    log.debug(
      '[%s.getListOfSystem] get system data type list',
      this.constructor.name
    );
    return yield this._doWithCache(
      dt.RDS_DATATYPE_SYSTEM, function*() {
        let ret = yield this.search({
          conds: {
            type: db.MDL_TYP_SYSTEM
          },
          joins: this._getUserJoins()
        });
        return ret;
      }
    );
  }

  /**
   * get datatype list in project. including system datatypes
   *
   * raw data with params, imports and overwrites set up.
   * @return {Array model/db/Datatype} data type list
   */
  * getListInProject(pid, hash = {}) {
    let pids = yield this._getSearchPids(pid);
    return yield this.getListInProjects(pids, hash);
  }

  /**
   * get datatype list in projects. including system datatypes
   *
   * raw data without params, imports and overwrites set up.
   * @return {Array model/db/Datatype} data type list
   */
  * getListInProjects(pids, hash = {}) {
    let ret = [];
    // merge system data type list
    let [systemList, projectList] = yield [
      this.getListOfSystem(),
      super.getListInProjects(pids)
    ];
    (systemList.concat(projectList || [])).forEach(it => {
      ret.push(it);
      if (!hash[it.id]) {
        it.params = [];
        hash[it.id] = it;
      } else {
        it.params = hash[it.id].params || [];
      }
    });
    return ret;
  }

  /**
   * get datatype list in project, with all params details.
   * including system datatypes
   *
   * @return {Array model/db/Datatype} data type list
   */
  * _getInProject(pid, fn, hash) {
    let ret = yield this._doWithCache(
      dt.RDS_DATATYPE_DETAIL + pid, function*() {
        return yield fn(pid, hash);
      }
    );
    return ret;
  }

  /**
   * get search selected fields
   *
   * @protected
   * @return {Array String} search selected fields array
   */
  _getSearchFields() {
    return [
      'id', 'description', 'name',
      'tag', 'tag_pinyin', 'format', 'create_time'
    ];
  }

}

DataTypeDao['__history'] = {
  addText: '新建数据模型 %s',
  delText: '删除数据模型 %s',
  shareText: '分享数据模型 %s',
  updateText: {
    name: {
      text: '更新数据模型 %s 名称为 %s'
    },
    description: {
      text: '更新数据模型 %s 描述为 %s，旧值是 %s',
    },
    tag: {
      text: '更新数据模型 %s 标签为 %s，旧值是 %s'
    },
    format: {
      text: '更新数据模型 %s 属性类型为 %s，旧值是 %s',
    },
    groupId: {
      text: '将数据模型 %s 所在的业务分组调整为 %s，旧值是 %s',
    },
    projectId: {
      text: '将数据模型 %s 移动至项目 %s，旧值是 %s',
    }
  },
  resType: db.RES_TYP_DATATYPE,
};

module.exports = DataTypeDao;
