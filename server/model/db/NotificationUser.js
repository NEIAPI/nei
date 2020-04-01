/**
 *  NotificationUser Model Class
 */
// variables
const Model = require('./Model');
// NotificationUser primary fields
const PRIMARY = ['user_id', 'notification_id'];
// NotificationUser fields definition
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
   * 消息标识
   * @type {Object}
   */
  notificationId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 消息已读状态  0 － 未读 1 － 已读
   * @type {Object}
   */
  isRead: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 消息发送时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class NotificationUser extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/NotificationUser');
  }
}

NotificationUser.props('notification_user', FIELDS, PRIMARY);
// export NotificationUser class
module.exports = NotificationUser;
