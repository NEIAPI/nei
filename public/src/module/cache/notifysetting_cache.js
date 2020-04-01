/*
 * 通知设置缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js'
], function (_k, _u, _v, _c, _d, _p, _pro) {
  _p._$$CacheNotifySetting = _k._$klass();
  _pro = _p._$$CacheNotifySetting._$extend(_d._$$Cache);
  _p._$cacheKey = 'notify-setting';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * 支持更新通知设置的字段有:
   * @property {Boolean} [options.flag] - 通知开关
   * @property {Boolean} [options.methodYixin] - 通知方式 － 易信
   * @property {Boolean} [options.methodEmail] - 通知方式 － 邮箱通知
   * @property {Boolean} [options.methodPhone] - 通知方式 － 手机
   * @property {Boolean} [options.methodPaopao] - 通知方式 － 泡泡
   * @success dispatch event: onitemupdate
   */
  _pro.__doUpdateItem = function (options) {
    this.__super(options);
  };

  _pro.__doLoadItem = function (options) {
    var _options = {
      onload: function (data) {
        this.__setDataInCache(_p._$cacheKey, data);
        // 父类中的回调
        options.onload();
      }.bind(this)
    };
    this.__super(_options);
  };

  _pro._$getNotifySettingsInCache = function () {
    return this.__getDataInCache(_p._$cacheKey);
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url;
    switch (options.key) {
      case _p._$cacheKey:
        url = '/api/notifysettings/';
        break;

      default:
        break;
    }
    return url;
  };

});
