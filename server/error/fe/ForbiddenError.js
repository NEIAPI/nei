/**
 *  Forbidden Error Class
 */

const cf = require('../error.json');

class ForbiddenError extends require('./FEError') {
  /**
   * Create a Forbidden Error
   * @param {String}   message - error message
   * @param [Variable] data    - error data
   */
  constructor(message, data) {
    super(cf.RES_FORBIDDEN, message, data);
  }
}

module.exports = ForbiddenError;
