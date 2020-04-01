/**
 *  ProgroupUser Model Class
 */
// variables
const Model = require('./Model');
// ProgroupUser primary fields
const PRIMARY = ['user_id', 'progroup_id'];
// ProgroupUser fields definition
const FIELDS = {
  /**
   * 用户角色  0 － 观察者 1 － 开发者 2 － 测试员 9 － 管理员 10 － 拥有者
   * @type {Object}
   */
  role: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 用户标识
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
class ProgroupUser extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ProgroupUser');
  }
}

ProgroupUser.props('progroup_user', FIELDS, PRIMARY);
// export ProgroupUser class
module.exports = ProgroupUser;
