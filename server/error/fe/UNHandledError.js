/**
 *  Resource UnHandled Error Class
 */

const cf = require('../error.json');

class UNHandledError extends require('./FEError') {
  /**
   * Create a Resource UnHandled Error
   * @param {String}   message - error message
   * @param {Variable} data    - error data
   */
  constructor(message, data) {
    super(cf.RES_NOHANDLE, message, data);
  }
}

module.exports = UNHandledError;
