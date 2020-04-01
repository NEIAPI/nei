NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module'
], function (_k, _e, _t, _l, _m, _p, _pro) {

  _p._$$ModuleProGroupHome = _k._$klass();
  _pro = _p._$$ModuleProGroupHome._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-home')
    );
    this._tabWrap = _e._$getByClassName(this.__body, 'tab-wrap')[0];
    this._tabCon = _e._$getByClassName(this.__body, 'con-wrap')[0];
    this.__export = {
      tab: this._tabWrap,
      parent: this._tabCon
    };
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([[
      this._tabCon, 'scroll',
      function () {
        if (this._tabCon.scrollTop === 0) {
          _e._$delClassName(this._tabWrap, 'nei-scrolled');
        } else {
          _e._$addClassName(this._tabWrap, 'nei-scrolled');
        }
      }.bind(this)
    ]]);
  };
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
    _e._$delClassName(this._tabWrap, 'nei-scrolled');
    this.__doClearDomEvent();
  };

  _m._$regist(
    'progroup-home',
    _p._$$ModuleProGroupHome
  );
});
