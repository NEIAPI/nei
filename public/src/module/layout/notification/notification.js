NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/notification_cache'
], function (_k, _e, _v, _l, _m, _cache, _p, _pro) {
  /**
   * 项目模块基类对象
   * @class   {wd.m._$$ModuleLayoutNotification}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleLayoutNotification = _k._$klass();
  _pro = _p._$$ModuleLayoutNotification._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-notification')
    );
    this.__conWrap = _e._$getByClassName(this.__body, 'con-wrap')[0];
    this.__tabWrap = _e._$getByClassName(this.__body, 'tab-wrap')[0];
    this.__export = {
      tab: this.__tabWrap,
      parent: this.__conWrap
    };

  };
  /**
   * 显示模块
   * @param {Object} 配置参数
   * @private
   */
  _pro.__onShow = function (_options) {
    this.__doInitDomEvent([
      [this.__conWrap, 'scroll', function (event) {
        if (event.target.scrollTop != 0) {
          _e._$addClassName(this.__tabWrap, 'nei-scrolled');
        } else {
          _e._$delClassName(this.__tabWrap, 'nei-scrolled');
        }
      }.bind(this)]
    ]);
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param {Object} 配置参数
   * @private
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };
// notify dispatcher
  _m._$regist(
    'layout-notification',
    _p._$$ModuleLayoutNotification
  );
})
;
