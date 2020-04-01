/**
 *  Resource Invalid Error Class
 */
const cf = require('../error.json');

const FEError = require('./FEError');

class InvalidError extends FEError {
  /**
   * Create a Resource Invalid Error
   * @param {String}   message - error message
   * @param {Object} data    - error data
   */
  constructor(message, data) {
    super(cf.RES_INVALID, message, data);
  }
}

module.exports = InvalidError;
