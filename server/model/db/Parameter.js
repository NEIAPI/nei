/**
 *  Parameter Model Class
 */
// variables
const Model = require('./Model');
// Parameter primary fields
const PRIMARY = ['id'];
// Parameter fields definition
const FIELDS = {
  /**
   * 参数标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 参数数据类型
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 参数名称，枚举类型存的是代码变量名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 是否数组  0 － 非数组 1 － 数组
   * @type {Object}
   */
  isArray: {
    type: 'Number',
    defaultValue: 0
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
   * 描述信息
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 默认值，枚举类型存的是显示值
   * @type {Object}
   */
  defaultValue: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 参数归属的资源标识，可以是数据类型、页面请求参数等
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
   * 归属项目组标识
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
   * 是否必须  0 － 非必须 1 － 必须
   * @type {Object}
   */
  required: {
    type: 'Number',
    defaultValue: 1
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
class Parameter extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Parameter');
  }
}

Parameter.props('parameter', FIELDS, PRIMARY);
// export Parameter class
module.exports = Parameter;
