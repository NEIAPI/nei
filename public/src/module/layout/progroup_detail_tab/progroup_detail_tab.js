NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'base/event',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/tab/tab',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/common/util'
], function (_k, _e, _u, _v, _tpl, _jst, _m, tab, _pgCache, _userCache, _cu, _p, _pro) {

  _p._$$ModuleProGroupDetailTab = _k._$klass();
  _pro = _p._$$ModuleProGroupDetailTab._$extend(_m._$$Module);
  // 标签列表数据
  var xlist1 = [];
  var xlist2 = [
    {type: 'project', name: '项目'},
    {type: 'team', name: '团队'},
    {type: 'tool', name: '设置'},
    {type: 'activity', name: '动态'}
  ];
  var xlist3 = [
    {type: 'projectmanage', name: '项目管理'},
    {type: 'teammanage', name: '团队管理'},
    {type: 'privilege', name: '权限管理'},
    {type: 'tool', name: '设置'},
    {type: 'activity', name: '动态'}
  ];

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _tpl._$getTextTemplate('module-progroup-detail-tab')
    );
    this.__tabWrap = _e._$getByClassName(this.__body, 'm-tab')[0];
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
      onlistload: function () {
        _jst._$render(this.__tabWrap, 'module-progroup-detail-tabs', {
          id: this.pgid, // 项目组的id
          xlist: this.__chooseTabs() // 根据用户类型, 显示不同的tab
        });
        this._initTab();
      }.bind(this)
    });
  };

  _pro.__onShow = function (_options) {
    this.__pgid = _options.param.pgid;
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.pgid = _options.param.pgid;
    this.__pgCache._$getList({
      key: _pgCache._$cacheKey
    });
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
    if (this.__tbview) {
      this.__tbview = this.__tbview._$recycle();
    }
  };

  _pro._initTab = function () {
    this.__tbview = tab._$$ModuleTab._$allocate({
      tab: this.__tabWrap,
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
    this.__tbview._$match(
      this.__getPathFromUMI(this._options)
    );
  };

  /**
   * 根据身份显示tab
   * @return {Array}  tabList - 显示的tab数组
   */
  _pro.__chooseTabs = function () {
    var privilege = this.__pgCache._$getPrivilege(this.pgid);
    if (privilege.isAdminOrCreator) {
      return xlist3;
    } else if (privilege.isInGroup) {
      return xlist2;
    } else {
      return xlist1;
    }
  };

  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };

  _m._$regist(
    'progroup-detail-tab',
    _p._$$ModuleProGroupDetailTab
  );
});
