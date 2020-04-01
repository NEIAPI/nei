/*
 * 项目命令行参数缓存
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js'
], function (_k, _u, _v, _c, _d, p, pro) {
  p._$$CacheCliArg = _k._$klass();
  pro = p._$$CacheCliArg._$extend(_d._$$Cache);
  p._$cacheKey = 'cliarg';

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
   * @property {String} options.value - 值
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    if (!_u._$isString(options.data.key) || !options.data.key.trim()) {
      // console.error('请输入有效的键名');
      return;
    }
    if (!_u._$isString(options.data.value) || !options.data.value.trim()) {
      // console.error('请输入有效的值名');
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
      this._splitListToCache(data.params, options);
      onload(data);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 将列表数据按照type值分片, 存到缓存中
   * @param {Object} list - 命令行参数列表
   * @param {Object} options - 发送请求时携带的参数对象
   * @param {Boolean} [isAppend] - 是否追回
   */
  pro._splitListToCache = function (list, options, isAppend) {
    var types = {};
    list.forEach(function (item) {
      if (!types.hasOwnProperty(item.type)) {
        types[item.type] = [];
      }
      types[item.type].push(item);
    });
    Object.keys(types).forEach(function (type) {
      var listKey = options.key + '-' + type;
      var listData = types[type];
      if (isAppend) {
        var existList = this._$getListInCache(listKey);
        listData = listData.concat(existList);
      }
      this._$setListInCache(listKey, listData);
    }.bind(this));
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
      url = '/api/cliargs/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

});
