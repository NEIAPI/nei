/**
 * 接口测试-缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  './cache.js',
  'util/cache/share',
  './testcollection_cache.js',
  './interface_cache.js'
], function (_k, _u, _d, _sc, _collectCache, _infCache, _p, _pro) {
  _p._$resourceInf = 'interface';
  _p._$resourceRecord = 'record';
  _p._$resourceCollect = 'suite';
  _p._$resourceDependency = 'dependency';

  _p._$getResourceType = function (path) {
    if (path.indexOf('group/suite') > -1) {
      return _p._$resourceCollect;
    } else if (path.indexOf('group/dependency') > -1) {
      return _p._$resourceDependency;
    } else if (path.indexOf('record') > -1) {
      return _p._$resourceRecord;
    } else if (path.indexOf('group') > -1) {
      return _p._$resourceInf;
    }
  };

  _p._$removeResourceData = function (id, type, keys) {
    var cacheObj = _sc.localCache._$get(_p._$cacheKey);
    if (cacheObj) {
      if (id) {
        var resKey = type + '-' + id;
        var resData = cacheObj[resKey];
        if (resData) {
          if (!keys) {
            delete cacheObj[resKey];
          } else {
            if (!Array.isArray(keys)) {
              keys = [keys];
            }
            keys.forEach(function (key) {
              delete resData[key];
            });
          }
        }
      } else {
        _u._$loop(
          cacheObj,
          function (_item, _key) {
            var ids = _key.split('-');
            this._$removeResourceData(ids[1], ids[0], keys);
          },
          this
        );
      }
    }
  };

  _p._$saveResourceData = function (id, type, data) {
    var cacheObj = _sc.localCache._$get(_p._$cacheKey);
    if (!cacheObj) {
      cacheObj = {};
      _sc.localCache._$set(_p._$cacheKey, cacheObj);
    }
    var resKey = type + '-' + id;
    var resData = cacheObj[resKey];
    if (!resData) {
      resData = {};
      cacheObj[resKey] = resData;
    }

    _u._$merge(resData, data);
  };

  _p._$getResourceData = function (id, type, keys) {
    var res;
    var cacheObj = _sc.localCache._$get(_p._$cacheKey);
    if (cacheObj) {
      var resData = cacheObj[type + '-' + id];
      if (resData) {
        if (!keys) {
          res = resData;
        } else {
          if (!Array.isArray(keys)) {
            keys = [keys];
          }
          res = {};
          keys.forEach(function (key) {
            res[key] = resData[key];
          });
        }
      }
    }
    return res;
  };

  /**
   * 获取用例默认数据是否编辑过
   *
   * @param  {?number} id 接口id
   * @return {boolean}    编辑过返回true
   */
  _p._$getModifiedStatus = function (id) {
    var isModified = false;
    if (id) {
      var resData = this._$getResourceData(id, _p._$resourceInf);
      if (resData && resData.stash && resData.stash !== resData.origin) {
        isModified = true;
      }
    } else {
      var cacheObj = _sc.localCache._$get(_p._$cacheKey);
      if (cacheObj) {
        _u._$loop(
          cacheObj,
          function (_item) {
            if (_item.stash && _item.stash !== _item.origin) {
              isModified = true;
              return true;
            }
          }
        );
      }
    }
    return isModified;
  };

  _p._$getResource = function (type, id) {
    var cacheClass;
    if (type === _p._$resourceCollect || type === _p._$resourceDependency) {
      cacheClass = _collectCache._$$CacheTestcollection;
    } else if (type === _p._$resourceInf) {
      cacheClass = _infCache._$$CacheInterface;
    }
    var cache = cacheClass._$allocate({});
    var data = cache._$getItemInCache(id);
    cache._$recycle();
    return data;
  };
});
