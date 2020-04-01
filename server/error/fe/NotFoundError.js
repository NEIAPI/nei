/**
 *  Resource Not Found Error Class
 */

const cf = require('../error.json');

const FEError = require('./FEError');

class NotFoundError extends FEError {
  /**
   * Creat a Resource Not Found Error
   * @param {String}   message - error message
   * @param {Object} data    - error data
   */
  constructor(message, data) {
    super(cf.NOT_FOUND, message, data);
  }
}

module.exports = NotFoundError;
