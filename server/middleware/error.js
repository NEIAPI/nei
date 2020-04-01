/**
 * Error handling middleware
 */
const NError = require('../error/NError');
const Mysql = require('../dao/db/Mysql');
const log = require('../util/log');

module.exports = function*(next) {
  try {
    yield next;
  } catch (err) {
    try {
      yield Mysql.rollbackTransaction(this);
    } catch (rollbackErr) {
      log.error(rollbackErr.stack);
    } finally {
      if (err instanceof NError) {
        this.response.body = err.toNObject();
      } else {
        // for non-NError, log it and simply say server error
        log.error(err.message);
        if (process.appConfig.mode === 'develop') {
          console.log(err.stack);
        }
        this.response.body = {
          code: 500,
          result: null,
          msg: '服务器内部错误'
        };
      }
    }
  }
};
