/**
 *  Illegal Request MIME Type Error Class
 */

const cf = require('../error.json');

class IllegalMIMEError extends require('./FEError') {
  /**
   * Create an Illegal MIME Type Error
   * @param {String}   message - error message
   * @param {Variable} data    - error data
   */
  constructor(message, data) {
    super(cf.ILG_MIME, message, data);
  }
}

module.exports = IllegalMIMEError;
