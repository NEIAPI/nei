NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/template/jst',
  'util/template/tpl',
  'pro/common/module',
  './projectlist.js',
  './processlist.js',
  'pro/common/jst_extend',
  'pro/stripedlist/stripedlist',
  'pro/activitylist/activitylist',
  'pro/cache/user_cache',
  'pro/cache/view_history_cache',
], function (_k, _e, _v, jst, _l, _m, ProjectList, Processlist, jstExt, stripedlist, active, user_cache, viewHistoryCache, _p, _pro) {

  _p._$$ModuleLayoutDashboard = _k._$klass();
  _pro = _p._$$ModuleLayoutDashboard._$extend(_m._$$Module);

  _pro.__doBuild = function (options) {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-dashboard')
    );
    var list = _e._$getByClassName(this.__body, 'j-flag');
    this.__viewHistoryListEl = list[0];
    this.__eProlist = list[1];
    this.__eApplylist = list[2];
    this.__eNew = list[3];

    this.__export = {
      search: _e._$getByClassName(this.__body, 'dashboard-search')[0]
    };
  };

  _pro.__onShow = function (options) {
    this.__super(options);
    this.__activityList = active._$$ModuleActivityList._$allocate({
      parent: this.__eNew,
      hasPager: false,
      key: 'activities-all'
    });
    this.__projectList = new ProjectList({
      data: {}
    }).$inject(this.__eProlist);

    this.__processList = new Processlist({
      data: {}
    }).$inject(this.__eApplylist);

    this._showViewHistory();

  };

  _pro.__onRefresh = function (options) {
    this.__super(options);
  };

  _pro.__onHide = function () {
    this.__activityList && this.__activityList._$recycle();
    this.__processList && this.__processList.destroy();
    this.__projectList && this.__projectList.destroy();
    this.__eApplylist.innerHTML = '';
    this.__eProlist.innerHTML = '';
    this.__activityList = null;
    this.__super();
  };

  _pro._showViewHistory = function () {
    this._stripedListOptions = {
      // 父容器
      parent: this.__viewHistoryListEl,
      listCache: 'viewHistory',
      listCacheKey: viewHistoryCache._$cacheKey,
      // 处理数据
      filter: function (list, listStates) {
        // 处理 action 列
        list.forEach(function (item) {
          var url;
          var itemState = listStates[item.id];
          var projectId = item.project.id;
          url = '/interface/detail/?pid=' + projectId + '&id=' + item.resData.id;
          var projectUrl = '/project/detail?pid=' + projectId;

          var escapeProjectName = jstExt.escape2(item.project.name);
          itemState['__ui_project.name'] = '<a href="' + projectUrl + '" class="stateful">' + escapeProjectName + '</a>';

          var escapeName = jstExt.escape2(item.resData.name);
          itemState['__ui_resData.name'] = '<a href="' + url + '" class="stateful">' + escapeName + '</a>';
          itemState['__ui_resData.method'] = item.resData.method.slice(0, 3);
        });
        return list;
      },
      // 要显示的字段
      headers: this._getStripedListHeader(),
      noItemTip: '最近您没有查看过接口'
    };

    if (this.__list) {
      this.__list._$refresh(this._stripedListOptions);
    } else {
      this.__list = stripedlist._$$ModuleStripedList._$allocate(this._stripedListOptions);
    }
  };

  _pro._getStripedListHeader = function () {
    var headers = [
      {name: '所属项目', key: 'project.name', valueType: 'deepKey'},
      {name: '名称', key: 'resData.name', valueType: 'deepKey'},
      {name: '方法', key: 'resData.method', valueType: 'deepKey'},
      {name: '路径', key: 'resData.path', valueType: 'deepKey'},
      {name: '查看次数', key: 'viewCount'},
      {name: '查看时间', key: 'createTime', valueType: 'time'}
    ];
    return headers;
  };

  _m._$regist(
    'layout-dashboard',
    _p._$$ModuleLayoutDashboard
  );
});
