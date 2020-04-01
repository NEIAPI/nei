/**
 *  TestcaseCollection Model Class
 */
// variables
const Model = require('./Model');
// TestcaseCollection primary fields
const PRIMARY = ['id'];
// TestcaseCollection fields definition
const FIELDS = {
  /**
   * 测试集标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 测试集类型
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 测试集服务器地址
   * @type {Object}
   */
  host: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 测试集名称
   * @type {Object}
   */
  name: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 测试集名称拼音
   * @type {Object}
   */
  namePinyin: {
    type: 'String',
    defaultValue: ''
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
   * 测试集描述信息
   * @type {Object}
   */
  description: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 测试集接口排序信息
   * @type {Object}
   */
  data: {
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
class TestcaseCollection extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/TestcaseCollection');
  }
}

TestcaseCollection.props('testcase_collection', FIELDS, PRIMARY);
// export TestcaseCollection class
module.exports = TestcaseCollection;
