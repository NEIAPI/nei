/**
 *  Progroup Model Class
 */
// variables
const Model = require('./Model');
// Progroup primary fields
const PRIMARY = ['id'];
// Progroup fields definition
const FIELDS = {
  /**
   * 项目组标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 项目组类型  0 － 常规项目组 1 － 默认项目组 2 － 隐藏项目组
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 产品LOGO地址
   * @type {Object}
   */
  logo: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 项目组名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 项目组名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 项目组描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: '',
    searchable: true
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
   * 项目组创建时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  },
  /**
   * 项目排序方式
   * @type {Object}
   */
  projectOrder: {
    type: 'Number',
    defaultValue: 1
  },
  /**
   * 项目自定义排序列表
   * @type {Object}
   */
  projectOrderList: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 项目置顶列表
   * @type {Object}
   */
  projectTopList: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 验证方式  0 － 验证通过 1 － 自动通过
   * @type {Object}
   */
  verification: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 自动验证通过的角色  0 － 观察者 1 － 管理员 2 － 开发者 3 － 测试员
   * @type {Object}
   */
  verificationRole: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 工具使用的标识
   * @type {Object}
   */
  toolKey: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 项目组使用的默认WEB工程规范
   * @type {Object}
   */
  toolSpecWeb: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目组使用的默认AOS工程规范
   * @type {Object}
   */
  toolSpecAos: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目组使用的默认IOS工程规范
   * @type {Object}
   */
  toolSpecIos: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目组使用的默认测试工程规范
   * @type {Object}
   */
  toolSpecTest: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目组是否被锁定
   * @type {Object}
   */
  isLock: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目组是否开启接口审核功能
   * @type {Object}
   */
  apiAudit: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目组是否开启接口变更管控功能
   * @type {Object}
   */
  apiUpdateControl: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 在普通资源列表中是否显示公共资源列表
   * @type {Object}
   */
  showPublicList: {
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
class Progroup extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Progroup');
  }
}

Progroup.props('progroup', FIELDS, PRIMARY);
// export Progroup class
module.exports = Progroup;
