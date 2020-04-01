/*
 * 动态列表缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  './cache.js',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _u, _d, db, _p, _pro) {
  _p._$$CacheActivity = _k._$klass();
  _pro = _p._$$CacheActivity._$extend(_d._$$Cache);
  // 项目组所有动态缓存 key
  _p._$progroupsAllCacheKey = 'activities-progroups-all';
  // 指定项目组的所有动态缓存 key
  _p._$progroupsCacheKey = 'activities-progroups';
  // 指定项目的所有动态缓存 key
  _p._$projectsCacheKey = 'activities-projects';
  //  指定HTTP 接口的操作历史缓存 key
  _p._$interfacesCacheKey = 'activities-interfaces';
  //  指定rpc接口的操作历史缓存 key
  _p._$rpcsCacheKey = 'activities-rpcs';
  //  指定规范的操作历史缓存 key
  _p._$specsCacheKey = 'activities-specs';
  //  指定页面的操作历史缓存 key
  _p._$pagesCacheKey = 'activities-pages';
  //  指定页面模板的操作历史缓存 key
  _p._$templatesCacheKey = 'activities-templates';
  //  指定数据模型的操作历史缓存 key
  _p._$datatypesCacheKey = 'activities-datatypes';
  //  指定规则函数的操作历史缓存 key
  _p._$constraintsCacheKey = 'activities-constraints';
  //  指定规则函数的操作历史缓存 key
  _p._$wordsCacheKey = 'activities-words';
  //  指定客户端的操作历史缓存 key
  _p._$clientsCacheKey = 'activities-clients';
  //  指定业务分组的操作历史缓存 key
  _p._$groupCacheKey = 'activities-group';
  //  用户所有的操作历史缓存 key
  _p._$allCacheKey = 'activities-all';

  /**
   * 加载列表
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.offset] - 列表缓存列表起始位置
   * @property {Number} [options.limit] - 列表缓存列表当前查询条数
   * @property {Number} [options.total] - 是否有总数信息
   * @success dispatch event: onlistload
   */
  _pro.__doLoadList = function (options) {
    var data = this._$getListInCache(options.key);
    var lct = new Date().getTime();
    if (data.length > 0) {
      var last = data[options.data.offset - 1];
      if (last) {
        lct = data[options.data.offset - 1].createTime;
      } else {
        lct = null;
      }
    }
    options.data = _u._$merge({
      limit: options.limit,
      total: options.total
    }, options.data);
    if (lct) {
      options.data.lct = lct;
    }
    var url = this.__getUrl(options);
    this.__sendRequest(url, options);
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url = '/api/activities/';

    switch (options.ext.key) {
      case _p._$progroupsAllCacheKey:
        options.data.type = db.RES_TYP_PROGROUP;
        break;

      case _p._$projectsCacheKey:
        options.data.type = db.RES_TYP_PROJECT;
        break;

      case _p._$interfacesCacheKey:
        options.data.type = db.RES_TYP_INTERFACE;
        break;

      case _p._$rpcsCacheKey:
        options.data.type = db.RES_TYP_RPC;
        break;

      case _p._$specsCacheKey:
        url += '?spec';
        break;

      case _p._$pagesCacheKey:
        options.data.type = db.RES_TYP_WEBVIEW;
        break;

      case _p._$templatesCacheKey:
        options.data.type = db.RES_TYP_TEMPLATE;
        break;

      case _p._$datatypesCacheKey:
        options.data.type = db.RES_TYP_DATATYPE;
        break;

      case _p._$constraintsCacheKey:
        options.data.type = db.RES_TYP_CONSTRAINT;
        break;

      case _p._$wordsCacheKey:
        options.data.type = db.RES_TYP_WORD;
        break;

      case _p._$clientsCacheKey:
        options.data.type = db.RES_TYP_CLIENT;
        break;

      case _p._$groupCacheKey:
        options.data.type = db.RES_TYP_BISGROUP;
        break;

      case _p._$allCacheKey:
        url += '?all';
        break;

      default:
        break;
    }
    if (options.ext.pid) {
      options.data.pid = options.ext.pid;
    }
    return url;
  };
});
