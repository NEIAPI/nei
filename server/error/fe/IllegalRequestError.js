/**
 *  Illegal Request Error Class
 */

const cf = require('../error.json');

const FEError = require('./FEError');

class IllegalRequestError extends FEError {
  /**
   * Create an Illegal Request Error
   * @param {String}   message - error message
   * @param {Object} [data]    - error data
   */
  constructor(message, data) {
    super(cf.ILG_REQUEST, message, data);
  }
}

module.exports = IllegalRequestError;
