/*
 * 参数缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './page_cache.js',
  './template_cache.js',
  './datatype_cache.js',
  './interface_cache.js',
  './rpc_cache.js'
], function (_k, u, v, _c, _d, pageCache, templateCache, dtCache, interCache, rpcCache, _p, pro) {
  _p._$$CacheParameter = _k._$klass();
  pro = _p._$$CacheParameter._$extend(_d._$$Cache);
  _p._$cacheKey = 'parameter';
  _p._$cacheKeyAnonymousModify = 'anonymous-datatype-modify';//匿名类型修改

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * 必须要传的参数:
   * @property {Number} options.id - 参数 id
   * @property {Number} options.parentId - 参数归属资源标识
   * @property {Number} options.parentType - 参数归属资源类型
   * 支持更新的字段有:
   * @property {String} [options.name] - 名称
   * @property {String} [options.type] - 数据模型标识
   * @property {String} [options.isArray] - 是否数组类型
   * @property {String} [options.description] - 参数描述
   * @property {Array} [options.genExpression] - 生成规则表达式
   * @success dispatch event: onitemupdate
   */
  pro.__doUpdateItem = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      // 如果更新的是数据模型, 则更新完成后, 还需要更新引用了它的数据模型、HTTP 接口、页面模板
      // 后端返回的是所有需要更新的数据模型列表, 包括当前被修改的数据模型
      this._updateResources(result.datatypes, options);

      var params = this._getParams({
        parentType: options.data.parentType,
        parentId: options.data.parentId
      });
      if (params) {
        var param = params.find(function (param) {
          return param.id === result.params[0].id;
        });
        // 更新字段的值, 在更新 typeName 时, 后端并没有返回 typeName 信息, 所以加上 options.data 的数据
        u._$merge(param, options.data, result.params[0]);
      }
      onload(result);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 批量添加
   * @param {Object} options - 参数对象
   * @property {Number} options.items- 要添加的对象列表
   * @success dispatch event: onitemsadd
   */
  pro._$addItems = function (options) {
    options.onload = function (evt) {
      // 如果添加的是数据模型的参数, 则添加成功后, 还需要更新引用了它的数据模型、HTTP 接口、页面模板
      // 后端返回的是所有需要更新的数据模型列表, 包括当前被修改的数据模型
      this._updateResources(evt.data.datatypes, options);

      // 更新资源的参数，但数据模型不用更新
      evt.data.params.forEach(function (item) {
        var params = this._getParams(item);
        if (params) {
          params.push(item);
        }
      }, this);

    }.bind(this);
    this.__super(options);
  };

  /**
   * 批量删除
   * @param {Object} options - 参数对象
   * @property {Number} options.ids- 要删除的 id 列表
   * @success dispatch event: onitemsdelete, listchange
   */
  pro._$deleteItems = function (options) {
    options.onload = function (evt) {
      // 如果删除的是数据模型的参数, 则删除成功后, 还需要更新引用了它的数据模型、HTTP 接口、页面模板
      // 后端返回的是所有需要更新的数据模型列表, 包括当前被修改的数据模型
      this._updateResources(evt.data.datatypes, options);

      var params = this._getParams({
        parentType: options.data.parentType,
        parentId: options.data.parentId
      });
      if (!params) {
        return;
      }
      u._$reverseEach(params, function (item1, index) {
        u._$forEach(evt.data.params, function (item2) {
          if (item1.id === item2) {
            params.splice(index, 1);
          }
        });
      });
      u._$reverseEach(params, function (item1, index) {
        u._$forEach(evt.data.imports, function (item2) {
          if (item1.datatypeId === item2) {
            params.splice(index, 1);
          }
        });
      });
    }.bind(this);
    this.__super(options);
  };

  /**
   * 批量更新 position
   * @param {Object} options - 参数对象
   * @property {Number} options.parentId- 所属资源id
   * @property {Number} options.parentType- 所属资源类型
   * @property {Array|Object} options.params- 所属资源类型
   * @property {Number} options.params: id- 参数id
   * @property {Number} options.params: datatypeId- 导入的数据模型id
   * @property {Number} options.params: position- 排序位置
   * @success dispatch event: onupdatepositions
   */
  pro._$updatePositions = function (options) {
    this.__doAction({
      data: {
        params: options.params,
        parentId: options.parentId,
        parentType: options.parentType,
      },
      method: 'PATCH',
      action: 'position',
      onload: function (evt) {
        this._updateParamsPosition(evt.data);
        this._$dispatchEvent('onupdatepositions', evt);
      }._$bind(this)
    });
  };
  /**
   * 根据 parentType 返回相应的缓存实例
   * @param {Number} parentType - 参数所属的资源类型
   * @return {Object} cache 实例
   */
  pro._getCache = function (parentType) {
    switch (parentType) {
      case this._dbConst.PAM_TYP_QUERY:
        return pageCache._$$CachePage._$allocate();
      case this._dbConst.PAM_TYP_VMODEL:
        return templateCache._$$CacheTemplate._$allocate();
      case this._dbConst.PAM_TYP_ATTRIBUTE:
        return dtCache._$$CacheDatatype._$allocate();
      case this._dbConst.PAM_TYP_PATHVAR:
      case this._dbConst.PAM_TYP_INPUT:
      case this._dbConst.PAM_TYP_OUTPUT:
        return interCache._$$CacheInterface._$allocate();
      case this._dbConst.PAM_TYP_RPC_INPUT:
      case this._dbConst.PAM_TYP_RPC_OUTPUT:
        return rpcCache._$$CacheRpc._$allocate();
    }
  };

  /**
   * 根据 parentType 返回相应的缓存中的参数列表
   * @param {Object} result - 后端返回的参数信息
   * @return {Array} 缓存中对应的参数列表
   */
  pro._getParams = function (result) {
    var cache = this._getCache(result.parentType);
    // 更新相应缓存中的数据
    var data = cache._$getItemInCache(result.parentId);
    var params = null;
    switch (result.parentType) {
      case this._dbConst.PAM_TYP_QUERY:
      case this._dbConst.PAM_TYP_VMODEL:
        // 数据模型有单独的更新逻辑，这里不需要再更新它的属性
        // case this._dbConst.PAM_TYP_ATTRIBUTE:
        params = data.params;
        break;
      case this._dbConst.PAM_TYP_INPUT:
      case this._dbConst.PAM_TYP_RPC_INPUT:
        params = data.params.inputs;
        break;
      case this._dbConst.PAM_TYP_OUTPUT:
      case this._dbConst.PAM_TYP_RPC_OUTPUT:
        params = data.params.outputs;
        break;
    }
    return params;
  };

  /**
   * 根据 parentType 更新相应的缓存中的参数的位置信息
   * @param {Object} data - 后端返回的参数信息
   */
  pro._updateParamsPosition = function (data) {
    var cache = this._getCache(data.parentType);
    // 更新相应缓存中的数据
    var resource = cache._$getItemInCache(data.parentId);
    var setPosition = function (params) {
      data.params.forEach(function (movedParam) {
        if (movedParam.datatypeId) {
          var importedParams = params.filter(function (p) {
            return p.datatypeId === movedParam.datatypeId;
          });
          importedParams.forEach(function (p) {
            p.position = movedParam.position;
          });
        } else {
          var _param = params.find(function (p) {
            return p.id === movedParam.id;
          });
          _param.position = movedParam.position;
        }
      });
    };
    switch (data.parentType) {
      case this._dbConst.PAM_TYP_QUERY:
      case this._dbConst.PAM_TYP_VMODEL:
      case this._dbConst.PAM_TYP_ATTRIBUTE:
        setPosition(resource.params);
        break;
      case this._dbConst.PAM_TYP_INPUT:
      case this._dbConst.PAM_TYP_RPC_INPUT:
        setPosition(resource.params.inputs);
        break;
      case this._dbConst.PAM_TYP_OUTPUT:
      case this._dbConst.PAM_TYP_RPC_OUTPUT:
        setPosition(resource.params.outputs);
        break;
    }
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  pro.__getUrl = function (options) {
    var url;
    switch (options.key) {
      case _p._$cacheKey:
        url = '/api/parameters/' + (options.id || '');
        if (options.action) {
          url += '?' + options.action;
        }
        break;
      default:
        break;
    }
    return url;
  };

  /**
   * 更新数据模型, 更新引用了该数据模型的 HTTP 接口、页面模板、页面
   * @param {Array} dataTypes - 数据模型
   * @param {Object} options - 操作参数
   */
  pro._updateResources = function (dataTypes, options) {
    var updateResource = function (updatedDataTypeId) {
      // 从某个参数数组中查找是否引用了当前被更新的数据模型
      var foundRef = function (params) {
        return params.find(function (item) {
          return item.datatypeId === updatedDataTypeId;
        });
      };
      // 查找HTTP 接口, 如果HTTP 接口引用了这个数据模型, 则把它的 params 属性删除, 这样下次访问接口详情时会重新获取
      var _interCache = interCache._$$CacheInterface._$allocate();
      // 因为有可能更改的是公共资源, 所以简便起见, 更新缓存中的所有数据, 而不是只更新当前项目的数据
      //var itfList = _interCache._$getListInCache(_interCache._$getListKey(options.ext.pid));
      var itfList = _interCache.__getHash();

      u._$loop(itfList, function (item) {
        if (!item.hasOwnProperty('params')) {
          return;
        }
        var params = item.params;
        var found = foundRef(params.inputs);
        if (!found) {
          found = foundRef(params.outputs);
        }
        if (!found) {
          found = foundRef(params.reqHeaders);
        }
        if (!found) {
          found = foundRef(params.resHeaders);
        }
        if (found) {
          delete item.params;
        }
      });
      _interCache._$recycle();
      // 查找页面模板, 如果页面模板引用了这个数据模型, 则把它的 params 属性删除, 这样下次访问接口详情时会重新获取
      var _tplCache = templateCache._$$CacheTemplate._$allocate();
      var tplList = _tplCache.__getHash();
      u._$loop(tplList, function (item) {
        if (!item.hasOwnProperty('params')) {
          return;
        }
        var found = foundRef(item.params);
        if (found) {
          delete item.params;
        }
      });
      _tplCache._$recycle();
      // 查找页面, 如果页面的请求参数引用了这个数据模型, 则把它的 params 属性删除, 这样下次访问页面详情时会重新获取
      var _pageCache = pageCache._$$CachePage._$allocate();
      var pageList = _pageCache.__getHash();
      u._$loop(pageList, function (item) {
        if (!item.hasOwnProperty('params')) {
          return;
        }
        var found = foundRef(item.params);
        if (found) {
          delete item.params;
        }
      });
      _pageCache._$recycle();
    }.bind(this);
    // 更新数据模型列表
    var _dtCache = dtCache._$$CacheDatatype._$allocate();
    dataTypes.forEach(function (dt) {
      var item = _dtCache._$getItemInCache(dt.id);
      if (typeof item === 'undefined') {
        // 需要添加到缓存
        //如果参数添加里面有添加匿名数据模型则要写到数据类型缓存中 added by lihl 12.2
        var key = _dtCache._$getListKey(dt.projectId);
        //添加匿名类型标志
        dt.__isAnon = true;
        _dtCache.__doUnshiftToList(key, dt);
      } else {
        u._$merge(item, dt);
      }
      updateResource(dt.id);
    });
    _dtCache._$recycle();
  };
  /**
   * 修改匿名数据类型的属性
   * update by lihl
   * @private
   */
  pro._$updateAnonymousDatatype = function (options) {
    this.__doAction({
      headers: options.headers || {},
      data: options.data,
      ext: options.ext,
      key: options.key,
      method: 'PATCH',
      onload: function (data) {
        // 更新匿名数据模型的参数
        var _dtCache = dtCache._$$CacheDatatype._$allocate();
        //更新缓存
        data.data.datatypes.forEach(function (dt) {
          var item = _dtCache._$getItemInCache(dt.id);
          u._$merge(item, dt);
        });
        this._$dispatchEvent('onitemupdate', data);
        v._$dispatchEvent(this.constructor, 'update');
        _dtCache._$recycle();
      }.bind(this)
    });
  };

});
