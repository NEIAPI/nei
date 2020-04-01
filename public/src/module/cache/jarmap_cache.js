/*
 * 暴露给模板实例的变量映射缓存
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js'
], function (_k, _u, _v, _c, _d, p, pro) {
  p._$$CacheJarMap = _k._$klass();
  pro = p._$$CacheJarMap._$extend(_d._$$Cache);
  p._$cacheKey = 'jarmap';

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__cacheKey = p._$cacheKey;
    this.__super(options);
  };

  /**
   * 新建
   * @param {Object} options - 参数对象
   * @property {String} options.projectId - 参数所在项目标识
   * @property {String} options.type - 归属类型
   * @property {String} options.key - 键
   * @property {String} options.klassName - 值
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    if (!_u._$isString(options.data.key) || !options.data.key.trim()) {
      // console.error('请输入有效的实例名');
      return;
    }
    if (!_u._$isString(options.data.value) || !options.data.value.trim()) {
      // console.error('请输入有效的类名');
      return;
    }
    var onload = options.onload;
    options.onload = function (item) {
      this._splitListToCache([item], options, true);
      onload(item);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 加载列表
   * @param {Object} [options] - 参数对象
   * @success dispatch event: onlistload
   */
  pro.__doLoadList = function (options) {
    var onload = options.onload;
    options.onload = function (data) {
      var listKey = options.key;
      this._$setListInCache(listKey, data.params);
      onload(data);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * @property {Number} options.id - id
   * 支持更新的字段有:
   * @property {String} [options.key] - 键
   * @property {String} [options.value] - 值
   * @success dispatch event: onitemupdate
   */
  pro.__doUpdateItem = function (options) {
    this.__super(options);
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  pro.__getUrl = function (options) {
    var url;
    if (options.key.indexOf(p._$cacheKey) > -1) {
      url = '/api/klassmaps/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

});

