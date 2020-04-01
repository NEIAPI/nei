/**
 * 接口列表右侧顶部 tab
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'util/cache/share',
  'pro/cache/progroup_interface_cache',
  'pro/cache/interface_cache',
  'pro/cache/testcollection_cache',
  'pro/modal/modal',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend'
], function (_k, _e, _v, t, _l, jst, _sc, _testInfCache, _infCache, _collectCache, _modal, _m, _cu, _jstExt, _p, _pro) {
  _p._$$ModuleTestMainTab = _k._$klass();
  _pro = _p._$$ModuleTestMainTab._$extend(_m._$$Module);
  var xlist = [];

  _pro.__doBuild = function () {
    var me = this;
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-main-tab')
    );
  };

  _pro.__addTab = function () {
    var resourceData = _testInfCache._$getResource(this._resourceType, this._id);
    var tabItem = {
      type: this._resourceType,
      href: location.pathname + location.search,
      id: this._id
    };
    if (this._resourceType === _testInfCache._$resourceInf) {
      tabItem.name = resourceData.method.substr(0, 3) + ' ' + _jstExt.escape2(resourceData.name);
    } else if (this._resourceType === _testInfCache._$resourceCollect) {
      tabItem.name = 'TS ' + _jstExt.escape2(resourceData.name);
    } else if (this._resourceType === _testInfCache._$resourceDependency) {
      tabItem.name = '依赖测试集 ' + _jstExt.escape2(resourceData.name);
    }
    xlist.push(tabItem);
    this._lastTab = tabItem;
    jst._$render(this.__body, 'module-test-main-tab-wrap', {
      xlist: xlist
    });
    this.__tabWrap = _e._$getByClassName(this.__body, 'tab-wrap')[0];
    this.__tabView.__list = _e._$getByClassName(this.__tabWrap, 'tab');
    this.__tabView._$match(this._resourceType + '-' + this._id);
  };

  _pro.__onHide = function () {
    this.__super();
    delete this._lastTab;
    delete this._resourceType;
    delete this._id;
    delete this._pid;
    delete this._pgid;
    xlist = [];
    if (this.__tabWrap) {
      this.__tabWrap.innerHTML = '';
    }
    _testInfCache._$removeResourceData(null, null, ['href', 'stash', 'origin']);
    this.__tabView._$recycle();
    this._infCache._$recycle();
    this._collectCache._$recycle();
    delete this.__tabView;
    delete this._collectCache;
    this.__doClearDomEvent();
    _v._$clearEvent(window, 'beforeunload');
  };

  _pro.__onShow = function (_options) {
    var me = this;
    if (!_options.param.iid || !_options.param.cid) {
      jst._$render(this.__body, 'module-test-main-tab-wrap', {
        xlist: []
      });
    }

    var addTabHandler = this.__addTab.bind(this);
    this._infCache = _infCache._$$CacheInterface._$allocate({
      onlistload: addTabHandler
    });
    this._collectCache = _collectCache._$$CacheTestcollection._$allocate({
      onlistload: addTabHandler
    });

    this.__tabView = t._$$TabView._$allocate({
      list: []
    });

    this.__super(_options);
    this.__doInitDomEvent([
      [this.__body, 'click', function (evt) {
        var closeBtn = _v._$getElement(evt, 'c:tab-close-wrap');
        if (closeBtn) {
          _v._$stop(evt);
          me._closeHandler(closeBtn.parentNode);
        }
      }]
    ]);
    _v._$addEvent(window, 'beforeunload', this.__doBeforeUnload._$bind(this));
  };

  /**
   * 关闭页面前判断是否要进行确认
   *
   * @param  {Object} evt
   * @return {Void}
   */
  _pro.__doBeforeUnload = function (evt) {
    if (_testInfCache._$getModifiedStatus()) {
      evt.returnValue = '确认离开吗？';
    }
  };

  _pro.__onRefresh = function (_options) {
    var me = this;
    this.__super(_options);
    this._id = _options.param.iid || _options.param.cid;
    this._pgid = _options.param.pgid;
    this._pid = _options.param.pid;
    this._resourceType = _testInfCache._$getResourceType(this.__getPathFromUMI());
    if (!this._id) {
      delete this._lastTab;
      this.__tabView._$match('xxxx-0000'); // tab组件为啥不加个清除选中的方法
      return;
    }
    var tabItem = xlist.find(function (item) {
      return item.id === me._id && me._resourceType === item.type;
    });
    if (tabItem) { // 打开存在的标签页
      var tabId = this._resourceType + '-' + this._id;
      if (!this._lastTab || this._lastTab.id !== tabItem.id || this._lastTab.type !== tabItem.type) { // 真切换标签，刷新选中状态
        this.__tabView._$match(tabId);
        this._lastTab = tabItem;
      }
      var tabHref = location.pathname + location.search; // 新的标签页链接
      if (tabItem.href !== tabHref) { // 标签页已经更换，刷新dom节点链接
        var elem = this.__getTab(tabId);
        elem.href = tabHref;
        tabItem.href = tabHref;
      }
    } else {
      if (this._resourceType === _testInfCache._$resourceInf) {
        this._infCache._$getList({
          key: this._infCache._$getListKey(this._pid),
          data: {
            pid: this._pid
          }
        });
      } else if (this._resourceType === _testInfCache._$resourceCollect || this._resourceType === _testInfCache._$resourceDependency) {
        this._collectCache._$getList({
          key: this._collectCache._$getListKey(this._pid),
          data: {
            pid: this._pid
          }
        });
      }
    }
  };

  _pro.__getTab = function (type, id) {
    var tabId = type;
    if (id) {
      tabId = type + '-' + id;
    }
    return _e._$getByClassName(this.__tabWrap, 'tab').find(function (item) {
      return item.getAttribute('data-id') === tabId;
    });
  };

  _pro.__onMessage = function (evt) {
    var evtData = evt.data;
    if (evtData.type === 'save-editor-done') {
      this._confirmHandler(true);
    } else if (evtData.type === 'close-tab') {
      var tabElem = this.__getTab(evtData.resType, evtData.id);
      if (tabElem) {
        this._closeHandler(tabElem);
      }
    } else if (evtData.type === 'update-tab') {
      var tabElem = this.__getTab(evtData.resType, evtData.id);
      if (tabElem) {
        var tabResId = evtData.id + '';
        var tabItem = xlist.find(function (item) {
          return item.id === tabResId && evtData.resType === item.type;
        });
        tabItem.name = (evtData.resType === _testInfCache._$resourceCollect ? 'TS ' : '依赖测试集 ') + evtData.data.name;
        tabElem.title = tabItem.name;
        _e._$getByClassName(tabElem, 'tab-name')[0].textContent = tabItem.name;
      }
    }
  };

  _pro._closeHandler = function (tab) {
    this._tabToClose = tab;
    var needSave = this.__getPathFromUMI().indexOf('/group/create') > -1 && _e._$hasClassName(tab, 'js-selected'); // 关闭当前的，且是创建tab，必须先保存
    if (needSave) {
      this.__doSendMessage('/m/test/group/create/', {
        type: 'save-editor'
      });
    } else {
      this._confirmHandler();
    }
  };

  /**
   * 取消保存
   *
   * @param  {boolean} isGroupCreate 当前tab是否为项目组创建用例页
   * @return {void}
   */
  _pro._cancelSave = function (isGroupCreate) {
    delete this._leaveLayer;
    if (isGroupCreate) {
      this.__doSendMessage('/m/test/group/create/', {
        type: 'cancel-close'
      });
    }
  };

  _pro._confirmHandler = function (isGroupCreate) {
    this._closeTab();
  };

  /**
   * 关闭标签页
   *
   * @param  {Element} tab tab节点
   * @return {void}
   */
  _pro._closeTab = function () {
    var tab = this._tabToClose;
    delete this._tabToClose;
    var tabId = tab.getAttribute('data-id');
    var tabIdInfos = tabId.split('-');
    var l = xlist.length;
    for (var i = 0; i < l; i++) { // findIndex chrome 45才开始支持，只好用这个了
      if (xlist[i].type === tabIdInfos[0] && xlist[i].id === tabIdInfos[1]) { // 找到了删除的项
        break;
      }
    }
    var tabItem = xlist[i];
    xlist.splice(i, 1);
    _e._$remove(tab, true);
    _testInfCache._$removeResourceData(tabIdInfos[1], tabIdInfos[0], 'href');
    this.__tabView.__list = _e._$getByClassName(this.__tabWrap, 'tab');
    if (tabId === this._resourceType + '-' + this._id) { // 关闭当前tab
      if (xlist.length === 0) { // 没标签了
        dispatcher._$redirect('/test/group/?pgid=' + this._pgid + '&pid=' + this._pid);
      } else {
        if (i === xlist.length) { // 删除的是最后一个元素
          i--;
        }
        dispatcher._$redirect(xlist[i].href);
      }
    } else {
      _testInfCache._$removeResourceData(tabIdInfos[1], tabIdInfos[0], ['origin', 'stash']);
    }
  };

  _m._$regist(
    'test-main-tab',
    _p._$$ModuleTestMainTab
  );
});
