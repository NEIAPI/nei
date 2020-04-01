const NDao = require('./NDao');

class NotificationDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/Notification');
    this._nuDAO = new (require('./NotificationUserDao'))(sqlOpt);
    this._nrDAO = new (require('./NotificationResourceDao'))(sqlOpt);
  }

  * sendNotification(recipientIds, model, opt, isRead = 0) {
    yield this._beginTransaction();

    let insertId, ret;
    // create the notifcation
    if (model) {
      ret = yield this.create(model);
      insertId = ret.id;
    }

    // link notification to user
    if (insertId) {
      let notificationUsers = recipientIds.map((id) => {
        return {
          notificationId: insertId,
          userId: id,
          is_read: isRead
        };
      });

      yield this._nuDAO.createBatch(notificationUsers);
    }

    if (opt && opt.hasOwnProperty('resType') && opt.hasOwnProperty('resId')) {
      let resId = opt['resId'];
      if (!Array.isArray(resId)) {
        resId = [resId];
      }
      yield this._nrDAO.createBatch(resId.map((it) => {
        return {
          resType: opt.resType,
          resId: it,
          notificationId: insertId,
          creatorId: opt.creatorId
        };
      }));
    }

    yield this._endTransaction();
    return ret;
  }
}

module.exports = NotificationDao;
