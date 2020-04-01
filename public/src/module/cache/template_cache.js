/*
 * 页面模板缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './page_cache.js',
  './group_cache.js',
  './datatype_cache.js'
], function (_k, _u, _v, _c, _d, pageCache, groupCache, datatypeCache, _p, _pro) {
  _p._$$CacheTemplate = _k._$klass();
  _pro = _p._$$CacheTemplate._$extend(_d._$$Cache);
  _p._$cacheKey = 'template';
  _p._$cacheRefKey = 'template-ref-';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 新建模板
   * @param {Object} options - 参数对象
   * @property {String} options.projectId - 模板所在的项目id
   * @property {String} options.name - 名称
   * @property {String} options.path - 路径
   * @property {String} [options.tag=''] - 标签
   * @property {String} [options.description=''] - 描述信息
   * @property {Array} [options.parameters=[]] - 参数
   * @property {String} [options.respoId=''] - 负责人id
   * @property {String} [options.groupId=''] - 所在业务分组id
   * @property {Array} [options.imports=[]] - 导入的数据模型
   * @success dispatch event: onitemadd
   */
  _pro.__doAddItem = function (options) {
    options.data.name = options.data.name.trim();
    options.data.path = options.data.path.trim();
    if (!_u._$isString(options.data.name)) {
      // console.error('请输入有效的模板名称');
      return;
    }
    if (!_u._$isString(options.data.path)) {
      // console.error('请输入有效的模板地址');
      return;
    }
    var onload = options.onload;
    options.onload = function (result) {
      var _cache = datatypeCache._$$CacheDatatype._$allocate();
      var key = _cache._$getListKey(result.projectId);
      if (result.hasOwnProperty('hiddenDts')) { //如果存在匿名类型，需要将匿名类型添加到datatype cache中
        _cache.__doUnshiftToList(key, _cache._filterAnon(result.hiddenDts));
      }
      _cache._$recycle();
      onload(result);
    };
    this.__super(options);
  };

  /**
   * 更新模板
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 模板 id
   * 支持更新的字段有:
   * @property {String} [options.name] - 名称
   * @property {String} [options.tag] - 标签
   * @property {String} [options.path] - 路径
   * @property {String} [options.description] - 描述
   * @property {Array} [options.parameters] - 参数列表
   * @property {Array} [options.respoId] - 负责人id
   * @property {Array} [options.groupId] - 业务分组id
   * @property {Array} [options.imports] - 导入的参数列表
   * @success dispatch event: onitemupdate
   */
  _pro.__doUpdateItem = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      // 如果更新分组id，则需要将数据中的group更新
      if (options.data.hasOwnProperty('groupId')) {
        var _groupCache = groupCache._$$CacheGroup._$allocate();
        result.group = _groupCache._$getItemInCache(result.groupId);
        _groupCache._$recycle();
      }
      onload(result);
    }.bind(this);
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
  _pro.__doCheckItemValidity = function (_item, _lkey) {
    // 如果没有 params 属性, 则在调用 $getItem 方法时需要重新获取数据
    return _item.params;
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url;
    if (options.key === _p._$cacheRefKey) {
      url = '/api/templates' + options.id + '?ref';
    } else if (options.key.indexOf(_p._$cacheKey) > -1) {
      url = '/api/templates/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

  /**
   * 从服务器获取引用某个页面模板的页面列表
   * @param {Object} options - 参数
   * @property {Number} options.id - 页面模板的id
   * @success dispatch event: onreflistload
   */
  _pro._$getRefList = function (options) {
    var refKey = _p._$cacheKeyRef + options.id;
    this.__getRefList(
      refKey,
      {
        pc: pageCache._$$CachePage._$allocate()
      },
      options
    );
  };
  /**
   * 批量增删标签
   * @param options 配置参数
   * @property {Array} options.data.ids 批量资源id
   * @property {Array} options.data.tags 标签
   */
  _pro._$tag = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'tag',
      actionMsg: options.actionMsg,
      onload: function (result) {
        options.data.ids.forEach(function (id) {
          var res = this._$getItemInCache(id);
          var target = result.data.filter(function (res) {
            return res.id === id;
          })[0];
          res.tag = target.tag;
          res.tagPinyin = target.tagPinyin;
        }, this);
        this._$dispatchEvent('ontag');
      }.bind(this)
    });
  };
  /**
   * 复制模板
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.copys 复制的模板数据
   * @property {String} options.data.tags 标签
   */
  _pro._$clone = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'clone',
      actionMsg: options.actionMsg,
      onload: function () {
        //清空复制到的项目的template cache
        this._$clearListInCache(options.key);
        //复制模板的时候，有可能会产生新的匿名类型，这时候清空缓存，不维护数据模型缓存，后面会重新加载数据模型列表
        var dtCache = datatypeCache._$$CacheDatatype._$allocate();
        dtCache._$clearListInCache(dtCache._$getListKey(options.data.pid));
        dtCache._$recycle();
        this._$dispatchEvent('onclone', {pid: options.data.pid});
      }.bind(this)
    });
  };
  /**
   * 移动模板
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.moves 移动的模板数据
   * @property {String} options.data.tags 标签
   */
  _pro._$move = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'move',
      actionMsg: options.actionMsg,
      onload: function () {
        //清空复制到的项目的datatype cache
        this.__doRemoveItemFromList(this._$getListKey(options.ext.originPid), options.data.moves);
        this._$clearListInCache(options.key);
        this._$dispatchEvent('onmove', {pid: options.data.pid});
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
          var template = this._$getItemInCache(id);
          template.groupId = groupId;
          template.group = group;
        }.bind(this));
        this._$dispatchEvent('onsetgroup');
        _groupCache._$recycle();
      }.bind(this)
    });
  };

  /**
   * 批量新建页面模版
   * @param {Object} 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.projectId 项目id
   * @property {Number} options.data.groupId 分组id
   * @property {Array} options.data.items 导入的数据类型数据
   * @success dispatch event: onbatch
   */
  _pro._$batch = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'bat',
      actionMsg: options.actionMsg,
      onload: function (evt) {
        var key = options.key;
        evt.data.forEach(function (item) {
          var obj = this._$getItemInCache(item.id);
          if (obj) {
            this.__doRemoveItemFromList(key, item.id);
          }
        }.bind(this));
        this.__doUnshiftToList(key, evt.data);
        this._$dispatchEvent('onbatch', evt);
      }.bind(this)
    });
  };
});
