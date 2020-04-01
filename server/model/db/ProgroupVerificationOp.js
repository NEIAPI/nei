/**
 *  ProgroupVerificationOp Model Class
 */
// variables
const Model = require('./Model');
// ProgroupVerificationOp primary fields
const PRIMARY = ['id'];
// ProgroupVerificationOp fields definition
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
   * 如果操作为通过，则通过的角色标识  0 － 观察者 1 － 开发者 2 － 测试员 9 － 管理员
   * @type {Object}
   */
  role: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 操作结果  0 - 未操作 1 - 通过 2 - 拒绝 3 - 自动通过
   * @type {Object}
   */
  result: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 操作描述信息，（自动）通过的描述信息由程序组装
   * @type {Object}
   */
  message: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 操作人员标识
   * @type {Object}
   */
  userId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 申请记录标识
   * @type {Object}
   */
  verificationId: {
    type: 'Number',
    defaultValue: 0
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
class ProgroupVerificationOp extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ProgroupVerificationOp');
  }
}

ProgroupVerificationOp.props('progroup_verification_op', FIELDS, PRIMARY);
// export ProgroupVerificationOp class
module.exports = ProgroupVerificationOp;
