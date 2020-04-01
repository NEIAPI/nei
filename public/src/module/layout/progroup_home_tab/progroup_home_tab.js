NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'pro/common/module',
  'pro/tab/tab'
], function (_k, _e, _l, _m, tab, _p, _pro) {

  _p._$$ModuleProGroupHomeTab = _k._$klass();
  _pro = _p._$$ModuleProGroupHomeTab._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-home-tab')
    );
    this.__tbview = tab._$$ModuleTab._$allocate({
      tab: _e._$getByClassName(this.__body, 'm-tab')[0],
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__tbview._$match(
      this.__getPathFromUMI(_options)
    );
  };

  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };

  _m._$regist(
    'progroup-home-tab',
    _p._$$ModuleProGroupHomeTab
  );
});
