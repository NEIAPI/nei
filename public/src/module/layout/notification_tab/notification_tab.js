NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'pro/tab/tab',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/notification_cache'
], function (_k, _e, _v, _t, _l, _m, _cache, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModuleNotificationTab}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleNotificationTab = _k._$klass();
  _pro = _p._$$ModuleNotificationTab._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__nCache = _cache._$$CacheNotification._$allocate();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-notification-tab')
    );
    //系统未读和个人未读
    this.__systemUnread = _e._$getByClassName(this.__body, 'unread-s')[0];
    this.__personalUnread = _e._$getByClassName(this.__body, 'unread-p')[0];
    this.__apiUnread = _e._$getByClassName(this.__body, 'unread-a')[0];
    this.__auditUnread = _e._$getByClassName(this.__body, 'unread-audit')[0];
    this.__tbview = _t._$$ModuleTab._$allocate({
      tab: _e._$getByClassName(this.__body, 'js-tab')[0],
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
  };
  /**
   * 显示模块
   * @param {Object} 配置参数
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([
      [_cache._$$CacheNotification, 'onunreadload', this.__updateUnread.bind(this)],
      [_cache._$$CacheNotification, 'onunreadupdate', this.__updateUnread.bind(this)]
    ]);
    this.__nCache._$getUnread({
      isPolling: false
    });
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__tbview._$match(
      this.__getPathFromUMI(_options)
    );
  };
  /**
   * 更新显示未读数量
   */
  _pro.__updateUnread = function () {
    var data = this.__nCache._$getDataInCache(_cache._$cacheKeyUnread);
    if (!data)
      return;
    if (data.system == 0) {
      _e._$addClassName(this.__systemUnread, 'f-dn');
    } else {
      this.__systemUnread.textContent = data.system > 99 ? '···' : data.system;
      _e._$delClassName(this.__systemUnread, 'f-dn');
    }
    if (data.personal == 0) {
      _e._$addClassName(this.__personalUnread, 'f-dn');
    } else {
      this.__personalUnread.textContent = data.personal > 99 ? '···' : data.personal;
      _e._$delClassName(this.__personalUnread, 'f-dn');
    }
    if (data.api == 0) {
      _e._$addClassName(this.__apiUnread, 'f-dn');
    } else {
      this.__apiUnread.textContent = data.api > 99 ? '···' : data.api;
      _e._$delClassName(this.__apiUnread, 'f-dn');
    }

    if (data.audit && data.audit == 0) {
      _e._$addClassName(this.__auditUnread, 'f-dn');
    } else if (data.audit) {
      this.__auditUnread.textContent = data.audit > 99 ? '···' : data.audit;
      _e._$delClassName(this.__auditUnread, 'f-dn');
    }
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__doClearDomEvent();
    this.__super();
  };
  /**
   * 验证选中项
   * @param  {Object} 事件信息
   * @return {Void}
   */
  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };
  // notify dispatcher
  _m._$regist(
    'notification-tab',
    _p._$$ModuleNotificationTab
  );
});
