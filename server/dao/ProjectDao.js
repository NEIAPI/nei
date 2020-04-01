const log = require('../util/log');
const dt = require('./config/const.json');
const db = require('../../common').db;

class ProjectDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_PROJECT,
      owner: 'progroupId'
    }, sqlOpt);
    this._Model = require('../model/db/Project');
  }

  /**
   * get resource type filter
   *
   * @protected
   * @return {Object} type filter conditions
   */
  _getResTypeFilter() {
    return {
      type: {
        op: '!=',
        value: db.PRO_TYP_HIDDEN
      }
    };
  };

  /**
   * get search selected fields
   *
   * @protected
   * @return {Array String} search selected fields array
   */
  _getSearchFields() {
    return [
      'id', 'creator_id', 'progroup_id', 'type', 'logo',
      'name', 'name_pinyin', 'description'
    ]; // project search exported fields
  }

  /**
   * get project group id for project
   *
   * @param  {Number} pid - project id
   * @return {Number} project group id
   */
  * getProGroupID(pid) {
    log.debug(
      '[%s.getProGroupID] get project group id for project %s',
      this.constructor.name, pid
    );
    let arr = yield this.getProGroups([pid]);
    if (!arr.length) {
      log.warn(
        '[%s.getProGroupID] project group for project %s not found',
        this.constructor.name, pid
      );
      return;
    }
    return arr[0];
  }

  /**
   * get shared project in progroup
   *
   * @param  {Number} pgid - project group id
   * @return {model/db/Project} project model
   */
  * getSharedByProGroup(pgid) {
    return yield this._doWithCache(
      dt.RDS_PROJECT_DEFAULT + pgid, function*() {
        let ret = yield this.search({
          conds: {
            progroup_id: pgid,
            type: db.PRO_TYP_COMMON
          }
        });
        return (ret || [])[0];
      }
    );
  }

  /**
   * get shared project by project
   *
   * @param  {Number} pid - project id
   * @return {model/db/Project} project model
   */
  * getSharedByProject(pid) {
    let pgid = yield this.getProGroupID(pid);
    if (pgid) {
      return yield this.getSharedByProGroup(pgid);
    }
  }

  /**
   * get relation project id list
   * @param  {Number} pid - project id
   * @return {Array} project id list
   */
  * getRelationPids(pid) {
    let pubProject = yield this.getSharedByProject(pid);

    if (pubProject.id === pid) {
      return yield this.getPidsInProGroup(pubProject.progroupId);
    }
    return [pid, pubProject.id];
  }

  /**
   * get project id list in progroup
   * @param  {Number} pgid - progroup id
   * @return {Array} project id list
   */
  * getPidsInProGroup(pgid) {
    let projects = yield this.getListInProGroup(pgid);
    return projects.map(it => it.id);
  }

  /**
   * get project list that uses the spec
   * @param  {Number} sid - spec id
   * @return {Array} project list
   */
  * getListBySpecId(sid) {
    let ret = yield this.search({
      conds: this.TOOLSPEC.map(it => {
        return {
          [it]: sid
        };
      }),
      sfields: this.PROJECT_EXPORT_FIELD
    });
    return ret;
  }

  /**
   * 根据项目组 id 查找项目列表
   * @param  {Number} pgid - 项目组id
   * @return {Array|Project} 项目列表
   */
  * getListByProgroupId(progroupId) {
    let ret = yield this.search({
      conds: {
        progroupId
      },
      joins: this._getUserJoins()
    });
    return ret;
  }
}

ProjectDao['__history'] = {
  addText: '新建项目 %s',
  delText: '删除项目 %s',
  resType: db.RES_TYP_PROJECT,
  updateText: {
    name: {
      text: '更新项目 %s 名称为 %s'
    },
    description: {
      text: '更新项目 %s 描述为 %s',
    },
    toolSpecWeb: {
      text: '修改项目 %s WEB工程规范为 %s',
    },
    toolSpecAos: {
      text: '修改项目 %s Android工程规范为 %s',
    },
    toolSpecIos: {
      text: '修改项目 %s iOS工程规范为 %s',
    },
    toolSpecTest: {
      text: '修改项目 %s 测试工程规范为 %s',
    },
    toolKey: {
      text: '修改项目 %s 工具标识为 %s'
    },
    resParamRequired: {
      text: '更新项目 %s HTTP 接口-响应信息-返回结果的字段 %s 配置成非必需'
    },
    useWordStock: {
      text: '更新项目 %s %s 参数字典校验'
    }
  }
};
module.exports = ProjectDao;
