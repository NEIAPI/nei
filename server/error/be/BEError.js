const cf = require('../error.json');

class BEError extends require('../NError') {
  /**
   * Create a Back End Error
   * @param  {String} message - error message
   * @param  {Variable} data - error data
   */
  constructor(message, data) {
    super(cf.ERR_SERVER, message, data);
  }
}

module.exports = BEError;
