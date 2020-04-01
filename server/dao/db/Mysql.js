/**
 * Mysql Connection Class
 */

const mysql = require('mysql');
const wrap = require('thunkify-wrap');
const log = require('../../util/log');
const s5tchOn = process.appConfig.mysqlLog || false;

// default config
const DEFAULT = {
  dateStrings: true,
  multipleStatements: true
};
// mysql connection yield support
const CO_MYSQL = [
  'query', 'release',
  'beginTransaction',
  'commit', 'rollback'
];

let pool;

const NConnection = require('./NConnection');

class Mysql extends NConnection {
  constructor(sqlOpt = {context: {'_neiSql': {}}, noTransaction: false}) {
    super();
    // connectioin stored in _context object is transcation connection
    this._context = sqlOpt.context;
    this._noTransaction = sqlOpt.noTransaction;
  }

  /**
   * get connection from pool
   * @private
   * @return {Connection} - connection
   */
  static * getConnection() {
    if (!pool) {
      pool = wrap(mysql.createPool(
        Object.assign(
          DEFAULT,
          process.appConfig.mysql
        )
      ));
    }
    let conn = yield pool.getConnection();
    return wrap(conn, CO_MYSQL);
  }

  /**
   * begin transaction
   * @param {Object} koa context
   * @return {Void}
   */
  static * beginTransaction(context) {
    super.beginTransaction();
    let _sqlCtx = context['_neiSql'];
    if (_sqlCtx._conn) {
      _sqlCtx._ref++;
      return _sqlCtx._conn;
    }
    _sqlCtx._ref = 0;
    _sqlCtx._conn = yield this.getConnection();
    yield _sqlCtx._conn.beginTransaction();
  }

  /**
   * end transaction
   * @param {Object} koa context
   * @return {Void}
   */
  static * endTransaction(context) {
    super.endTransaction();
    let _sqlCtx = context['_neiSql'];
    if (!_sqlCtx._conn) {
      return;
    }
    if (_sqlCtx._ref) {
      _sqlCtx._ref--;
      return;
    }
    try {
      yield _sqlCtx._conn.commit();
    } catch (ex) {
      yield _sqlCtx._conn.rollback();
      throw ex;
    } finally {
      if (s5tchOn) {
        log.debug(
          '[%s.endTransaction] release connection',
          this.constructor.name
        );
      }
      _sqlCtx._conn.release();
      delete _sqlCtx._conn;
    }
  }

  /**
   * rollback transaction
   * @return {Void}
   */
  static * rollbackTransaction(context) {
    super.rollbackTransaction();
    let _sqlCtx = context['_neiSql'];
    if (!_sqlCtx._conn) {
      return;
    }
    try {
      yield _sqlCtx._conn.rollback();
    } catch (ex) {
      throw ex;
    } finally {
      if (s5tchOn) {
        log.debug(
          '[%s.rollbackTransaction] release connection',
          this.constructor.name
        );
      }
      _sqlCtx._conn.release();
      delete _sqlCtx._conn;
    }
  }

  /**
   * execute sql statement
   * @param  {String} sql - sql statement
   * @param  {Array}  args - sql parameters
   * @return {Object} result for sql statement
   */
  * exec(sql, args) {
    super.exec(sql, args);
    let ret = null,
      conn,
      parent = this.constructor,
      _neiSql = this._context['_neiSql'];

    if (this._noTransaction || !_neiSql._conn) {
      // get a new connection;
      conn = yield parent.getConnection();
    } else {
      conn = _neiSql._conn;
    }
    try {
      let t = +new Date;
      ret = yield conn.query(sql, args || []);
      if (s5tchOn) {
        log.debug(
          '[%s.exec] sql execute time %sms',
          this.constructor.name, +new Date - t,
          sql, args
        );
      }
      // 0-result 1-fields
      ret = (ret || [])[0];
    } finally {
      if (conn !== _neiSql._conn) {
        if (s5tchOn) {
          log.debug(
            '[%s.exec] release connection',
            this.constructor.name
          );
        }
        conn.release();
      }
    }
    return ret;
  }

  /**
   *  proxy for mysql.format
   *  prepare a query with multiple insertion points,
   *  utilizing the proper escaping for ids and values.
   * @param sql
   * @param args
   */
  format(sql, args) {
    return mysql.format(sql, args);
  }
}

module.exports = Mysql;
