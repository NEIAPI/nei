/**
 * Notification Setting Service Class
 */

const log = require('../util/log');
const IllegalRequest = require('../error/fe/IllegalRequestError');
const dbMap = require('../../common').db;

class NotificationSettingService extends require('./NService') {
  constructor(context) {
    super(context);
    this._uDAO = new (require('../dao/UserDao'))({context});
    this._dao = new (require('../dao/NotificationSettingDao'))({context});
  }

  /**
   * update/insert setting for user
   * @param  {Number} uid - user id to get setting for
   * @param  {Object} options - settings data
   * @param  {Number} options.methodEmail - email switch
   * @param  {Number} options.methodPhone - phone switch
   * @param  {Number} options.methodPaoPao - paopao switch
   * @param  {Number} options.methodYixin - yixin switch
   * @param  {Number} options.flag - switch flag
   * @return {model/db/NotificationSetting} notification setting model
   */
  * update(uid, options = {}) {
    log.debug(
      '[%s.update] update notification for user ',
      this.constructor.name, uid, options
    );

    let user = this._uDAO.find(uid);

    if (user.emailState === dbMap.CMN_FLG_OFF && options.methodEmail === dbMap.CMN_FLG_ON) {
      throw new IllegalRequest('邮箱未绑定的情况下不可打开邮件通知设置');
    }

    let setting = yield this.getListForUser(uid, true) || {};
    if (setting) {
      yield this._dao.update(options, {userId: uid});
    } else {
      yield this._dao.create(Object.assign({
        userId: uid
      }, options));
    }

    return (yield this.getListForUser(uid, true));
  }
}

module.exports = NotificationSettingService;
