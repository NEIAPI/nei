/**
 *  User Model Class
 */
// variables
const Model = require('./Model');
// User primary fields
const PRIMARY = ['id'];
// User fields definition
const FIELDS = {
  /**
   * 用户标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 用户帐号，对于第三方登录的帐号，此处保存第三方过来的帐号
   * @type {Object}
   */
  username: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 邮箱地址
   * @type {Object}
   */
  email: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 邮箱绑定状态  0 － 未绑定 1 － 已绑定
   * @type {Object}
   */
  emailState: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 手机号码
   * @type {Object}
   */
  phone: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 手机号码绑定状态  0 － 未绑定 1 － 已绑定
   * @type {Object}
   */
  phoneState: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 登录密码，对于第三方帐号登录的用户此处没有密码
   * @type {Object}
   */
  password: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 密码盐值
   * @type {Object}
   */
  passwordSalt: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 用户真实姓名
   * @type {Object}
   */
  realname: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 真实姓名拼音
   * @type {Object}
   */
  realnamePinyin: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 用户头像地址
   * @type {Object}
   */
  portrait: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 帐号来源  0 － 站内帐号 1
   * @type {Object}
   */
  from: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 用户所在企业
   * @type {Object}
   */
  company: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 用户角色  0 － 未设置 1 － 其它角色 2 － 项目经理 3 － 前端工程师 4 － 后端工程师 5 － IOS工程师 6 － AOS工程师 7 － 测试工程师 8 － 运维工程师
   * @type {Object}
   */
  role: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 个人博客地址
   * @type {Object}
   */
  blog: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * GitHub帐号
   * @type {Object}
   */
  github: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 微信号
   * @type {Object}
   */
  weixin: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 易信号
   * @type {Object}
   */
  yixin: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 泡泡号
   * @type {Object}
   */
  paopao: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * QQ号码
   * @type {Object}
   */
  qq: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 参加工作时间
   * @type {Object}
   */
  jobTime: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 帐号创建时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  },
  /**
   * 项目组排序方式   0 - 自定义排序 1 － 名称升序 2 － 名称降序 3 － 时间升序 4 － 时间降序 5 － 项目数量升序 6 － 项目数量降序
   * @type {Object}
   */
  progroupOrder: {
    type: 'Number',
    defaultValue: 1
  },
  /**
   * 项目组自定义排序列表
   * @type {Object}
   */
  progroupOrderList: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 项目组置顶列表
   * @type {Object}
   */
  progroupTopList: {
    type: 'String',
    defaultValue: ''
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class User extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/User');
  }
}

User.props('user', FIELDS, PRIMARY);
// export User class
module.exports = User;
