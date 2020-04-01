/**
 *  View Model Class
 */
// variables
const Model = require('./Model');
// View primary fields
const PRIMARY = ['id'];
// View fields definition
const FIELDS = {
  /**
   * 视图标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 视图标签
   * @type {Object}
   */
  tag: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 视图标签拼音
   * @type {Object}
   */
  tagPinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 视图类型  0 － WEB视图 1 － AOS视图 2 － IOS视图
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 视图访问路径
   * @type {Object}
   */
  path: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 视图名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 视图名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 视图描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 代码映射
   * @type {Object}
   */
  className: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 负责人标识
   * @type {Object}
   */
  respoId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 视图所在业务分组标识
   * @type {Object}
   */
  groupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 视图所在项目标识
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 视图所在项目组标识
   * @type {Object}
   */
  progroupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 视图创建者标识
   * @type {Object}
   */
  creatorId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 视图创建时间
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
class View extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/View');
  }
}

View.props('view', FIELDS, PRIMARY);
// export View class
module.exports = View;
