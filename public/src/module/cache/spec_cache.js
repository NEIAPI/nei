/*
 * 规范缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './pro_cache.js',
  './pg_cache.js'
], function (k, u, v, c, d, proCache, pgCache, p, pro) {
  p._$$CacheSpec = k._$klass();
  pro = p._$$CacheSpec._$extend(d._$$Cache);
  p._$cacheKeyRef = 'spec-ref-';
  p._$cacheKey = 'spec';

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = p._$cacheKey;
    // 全局事件, 方便模块间通信
    if (!this.constructor.__eventAdded2) {
      this.constructor.__eventAdded2 = true;
      c._$$CustomEvent._$allocate({
        element: this.constructor,
        event: [
          'onlanguageupdate'
        ]
      });
    }
  };

  /**
   * 根据 key 值获取相应的列表
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.offset] - 列表缓存列表起始位置
   * @property {Number} [options.limit] - 列表缓存列表当前查询条数
   * @property {Number} [options.total] - 是否有总数信息
   * @success dispatch event: onlistload
   */
  pro.__doLoadList = function (options) {
    // 在缓存命中计算时(module:util/cache/cache._$$CacheAbstract#__hasFragment), 需要考虑 offset 和 limit 的信息
    // 将 limit 设置为较大的值后, 在一定程度上保证了可以全部加载列表数据
    if (options.key === this.__cacheKey) {
      options.limit = 100000;
    }
    this.__super(options);
  };

  /**
   * 收藏和取消收藏
   * @param {Object} [options] - 参数对象
   * @property {Boolean} [options.id] - 规范id
   * @property {Boolean} [options.v] - true 表示收藏, false 表示取消收藏
   * @success dispatch event: onfavorite
   */
  pro._$favorite = function (options) {
    this.__doAction({
      method: 'PUT',
      action: 'favorite',
      id: options.id,
      data: {
        v: options.v
      },
      actionMsg: options.actionMsg,
      onload: function (event) {
        if (event.data) {
          // 更新单条数据
          var oldItem = this._$getItemInCache(options.id);
          u._$merge(oldItem, event.data);
          event.data = oldItem;
        } else { // 删除规范数据
          this.__doRemoveItemFromList(event.key, options.id);
        }
        this._$dispatchEvent('onfavorite', event);
      }.bind(this)
    });
  };
  /**
   * 共享和取消共享
   * @param {Object} [options] - 参数对象
   * @property {Boolean} [options.id] - 规范id
   * @property {Boolean} [options.v] - true 表示共享, false 表示取消共享
   * @success dispatch event: onshare
   */
  pro._$share = function (options) {
    this.__doAction({
      method: 'PUT',
      action: 'share',
      id: options.id,
      data: {
        v: options.v
      },
      actionMsg: options.actionMsg,
      onload: function (event) {
        if (event.data) {
          // 更新单条数据
          var list = this._$getListInCache(event.key);
          var oldItem = list.find(function (item) {
            return item.id === options.id;
          });
          u._$merge(oldItem, event.data);
          event.data = oldItem;
        } else { //删除规范数据
          // this.__doRemoveItemFromList(event.key, options.id);
        }
        this._$dispatchEvent('onshare', event);
      }.bind(this)
    });
  };
  /**
   * 锁定和取消锁定
   * @param {Object} [options] - 参数对象
   * @property {Boolean} [options.id] - 规范id
   * @property {Boolean} [options.v] - true 表示锁定, false 表示取消锁定
   * @success dispatch event: onlock
   */
  pro._$lock = function (options) {
    this.__doAction({
      method: 'PUT',
      action: 'lock',
      id: options.id,
      data: {
        v: options.v
      },
      actionMsg: options.actionMsg,
      onload: function (event) {
        if (event.data) {
          // 更新单条数据
          var list = this._$getListInCache(event.key);
          var oldItem = list.find(function (item) {
            return item.id === options.id;
          });
          u._$merge(oldItem, event.data);
          event.data = oldItem;
        } else { //删除规范数据
          //this.__doRemoveItemFromList(event.key, options.id);
        }
        this._$dispatchEvent('onlock', event);
      }.bind(this)
    });
  };
  /**
   * 复制单个规范
   * @param {Object} [options] - 参数对象
   * @property {Boolean} [options.id] - 规范id
   * @property {String} [options.name] - 规范名称
   * @success dispatch event: onclone
   */
  pro._$clone = function (options) {
    this.__doAction({
      method: 'POST',
      action: 'clone',
      id: options.id,
      data: {
        name: options.name
      },
      onload: function (event) {
        this.__doUnshiftToList(this.__cacheKey, event.data);
        this._$dispatchEvent('onclone', event);
      }.bind(this)
    });
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  pro.__getUrl = function (options) {
    var url;
    if (options.key.indexOf(p._$cacheKey) > -1) {
      url = '/api/specs/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

  /**
   * 从服务器获取引用某个规范的项目列表
   * @param {Object} options - 参数
   * @property {Number} options.id - 规范的id
   * @success dispatch event: onreflistload
   */
  pro._$getRefList = function (options) {
    var refKey = p._$cacheKeyRef + options.id;
    this.__getRefList(
      refKey,
      {
        proc: proCache._$$CachePro._$allocate(),
        progc: pgCache._$$CacheProGroup._$allocate()
      },
      options
    );
  };

  /**
   * 重新生成工具标识key
   * @param {Object} options - 参数对象
   * @success dispatch event: onrefreshkey
   */
  pro._$refreshKey = function (options) {
    this.__doAction({
      key: options.key,
      data: {
        reqHolder: 1
      },
      method: 'PUT',
      action: 'rtk',
      onload: function (evt) {
        this.__setDataInCache(evt.key, evt.data);
        this._$dispatchEvent('onrefreshkey', evt);
      }.bind(this),
      id: options.id
    });
  };

});
