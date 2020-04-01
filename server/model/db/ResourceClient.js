/**
 * Clients Model class
 */

const Model = require('./Model');
const PRIMARY = ['res_id', 'res_type', 'project_id', 'progroup_id', 'client_id', 'create_time'];
const FIELDS = {
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
   * 客户端标识
   * @type {Object}
   */
  clientId: {
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
};

class ResourceClient extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ResourceClient');
  }
}

ResourceClient.props('resource_client', FIELDS, PRIMARY);
module.exports = ResourceClient;
