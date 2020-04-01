/**
 *  Bisgroup Model Class
 */
// variables
const Model = require('./Model');
// Bisgroup primary fields
const PRIMARY = ['id'];
// Bisgroup fields definition
const FIELDS = {
  /**
   * 业务分组标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 业务分组类型  0 - 常规业务分组 1 - 默认业务分组 2 - 隐藏业务分组
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 业务分组名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 业务分组名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 业务分组描述
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 业务分组 - RPC 工程的 POM 依赖
   * @type {Object}
   */
  rpcPom: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 业务分组 - RPC 工程的 Key
   * @type {Object}
   */
  rpcKey: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 负责人标识
   * @type {Object}
   */
  respoId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 业务分组归属项目
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 业务分组归属项目组
   * @type {Object}
   */
  progroupId: {
    type: 'Number',
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
class Bisgroup extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Bisgroup');
  }
}

Bisgroup.props('bisgroup', FIELDS, PRIMARY);
// export Bisgroup class
module.exports = Bisgroup;
