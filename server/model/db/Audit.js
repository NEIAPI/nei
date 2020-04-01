/**
 * Audit Model class
 */

const Model = require('./Model');
const PRIMARY = ['id'];
const FIELDS = {
  /**
   * 审核记录标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    primary: !0
  },
  /**
   * 被审核接口标识
   * @type {Object}
   */
  interfaceId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 审核状态
   * @type {Object}
   */
  state: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 拒绝原因
   * @type {Object}
   */
  reason: {
    type: 'string',
    defaultValue: ''
  },
};

class Audit extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Audit');
  }
}

Audit.props('audit', FIELDS, PRIMARY);
module.exports = Audit;
