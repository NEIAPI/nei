/**
 *  ParameterCombination Model Class
 *
 */
// variables
const Model = require('./Model');
// ParameterCombination primary fields
const PRIMARY = ['parent_id', 'parent_type', 'datatype_id'];
// ParameterCombination fields definition
const FIELDS = {
  /**
   * 参数归属资源标识
   * @type {Object}
   */
  parentId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 参数归属资源类型  0 － 页面请求参数 1 － 模板预填参数 2 － 接口输入参数 3 － 接口输出参数 4 － 数据类型属性
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
   * 数据类型导入时间
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
class ParameterCombination extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ParameterCombination');
  }
}

ParameterCombination.props('parameter_combination', FIELDS, PRIMARY);
// export ParameterCombination class
module.exports = ParameterCombination;
