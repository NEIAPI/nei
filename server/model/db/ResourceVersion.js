/**
 * Clients Model class
 */
const Model = require('./Model');
const PRIMARY = ['id'];
const FIELDS = {
  /**
   * 版本标识
   * @type{Object}
   */
  id: {
    type: 'Number',
    primary: !0
  },
  /**
   * 资源标识
   * @type {Object}
   */
  resId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 资源类型
   * @type {Object}
   */
  resType: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 项目标识
   * @type {Object}
   */
  projectId: {
    type: 'Number'
  },
  /**
   * 项目组标识
   * @type {Object}
   */
  progroupId: {
    type: 'Number',
  },
  /**
   * 源资源标识:
   * @type {Object}
   */
  origin: {
    type: 'Number'
  },
  /**
   * 父资源标识
   * @type {Object}
   */
  parent: {
    type: 'Number'
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
   * 创建者标识
   * @type {Object}
   */
  creatorId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 历史版本描述信息
   * @type {Object}
   */
  description: {
    type: 'String'
  },
  /**
   * 历史版本名称
   * @type {Object}
   */
  name: {
    type: 'String'
  }
};

class ResourceVersion extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ResourceVersion');
  }
}

ResourceVersion.props('resource_version', FIELDS, PRIMARY);
module.exports = ResourceVersion;

