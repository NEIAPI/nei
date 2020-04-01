/**
 *  NotificationSetting Model Class
 */
// variables
const Model = require('./Model');
// NotificationSetting primary fields
const PRIMARY = ['user_id'];
// NotificationSetting fields definition
const FIELDS = {
  /**
   * 用户标识
   * @type {Object}
   */
  userId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 通知开关  0 － 关闭通知功能 1 － 开启通知功能
   * @type {Object}
   */
  flag: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 通知方式 － 易信  0 － 关闭 1 － 开启
   * @type {Object}
   */
  methodYixin: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 通知方式 － 邮箱通知  0 － 关闭 1 － 开启
   * @type {Object}
   */
  methodEmail: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 通知方式 － 手机  0 － 关闭 1 － 开启
   * @type {Object}
   */
  methodPhone: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 通知方式 － 泡泡  0 － 关闭 1 － 开启
   * @type {Object}
   */
  methodPaopao: {
    type: 'Number',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class NotificationSetting extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/NotificationSetting');
  }
}

NotificationSetting.props('notification_setting', FIELDS, PRIMARY);
// export NotificationSetting class
module.exports = NotificationSetting;
