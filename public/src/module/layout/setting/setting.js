NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'pro/common/module'
], function (_k, _e, _l, _m, _p, _pro) {
  /**
   * 项目模块基类对象
   * @class   {wd.m._$$ModuleLayoutSetting}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleLayoutSetting = _k._$klass();
  _pro = _p._$$ModuleLayoutSetting._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-setting')
    );
    this.__export = {
      tab: _e._$getByClassName(this.__body, 'tab-wrap')[0],
      parent: _e._$getByClassName(this.__body, 'con-wrap')[0]
    };
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };
  // notify dispatcher
  _m._$regist(
    'layout-setting',
    _p._$$ModuleLayoutSetting
  );
});
