/**
 *  Base NEI Error Class
 */

class NError extends Error {
  /**
   * NEI Error constructor
   * @param {String}   message - error message
   * @param {Object} [data]    - error data
   */
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
  }

  /**
   * convert to front end model
   *
   * @return {Object} model return to front end
   */
  toNObject() {
    return {
      code: this.code,
      result: this.data,
      msg: this.message
    };
  }

  /**
   * error to string
   * @returns {string} - error message
   */
  toString() {
    return `[${this.constructor.name}] - ${this.message}`;
  }
}

module.exports = NError;
