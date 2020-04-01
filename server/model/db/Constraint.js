/**
 *  Constraint Model Class
 */
// variables
const Model = require('./Model');
// Constraint primary fields
const PRIMARY = ['id'];
// Constraint fields definition
const FIELDS = {
  /**
   * 约束函数标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 标签
   * @type {Object}
   */
  tag: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 标签拼音
   * @type {Object}
   */
  tagPinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 函数类型  0 － 用户定义 1 － 系统预置
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 函数名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 适用类型，0表示适用于所有类型
   * @type {Object}
   */
  apply: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 函数执行体
   * @type {Object}
   */
  function: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 描述信息
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 所属业务分组
   * @type {Object}
   */
  groupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 归属项目
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 归属项目分组
   * @type {Object}
   */
  progroupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 创建者标识
   * @type {Object}
   */
  creatorId: {
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
class Constraint extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Constraint');
  }
}

Constraint.props('constraint', FIELDS, PRIMARY);
// export Constraint class
module.exports = Constraint;
