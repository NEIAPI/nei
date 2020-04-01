NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/user_cache',
  'pro/common/regular/regular_base',
  'pro/stripedlist/stripedlist'
], function (_k, _e, _u, _t, _l, _m, _cu, pgCache, proCache, usrCache, _r, _sl, _p, _pro) {

  _p._$$ModuleProGroupSearchGroup = _k._$klass();
  _pro = _p._$$ModuleProGroupSearchGroup._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-searchresult')
    );
    this._stripedListOptions = {
      parent: this.__body,
      filter: function (list, listStates) {
        _u._$forEach(list, function (item) {
          var itemState = listStates[item.id];
          var str = '';
          // 查看详情
          var type = this._stripedListOptions.listCache;
          var typeId = type == 'progroup' ? 'pgid' : 'pid';
          str += '<a href="/' + type + '/detail?' + typeId + '=' + item.id + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';
          itemState['__nei-actions'] = str;
        }, this);
        return list;
      }.bind(this),
      headers: [
        {
          key: 'name'
        },
        {
          name: '拥有者',
          key: 'creator.realname',
          valueType: 'deepKey'
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions',
          sortable: false
        }
      ],
      hasPager: true,
      noItemTip: '没有搜索结果'
    };
    _u._$forIn(this._stripedListOptions.headers, function (headerItem) {
      if (headerItem.key === 'name') {
        this._header = headerItem;
        return true;
      }
    }, this);
  };

  _pro.__onRefresh = function (options) {
    var s = _u._$escape(options.param.s || '');
    var needFlush = false;
    if (options.umi === '/m/progroup/search/project/') {
      this._header.name = '项目名称';
      // 项目搜索结果列表
      this._stripedListOptions.listCache = 'project';
      this._stripedListOptions.listCacheKey = proCache._$searchCacheKey;
      if (s !== this._proSearch) {
        needFlush = true;
      }
      this._proSearch = s;
    } else {
      this._header.name = '项目组名称';
      // 项目组搜索结果列表
      this._stripedListOptions.listCache = 'progroup';
      this._stripedListOptions.listCacheKey = pgCache._$searchCacheKey;
      if (s !== this._pgSearch) {
        needFlush = true;
      }
      this._pgSearch = s;
    }
    this._stripedListOptions.queryData = {
      v: s,
      offset: 0,
      limit: 20,
      total: true
    };
    this._stripedListOptions.queryExtData = {
      isSearch: true,
      needFlush: needFlush
    };
    if (this._searchList) {
      this._searchList._$refresh(this._stripedListOptions);
    } else {
      this._searchList = _sl._$$ModuleStripedList._$allocate(this._stripedListOptions);
    }
    this.__super(options);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    this._searchList._$recycle();
    delete this._searchList;
    delete this._proSearch;
    delete this._pgSearch;
  };

  _m._$regist(
    'progroup-searchresult',
    _p._$$ModuleProGroupSearchGroup
  );
});
