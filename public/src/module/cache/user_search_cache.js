/*
 * 搜索用户列表缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js'
], function (_k, _u, _v, _c, _d, _p, _pro) {
  _p._$$CacheSearchUser = _k._$klass();
  _pro = _p._$$CacheSearchUser._$extend(_d._$$Cache);

  _pro.__doLoadList = function (options) {
    options.onload = function (data) {
      this.__setDataInCache(options.data.v, data);
      var event = {
        key: ('' + options.key) || '',
        ext: options.ext || null,
        data: options.data || null
      };
      this._$dispatchEvent('onlistload', event);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 根据关键词获取用户列表
   * @param {String} key - 搜索关键词
   * @return {Array|Object} 用户列表
   */
  _pro._$getDataInCache = function (key) {
    return this.__getDataInCache(key) || null;
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function () {
    return '/api/users/';
  };

});
