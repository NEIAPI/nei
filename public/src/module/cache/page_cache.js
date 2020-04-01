/*
 * 页面缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './interface_cache.js',
  './template_cache.js',
  './group_cache.js',
  './datatype_cache.js'
], function (_k, _u, _v, _c, _d, interCache, templateCache, groupCache, datatypeCache, _p, _pro) {
  _p._$$CachePage = _k._$klass();
  _pro = _p._$$CachePage._$extend(_d._$$Cache);
  _p._$cacheKey = 'page';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 新建页面
   * @param {Object} options - 参数对象
   * @property {String} options.projectId - 所在的项目id
   * @property {String} options.name - 名称
   * @property {String} options.path - 路径
   * @property {String} [options.tag=''] - 标签
   * @property {String} [options.description=''] - 描述信息
   * @property {Array} [options.parameters=[]] - 参数
   * @property {Array} options.templateIds - 引用的模板id列表
   * @property {Array} [options.interfaceIds=[]] - 引用的HTTP 接口id列表
   * @property {String} [options.respoId=''] - 负责人id
   * @property {String} [options.groupId=''] - 所在业务分组id
   * @property {Array} [options.imports=[]] - 导入的数据模型
   * @success dispatch event: onitemadd
   */
  _pro.__doAddItem = function (options) {
    options.data.name = options.data.name.trim();
    options.data.path = options.data.path.trim();
    if (!_u._$isString(options.data.name)) {
      // console.error('请输入有效的页面名称');
      return;
    }
    if (!_u._$isString(options.data.path)) {
      // console.error('请输入有效的页面地址');
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
   * 更新页面
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 资源 id
   * 支持更新的字段有:
   * @property {String} [options.name] - 名称
   * @property {String} [options.tag] - 标签
   * @property {String} [options.path] - 路径
   * @property {String} [options.description] - 描述
   * @property {Array} [options.interfaceIds] - 引用的HTTP 接口id列表
   * @property {Array} [options.templateIds] - 引用的模板id列表
   * @property {Array} [options.parameterIds] - 参数列表
   * @property {Array} [options.respoId] - 负责人id
   * @property {Array} [options.groupId] - 业务分组id
   * @property {Array} [options.imports] - 导入的参数列表
   * @success dispatch event: onitemupdate
   */
  _pro.__doUpdateItem = function (options) {
    var onload = options.onload;
    options.onload = function (page) {
      this._updateListCache(page);
      onload(page);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 加载某一项
   * @param {Object} [options] - 参数对象
   * @property {Number} options.id - 要加载资源的id
   * @property {String} options.key - 这个 key 主要用于获取相应的 url
   * @success dispatch event: onloaditem
   */
  _pro.__doLoadItem = function (options) {
    var onload = options.onload;
    options.onload = function (page) {
      this._updateListCache(page);
      onload(page);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 将页面中的模板列表或者接口列表存到相应的缓存中去, 分加载和更新两种情况:
   * 1. 加载页面详情时, 直接将数据存到相应的缓存中
   * 2. 并不是所有的更新操作后端都会返回 interfaces 和 templates 信息, 这里只在后端返回 interfaces 或者 templates 信息的时候更新相应的缓存
   * @param {Object} page - 页面对象
   */
  _pro._updateListCache = function (page) {
    if (page.hasOwnProperty('interfaces')) {
      var _interCache = interCache._$$CacheInterface._$allocate();
      _interCache._$setListInCache(_interCache._$getListKey(page.projectId, page.id), page.interfaces);
      _interCache._$recycle();
    }
    if (page.hasOwnProperty('templates')) {
      var _tplCache = templateCache._$$CacheTemplate._$allocate();
      _tplCache._$setListInCache(_tplCache._$getListKey(page.projectId, page.id), page.templates);
      _tplCache._$recycle();
    }
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url = '/api/pages/' + (options.id || '');
    if (options.action) {
      url += '?' + options.action;
    }
    return url;
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
   * 复制页面
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.copys 复制的页面数据
   * @property {String} options.data.tags 标签
   */
  _pro._$clone = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'clone',
      actionMsg: options.actionMsg,
      onload: function () {
        //清空复制到的项目的页面 cache
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
   * 移动页面
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.moves 移动的页面数据
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
          var page = this._$getItemInCache(id);
          page.groupId = groupId;
          page.group = group;
        }.bind(this));
        this._$dispatchEvent('onsetgroup');
        _groupCache._$recycle();
      }.bind(this)
    });
  };
});
