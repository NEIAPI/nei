class NCache extends require('../../NObject') {
  /**
   * get data from cache
   * @param  {String}   key - key of data
   * @param  {Variable} defaultValue - default value of key
   * @return {Variable} data from cache
   */
  get(key, defaultValue) {
  }

  /**
   * set data to cache
   * @param  {String}   key - key of data
   * @param  {Variable} value - data to cache
   * @param  {Number}   ttl - expire time
   * @return {Void}
   */
  set(key, value, ttl) {
  }

  /**
   * Increments the value by one
   * @param  {String} key - data key
   * @return {Void}
   */
  incr(key) {
  }

  /**
   * remove data with key from cache
   * @param  {String} key - data key
   * @return {Void}
   */
  remove(key) {
  }

  /**
   * alias of remove
   * @param  {String} key - data key
   * @return {Void}
   */
  destroy(key) {
    this.remove(key);
  }

  /**
   * update expire time
   * @param  {String} key - key of data
   * @param  {Number} ttl - expire time
   * @return {Void}
   */
  expire(key, ttl) {
  }
}

module.exports = NCache;
