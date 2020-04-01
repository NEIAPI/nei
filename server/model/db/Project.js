/**
 *  Project Model Class
 */
// variables
const Model = require('./Model');
// Project primary fields
const PRIMARY = ['id'];
// Project fields definition
const FIELDS = {
  /**
   * 项目标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 项目类型标识  0 - 常规项目 1 - 共享资源 2 - 隐藏项目
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目LOGO地址
   * @type {Object}
   */
  logo: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 项目名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 项目名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * line of business
   * @type {Object}
   */
  lob: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 项目描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 通过QBS系统绑定的项目标识
   * @type {Object}
   */
  qbsId: {
    type: 'Number',
    defaultValue: 0
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
   * 项目创建者标识
   * @type {Object}
   */
  creatorId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目创建时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  },
  /**
   * 工具使用密码
   * @type {Object}
   */
  toolKey: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 项目使用WEB工程规范标识
   * @type {Object}
   */
  toolSpecWeb: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目使用的AOS工程规范标识
   * @type {Object}
   */
  toolSpecAos: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目使用的IOS工程规范标识
   * @type {Object}
   */
  toolSpecIos: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目使用的测试工程规范标识
   * @type {Object}
   */
  toolSpecTest: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目使用的默认测试主机标识
   * @type {Object}
   */
  hostId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 授权类型标识0 - key授权1 - cookie授权
   * @type {Object}
   */
  authType: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * @type {Object}
   */
  resParamRequired: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 是否使用参数字典校验功能 0 － 不开启 1 － 开启
   * @type {Object}
   */
  useWordStock: {
    type: 'Number',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class Project extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Project');
  }
}

Project.props('project', FIELDS, PRIMARY);
// export Project class
module.exports = Project;
