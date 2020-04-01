NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module'
], function (_k, _e, _t, _l, _m, _p, _pro) {

  _p._$$ModuleProGroupSearch = _k._$klass();
  _pro = _p._$$ModuleProGroupSearch._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-search')
    );
    this.__export = {
      tab: _e._$getByClassName(this.__body, 'tab-wrap')[0],
      parent: _e._$getByClassName(this.__body, 'con-wrap')[0]
    };
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  _pro.__onShow = function (_options) {
    var tabCon = _e._$getByClassName(this.__body, 'con-wrap')[0];
    this._tabWrap = _e._$getByClassName(this.__body, 'tab-wrap ')[0];
    this.__super(_options);
    this.__doInitDomEvent([[
      tabCon, 'scroll',
      function (evt) {
        if (tabCon.scrollTop === 0) {
          _e._$delClassName(this._tabWrap, 'nei-scrolled');
        } else {
          _e._$addClassName(this._tabWrap, 'nei-scrolled');
        }
      }.bind(this)
    ]]);
  };

  _pro.__onHide = function () {
    this.__super();
    _e._$delClassName(this._tabWrap, 'nei-scrolled');
    this.__doClearDomEvent();
  };

  _m._$regist(
    'progroup-search',
    _p._$$ModuleProGroupSearch
  );
});
