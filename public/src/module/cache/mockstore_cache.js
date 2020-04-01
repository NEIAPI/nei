/**
 * Mockstore 缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  './cache.js',
  './pro_cache.js'
], function (_k, _u, _d, _proCache, _p, _pro) {
  _p._$$CacheMockstore = _k._$klass();
  _pro = _p._$$CacheMockstore._$extend(_d._$$Cache);
  _p._$cacheKey = 'mockstore';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
    this.__key = 'interfaceId';
  };

  /**
   * 根据参数获取请求url
   */
  _pro.__getUrl = function (options) {
    var url = '/api/mockstore/' + (options.iid || '');
    if (options.action === 'refresh') {
      url += options.id;
    }
    if (options.action) {
      url += ('?' + options.action);
    }
    if (!options.iid && options.id && !options.action) {
      if (options.ext && options.ext.isRpc) {
        url += '?rpcId=' + options.id;
      } else {
        url += '?interfaceId=' + options.id;
      }
    }
    return url;
  };

  _pro.__doSaveItemToCache = function (_item, _lkey) {
    _item = this.__doFormatItem(_item, _lkey) || _item;
    if (!_item) {
      return null;
    }
    var _key = _lkey;
    if (_key != null) {
      this.__getHash()[_key] = _item;
    }
    delete _item.__dirty__;
    return _item;
  };

  _pro.__getItem = function (_options, _item) {
    _options = _options || {};
    this.__doSaveItemToCache(_item, _options.id);
    this.__doCallbackRequest(
      _options.rkey, 'onitemload', _options
    );
  };

  _pro.__doCheckItemValidity = function (_item, _lkey) {
    // 由于接口关联的数据模型有改变，mock数据
    return false;
  };

  _pro._$saveMockData = function (options) {
    this.__doAction({
      method: 'POST',
      data: options.data,
      onload: function (evt) {
        this.__doSaveItemToCache(evt.data, options.data.interfaceId);
        this._$dispatchEvent('onsave', {
          id: options.data.interfaceId,
          data: evt.data
        });
      }.bind(this)
    });
  };

  _pro._$refreshMockData = function (options) {
    this.__doAction({
      id: options.iid,
      method: 'PUT',
      action: 'refresh',
      data: {
        isRpc: options.isRpc
      },
      onload: function (evt) {
        this.__doSaveItemToCache(evt.data, options.iid);
        this._$dispatchEvent('onrefresh', {
          id: options.iid,
          data: evt.data
        });
      }.bind(this)
    });
  };
});
