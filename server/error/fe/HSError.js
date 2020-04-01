/**
 *  Base Back End Error Class
 */

const cf = require('../error.json');

class HSError extends require('../NError') {
  /**
   * Create a Has Same Error
   * @param  {String} message - error message
   * @param  {Variable} data - error data
   */
  constructor(message, data) {
    super(cf.HAS_SAME, message, data);
  }
}

module.exports = HSError;
