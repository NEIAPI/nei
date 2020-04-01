/**
 * Clients Model class
 */
const Model = require('./Model');
const PRIMARY = ['id'];
const FIELDS = {
  /**
   * 文档标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    primary: !0
  },
  /**
   * 文档名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 文档名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 文档内容
   * @type {Object}
   */
  content: {
    type: 'string',
    defaultValue: 0
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
  }
};

class Document extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Document');
  }
}

Document.props('document', FIELDS, PRIMARY);
module.exports = Document;
