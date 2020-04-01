/**
 *  ResourceWatch Model Class
 */
// variables
const Model = require('./Model');
// ResourceWatch primary fields
const PRIMARY = ['id'];
// ResourceWatch fields definition
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
   * 项目标识
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目组标识
   * @type {Object}
   */
  progroupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 用户标识
   * @type {Object}
   */
  userId: {
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
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class ResourceWatch extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ResourceWatch');
  }
}

ResourceWatch.props('resource_watch', FIELDS, PRIMARY);
// export SpecificationUser class
module.exports = ResourceWatch;
