/**
 * 项目-host服务器缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  './cache.js',
  './pro_cache.js'
], function (_k, _u, _d, _proCache, _p, _pro) {
  _p._$$CacheHost = _k._$klass();
  _pro = _p._$$CacheHost._$extend(_d._$$Cache);
  _p._$cacheKey = 'host';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 根据参数, 获取请求 url
   *
   * @param {Object} options - 参数对象
   * @return {string} request url
   */
  _pro.__getUrl = function (options) {
    var url = '/api/hosts/' + (options.id || '');
    if (options.action) {
      url += ('?' + options.action);
    }
    return url;
  };

  /**
   * 删除数据返回后回调
   *
   * @param {Object} options - 参数对象
   * @success dispatch event: onitemdelete, listchange
   */
  _pro.__doDeleteItem = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      onload(result);
      var key = result[this.__key];
      delete this.__getHash()[key];
      var tmpProjCache = _proCache._$$CachePro._$allocate({});
      var proj = tmpProjCache._$getItemInCache(result.projectId);
      if (proj.hostId === key) {
        proj.hostId = 0;
      }
      tmpProjCache._$recycle();
    }.bind(this);
    this.__super(options);
  };

  /**
   * 批量删除
   *
   * @param {Object} options - 参数对象
   * @property {number} options.ids- 要删除的 id 列表
   * @success dispatch event: onitemsdelete, listchange
   */
  _pro._$deleteItems = function (options) {
    var onload = options.onload;
    options.onload = function (event) {
      onload && onload(event);
      var deletedList = event.data;
      var me = this;
      var hash = me.__getHash();
      var tmpProjCache = _proCache._$$CachePro._$allocate({});
      deletedList.forEach(function (result) {
        var key = result[me.__key];
        delete hash[key];
        var proj = tmpProjCache._$getItemInCache(result.projectId);
        if (proj.hostId === key) {
          proj.hostId = 0;
        }
      });
      tmpProjCache._$recycle();
    }.bind(this);
    this.__super(options);
  };
});
