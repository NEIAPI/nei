NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/activitylist/activitylist'
], function (_k, _e, _v, _t, _l, _jst, _m, _cu, _proCache, _pgCache, _usrCache, _aList, _p, _pro) {

  _p._$$ModuleProGroupPD = _k._$klass();
  _pro = _p._$$ModuleProGroupPD._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-p-d')
    );
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            var privilege = this.__pgCache._$getPrivilege(this.__project.progroupId);
            var isProCreator = this.__proCache._$isCreator(this.__pid);
            // 项目组管理员或者创建者, 或者是项目的创建者, 才有修改权限
            this._canModify = privilege.isAdminOrCreator || isProCreator;
            this.__renderView(privilege.isOthers);
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

  _pro.__renderView = function (isOthers) {
    _jst._$render(this.__body, 'pro-base-detail', {
      name: this.__project.name,
      id: this.__pid,
      description: this.__project.description,
      canModify: this._canModify
    });
    this.__descTextarea = _e._$getByClassName(this.__body, 'pg-desc')[0];
    if (!isOthers) {
      this.__aList = _aList._$$ModuleActivityList._$allocate({
        parent: _e._$getByClassName(this.__body, 'activity-list')[0],
        key: 'activities-projects',
        id: this.__pid,
        count: 1
      });
    }
  };

  _m._$regist(
    'progroup-p-detail',
    _p._$$ModuleProGroupPD
  );
});
