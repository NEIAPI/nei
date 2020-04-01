/*
 * 最近查看的接口列表缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  './cache.js',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _u, _d, db, _p, _pro) {
  _p._$$CacheViewHistory = _k._$klass();
  _p._$cacheKey = 'view-history';
  _pro = _p._$$CacheViewHistory._$extend(_d._$$Cache);

  /**
   * 加载列表
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.offset] - 列表缓存列表起始位置
   * @property {Number} [options.limit] - 列表缓存列表当前查询条数
   * @property {Number} [options.total] - 是否有总数信息
   * @success dispatch event: onlistload
   */
  _pro.__doLoadList = function (options) {
    var url = this.__getUrl(options);
    this.__sendRequest(url, options);
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    return '/api/resview/';
  };
});
