NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'util/cache/share',
  'pro/common/module',
  'pro/common/util'
], function (_k, _e, _l, _sc, _m, _cu, _p, _pro) {

  _p._$$ModuleTestRecord = _k._$klass();
  _pro = _p._$$ModuleTestRecord._$extend(_m._$$Module);


  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-record')
    );
    this.__export = {
      parent: _e._$getByClassName(this.__body, 'main-tab-tab-con')[0],
      tab: _e._$getByClassName(this.__body, 'main-tab-tab-wrap')[0]
    };
  };

  _pro.__onHide = function () {
    this.__super();
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  _m._$regist(
    'test-record',
    _p._$$ModuleTestRecord
  );
});
