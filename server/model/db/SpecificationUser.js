/**
 *  SpecificationUser Model Class
 */
// variables
const Model = require('./Model');
// SpecificationUser primary fields
const PRIMARY = ['user_id', 'spec_id'];
// SpecificationUser fields definition
const FIELDS = {
  /**
   * 用户标识
   * @type {Object}
   */
  userId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 工程规范标识
   * @type {Object}
   */
  specId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 关系建立时间
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
class SpecificationUser extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/SpecificationUser');
  }
}

SpecificationUser.props('specification_user', FIELDS, PRIMARY);
// export SpecificationUser class
module.exports = SpecificationUser;
