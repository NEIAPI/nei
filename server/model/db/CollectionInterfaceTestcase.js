/**
 *  CollectionInterfaceTestcase Model Class
 */
// variables
const Model = require('./Model');
// CollectionInterfaceTestcase primary fields
const PRIMARY = ['id'];
// CollectionInterfaceTestcase fields definition
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
   * 测试集记录标识
   * @type {Object}
   */
  collectionId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 接口标识
   * @type {Object}
   */
  interfaceId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 测试用例标识
   * @type {Object}
   */
  testcaseId: {
    type: 'Number',
    defaultValue: 0
  }
};

/**
 * Base Model Class
 *
 * @extends Model
 */
class CollectionInterfaceTestcase extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/CollectionInterfaceTestcase');
  }
}

CollectionInterfaceTestcase.props('collection_interface_testcase', FIELDS, PRIMARY);
// export TestcaseCollection class
module.exports = CollectionInterfaceTestcase;
