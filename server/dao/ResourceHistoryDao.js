const log = require('../util/log');

class ResourceHistoryDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ResourceHistory');
  }

  /**
   * findForPage
   *
   */
  * findForPage(obj) {
    log.debug(
      '[%s.hasConflictInProject] check ',
      this.constructor.name
    );
    let ret = yield this.search({
      sfields: Object.keys(this._Model.getField()),
      field: {
        'user.realname': {alias: 'realname'}
      },
      conds: obj.condition,
      pages: obj.pages,
      order: {field: 'create_time', desc: !0},
      joins: [{table: `user`, fkmap: {id: 'user_id'}}]
    });
    return ret;
  }

  /**
   * findForPage
   *
   */
  * getTotal(condition) {
    log.debug(
      '[%s.getTotal] check ',
      this.constructor.name
    );
    let ret = yield this.search({
      field: {
        'id': {
          alias: 'total',
          func: 'count'
        }
      },
      conds: condition
    });
    return ret;
  }

  /**
   * find recent projects
   * @param {Number} uid - user id
   * @return {Array Object} [{projectId:11111}, {projectId:22222}]
   */
  * findRecentProjects(uid) {
    log.debug(
      '[%s.findRecentProjects] check ',
      this.constructor.name
    );

    let ret = yield this.search({
      field: {
        'create_time': {
          func: 'MAX',
          alias: 'update_time'
        }
      },
      sfields: ['project_id'],
      conds: {
        'user_id': uid
      },
      group: ['project_id'],
      order: {field: 'update_time', desc: true},
      pages: {limit: 6}
    });
    return ret;
  }
}

module.exports = ResourceHistoryDao;
