// variables
const Model = require('./Model');
// User primary fields
const PRIMARY = ["id"];
// User fields definition
const FIELDS = {
  /**
   * 唯一标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 访问令牌
   * @type {Object}
   */
  token: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 过期时间
   * @type {Object}
   */
  expire: {
    type: 'String',
    defaultValue: ''
  },
  /**
   *  访问权限
   * @type {Object}
   */
  privilege: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   *  令牌状态
   * @type {Object}
   */
  revoked: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目组创建者
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
class Pat extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Pat');
  }
}

Pat.props('pat', FIELDS, PRIMARY);
// export Pat class
module.exports = Pat;
