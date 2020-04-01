/*
 * 规范变量映射缓存
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js'
], function (k, u, v, c, d, p, pro) {
  p._$$CacheVarMap = k._$klass();
  pro = p._$$CacheVarMap._$extend(d._$$Cache);
  p._$cacheKey = 'varmap';

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__cacheKey = p._$cacheKey;
    this.__super(options);
  };

  /**
   * 新建变量映射
   * @param {Object} options - 参数对象
   * @property {String} options.parentId - 映射关系归属标识
   * @property {String} options.parentType - 映射关系归属类型
   * @property {String} options.orgName - 原始数据模型名称
   * @property {String} options.varName - 映射代码变量名称
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    if (!u._$isString(options.data.orgName) || !options.data.orgName.trim()) {
      // console.error('请输入有效的原始数据模型名称');
      return;
    }
    if (!u._$isString(options.data.varName) || !options.data.varName.trim()) {
      // console.error('请输入有效的映射代码变量名称');
      return;
    }
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
   * @param {Object} list - 映射规则列表
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
   * 更新模板
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 模板 id
   * 支持更新的字段有:
   * @property {String} [options.orgName] - 原始数据模型名称
   * @property {String} [options.varName] - 映射代码变量名称
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
      url = '/api/varmaps/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };
});
