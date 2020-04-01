/**
 *  ProgroupIp Model Class
 */
// variables
const Model = require('./Model');
// ProgroupIp primary fields
const PRIMARY = ['id'];
// ProgroupIp fields definition
const FIELDS = {
  /**
   * 项目组ip标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
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
   * 归属项目组标识
   * @type {Object}
   */
  ip: {
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
class ProgroupIp extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ProgroupIp');
  }
}

ProgroupIp.props('progroup_ip', FIELDS, PRIMARY);
// export TestcaseCollection class
module.exports = ProgroupIp;
