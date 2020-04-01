const db = require('../../common').db;
const NDao = require('./NDao');

class NotificationUserDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/NotificationUser');
  }

  /**
   * mark notifications to read state
   * @param  {Number} uid - user id
   * @param  {Array} nids - notification ids
   * @return {Array db/model/notification}
   */
  * markRead(uid, nids) {
    yield this.updateBatch({
      'is_read': db.CMN_BOL_YES
    }, {
      'notification_id': nids,
      'user_id': uid

    });

    this._nDAO = new (require('./NotificationDao'))(this._sqlOpt);
    return yield this._nDAO.findBatch(nids);
  }

  /**
   * mark all notifications to read state
   *
   * @param {Number} uid - user id
   */
  * markAllRead(uid, type) {
    let inSubquery = this._Model.toSearchSQL({
      conds: {'user_id': uid},
      sfields: ['notification_id'],
      joins: [{
        table: 'notification',
        fkmap: {'id': 'notification_id'},
        propagate: true,
        conds: {type},
      }]
    });
    let formatSql = this._database.format(inSubquery.sql, inSubquery.args);
    let wrapQuery = '(' + 'select * from (' + formatSql + ') as t)';
    return yield this.update({
      'is_read': db.CMN_BOL_YES
    }, {
      'user_id': uid,
      'notification_id': {
        op: 'IN',
        value: wrapQuery,
        subquery: true
      }
    });
  }
}

module.exports = NotificationUserDao;
