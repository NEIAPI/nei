class NotificationSettingDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/NotificationSetting');
  }
}

module.exports = NotificationSettingDao;
