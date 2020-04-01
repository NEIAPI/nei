/**
 *  Business Group DAO Class
 */
const log = require('../util/log');
const dt = require('./config/const.json');
const db = require('../../common').db;

class BisGroupDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_BISGROUP
    }, sqlOpt);
    this._Model = require('../model/db/Bisgroup');
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
        value: db.BIS_TYP_HIDDEN
      }
    };
  };

  /**
   * get project default business group
   *
   * @param  {Number} pid - project id
   * @return {Number} default bisgroup id
   */
  * getDefaultId(pid) {
    log.debug(
      '[%s.getDefaultId] get default business group for project %s',
      this.constructor.name, pid
    );
    return yield this._doWithCache(
      dt.RDS_BISGROUP_DEFAULT + pid, function*() {
        // get default bis group from db
        let ret = yield this.search({
          conds: {
            project_id: pid,
            type: db.BIS_TYP_SYSTEM
          }
        });
        return (ret[0] || {}).id;
      }
    );
  }

  /**
   * get search selected fields
   *
   * @protected
   * @return {Array String} search selected fields array
   */
  _getSearchFields() {
    return [
      'id', 'description', 'name', 'name_pinyin', 'type',
      'projectId', 'progroupId', 'create_time'
    ];
  }
}

BisGroupDao['__history'] = {
  addText: '新建业务分组 %s',
  delText: '删除业务分组 %s',
  resType: db.RES_TYP_BISGROUP,
  updateText: {
    name: {
      text: '更新业务分组 %s 名称为 %s，旧值是 %s'
    },
    description: {
      text: '更新业务分组 %s 描述为 %s，旧值是 %s',
    },
    rpcPom: {
      text: '更新业务分组 %s RPC 工程的 POM 依赖为 %s，旧值是 %s',
    },
    rpcKey: {
      text: '更新业务分组 %s RPC 工程的 Key 为 %s，旧值是 %s',
    },
    respoId: {
      text: '修改业务分组 %s 负责人为 %s，旧值是 %s',
    }
  }
};

module.exports = BisGroupDao;
