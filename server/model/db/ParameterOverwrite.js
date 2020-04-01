/**
 *  ParameterOverwrite Model Class
 */
// variables
const Model = require('./Model');
// ParameterOverwrite primary fields
const PRIMARY = ['parent_id', 'parent_type', 'datatype_id', 'parameter_id'];
// ParameterOverwrite fields definition
const FIELDS = {
  /**
   * 参数归属的资源标识
   * @type {Object}
   */
  parentId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 参数归属的资源类型  0 － 页面请求参数 1 － 模板预填参数 2 － 接口输入参数 3 － 接口输出参数 4 － 数据类型属性
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
   * 参数标识
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
   * 重写的数据类型
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 是否数组格式  0 － 非数组 1 － 数组 9 － 未设置
   * @type {Object}
   */
  isArray: {
    type: 'Number',
    defaultValue: 9
  },
  /**
   * 字段验证表达式
   * @type {Object}
   */
  valExpression: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 字段生成表达式
   * @type {Object}
   */
  genExpression: {
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
   * 重写的默认值
   * @type {Object}
   */
  defaultValue: {
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
   * 是否必须  0 － 非必须 1 － 必须
   * @type {Object}
   */
  required: {
    type: 'Number',
    defaultValue: 1
  },
  /**
   * 是否忽略  0 － 非忽略 1 － 忽略
   * @type {Object}
   */
  ignored: {
    type: 'Number',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class ParameterOverwrite extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ParameterOverwrite');
  }
}

ParameterOverwrite.props('parameter_overwrite', FIELDS, PRIMARY);
// export ParameterOverwrite class
module.exports = ParameterOverwrite;
