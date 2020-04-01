const NDao = require('./NDao');

class NotificationResourceDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/NotificationResource');
  }
}

module.exports = NotificationResourceDao;
