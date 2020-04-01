NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/template/tpl',
  'pro/common/module',
  'pro/tab/tab',
  'pro/common/jst_extend',
  'pro/stripedlist/stripedlist',
  'pro/cache/globalsearch_cache',
], function (_k, _e, _v, _l, _m, tab, jstExt, _sl, cache, _p, _pro) {

  _p._$$ModuleLayoutDashboardSearch = _k._$klass();
  _pro = _p._$$ModuleLayoutDashboardSearch._$extend(_m._$$Module);

  _pro.__doBuild = function (options) {
    this.__super(options);

    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-gobalsearch-result')
    );

    this.__content = _e._$getByClassName(this.__body, 'globalsearch-con-wrap')[0];
    this.__tabWrap = _e._$getByClassName(this.__body, 'globalsearch-tab-wrap')[0];

    this.__export = {
      tab: this.__tabWrap
    };
  };

  _pro.__onShow = function (options) {
    this.__super(options);

    this.__doInitDomEvent([[
      this.__content, 'scroll',
      function () {
        if (this.__content.scrollTop === 0) {
          _e._$delClassName(this.__tabWrap, 'nei-scrolled');
        } else {
          _e._$addClassName(this.__tabWrap, 'nei-scrolled');
        }
      }.bind(this)
    ]]);
  };

  _pro.__onRefresh = function (options) {
    var s = decodeURIComponent(options.param.s || '');
    var resourceType = options.umi.slice(16, -2);

    this._stripedListOptions = {
      // 父容器
      parent: _e._$getByClassName(this.__body, 'globalsearch-con-wrap')[0],
      listCache: cache._$cacheKey,
      // listCacheKey = 类型-搜索关键字
      listCacheKey: options.umi.slice(16, -1) + '-' + s,
      queryData: {
        v: s,
        offset: 0,
        limit: 20,
        total: true
      },
      // 处理数据
      filter: function (list, listStates) {
        // 处理 action 列
        list.forEach(function (item) {
          var url;

          var itemState = listStates[item.id];
          switch (resourceType) {
            case 'project':
              url = '/project/detail?pid=' + item.id;
              break;
            case 'progroup':
              url = '/progroup/detail?pgid=' + item.id;
              break;
            default:
              var projectId = item.projectId || item.group.projectId;
              url = '/' + resourceType + '/detail/?pid=' + projectId + '&id=' + item.id;
              var projectUrl = '/project/detail?pid=' + projectId;
              itemState['__ui_project.name'] = '<a href="' + projectUrl + '" class="stateful">' + item.project.name + '</a>';
              break;
          }

          var escapeName = jstExt.escape2(item.name);
          itemState['__ui_name'] = '<a href="' + url + '" class="stateful">' + escapeName + '</a>';
          itemState['__nei-actions'] = ''
            + '<a href="' + url + '" title="查看详情" class="stateful">'
            + '<em class="u-icon-detail-normal"></em></a>';
        });
        return list;
      },
      // 要显示的字段
      headers: this.__getStripedListHeader(resourceType),
      hasPager: true,
      noItemTip: '没有搜索结果'
    };

    if (this.__list) {
      this.__list._$refresh(this._stripedListOptions);
    } else {
      this.__list = _sl._$$ModuleStripedList._$allocate(this._stripedListOptions);
    }

    this.__super(options);
  };

  _pro.__onHide = function (options) {
    this.__super(options);
    this.__list._$recycle();
    delete this.__list;
  };

  _pro.__getStripedListHeader = function (resourceType) {
    var actionHeader = {
      name: '',
      key: '__nei-actions',
      valueType: '__nei-actions',
      sortable: false
    };
    var headers;

    switch (resourceType) {
      case 'interface':
        headers = [
          {name: '所属项目', key: 'project.name', valueType: 'deepKey'},
          {name: '名称', key: 'name'},
          {name: '描述', key: 'description'},
          {name: '方法', key: 'method', valueType: 'method'},
          {name: '路径', key: 'path'},
          {name: '状态', key: 'status.name', valueType: 'deepKey'},
          {name: '负责人', key: 'respo.realname', valueType: 'deepKey'},
          {name: '创建时间', key: 'createTime', valueType: 'time'}
        ];
        break;
      case 'rpc':
        headers = [
          {name: '所属项目', key: 'project.name', valueType: 'deepKey'},
          {name: '名称', key: 'name'},
          {name: '描述', key: 'description'},
          {name: '类名', key: 'className'},
          {name: '方法', key: 'path'},
          {name: '状态', key: 'status.name', valueType: 'deepKey'},
          {name: '负责人', key: 'respo.realname', valueType: 'deepKey'},
          {name: '创建时间', key: 'createTime', valueType: 'time'}
        ];
        break;
      case 'datatype':
      case 'constraint':
      case 'group':
        headers = [
          {name: '所属项目', key: 'project.name', valueType: 'deepKey'},
          {name: '名称', key: 'name'},
          {name: '描述', key: 'description'},
          {name: '创建者', key: 'creator.realname', valueType: 'deepKey'},
          {name: '创建时间', key: 'createTime', valueType: 'time'}
        ];
        break;
      case 'progroup':
      case 'project':
        headers = [
          {name: '名称', key: 'name'},
          {name: '创建者', key: 'creator.realname', valueType: 'deepKey'}
        ];
        break;
      default:
        headers = [
          {name: '所属项目', key: 'project.name', valueType: 'deepKey'},
          {name: '名称', key: 'name'},
          {name: '路径', key: 'path'},
          {name: '创建者', key: 'creator.realname', valueType: 'deepKey'},
          {name: '创建时间', key: 'createTime', valueType: 'time'}
        ];
        break;
    }

    headers.push(actionHeader);

    return headers;
  };

  _m._$regist(
    'globalsearch-result',
    _p._$$ModuleLayoutDashboardSearch
  );
});
