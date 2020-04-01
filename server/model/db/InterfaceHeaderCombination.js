/**
 *  InterfaceHeaderCombination Model Class
 */
const Model = require('./Model');
// InterfaceHeaderCombination primary fields
const PRIMARY = ['parent_id', 'datatype_id', 'parent_type'];
// InterfaceHeaderCombination fields definition
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
   * 归属项目组标识
   * @type {Object}
   */
  progroupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   *
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
class InterfaceHeaderCombination extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/InterfaceHeaderCombination');
  }
}

InterfaceHeaderCombination.props('interface_header_combination', FIELDS, PRIMARY);
// export InterfaceHeaderCombination class
module.exports = InterfaceHeaderCombination;
