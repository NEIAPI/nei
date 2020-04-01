NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/common/util'
], function (_k, _e, _l, _m, _pgCache, _cu, _p, _pro) {

  _p._$$ModuleLayoutProjectGroup = _k._$klass();
  _pro = _p._$$ModuleLayoutProjectGroup._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-progroup')
    );
    this.__export = {
      tree: _e._$getByClassName(this.__body, 'tree-wrap')[0],
      parent: _e._$getByClassName(this.__body, 'con-wrap')[0]
    };
  };

  _pro.__onShow = function (_options) {
    this.__toggleTree();
    this.__super(_options);
  };

  /**
   * 菜单栏展开收起
   * */
  _pro.__toggleTree = function () {
    window.localStorage.showPgTreeFlag = _cu._$toBool(window.localStorage.showPgTreeFlag);
    if (!_cu._$toBool(window.localStorage.showPgTreeFlag)) {
      _e._$addClassName(this.__export.tree, 'j-animation j-animation-width');
      _e._$addClassName(this.__export.parent, 'j-contentAnimation');
    }
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  _m._$regist(
    'layout-progroup',
    _p._$$ModuleLayoutProjectGroup
  );
});
