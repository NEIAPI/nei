/**
 *  WordOverwrite Model Class
 */
// variables
const Model = require('./Model');
// WordOverwrite primary fields
const PRIMARY = ['project_id', 'word_id'];
// WordOverwrite fields definition
const FIELDS = {
  /**
   * 项目id
   * @type {Object}
   */
  projectId: {
    type: 'Number',
    defaultValue: 0,
    searchable: true
  },
  /**
   * 词条id
   * @type {Object}
   */
  wordId: {
    type: 'String',
    defaultValue: '',
    searchable: true
  },
  /**
   * 是否禁用 0 - 非禁用  1 - 禁用
   * @type {Object}
   */
  forbid: {
    type: 'Number',
    defaultValue: 0
  },
  /**
   * 归属项目组
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
class WordOverwrite extends Model {
  /**
   * get ViewModel class bind with Model
   * @return {ViewModel} - ViewModel class
   */
  getViewModel() {
    return require('../vm/WordOverwrite');
  }
}

WordOverwrite.props('word_overwrite', FIELDS, PRIMARY);
// export Word class
module.exports = WordOverwrite;
