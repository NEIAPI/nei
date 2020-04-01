/**
 * Abstract Connection Class
 */

class NConnection extends require('../../NObject') {
  /**
   * begin transaction
   * @return {Void}
   */
  static beginTransaction() {
  }

  /**
   * end transaction
   * @return {Void}
   */
  static endTransaction() {
  }

  /**
   * rollback transaction
   * @return {Void}
   */
  static rollbackTransaction() {
  }

  /**
   * execute sql statement
   * @param  {String} sql - sql statement
   * @param  {Array}  args - sql parameters
   * @return {Object} result for sql statement
   */
  exec(sql, args) {
  }
}

module.exports = NConnection;
