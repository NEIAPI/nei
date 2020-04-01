/**
 *  SpecificationKlassmap Model Class
 */
const Model = require('./Model');
// SpecificationKlassmap primary fields
const PRIMARY = ['id'];
// SpecificationKlassmap fields definition
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
   * 归属规范标识
   * @type {Object}
   */
  specId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 实例名称
   * @type {Object}
   */
  instanceName: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 类名称
   * @type {Object}
   */
  klassName: {
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
class SpecificationKlassmap extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/SpecificationKlassmap');
  }
}

SpecificationKlassmap.props('specification_klassmap', FIELDS, PRIMARY);
// export SpecificationKlassmap class
module.exports = SpecificationKlassmap;
