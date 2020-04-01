/**
 *  Illegal Request Method Error Class
 */

const cf = require('../error.json');

class IllegalMethodError extends require('./FEError') {
  /**
   * Create an Illegal Method Error
   * @param {String}   message - error message
   * @param {Variable} data    - error data
   */
  constructor(message, data) {
    super(cf.ILG_METHOD, message, data);
  }
}

module.exports = IllegalMethodError;
