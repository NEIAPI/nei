NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, u, v, _c, baseCache, db, _p, pro) {
  _p._$$CacheGlobalsearch = _k._$klass();
  _p._$cacheKey = 'globalsearch';
  pro = _p._$$CacheGlobalsearch._$extend(baseCache._$$Cache);

  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  pro.__doLoadList = function (options) {
    var url = this.__getUrl(options);
    return this.__sendRequest(url, options);
  };

  pro.__getUrl = function (options) {
    return '/api/' + options.key.split('-')[0] + '?search';
  };
});
