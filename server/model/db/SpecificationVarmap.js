/**
 *  SpecificationVarmap Model Class
 */
// variables
const Model = require('./Model');
// SpecificationVarmap primary fields
const PRIMARY = ['id'];
// SpecificationVarmap fields definition
const FIELDS = {
  /**
   * 映射关系标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 工程规范类型  0 － WEB工程规范 1 － AOS工程规范 2 － IOS工程规范 3 － 测试工程规范
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 映射关系归属标识
   * @type {Object}
   */
  parentId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 映射关系归属类型  0 - 工程规范 1 - 项目组 2 - 项目
   * @type {Object}
   */
  parentType: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 原始数据类型名称
   * @type {Object}
   */
  orgName: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 映射代码变量名称
   * @type {Object}
   */
  varName: {
    type: 'String',
    defaultValue: ''
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
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class SpecificationVarmap extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/SpecificationVarmap');
  }
}

SpecificationVarmap.props('specification_varmap', FIELDS, PRIMARY);
// export SpecificationVarmap class
module.exports = SpecificationVarmap;
