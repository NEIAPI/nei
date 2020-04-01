/*
 * 用户缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js'
], function (_k, _u, _v, _c, _d, _p, _pro) {
  _p._$$CachePAT = _k._$klass();
  _pro = _p._$$CachePAT._$extend(_d._$$Cache);
  _p._$cacheKey = 'pat';

  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  _pro.__doLoadList = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      onload(result);
    }.bind(this);
    this.__super(options);
  };

  _pro.__getUrl = function (options) {
    var url;
    switch (options.key) {
      case _p._$cacheKey:
        url = '/api/pats/';
        if (options.action) {
          url += '?' + options.action;
        }
        break;

      default:
        break;
    }
    return url;
  };

});
