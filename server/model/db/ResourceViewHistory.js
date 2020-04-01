const Model = require('./Model');
// ResourceViewHistory primary fields
const PRIMARY = ['id'];
// ResourceViewHistory fields definition
const FIELDS = {
  /**
   * 操作记录标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 操作用户标识
   * @type {Object}
   */
  userId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 资源归属项目ID
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 资源归属项目组标识
   * @type {Object}
   */
  progroupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 操作资源标识
   * @type {Object}
   */
  resId: {
    type: 'Number',
    defaultValue: 0
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
   * 操作时间
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
class ResourceViewHistory extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ResourceViewHistory');
  }
}

ResourceViewHistory.props('resource_view_history', FIELDS, PRIMARY);
// export NotificationResource class
module.exports = ResourceViewHistory;
