NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'util/event/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/cache/rpc_cache',
  'pro/activitylist/activitylist'
], function (_k, u, _e, c, _t, _l, _j, _m, cache, _aList, _p, _pro) {

  _p._$$ModuleRpcDetailActivity = _k._$klass();
  _pro = _p._$$ModuleRpcDetailActivity._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-rpc-detail-activity')
    );
    this.__cache = cache._$$CacheRpc._$allocate({
      onitemload: function () {
        this.__rpc = this.__cache._$getItemInCache(this.__id);
        this.__aList = _aList._$$ModuleActivityList._$allocate({
          parent: this.__body,
          key: 'activities-rpcs',
          id: this.__id,
          count: 1
        });
      }._$bind(this)
    });
  };

  _pro.__onRefresh = function (_options) {
    this.__id = _options.param.id.replace('/', '');
    this.__super(_options);
    this.__cache._$getItem({
      id: this.__id
    });
  };

  _pro.__onHide = function () {
    this.__aList && (this.__aList = this.__aList._$recycle());
    this.__super();
  };

  _m._$regist(
    'rpc-detail-activity',
    _p._$$ModuleRpcDetailActivity
  );
});
