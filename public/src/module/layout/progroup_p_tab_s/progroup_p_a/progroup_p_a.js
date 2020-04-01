NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/activitylist/activitylist'
], function (_k, _e, _t, _l, _m, _proCache, _pgCache, _aList, _p, _pro) {

  _p._$$ModuleProGroupPA = _k._$klass();
  _pro = _p._$$ModuleProGroupPA._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-p-a')
    );
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this.__renderView();
          }.bind(this)
        });
        this.__pgCache._$getItem({
          id: this.__project.progroupId
        });
      }.bind(this)
    });
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__super(_options);
    this.__proCache._$getItem({
      id: this.__pid
    });
  };

  _pro.__onHide = function () {
    this.__super();
    if (this.__aList) {
      this.__aList = this.__aList._$recycle();
    }
  };

  _pro.__renderView = function () {
    this.__aList = _aList._$$ModuleActivityList._$allocate({
      parent: this.__body,
      key: 'activities-projects',
      id: this.__pid,
      count: 1
    });
  };

  _m._$regist(
    'progroup-p-activity',
    _p._$$ModuleProGroupPA
  );
});
