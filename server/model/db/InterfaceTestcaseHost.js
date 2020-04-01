/**
 *  InterfaceTestcaseHost Model Class
 */
// variables
const Model = require('./Model');
// InterfaceTestcaseHost primary fields
const PRIMARY = ['id'];
// InterfaceTestcaseHost fields definition
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
   * 测试服务器名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 测试服务器地址
   * @type {Object}
   */
  value: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 测试时发送的请求头，以逗号分隔
   * @type {Object}
   */
  header: {
    type: 'String',
    defaultValue: ''
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
class InterfaceTestcaseHost extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/InterfaceTestcaseHost');
  }
}

InterfaceTestcaseHost.props('interface_testcase_host', FIELDS, PRIMARY);
// export InterfaceTestcaseHost class
module.exports = InterfaceTestcaseHost;
