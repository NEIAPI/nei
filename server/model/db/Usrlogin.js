/**
 *  Usrlogin Model Class
 */
// variables
const Model = require('./Model');
// Usrlogin primary fields
const PRIMARY = ['id'];
// Usrlogin fields definition
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
   * 用户标识
   * @type {Object}
   */
  userId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 登录来源  0 － 站内登录 1 － OPENID登录 2 － URS登录
   * @type {Object}
   */
  loginFrom: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 登录时间
   * @type {Object}
   */
  loginTime: {
    type: 'Date',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class Usrlogin extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Usrlogin');
  }
}

Usrlogin.props('usrlogin', FIELDS, PRIMARY);
// export Usrlogin class
module.exports = Usrlogin;
