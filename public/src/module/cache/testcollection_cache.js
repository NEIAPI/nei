/**
 * 项目组-测试集缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  './cache.js',
  './testcase_cache.js',
  './interface_cache.js',
], function (_k, _u, _d, _caseCache, _infCache, _p, _pro) {
  _p._$$CacheTestcollection = _k._$klass();
  _pro = _p._$$CacheTestcollection._$extend(_d._$$Cache);
  _p._$cacheKey = 'testcollection';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url = '/api/testcollections/' + (options.id || '');
    if (options.action) {
      url += ('?' + options.action);
    }
    return url;
  };

  _pro.__doLoadList = function (options) {
    var onload = options.onload;
    options.onload = function (list) {
      var cache = _infCache._$$CacheInterface._$allocate();
      var listKey = cache._$getListKey(options.data.pid);
      (list || []).forEach(function (collect) {
        cache.__doSaveItemToCache(collect.interfaces, listKey);
      });
      cache._$recycle();
      if (onload) {
        onload(list);
      }
    }.bind(this);
    this.__super(options);
  };

  _pro._$getInterfaces = function (id) {
    var collect = this._$getItemInCache(id);
    var data = collect.data;
    var res = [];
    if (data) {
      var cache = _infCache._$$CacheInterface._$allocate();
      if (collect.type === 0) {
        var infIdOrderList = data.split(',');
        var infIds = [];
        infIdOrderList.forEach(function (infId) {
          var inf = cache._$getItemInCache(infId);
          if (inf) {
            res.push(inf);
            infIds.push(infId);
          }
        });
        collect.data = infIds.join(',');
      } else {
        var layers;
        var infIds = [];
        try {
          layers = JSON.parse(collect.data);
        } catch (e) {
          cache._$recycle();
          return res;
        }
        layers.forEach(function (layer) {
          if (layer.type === 'INTERFACE') {
            layer.data.forEach(function (interface) {
              infIds.push(interface);
            });
          }
        });
        infIds.forEach(function (id) {
          var inf = cache._$getItemInCache(id);
          if (inf) {
            res.push(inf);
          }
        });
      }
      cache._$recycle();
    }
    return res;
  };

  _pro._$addInfs = function (options) {
    this.__doAction({
      headers: options.headers || {},
      action: 'interface',
      data: options.data,
      id: options.id,
      key: options.key,
      method: 'POST',
      actionMsg: '增加成功',
      onload: function (event) {
        _u._$merge(this.__getHash()[options.id], event.data);

        var cache = _caseCache._$$CacheTestCase._$allocate();
        var collAllKey = cache._$getListKeyByCollection(options.id);
        if (cache._$isLoaded(collAllKey)) {
          cache._$clearListInCache(collAllKey);
        }
        options.data.interfaceIds.split(',').forEach(function (infId) {
          cache._$clearListInCache(cache._$getListKeyByCollection(options.id, infId));
        });
        cache._$recycle();

        if (options.onload) {
          options.onload(event);
        }
      }.bind(this)
    });
  };
  _pro._$removeInfs = function (options) {
    this.__doAction({
      headers: options.headers || {},
      action: 'interface',
      data: options.data,
      id: options.id,
      key: options.key,
      method: 'DELETE',
      actionMsg: '移除成功',
      onload: function (event) {
        _u._$merge(this.__getHash()[options.id], event.data);

        var cache = _caseCache._$$CacheTestCase._$allocate();
        var collAllKey = cache._$getListKeyByCollection(options.id);
        if (cache._$isLoaded(collAllKey)) {
          var allCaseList = cache._$getListInCache(collAllKey);
          var infs = options.data.interfaceIds.split(',').map(Number);
          var ids = [];
          allCaseList.forEach(function (caseItem) {
            if (infs.indexOf(caseItem.interfaceId) > -1) {
              ids.push(caseItem.id);
            }
          });
          cache.__doRemoveItemFromList(collAllKey, ids);

          infs.forEach(function (infId) {
            cache._$clearListInCache(cache._$getListKeyByCollection(options.id, infId));
          });
        }
        cache._$recycle();
        if (options.onload) {
          options.onload(event);
        }
      }.bind(this)
    });
  };
  _pro._$removeCases = function (options) {
    this.__doAction({
      headers: options.headers || {},
      action: 'testcase',
      data: options.data,
      id: options.id,
      key: options.key,
      method: 'DELETE',
      actionMsg: '移除成功',
      onload: function (event) {
        var cache = _caseCache._$$CacheTestCase._$allocate();
        cache.__doRemoveItemFromList(cache._$getListKeyByCollection(options.id, options.data.interfaceId), event.data);
        var collAllKey = cache._$getListKeyByCollection(options.id);
        if (cache._$isLoaded(collAllKey)) {
          cache.__doRemoveItemFromList(collAllKey, event.data);
        }
        cache._$recycle();
        if (options.onload) {
          options.onload(event);
        }
      }.bind(this)
    });
  };
  _pro._$addCases = function (options) {
    this.__doAction({
      headers: options.headers || {},
      action: 'testcase',
      data: options.data,
      id: options.id,
      key: options.key,
      method: 'POST',
      actionMsg: '增加成功',
      onload: function (event) {
        var cache = _caseCache._$$CacheTestCase._$allocate();
        var addedList = event.data;
        var caseList = cache._$getListInCache(cache._$getListKeyByCollection(options.id, options.data.interfaceId));
        var allCaseList = cache._$getListInCache(cache._$getListKeyByCollection(options.id));
        addedList.forEach(function (caseItem) {
          var originCase = cache._$getItemInCache(caseItem.id);
          _u._$merge(originCase, caseItem);
          caseList.push(originCase);
          if (allCaseList.loaded) {
            allCaseList.push(originCase);
          }
        });
        cache._$recycle();
        if (options.onload) {
          options.onload(event);
        }
      }.bind(this)
    });
  };
});
