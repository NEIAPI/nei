/*
 * 资源引用列表的缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js'
], function (_k, _u, _v, _c, _d, _p, _pro) {
  _p._$$CacheRef = _k._$klass();
  _pro = _p._$$CacheRef._$extend(_d._$$Cache);
  _p._$cacheKey = 'ref';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
    // 指定作为唯一标识的字段名
    this.__key = '__resKey';
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    return '/api/' + options.ext.type + '/' + options.ext.id + '/?ref';
  };
  /**
   * 格式化数据项，子类实现具体业务逻辑
   * @method module:util/cache/list._$$CacheList#__doFormatItem
   * @param  {Object} item - 列表项
   * @param  {String} lkey - 列表标识
   * @return {Object}        格式化后的列表项
   */
  _pro.__doFormatItem = function (item, lkey) {
    // 因为资源分属不同的表, 所以它们的 id 有可能是相同的, 需要给他们设置唯一的标识
    // 这里可以通过 id 和 type(资源所属的种类) 确定一条资源
    item[this.__key] = item.id + '-' + item.type;
    // 可以返回 item, 也可以不返回, 不返回的时候 /util/cache/list.js#__doSaveItemToCache 默认会用 item 值
    // return item;
  };

});
