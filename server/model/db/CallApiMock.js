/**
 *  CallApiMock Model Class
 */
// variables
const Model = require('./Model');
// CallApiMock primary fields
const PRIMARY = ['id'];
// CallApiMock fields definition
const FIELDS = {
  /**
   * 记录标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 登录IP
   * @type {Object}
   */
  ip: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 登录地址
   * @type {Object}
   */
  address: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 调用的接口标识
   * @type {Object}
   */
  interfaceId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 调用时间
   * @type {Object}
   */
  callTime: {
    type: 'Date',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class CallApiMock extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/CallApiMock');
  }
}

CallApiMock.props('call_apimock', FIELDS, PRIMARY);
// export CallApiMock class
module.exports = CallApiMock;
