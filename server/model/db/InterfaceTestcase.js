/**
 *  InterfaceTestcase Model Class
 */
// variables
const Model = require('./Model');
// InterfaceTestcase primary fields
const PRIMARY = ['id'];
// InterfaceTestcase fields definition
const FIELDS = {
  /**
   * 测试用例标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 用例归属接口标识
   * @type {Object}
   */
  interfaceId: {
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
   * 测试服务器地址
   * @type {Object}
   */
  host: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 测试用例执行状态  0 - 未测试 1 - 测试通过 2 - 测试失败
   * @type {Object}
   */
  state: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 测试名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 测试描述信息
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 测试用例创建者标识
   * @type {Object}
   */
  creatorId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 测试用例创建时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  },
  /**
   * 测试执行者标识
   * @type {Object}
   */
  testerId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 测试开始时间
   * @type {Object}
   */
  testBegTime: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 测试结束时间
   * @type {Object}
   */
  testEndTime: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 接口请求头，JSON串
   * @type {Object}
   */
  reqHeader: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 接口请求消息体
   * @type {Object}
   */
  reqData: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 接口响应头，JSON串
   * @type {Object}
   */
  resHeader: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 接口响应消息体
   * @type {Object}
   */
  resData: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 预期响应
   * @type {Object}
   */
  resExpect: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 预期响应头
   * @type {Object}
   */
  resExpectHeader: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 用例运行后结果报告
   * @type {Object}
   */
  report: {
    type: 'String',
    defaultValue: ''
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class InterfaceTestcase extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/InterfaceTestcase');
  }
}

InterfaceTestcase.props('interface_testcase', FIELDS, PRIMARY);
// export InterfaceTestcase class
module.exports = InterfaceTestcase;
