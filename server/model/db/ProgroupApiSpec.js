/**
 *  Progroup API Spec Model Class
 */
// variables
const Model = require('./Model');
// ProgroupUser primary fields
const PRIMARY = ['id'];
// ProgroupApiSpec fields definition
const FIELDS = {
  /**
   * 唯一标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
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
   * 接口类型标识 0 - http接口; 1 - 函数接口l; 2 - rpc 接口
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 路径规范
   * @type {Object}
   */
  path: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 路径规范描述信息
   * @type {Object}
   */
  pathDescription: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 参数名称规范
   * @type {Object}
   */
  param: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 参数名称规范描述信息
   * @type {Object}
   */
  paramDescription: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 参数描述规范
   * @type {Object}
   */
  paramdesc: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 参数描述规范描述信息
   * @type {Object}
   */
  paramdescDescription: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 请求方法规范
   * @type {Object}
   */
  method: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 请求方法规范描述信息
   * @type {Object}
   */
  methodDescription: {
    type: 'String',
    defaultValue: ''
  },
  tag: {
    type: 'String',
    defaultValue: ''
  },
  tagDescription: {
    type: 'String',
    defaultValue: ''
  },
  resSchema: {
    type: 'String',
    defaultValue: ''
  },
  resSchemaDescription: {
    type: 'String',
    defaultValue: ''
  },
  interfaceSchema: {
    type: 'String',
    defaultValue: ''
  },
  interfaceSchemaDescription: {
    type: 'String',
    defaultValue: ''
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
class ProgroupApiSpec extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ProgroupApiSpec');
  }
}

ProgroupApiSpec.props('progroup_api_spec', FIELDS, PRIMARY);
// export ProgroupUser class
module.exports = ProgroupApiSpec;
