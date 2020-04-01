/**
 *  InterfaceHeaderOverwrite Model Class
 */
// variables
const Model = require('./Model');
// InterfaceHeaderOverwrite primary fields
const PRIMARY = ['parent_type', 'parent_id', 'datatype_id', 'parameter_id'];
// InterfaceHeaderOverwrite fields definition
const FIELDS = {
  /**
   * 接口标识
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
   * 导入的数据类型标识
   * @type {Object}
   */
  datatypeId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 导入的属性标识
   * @type {Object}
   */
  parameterId: {
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
   * 重写的属性值
   * @type {Object}
   */
  defaultValue: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 重写的描述信息
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 重写时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  },
  /**
   * 重写是否可见 0 - 可见 1 - 不可见 9 - 未设置
   * @type {Object}
   */
  ignored: {
    type: 'Number',
    defaultValue: 9
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class InterfaceHeaderOverwrite extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/InterfaceHeaderOverwrite');
  }
}

InterfaceHeaderOverwrite.props('interface_header_overwrite', FIELDS, PRIMARY);
// export InterfaceHeaderOverwrite class
module.exports = InterfaceHeaderOverwrite;
