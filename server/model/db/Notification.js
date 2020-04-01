/**
 *  Notification Model Class
 */
const Model = require('./Model');
// Notification primary fields
const PRIMARY = ['id'];
// Notification fields definition
const FIELDS = {
  /**
   * 消息标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 消息类型  0 － 系统消息 1 － 个人消息
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 消息标题
   * @type {Object}
   */
  title: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 消息内容
   * @type {Object}
   */
  content: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 消息时间
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
class Notification extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Notification');
  }
}

Notification.props('notification', FIELDS, PRIMARY);
// export Notification class
module.exports = Notification;
