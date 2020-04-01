/**
 *  Datatype Model Class
 */
// variables
const Model = require('./Model');
// Datatype primary fields
const PRIMARY = ['id'];
// Datatype fields definition
const FIELDS = {
  /**
   * 数据类型标识
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
   * 数据类型形式  0 － 普通类型，列表中可见 1 － 系统预置类型，列表中置顶 2 － 匿名类型，列表中不可见
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 数据类型名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 数据类型格式  0 － 集合 1 － 枚举 2 － 数组 3 － 字符 4 － 数值 5 － 布尔 6 － 文件
   * @type {Object}
   */
  format: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 数据类型描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 业务分组标识
   * @type {Object}
   */
  groupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 归属项目标识
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 归属项目组标识
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
class Datatype extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Datatype');
  }
}

Datatype.props('datatype', FIELDS, PRIMARY);
// export Datatype class
module.exports = Datatype;
