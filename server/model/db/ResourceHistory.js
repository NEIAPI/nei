/**
 *  ResourceHistory Model Class
 */
// variables
const Model = require('./Model');
// ResourceHistory primary fields
const PRIMARY = ['id'];
// ResourceHistory fields definition
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
   * 资源类型  1 － 项目组 2 － 项目 3 － 页面 4 － 模板 5 － 接口 6 － 数据 7 － 分组 8 － 约束
   * @type {Object}
   */
  resType: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 操作信息需要保存的冗余信息，JSON字符串
   * @type {Object}
   */
  opData: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 操作标识  1 － 增加 2 － 删除 3 － 修改 4 －共享 5 －关注
   * @type {Object}
   */
  opAction: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 操作内容
   * @type {Object}
   */
  opContent: {
    type: 'String',
    defaultValue: ''
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
class ResourceHistory extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ResourceHistory');
  }
}

ResourceHistory.props('resource_history', FIELDS, PRIMARY);
// export ResourceHistory class
module.exports = ResourceHistory;
