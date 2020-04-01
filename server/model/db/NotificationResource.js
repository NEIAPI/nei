/**
 *  NotificationResource Model Class
 */

const Model = require('./Model');
// NotificationResource primary fields
const PRIMARY = ['id'];
// NotificationResource fields definition
const FIELDS = {
  /**
   * 资源关注标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 资源类型
   * @type {Object}
   */
  resType: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 资源id标识
   * @type {Object}
   */
  resId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 创建时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  },
  /**
   * 消息id标识
   * @type {Object}
   */
  notificationId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 变更者标识
   * @type {Object}
   */
  creatorId: {
    type: 'Number',
    defaultValue: 0
  },
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class NotificationResource extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/NotificationResource');
  }
}

NotificationResource.props('notification_resource', FIELDS, PRIMARY);
// export NotificationResource class
module.exports = NotificationResource;
