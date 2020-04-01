/**
 *  ProgroupVerification Model Class
 */
// variables
const Model = require('./Model');
// ProgroupVerification primary fields
const PRIMARY = ['id'];
// ProgroupVerification fields definition
const FIELDS = {
  /**
   * 申请记录标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 申请理由
   * @type {Object}
   */
  message: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 申请权限用户标识
   * @type {Object}
   */
  userId: {
    type: 'Number',
    defaultValue: 0
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
   * 申请时间
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
class ProgroupVerification extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ProgroupVerification');
  }
}

ProgroupVerification.props('progroup_verification', FIELDS, PRIMARY);
// export ProgroupVerification class
module.exports = ProgroupVerification;
