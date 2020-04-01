/**
 *  ViewInterface Model Class
 */
// variables
const Model = require('./Model');
// ViewInterface primary fields
const PRIMARY = ['view_id', 'interface_id'];
// ViewInterface fields definition
const FIELDS = {
  /**
   * 页面视图标识
   * @type {Object}
   */
  viewId: {
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
   * 添加时间
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
class ViewInterface extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ViewInterface');
  }
}

ViewInterface.props('view_interface', FIELDS, PRIMARY);
// export ViewInterface class
module.exports = ViewInterface;
