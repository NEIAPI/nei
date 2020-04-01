/*
 * 客户端缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './interface_cache.js',
  './group_cache.js'
], function (_k, _u, _v, _c, _d, interfaceCache, groupCache, _p, _pro) {
  _p._$$CacheClient = _k._$klass();
  _pro = _p._$$CacheClient._$extend(_d._$$Cache);
  _p._$cacheKey = 'client';
  _p._$cacheKeyRef = 'client-ref-';

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
      url = '/api/clients/' + (options.id || '');
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
  _pro._$getClientSelectSource = function (pid) {
    var clients = this._$getListInCache(this._$getListKey(pid));
    clients = clients.filter(function (client) {
      if (client.projectId === pid) {
        return true;
      }
    }, this);
    return clients.map(function (it) {
      return {
        id: it.id,
        name: it.name,
        title: it.description ? (it.name + '(' + it.description + ')') : it.name
      };
    });
  };

  _pro._$clone = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'clone',
      actionMsg: options.actionMsg,
      onload: function () {
        this._$clearListInCache(options.key);
        this._$dispatchEvent('onclone', {pid: options.data.pid, ext: options.ext});
      }.bind(this)
    });
  };

  /**
   * 批量设置分组
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Array} options.data.ids 批量资源id
   * @property {Number} options.data.groupId 分组id
   */
  _pro._$setGroup = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'bisgroup',
      actionMsg: options.actionMsg,
      onload: function () {
        //修改所选数据模型的分组
        var _groupCache = groupCache._$$CacheGroup._$allocate();
        var groupId = options.data.groupId, group = _groupCache._$getItemInCache(groupId);
        options.data.ids.forEach(function (id) {
          var client = this._$getItemInCache(id);
          client.groupId = groupId;
          client.group = group;
        }.bind(this));
        this._$dispatchEvent('onsetgroup');
        _groupCache._$recycle();
      }.bind(this)
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
        ic: interfaceCache._$$CacheInterface._$allocate()
      },
      options
    );
  };
});
