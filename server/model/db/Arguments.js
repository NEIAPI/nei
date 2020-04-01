/**
 *  Arguments Model Class
 */

const Model = require('./Model');
const PRIMARY = ['id'];
const FIELDS = {
  /**
   * 参数标识
   * @type {Object}
   */
  id: {
    type: 'Number',
    defaultValue: 0,
    primary: !0
  },
  /**
   * 归属类型，同规范类型定义  0 - web工程 1 - android工程 2 - ios工程 3 - 测试工程
   * @type {Object}
   */
  type: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 参数键
   * @type {Object}
   */
  key: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 参数值
   * @type {Object}
   */
  value: {
    type: 'String',
    defaultValue: ''
  },
  /**
   * 参数所在项目标识
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 参数所在项目组标识
   * @type {Object}
   */
  progroupId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 参数创建者标识
   * @type {Object}
   */
  creatorId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 参数创建时间
   * @type {Object}
   */
  createTime: {
    type: 'Date',
    defaultValue: 0
  }
};

class Arguments extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/Arguments');
  }
}

Arguments.props('arguments', FIELDS, PRIMARY);
module.exports = Arguments;
