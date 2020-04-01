/**
 * Notification Resource Service Class
 */

const NotificationResourceDao = require('../dao/NotificationResourceDao');
const NotificationUserDao = require('../dao/NotificationUserDao');
const NotificationDao = require('../dao/NotificationDao');
const NService = require('./NService');

class NotificationResourceService extends NService {
  constructor(uid, context) {
    super(context);
    this._uid = uid;
    this._dao = new NotificationResourceDao({context});
    this._ntuDao = new NotificationUserDao({context});
    this._ntDao = new NotificationDao({context});
  }

  /**
   * 删除绑定在资源上的消息
   */
  * removeByRes(resId, resType) {
    yield this._beginTransaction();
    let ntrs = yield this._dao.removeBatch({
      resId: resId,
      resType: resType
    });
    let ntids = ntrs.map(it => it.notificationId);
    yield this._ntuDao.removeBatch({
      notificationId: ntids,
      user_id: { // 避免safe update model错误
        op: '>',
        value: '0'
      }
    });
    yield this._ntDao.removeBatch({
      id: ntids
    });
    yield this._endTransaction();
  }
}

module.exports = NotificationResourceService;
