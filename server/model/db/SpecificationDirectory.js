/**
 *  SpecificationDirectory Model Class
 */
// variables
const Model = require('./Model');
// SpecificationDirectory primary fields
const PRIMARY = ['id'];
// SpecificationDirectory fields definition
const FIELDS = {
  /**
   * 节点标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 节点归属的规范标识
   * @type {Object}
   */
  specId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 节点所在父节点标识
   * @type {Object}
   */
  parent: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 节点类型  0 － 目录 1 － 文件
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 节点名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 节点描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 对于type为1的节点（即文件），指定文件的类型及高亮的语法，比如text/javascript
   * @type {Object}
   */
  mime: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 文件内容，如果是非文本文件则此字段存储文件对应的URL地址
   * @type {Object}
   */
  content: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 填充的数据模型类别 0 - 没有数据模型 1 - HTTP 接口列表 2 - 数据模型列表 3 - 页面模板列表 4 - 页面视图列表
   * @type {Object}
   */
  dataSource: {
    type: 'Number',
    defaultValue: 0
  },
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class SpecificationDirectory extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/SpecificationDirectory');
  }
}

SpecificationDirectory.props('specification_directory', FIELDS, PRIMARY);
// export SpecificationDirectory class
module.exports = SpecificationDirectory;
