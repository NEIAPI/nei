/**
 *  Template Model Class
 */
// variables
const Model = require('./Model');
// Template primary fields
const PRIMARY = ['id'];
// Template fields definition
const FIELDS = {
  /**
   * 模板标识
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
   * 模板路径
   * @type {Object}
   */
  path: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 模板名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 模板名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 页面模板状态信息
   * @type {Object}
   */
  status: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 模板描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: '',
    searchable: true
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
   * 归属业务分组标识
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
class Template extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Template');
  }
}

Template.props('template', FIELDS, PRIMARY);
// export Template class
module.exports = Template;
