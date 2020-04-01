/**
 *  InterfaceHeader Model Class
 */
// variables
const Model = require('./Model');
// InterfaceHeader primary fields
const PRIMARY = ['id'];
// InterfaceHeader fields definition
const FIELDS = {
  /**
   * 头标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 头字段名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 头字段归属的接口标识
   * @type {Object}
   */
  parentId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 头类型  0 － 请求头 1 － 响应头
   * @type {Object}
   */
  parentType: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 字段值
   * @type {Object}
   */
  defaultValue: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 字段描述信息
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 归属的项目组标识
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
  },
  /**
   * 参数排序
   * @type {Object}
   */
  position: {
    type: 'Number',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class InterfaceHeader extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/InterfaceHeader');
  }
}

InterfaceHeader.props('interface_header', FIELDS, PRIMARY);
// export InterfaceHeader class
module.exports = InterfaceHeader;
