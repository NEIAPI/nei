/**
 * Notification User Service Class
 */

const log = require('../util/log');
const Forbidden = require('../error/fe/ForbiddenError');

class NotificationUserService extends require('./NService') {
  constructor(context) {
    super(context);
    this._dao = new (require('../dao/NotificationUserDao'))({context});
  }

  /**
   * mark notifications to read state
   * @param  {Number} uid - user id
   * @param  {Array} nids   - notification ids
   * @return {Array db/model/notification}
   */
  * markRead(uid, nids) {
    log.debug(
      '[%s.markRead] - mark notifications as read for user %d',
      this.constructor.name, uid, nids
    );
    let ret = yield this._dao.search({conds: {userId: uid, notificationId: nids}});
    let realIds = ret.map(item => item.notificationId);
    if (nids.length > realIds.length) {
      throw new Forbidden('没有权限', {id: nids});
    }

    return yield this._dao.markRead(uid, nids);
  }

  /**
   * marker all notifications to read state
   * @param {Number} uid - user id
   */
  * markAllRead(uid, type) {
    log.debug(
      '[%s.markRead] - mark all notifications as read for user %d',
      this.constructor.name, uid
    );
    return yield this._dao.markAllRead(uid, type);
  }

}

module.exports = NotificationUserService;
