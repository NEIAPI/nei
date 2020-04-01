/**
 * 项目接口模块
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'util/cache/share',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/cache/pg_cache',
  'pro/cache/progroup_interface_cache',
  'pro/cache/testcollection_cache',
  'pro/cache/user_cache',
  './project_interface_tree.js'
], function (_k, _e, _v, _u, _l, _sc, _m, _cu, jstExt, _pgCache, _infCache, _collectCache, _userCache, _proInfTree, _p, _pro) {
  _p._$$ModuleTestGroup = _k._$klass();
  _pro = _p._$$ModuleTestGroup._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    var me = this;
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-group')
    );
    this.__export = {
      parent: _e._$getByClassName(this.__body, 'main-tab-tab-con')[0],
      tab: _e._$getByClassName(this.__body, 'main-tab-tab-wrap')[0]
    };

    this._data = {}; // 用来存放私有数据，全放在实例下，有点怪

    this._pgCache = _pgCache._$$CacheProGroup._$allocate({
      onlistload: function () {
        this._renderView();
      }._$bind(this)
    });

    _collectCache._$$CacheTestcollection._$allocate()._$recycle();
    var collectUpdateHandler = function (evt) {
      if (evt.action === 'add' || (evt.action === 'update' && evt.options.data.name)) {
        var c = _collectCache._$$CacheTestcollection._$allocate();
        var coll = c._$getItemInCache(evt.data.id);
        coll.nameEscaped = jstExt.escape2(evt.data.name);
        c._$recycle();
      }
      this._renderView(true);
      if (evt.action === 'delete') {
        this.__doSendMessage('/?/test/main/tab/', {
          type: 'close-tab',
          resType: evt.data.type === 0 ? _infCache._$resourceCollect : _infCache._$resourceDependency,
          id: evt.data.id
        });
      } else if (evt.action === 'update' && evt.options.data.name) {
        this.__doSendMessage('/?/test/main/tab/', {
          type: 'update-tab',
          resType: evt.data.type === 0 ? _infCache._$resourceCollect : _infCache._$resourceDependency,
          id: evt.data.id,
          data: evt.options.data
        });
      }
    }.bind(this);
    _v._$addEvent(_collectCache._$$CacheTestcollection, 'add', collectUpdateHandler);
    _v._$addEvent(_collectCache._$$CacheTestcollection, 'delete', collectUpdateHandler);
    _v._$addEvent(_collectCache._$$CacheTestcollection, 'update', collectUpdateHandler);

    var uc = _userCache._$$CacheUser._$allocate({});
    this._data.projLsKey = uc._$getUserInCache().id + '-inf-test-project';
    uc._$recycle();
  };

  /**
   * 绘制项目组接口树
   * @param {boolean} fromSearchChange 是否为搜索刷新
   *
   * @return {Void}
   */
  _pro._renderView = function (fromSearchChange) {
    var treeData = {
      pgid: this._data.pgid,
      pid: this._data.pid,
      iid: this._data.iid,
      cid: this._data.cid
    };
    if (!this._proInfTree) {
      this._proInfTree = new _proInfTree({
        data: treeData
      }).$inject(_e._$getByClassName(this.__body, 'pro_inf_tree_wrap')[0]);
      this._proInfTree.$on('pg-proj-change', function (evt) {
        if (evt.init) { // 初始化没选中pgid和pid，需要回传
          this._data.pgid = evt.pgid;
          this._data.pid = evt.pid;
          this.__saveProject(this._data.pgid, this._data.pid);
        } else {
          this._isSearching = false;
          this._proInfTree.$setSearching(0);
          this.__doSendMessage('/m/test', {
            type: 'close-search'
          });
          if (evt.pgid) { // 切换项目组
            delete this._data.pid;
            dispatcher._$redirect(location.pathname + '?pgid=' + evt.pgid);
          } else {
            dispatcher._$redirect(location.pathname + '?pgid=' + this._data.pgid + '&pid=' + evt.pid);
          }
        }
      }.bind(this));
    } else {
      this._proInfTree.$refreshTree(treeData, fromSearchChange);
    }
  };

  _pro.__onHide = function (_options) {
    this.__super(_options);
    if (_options.target.indexOf('/m/test/') !== 0) { // 切换至其他模块
      this._proInfTree.$off('progroup-change');
      this._proInfTree.destroy();
      delete this._proInfTree;
      delete this._isSearching;
    }
    delete this._data.pgid;
    delete this._data.pid;
    delete this._data.cid;
    delete this._data.iid;
  };

  _pro.__saveProject = function (pgid, pid) {
    localStorage.setItem(this._data.projLsKey, JSON.stringify({
      pid: pid,
      pgid: pgid
    }));
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var resType = _infCache._$getResourceType(this.__getPathFromUMI());
    if (resType === _infCache._$resourceCollect || resType === _infCache._$resourceDependency) {
      _e._$addClassName(this.__export.tab, 'f-dn');
    } else {
      _e._$delClassName(this.__export.tab, 'f-dn');
    }
    this._data.iid = parseInt(_options.param.iid, 10);
    this._data.cid = parseInt(_options.param.cid, 10);
    var lastProject = JSON.parse(localStorage.getItem(this._data.projLsKey) || '{}');
    this._data.pgid = parseInt(_options.param.pgid, 10) || lastProject.pgid;
    this._data.pid = parseInt(_options.param.pid, 10) || lastProject.pid;
    if (lastProject.pgid != this._data.pgid || lastProject.pid != this._data.pid) {
      this.__saveProject(this._data.pgid, this._data.pid);
    }

    if (!this._proInfTree) { // 第一次显示时，需要请求项目组列表
      this._pgCache._$getList({key: _pgCache._$cacheKey});
    } else {
      if (!this._isSearching) {
        this._renderView();
      }
    }
  };

  _pro.__onMessage = function (evt) {
    var evtType = evt.data.type;
    if (evtType === 'search-inf') {
      var search = _sc.localCache._$get('m-test-inf-search');
      this._isSearching = !!search;
      var state = 1;
      if (!search) {
        state = -1;
      }
      this._proInfTree.$setSearching(state, search);
      this._renderView(true);
    } else if (evtType === 'show-hosts-dialog') {
      this._proInfTree.$showHostsDialog();
    }
  };

  _m._$regist(
    'test-group',
    _p._$$ModuleTestGroup
  );
});
