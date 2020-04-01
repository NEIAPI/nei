/**
 * Redis Service Class
 */

const log = require('../util/log');
const NotFoundError = require('../error/fe/NotFoundError');

class RedisService extends require('./NService') {
  constructor() {
    super();
    this._cache = new (require('../dao/cache/Redis'))();
  }

  /**
   * get data from cache
   * @param  {String}   cKey - key of data
   * @return {Variable} data from cache
   */
  * getByKey(ckey) {
    log.debug(
      '[%s.getWithKey] get redis data with key %s',
      this.constructor.name, ckey
    );
    let ret = yield this._cache.get(ckey);
    if (!!ret) {
      return ret;
    } else {
      throw new NotFoundError(`can't find data in redis with key ${ckey}`);
    }
  }

  /**
   * get data from cache
   * @param  {String}   cKey - key of data
   * @return {Variable} data from cache
   */
  * getAll() {
    log.debug(
      '[%s.getAll] get redis data',
      this.constructor.name
    );
    let ret = yield this._cache.getAll();
    if (!!ret) {
      return ret;
    }
  }

  /**
   * delete cache data
   * @param  {Array String} - keys
   * @return {Void}
   */
  * delByKeys(keys) {
    log.debug(
      '[%s.delByKeys] delete redis data by keys',
      this.constructor.name, keys
    );
    yield this._cache.destroyBatch(keys);
  }

  /**
   * delete all cache data
   * @return {Void}
   */
  * clear() {
    log.debug(
      '[%s.clear] delete all redis data',
      this.constructor.name
    );
    yield this._cache.clear();
  }
}

module.exports = RedisService;
