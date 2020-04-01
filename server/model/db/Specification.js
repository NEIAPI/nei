/**
 *  Specification Model Class
 */
const Model = require('./Model');
// Specification primary fields
const PRIMARY = ['id'];
// Specification fields definition
const FIELDS = {
  /**
   * 工程规范标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 工程规范类型  0 － WEB工程规范 1 － AOS工程规范 2 － IOS工程规范
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 工程规范是否共享  0 － 未共享 1 － 已共享
   * @type {Object}
   */
  isShare: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 工程规范是否锁定  0 － 未锁定 1 － 已锁定
   * @type {Object}
   */
  isLock: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 是否系统预置规范  0 - 非系统预置，由用户创建 1 - 系统预置规范，用户不可修改
   * @type {Object}
   */
  isSystem: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 工程规范名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 规范名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 工程实现语言  0 - 其他  针对WEB工程规范：  11 - Java 12 - Node 13 - PHP  针对Android工程  11 - Java  针对iOS工程  31 - Swift 32 - Objective-C
   * @type {Object}
   */
  language: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 工程规范描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 规范文档，支持Markdown格式
   * @type {Object}
   */
  document: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 工程规范创建者标识
   * @type {Object}
   */
  creatorId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 工程规范创建时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  },

  /**
   * 命令行参数配置文件
   * @type {Object}
   */
  argsConfig: {
    type: 'Number',
    defaultValue: 0
  },

  /**
   * 模版引擎辅助函数
   * @type {Object}
   */
  helpersConfig: {
    type: 'Number',
    defaultValue: 0
  },

  /**
   * 工具使用的标识
   * @type {Object}
   */
  toolKey: {
    type: 'String',
    defaultValue: ''
  },

  /**
   * 当前WEB工程使用的模板引擎  0 －无   11 － Freemarker 12 － Velocity  21 － EJS 22 － Swig  31 － Smarty
   * @type {Object}
   */
  engine: {
    type: 'Number',
    defaultValue: 0
  },

  /**
   * 前端资源根节点
   * @type {Object}
   */
  webRoot: {
    type: 'Number',
    defaultValue: 0
  },

  /**
   * 模板根节点
   * @type {Object}
   */
  viewRoot: {
    type: 'Number',
    defaultValue: 0
  },

  /**
   * 模板文件扩展名
   * @type {Object}
   */
  viewExtension: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 接口MOCK数据输出根节点
   * @type {Object}
   */
  mockApiRoot: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 模板填充MOCK数据输出根节点
   * @type {Object}
   */
  mockViewRoot: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * Jar包根目录
   * @type {Object}
   */
  jarRoot: {
    type: 'Number',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class Specification extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Specification');
  }
}

Specification.props('specification', FIELDS, PRIMARY);

module.exports = Specification;
