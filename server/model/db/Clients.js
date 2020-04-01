/**
 * Clients Model class
 */

const Model = require('./Model');
const PRIMARY = ['id'];
const FIELDS = {
  /**
   * 客户端标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    primary: !0
  },
  /**
   * 客户端版本名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 客户端版本名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 客户端描述信息
   * @type {Object}
   */
  description: {
    type: 'string',
    defaultValue: 0
  },
  /**
   * 标签
   * @type {Object}
   */
  tag: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 标签拼音
   * @type {Object}
   */
  tagPinyin: {
    type: 'String',
    defaultValue: ''
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
   * 客户端下载链接
   * @type {Object}
   */
  downloadLink: {
    type: 'string',
    defaultValue: ''
  },
  /**
   * 上线日期
   * @type {Object}
   */
  launchDate: {
    type: 'String',
  },
  /**
   * 下线日期
   * @type {Object}
   */
  closeDate: {
    type: 'String',
  },
  /**
   * 归属项目标识
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 业务分组标识
   * @type {Object}
   */
  groupId: {
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
   * 客户端创建者标识
   * @type {Object}
   */
  creatorId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 客户端创建时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  },
  /**
   * 版本名称
   * @type {Object}
   */
  version: {
    type: 'String',
    defaultValue: ''
  }
};

class Clients extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Clients');
  }
}

Clients.props('client', FIELDS, PRIMARY);
module.exports = Clients;
