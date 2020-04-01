NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/activitylist/activitylist'
], function (_k, _e, _t, _l, _m, pgCache, _a, _p, _pro) {

  _p._$$ModuleProGroupDetailA = _k._$klass();
  _pro = _p._$$ModuleProGroupDetailA._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-d-a')
    );
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    this._pgCache = null;
    this._pgCacheOptions = {
      onlistload: function () {
        var privilege = this._pgCache._$getPrivilege(this._pgid);
        // 没权限不用加载动态
        if (privilege.isOthers) return;
        this.__actOpt = {
          parent: this.__body,
          key: 'activities-progroups-all',
          id: this._pgid
        };
        this.__actList = _a._$$ModuleActivityList._$allocate(this.__actOpt);

        //删除加载中提示，显示内容
        _e._$addClassName(this.__loading, 'f-dn');
        _e._$delClassName(this.__body, 'f-dn');
      }.bind(this)
    };
  };

  _pro.__onShow = function (_options) {
    this._pgCache = pgCache._$$CacheProGroup._$allocate(this._pgCacheOptions);
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    _e._$addClassName(this.__body, 'f-dn');
    this._pgid = _options.param.pgid;
    this._pgCache._$getList({
      key: pgCache._$cacheKey
    });
    this.__super(_options);
  };

  _pro.__onHide = function () {
    if (this.__actList) {
      this.__actList = this.__actList._$recycle();
    }
    this._pgCache._$recycle();
    this.__body.innerHTML = '';
    this.__super();
  };

  _m._$regist(
    'progroup-detail-a',
    _p._$$ModuleProGroupDetailA
  );
});
