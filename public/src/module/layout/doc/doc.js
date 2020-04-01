NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/template/tpl',
  'pro/common/module'
], function (_k, _e, _v, tpl, module, _p, _pro) {

  _p._$$ModuleLayoutSystem = _k._$klass();
  _pro = _p._$$ModuleLayoutSystem._$extend(module._$$Module);


  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      tpl._$getTextTemplate('module-layout-doc')
    );
    this.__export = {
      tab: _e._$getByClassName(this.__body, 'sidebar')[0],
      parent: _e._$getByClassName(this.__body, 'content')[0]
    };
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  module._$regist(
    'layout-doc',
    _p._$$ModuleLayoutSystem
  );
});
