const cf = require('../error.json');

class AuthError extends require('./FEError') {
  /**
   * Create an Login Auth Error
   * @param {String}   message - error message
   * @param {Variable} data    - error data
   */
  constructor(message, data) {
    super(cf.NOT_LOGIN, message, data);
  }
}

module.exports = AuthError;
