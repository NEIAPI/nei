const redis = require('redis');
const wrap = require('thunkify-wrap');
// redis config
const CONFIG = process.appConfig.redis || {};
// redis yield support
const CO_REDIS = ['set', 'get', 'incr', 'del', 'expire', 'scan', 'flushdb'];
// default config options
const DEFAULT = {};

let client;

class Redis extends require('./NCache') {
  constructor() {
    super();
  }

  get _client() {
    if (client) {
      return client;
    }
    let ret = redis.createClient(
      Object.assign(
        {}, DEFAULT, CONFIG
      )
    );
    client = wrap(ret, CO_REDIS);
    return client;
  }

  /**
   * wrap key in redis
   * @private
   * @param  {String} key - source key
   * @return {String} target key
   */
  _wrapKey(key) {
    let prefix = CONFIG.key || 'online_';
    if (key.indexOf(prefix) === 0) {
      return key;
    }
    return prefix + key;
  }

  /**
   * get data from cache
   * @param  {String}   dataKey - key of data
   * @param  {Variable} [defaultValue] - default value of key
   * @return {Variable} data from cache
   */
  * get(dataKey, defaultValue) {
    let key = this._wrapKey(dataKey);
    super.get(key, defaultValue);
    let ret = yield this._client.get(key);
    if (ret) {
      return JSON.parse(ret);
    }
    return defaultValue;
  }

  /**
   * get all keys in cache
   * @return {Array String} list of cache keys
   */
  * getKeys(ret, cursor) {
    if (cursor === undefined) {
      cursor = '0';
    }
    // [nextCursor, array of keys in current iteration]
    let result = yield this._client.scan(cursor);
    let nextCursor = result[0];
    [].push.apply(ret, result[1]);
    if (nextCursor === '0') {
      return;
    } else {
      return yield this.getKeys(ret, nextCursor);
    }
  }

  /**
   * get all data
   * @return {Array} list of data in cache
   */
  * getAll() {
    let keys = [];
    yield this.getKeys(keys);
    let ret = [];
    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i];
      let data = yield this._client.get(key);
      if (data) {
        ret.push({
          key,
          value: JSON.parse(data)
        });
      }
    }
    return ret;
  }

  /**
   * set data to cache
   * @param  {String}   dataKey - key of data
   * @param  {Object} value - data to cache
   * @param  {Number}   [ttl] - expire time
   * @return {Void}
   */
  * set(dataKey, value, ttl) {
    let key = this._wrapKey(dataKey);
    super.set(key, value, ttl);
    value = JSON.stringify(value);
    yield this._client.set(
      key, value, 'EX', ttl || CONFIG.expire
    );
  }

  /**
   * set batch data to cache
   * @param  {Array}    keys - key list of data
   * @param  {Variable} value - data to cache
   * @param  {Number}   ttl - expire time
   * @return {Void}
   */
  * setBatch(keys, value, ttl) {
    for (let i = 0, it; it = keys[i]; i++) {
      yield this.set(it, value, ttl);
    }
  }

  /**
   * Increments the value by one
   * @param  {String}   dataKey - key of data
   * @return {Void}
   */
  * incr(dataKey) {
    let key = this._wrapKey(dataKey);
    super.incr(key);
    yield this._client.incr(
      key
    );
  }

  /**
   * remove data with key from cache
   * @param  {String} dataKey - data key
   * @return {Void}
   */
  * remove(dataKey) {
    let key = this._wrapKey(dataKey);
    super.remove(key);
    yield this._client.del(key);
  }

  /**
   * alias of remove
   * @param  {String} key - data key
   * @return {Void}
   */
  * destroy(key) {
    yield this.remove(key);
  }

  /**
   * destroy cache data in batch
   * @param  {Array}    keys - key list of data
   * @return {Void}
   */
  * destroyBatch(keys) {
    for (let i = 0, len = keys.length; i < len; i++) {
      yield this.destroy(keys[i]);
    }
  }

  /**
   * update expire time
   * @param  {String} dataKey - key of data
   * @param  {Number} ttl - expire time
   * @return {Void}
   */
  * expire(dataKey, ttl) {
    // check arguments
    let key = this._wrapKey(dataKey);
    if (ttl == null) {
      ttl = CONFIG.expire;
    }
    if (ttl != null) {
      super.expire(key, ttl);
      yield this._client.expire(key, ttl);
    }
  }

  /**
   * clear all cache data
   * @return {Void}
   */
  * clear() {
    let keys = [];
    yield this.getKeys(keys);
    yield this.destroyBatch(keys);
  }
}

module.exports = Redis;
