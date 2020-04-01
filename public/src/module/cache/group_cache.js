/*
 * 业务分组缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './datatype_cache.js',
  './interface_cache.js',
  './page_cache.js',
  './template_cache.js',
  './constraint_cache.js',
  './rpc_cache.js',
  './client_cache.js'
], function (_k, _u, _v, _c, _d, datatypeCache, interfaceCache, pageCache, templateCache, constraintCache, rpcCache, clientCache, _p, _pro) {
  _p._$$CacheGroup = _k._$klass();
  _pro = _p._$$CacheGroup._$extend(_d._$$Cache);
  _p._$cacheKey = 'group';
  _p._$cacheKeyRef = 'group-ref-';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 新建
   * @param {Object} options - 参数对象
   * @property {Number} options.projectId - 所在项目的id
   * @property {String} options.name - 名称
   * @property {String} [options.description=''] - 描述信息
   * @property {String} [options.respoId=''] - 负责人id
   * @success dispatch event: onitemadd
   */
  _pro.__doAddItem = function (options) {
    options.data.name = options.data.name.trim();
    if (!_u._$isString(options.data.name)) {
      return;
    }
    this.__super(options);
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 资源 id
   * 支持更新的字段有:
   * @property {String} [options.name] - 名称
   * @property {String} [options.description] - 描述
   * @property {Array} [options.respoId] - 负责人id
   * @success dispatch event: onitemupdate
   */
  _pro.__doUpdateItem = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      // 更新所有引用这个group的数据
      [
        interfaceCache._$$CacheInterface,
        datatypeCache._$$CacheDatatype,
        pageCache._$$CachePage,
        templateCache._$$CacheTemplate,
        constraintCache._$$CacheConstraint,
        rpcCache._$$CacheRpc,
        clientCache._$$CacheClient
      ].forEach(function (constructor) {
        var cache = constructor._$allocate();
        var hash = cache.__getHash();
        Object.keys(hash).forEach(function (key) {
          var item = hash[key];
          if (item.groupId === result.id) {
            _u._$merge(item.group, result);
          }
        }, this);
        cache._$recycle();
      }, this);
      onload(result);
    };
    this.__super(options);
  };

  /**
   * 验证项缓存中的项是否有效，子类可重写
   *
   * @protected
   * @method module:util/cache/list._$$CacheList#__doCheckItemValidity
   * @param  {Object}  _item - 数据项
   * @param  {String}  _lkey - 列表标识
   * @return {Boolean}        是否有效
   */
  _pro.__doCheckItemValidity = function (_item) {
    // 如果没有 refs 属性, 则在调用 $getItem 方法时需要重新获取数据
    return _item.refs;
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url;
    if (options.key.indexOf(_p._$cacheKey) > -1) {
      url = '/api/groups/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

  /**
   * 获取某个项目中的所有业务分组, 运用于 select2 组件的 source 源数据
   * @param {Number} pid - 项目id
   * @return {Array} - 业务分组列表
   */
  _pro._$getGroupSelectSource = function (pid) {
    var groups = this._$getListInCache(this._$getListKey(pid));
    groups = groups.filter(function (group) {
      if (group.projectId === pid) {
        return true;
      }
    }, this);
    return groups.map(function (g) {
      return {
        id: g.id,
        name: g.name,
        title: g.description ? (g.name + '(' + g.description + ')') : g.name
      };
    });
  };

  /**
   * 从服务器获取属于某个业务分组的资源列表
   * @param {Object} options - 参数
   * @property {Number} options.id - 数据模型的id
   * @success dispatch event: onreflistload
   */
  _pro._$getRefList = function (options) {
    var refKey = _p._$cacheKeyRef + options.id;
    this.__getRefList(
      refKey,
      {
        dc: datatypeCache._$$CacheDatatype._$allocate(),
        ic: interfaceCache._$$CacheInterface._$allocate(),
        pc: pageCache._$$CachePage._$allocate(),
        tc: templateCache._$$CacheTemplate._$allocate(),
        cc: constraintCache._$$CacheConstraint._$allocate(),
      },
      options
    );
  };
});
