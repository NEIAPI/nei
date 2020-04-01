/*
 * 接口头信息缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './interface_cache.js'
], function (k, u, v, c, d, interCache, p, pro) {
  p._$$CacheIHeader = k._$klass();
  pro = p._$$CacheIHeader._$extend(d._$$Cache);
  p._$cacheKey = 'iheader';

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = p._$cacheKey;
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * 必须要传的参数:
   * @property {Number} options.id - 请求头 id
   * @property {Number} options.parentId - 所属接口标识
   * @property {Number} options.parentType - 头类型
   * 支持更新的字段有:
   * @property {String} [options.name] - 头字段名称
   * @property {String} [options.defaultValue] - 字段值
   * @property {String} [options.description] - 字段描述信息
   * @success dispatch event: onitemupdate
   */
  pro.__doUpdateItem = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      var newHeader = result.params[0];
      var headers = this._getHeaders(options.data.parentId, options.data.parentType);
      var header = headers.find(function (item) {
        return item.id === newHeader.id || item.id === newHeader.parameterId;
      });
      u._$merge(header, newHeader);
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
      var headers = this._getHeaders(options.data.parentId, options.data.parentType);
      evt.data.params.forEach(function (item) {
        headers.push(item);
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
      var headers = this._getHeaders(options.data.parentId, options.data.parentType);
      u._$reverseEach(headers, function (item1, index) {
        u._$forEach(evt.data.params, function (item2) {
          if (item1.id === item2) {
            headers.splice(index, 1);
          }
        });
      });
      u._$reverseEach(headers, function (item1, index) {
        u._$forEach(evt.data.imports, function (item2) {
          if (item1.datatypeId === item2) {
            headers.splice(index, 1);
          }
        });
      });
    }.bind(this);
    this.__super(options);
  };


  /**
   * 获取请求头参数
   * @param {String} interfaceId - HTTP 接口id
   * @param {Number} headerType - 请求头类型
   * @return {Array} 参数列表
   */
  pro._getHeaders = function (interfaceId, headerType) {
    var cache = interCache._$$CacheInterface._$allocate();
    var interfaceData = cache._$getItemInCache(interfaceId);
    var headers = [];
    if (headerType === this._dbConst.API_HED_REQUEST) {
      headers = interfaceData.params.reqHeaders;
    } else if (headerType === this._dbConst.API_HED_RESPONSE) {
      headers = interfaceData.params.resHeaders;
    }
    return headers;
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  pro.__getUrl = function (options) {
    var url;
    switch (options.key) {
      case p._$cacheKey:
        url = '/api/iheaders/' + (options.id || '');
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
        this._$dispatchEvent('onupdatepositions', evt);
      }._$bind(this)
    });
  };

  /**
   * 更新或者创建请求头中的 Content-type，用于“快速选择请求体类型”功能
   * @param {Object} options - 参数对象
   * @property {Number} options.parentId- 所属资源id
   * @property {Number} options.defaultValue - content-type 的值
   * @success dispatch event: onupdatepositions
   */
  pro._$updateOrCreateReqContentType = function (options) {
    var headers = this._getHeaders(options.parentId, this._dbConst.API_HED_REQUEST);
    var contentTypeParam = headers.find(function (header) {
      return header.name.toLowerCase() === 'content-type';
    });
    if (contentTypeParam) {
      // content-type 已经存在，则更新它
      this._$updateItem({
        data: {
          parentId: options.parentId,
          parentType: this._dbConst.API_HED_REQUEST,
          defaultValue: options.defaultValue
        },
        id: contentTypeParam.id
      });
    } else {
      // 否则就创建一个 content-type 参数
      this._$addItems({
        data: {
          parentId: options.parentId,
          parentType: this._dbConst.API_HED_REQUEST,
          params: [{
            name: 'Content-Type',
            defaultValue: options.defaultValue
          }]
        }
      });
    }
  };

});
