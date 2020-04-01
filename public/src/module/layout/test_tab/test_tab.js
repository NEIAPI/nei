NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/cache/progroup_interface_cache',
  'pro/common/module',
  'pro/common/util'
], function (_k, _e, t, _l, jst, _infCache, _m, _p, _pro) {

  _p._$$ModuleTestTab = _k._$klass();
  _pro = _p._$$ModuleTestTab._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    // 标签列表数据
    var xlist = [
      {type: _infCache._$resourceRecord, name: '测试记录'},
      {type: _infCache._$resourceInf, name: '项目组'}
    ];

    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-tab')
    );
    this.__tabCnt = _e._$getByClassName(this.__body, 'm-test-tab-cnt')[0];
    jst._$render(this.__tabCnt, 'module-test-tab-cnt', {
      xlist: xlist
    });
    this.__tabView = t._$$TabView._$allocate({
      list: _e._$getChildren(this.__tabCnt)
    });
  };

  _pro.__onHide = function () {
    this.__super();
    // this.__tabView && (this.__tabView = this.__tabView._$recycle());
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var resourceType = _infCache._$getResourceType(this.__getPathFromUMI());
    if (this._resourceType !== _infCache._$resourceRecord) {
      resourceType = _infCache._$resourceInf;
    }
    this.__tabView._$match(resourceType);
    _e._$getByClassName(this.__tabCnt, 'inf-type-' + resourceType)[0].href = location.pathname + location.search;
  };

  _m._$regist(
    'test-tab',
    _p._$$ModuleTestTab
  );
});
