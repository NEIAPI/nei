NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'pro/common/module',
  'pro/notify/notify'
], function (_k, _e, _v, _u, _l, _m, _notify, _p, _pro) {

  _p._$$ModuleSettingCache = _k._$klass();
  _pro = _p._$$ModuleSettingCache._$extend(_m._$$Module);

  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-setting-cache')
    );
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__doInitDomEvent([
      [_e._$getByClassName(this.__body, 'clear-btn')[0], 'click', function () {
        localStorage.clear();
        _notify.show('清除成功', 'success', 3000);
      }]
    ]);
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__doClearDomEvent();
    this.__super();
  };

  // notify dispatcher
  _m._$regist(
    'setting-cache',
    _p._$$ModuleSettingCache
  );
});
