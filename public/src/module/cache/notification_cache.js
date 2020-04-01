/*
 消息列表缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  'json!3rd/fb-modules/config/db.json',
  './cache.js'
], function (_k, _u, _v, _c, _db, _d, _p, _pro) {
  _p._$$CacheNotification = _k._$klass();
  _pro = _p._$$CacheNotification._$extend(_d._$$Cache);
  _p._$cacheKeySystem = 'notification-system';
  _p._$cacheKeyPersonal = 'notification-personal';
  _p._$cacheKeyApi = 'notification-api';
  _p._$cacheKeyAudit = 'notification-audit';
  // 未读消息
  _p._$cacheKeyUnread = 'notification-unread';
  // 资源变更消息
  _p._$cacheKeyResChangeconfirmlog = 'notification-res-changeconfirmlog';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__cacheKey = _p._$cacheKey;
    // 全局事件, 方便模块间通信
    if (!this.constructor.__eventAdded2) {
      this.constructor.__eventAdded2 = true;
      _c._$$CustomEvent._$allocate({
        element: this.constructor,
        event: [
          'onunreadload', 'onunreadupdate'
        ]
      });
    }
    this.__super(options);
  };

  /**
   * 加载列表
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.offset] - 列表缓存列表起始位置
   * @property {Number} [options.limit] - 列表缓存列表当前查询条数
   * @property {Number} [options.total] - 是否有总数信息
   * @success dispatch event: onlistload
   */
  _pro.__doLoadList = function (options) {
    options.data = _u._$merge({
      limit: options.limit,
      total: options.total,
      offset: options.offset
    }, options.data, options.ext);
    var url = this.__getUrl(options);
    this.__sendRequest(url, options);
  };

  /**
   * 请求未读消息数量
   * @success dispatch event: onunreadload
   */
  _pro._$getUnread = function (_options) {
    var key = _p._$cacheKeyUnread;
    var dispatchEvent = function () {
      this._$dispatchEvent('onunreadload', {
        key: key,
        ext: _options.ext
      });
      // 全局事件
      _v._$dispatchEvent(
        this.constructor, 'onunreadload', {
          key: key,
          ext: _options.ext,
          isPolling: _options.isPolling
        }
      );
    }.bind(this);
    var data = this.__getDataInCache(key);
    if (!_options.isPolling) {
      if (data) {
        return dispatchEvent();
      } else {
        return;
      }
    }
    var url = this.__getUrl({
      key: key
    });
    this.__sendRequest(url, {
      onload: function (_data) {
        // 缓存数据
        this.__setDataInCache(key, _data);
        if (data) {
          //判断数据是否更新
          if (data.system < _data.system) {
            _options.ext.systemUpdated = true;
          }
          if (data.personal < _data.personal) {
            _options.ext.personalUpdated = true;
          }
        }
        // 触发队列中同请求的回调逻辑
        return dispatchEvent();
      }._$bind(this)
    });
  };

  _pro._$setAllRead = function (options) {
    var type = _db.MSG_TYP_SYSTEM;
    if (options.type === 'personal') {
      type = _db.MSG_TYP_PRIVATE;
    } else if (options.type === 'api') {
      type = _db.MSG_TYP_API;
    }
    this.__doAction({
      action: 'readall',
      data: {
        type: type
      },
      method: 'PATCH',
      triggerListchange: true,
      onload: function (event) {
        var list = this._$getListInCache(options.key);
        var updatedList = [];
        list.forEach(function (item) {
          if (item && !item.isRead) {
            item.isRead = true;
            updatedList.push(item);
          }
        }, this);

        var key = _p._$cacheKeyUnread;
        var data = this.__getDataInCache(key);
        data[options.type] = 0;
        // 批量更新后需要触发的事件
        _v._$dispatchEvent(
          this.constructor, 'onunreadupdate', {
            data: updatedList,
            action: options.type
          }
        );
      }.bind(this)
    });
  };

  /**
   * 批量设置已读状态
   * @param {Object} options - 参数对象
   * @property {Number} options.ids- 要更新的 id 列表
   * @property {String} options.type- 要更新的消息类型（personal，system）
   * @property {String} options.key- 要更新cache list key
   * @success dispatch event: onunreadupdate, listchange
   */
  _pro._$setRead = function (options) {
    if (options.isAll) {
      delete options.ids;
      delete options.isAll;
      this._$setAllRead(options);
      return;
    }
    this.__doAction({
      action: 'read',
      data: {
        ids: options.ids
      },
      method: 'PATCH',
      triggerListchange: true,
      onload: function (event) {
        var list = this._$getListInCache(options.key);
        var updatedList = event.data;
        var updateNum = 0;
        // 设置已读字段
        updatedList.forEach(function (item) {
          item = list.find(function (itm) {
            return itm && itm.id === item.id; // 翻页list cache，没有拉取的页，都无初始数据
          });
          if (!item.isRead) {
            item.isRead = true;
            updateNum++;
          }
        }, this);
        //更新unread数据，减去已读的数量
        var key = _p._$cacheKeyUnread;
        var data = this.__getDataInCache(key);
        data[options.type] = Math.max(data[options.type] - updateNum, 0);
        // 批量更新后需要触发的事件
        _v._$dispatchEvent(
          this.constructor, 'onunreadupdate', {
            data: updatedList,
            action: options.type
          }
        );
      }.bind(this)
    });
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url = '/api/notifications/';

    switch (options.key) {
      case _p._$cacheKey:
        if (options.action) {
          url += '?' + options.action;
        }
        break;

      case _p._$cacheKeyUnread:
        url += '?unread';
        break;

      default:
        break;
    }
    // 资源变更记录
    if (options.key && options.key.includes(_p._$cacheKeyResChangeconfirmlog)) {
      url += '?res';
    }
    return url;
  };
});
