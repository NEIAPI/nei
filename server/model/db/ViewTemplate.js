/**
 *  ViewTemplate Model Class
 */
// variables
const Model = require('./Model');
// ViewTemplate primary fields
const PRIMARY = ['view_id', 'template_id'];
// ViewTemplate fields definition
const FIELDS = {
  /**
   * 页面标识
   * @type {Object}
   */
  viewId: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 模板标识
   * @type {Object}
   */
  templateId: {
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
class ViewTemplate extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/ViewTemplate');
  }
}

ViewTemplate.props('view_template', FIELDS, PRIMARY);
// export ViewTemplate class
module.exports = ViewTemplate;
