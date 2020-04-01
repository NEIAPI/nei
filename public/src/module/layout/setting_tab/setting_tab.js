NEJ.define([
  'base/klass',
  'base/element',
  'pro/tab/tab',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/user_cache',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _e, _t, _l, _m, usrCache, _db, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModuleProfileTab}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProfileTab = _k._$klass();
  _pro = _p._$$ModuleProfileTab._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-setting-tab')
    );
    var user = usrCache._$$CacheUser._$allocate()._$getUserInCache();
    if (user.from != _db.USR_FRM_SITE) {
      _e._$remove(_e._$getByClassName(this.__body, 'u-password-set')[0]);
    }
    this.__tbview = _t._$$ModuleTab._$allocate({
      // 列表容器
      tab: this.__body,
      oncheck: this.__doCheckMatchEQ._$bind(this)
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
   * 验证选中项
   * @param  {Object} 事件信息
   * @return {Void}
   */
  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };
  // notify dispatcher
  _m._$regist(
    'setting-tab',
    _p._$$ModuleProfileTab
  );
});
