/**
 * 记录 调用 apimock 接口 时的一些信息
 */

const log = require('../util/log');
const dt = require('./config/const.json');

class CallApiMockDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/CallApiMock');
  }

  * increaseCallTimes() {
    // 此行getCallTimes可以保证 redis 中有数据，因为 redis 数据有可能会被清理，此时需要执行 sql
    yield this.getCallTimes();
    yield this._cache.incr(dt.RDS_MOCKSTORE_CALLTIMES);
  }

  * getCallTimes() {
    log.debug(
      '[%s.getCallTimes] get mockstore api call times',
      this.constructor.name
    );
    this._context.response.set('Content-type', 'text/plain');
    return yield this._doWithCache(
      dt.RDS_MOCKSTORE_CALLTIMES, function*() {
        const ret = yield this._search('select count(*) from call_apimock');
        return ret[0]['count(*)'];
      }
    );
  }
}

module.exports = CallApiMockDao;
