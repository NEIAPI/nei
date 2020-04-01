/**
 *  Interface Model Class
 */
// variables
const Model = require('./Model');
// Interface primary fields
const PRIMARY = ['id'];
// Interface fields definition
const FIELDS = {
  /**
   * 接口标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 接口标签
   * @type {Object}
   */
  tag: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 标签拼音
   * @type {Object}
   */
  tagPinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 接口名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 接口名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 接口状态信息
   * @type {Object}
   */
  statusId: {
    type: 'Number',
    defaultValue: 9994
  },
  /**
   * 请求路径
   * @type {Object}
   */
  path: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 接口类型  0 － HTTP 接口 1 － 普通接口
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 请求方式，全大写字母
   * @type {Object}
   */
  method: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 是否REST风格  0 － 非REST风格 1 － REST风格
   * @type {Object}
   */
  isRest: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 自动代码生成时类名
   * @type {Object}
   */
  className: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 接口描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 对于非HTTP 接口，此字段保存参数顺序
   * @type {Object}
   */
  paramsOrder: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 负责人标识
   * @type {Object}
   */
  respoId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 业务分组标识
   * @type {Object}
   */
  groupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 归属项目标识
   * @type {Object}
   */
  projectId: {
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
   * 创建者标识
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
  },
  /**
   * 输入参数格式  0 － 集合 1 － 枚举 2 － 数组 3 － 字符 4 － 数值 5 － 布尔 6 － 文件
   * @type {Object}
   */
  reqFormat: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 输出参数格式  0 － 集合 1 － 枚举 2 － 数组 3 － 字符 4 － 数值 5 － 布尔 6 － 文件
   * @type {Object}
   */
  resFormat: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 发送规则表达式
   * @type {Object}
   */
  beforeScript: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 接收规则表达式
   * @type {Object}
   */
  afterScript: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * businessLogicBeforeScript，mockstore 前置业务逻辑脚本，是规则函数
   * @type {Object}
   */
  blbScript: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * businessLogicAfterScript，mockstore 后置业务逻辑脚本，是规则函数
   * @type {Object}
   */
  blaScript: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 关联的数据模型id
   * @type {Object}
   */
  connectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 关联的数据模型类型
   * 0 － 未设置
   * 1 － 按id加载单个
   * 2 － 加载所有
   * 3 - 按id列表加载多个
   * 4 - 创建单个
   * 5 - 按数组数据创建多个
   * 6 - 更新单个
   * 7 - 更新所有
   * 8 - 按id列表更新多个
   * 9 - 按id删除单个
   * 10 - 删除所有
   * 11 - 按id列表删除多个
   * @type {Object}
   */
  connectType: {
    type: 'Number',
    defaultValue: 0
  },
  // mock 请求的延时时间
  mockDelay: {
    type: 'Number',
    defaultValue: 0
  },
  // 接口出入参规范
  schema: {
    type: 'String',
    defaultValue: ''
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class Interface extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Interface');
  }
}

Interface.props('interface', FIELDS, PRIMARY);
// export Interface class
module.exports = Interface;
