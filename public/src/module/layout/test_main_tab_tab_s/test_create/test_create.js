/**
 * 接口测试-用例填写模块
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/layout/test_main_tab_tab_s/test_tab_base',
  'pro/cache/progroup_interface_cache',
  'pro/cache/pro_cache',
  'pro/cache/host_cache',
  'pro/cache/testcase_cache',
  'pro/cache/interface_cache',
  'pro/cache/datatype_cache',
  'pro/cache/constraint_cache',
  'pro/interface_test/interface_test'
], function (_k, _e, _v, _u, _l, _m, _cu, tabBase, _testInfCache, _projCache, _hostCache, cache, _infCache, _dtCache, _csCache, interfaceTest, _p, _pro) {
  _p._$$ModuleTestCreate = _k._$klass();
  _pro = _p._$$ModuleTestCreate._$extend(tabBase._$$ModuleTestTabBase);
  _p._$editorCacheKey = 'test-create-editor-map';
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    var me = this;
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-create')
    );
    this.__super();
    // 测试cache
    this.__cache = cache._$$CacheTestCase._$allocate({
      onitemsadd: function (result) {
        // 取得testdata列表后开始批量测试
        var host = this._hostCache._$getItemInCache(this._hostId);
        var datatypeCache = _dtCache._$$CacheDatatype._$allocate({});
        var constraintCache = _csCache._$$CacheConstraint._$allocate({});
        var interfaceCache = _infCache._$$CacheInterface._$allocate({});
        var datatypes = datatypeCache._$getListInCache(datatypeCache._$getListKey(this._pid));
        var constraints = constraintCache._$getListInCache(constraintCache._$getListKey(this._pid));
        var checkRequiredParam = !this.__projCache._$getItemInCache(this._pid).resParamRequired;
        var tdata = {
          env: host,
          datatypes: datatypes,
          constraints: constraints,
          checkRequiredParam: checkRequiredParam
        };
        var data = [];
        result.data.forEach(function (item) {
          var addItem = data.filter(function (i) {
            return i.interface.id === item.interfaceId;
          })[0];
          var interface = interfaceCache._$getItemInCache(item.interfaceId);
          var testdata = this.__cache._$getItemInCache(item.id);
          if (!addItem) {
            data.push({
              interface: interface,
              testcases: [{
                testcase: testdata,
                reqData: this.__reqData[item.interfaceId]
              }]
            });
          } else {
            addItem.testcases.push({
              testcase: testdata,
              reqData: this.__reqData[item.interfaceId]
            });
          }
        }, this);
        tdata.data = data;
        this.__cache._$startTests(tdata);
        // 表示已经提交或者强制关闭, 离开页面不再弹框警告未保存数据
        this._isSubmitted = true;
        datatypeCache._$recycle();
        constraintCache._$recycle();
        interfaceCache._$recycle();
      }._$bind(this),
      onitemupdate: function (result) {
        // 测试用例update代表测试已经完成,此时需跳转页面至测试报告
        dispatcher._$redirect('/test/group/report?pgid=' + this._pgid + '&pid=' + this._pid
          + '&iid=' + this._iid + '&id=' + result.data.id);
      }._$bind(this),
      onerror: function () {
        this._isSubmitted = false;
        this.__disableBtn(this.__submitBtn, this.__btnText, false);
      }.bind(this)
    });

    this._hostCache = _hostCache._$$CacheHost._$allocate({
      onitemload: function (options) {
        me._hostId = options.id;
        if (me._interfaceTest) {
          me._updateHost();
        }
      }
    });

    this.__noDataElem = _e._$getByClassName(this.__body, 'no-item-tip')[0];
    this.__cntWrap = _e._$getByClassName(this.__body, 'case-content-wrap')[0];
  };

  _pro._renderView = function (hasDefaultHost) {
    var infData = _testInfCache._$getResourceData(this._iid, _testInfCache._$resourceInf, ['origin', 'stash']) || {};
    this._interfaceTest = new interfaceTest({
      data: {
        cache: this.__cache,
        xlist: this._xlist,
        datatypes: this.__datatypes,
        constraints: this.__constraints,
        iid: this._iid,
        pid: this._pid,
        hasDefaultHost: hasDefaultHost,
        data: infData.stash ? JSON.parse(infData.stash) : null
      }
    });
    this._interfaceTest.$inject(_e._$getByClassName(this.__body, 'form-body')[0])
      .$on('ready', function (event) {
        this.__reqData = event.reqData;
        this.__handleSubmit(event.data, event.button);
      }.bind(this)).$on('show-hosts-dialog', function (event) {
      this.__doSendMessage('/m/test/group', {
        type: 'show-hosts-dialog'
      });
    }.bind(this));
    if (!infData.origin) {
      _testInfCache._$saveResourceData(this._iid, _testInfCache._$resourceInf, {
        origin: JSON.stringify(this.__getSubmitOptions())
      });
    }
    if (this._hostId) {
      this._updateHost();
    }
  };

  /**
   * 更新服务器地址
   *
   * @return {void}
   */
  _pro._updateHost = function () {
    var host = this._hostCache._$getItemInCache(this._hostId);
    if (host && this._interfaceTest) {
      this._interfaceTest.$updateHost(host);
    }
  };

  /**
   * 处理表单提交事件
   * @param {Boolean} data
   * @param {Boolean} btn
   * @return {Void}
   */
  _pro.__handleSubmit = function (data, btn) {
    this.__btnText = btn.innerText;
    this.__submitBtn = btn;
    this.__disableBtn(btn, '提交中...', true);
    var submitdata = {
      data: {items: data}
    };
    submitdata.key = this.__cache._$getListKey(this._iid);
    this.__cache._$addItems(submitdata);
  };

  /**
   * 显示模块
   * @param  {Object} _options - 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__projCache = _projCache._$$CachePro._$allocate({});
    this._refreshAfterShow = true;
    this.__super(_options);
    this._unloadHandler = this.__doBeforeUnload._$bind(this);
    _v._$addEvent(window, 'beforeunload', this._unloadHandler);
    this.__doInitDomEvent([[
      _projCache._$$CachePro, 'update',
      function (_result) {
        this._hostId = _result.options.data.hostId;
        this._updateHost();
      }._$bind(this)
    ]]);
  };

  /**
   * 关闭页面前需要先保存数据，然后由test/main/tab来执行判断逻辑
   *
   * @param  {Object} evt
   * @return {Void}
   */
  _pro.__doBeforeUnload = function (evt) {
    if (this._iid && !this._isSubmitted) {
      this._saveData(this._iid);
    }
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    if (this._lastIid) {
      if (!this._refreshAfterShow) {
        if (!this._isSubmitted) {
          this._saveData(this._lastIid); // 保存数据
        } else {
          _testInfCache._$removeResourceData(this._lastIid, _testInfCache._$resourceInf, ['origin', 'stash']);
        }
      }
      if (this._interfaceTest) {
        this._interfaceTest = this._interfaceTest.destroy();
      }
    }
    this.__clearPromises();
    delete this._refreshAfterShow;
    delete this._lastIid;
    delete this._hostId;
    delete this._isSubmitted;
    if (_options.param.iid) {
      _e._$addClassName(this.__noDataElem, 'f-dn');
      _e._$delClassName(this.__cntWrap, 'f-dn');
    } else { // 没有选中接口
      _e._$addClassName(this.__cntWrap, 'f-dn');
      _e._$delClassName(this.__noDataElem, 'f-dn');
      return;
    }
    this._pid = _options.param.pid;
    this._pgid = _options.param.pgid;
    this._iid = _options.param.iid;
    this._lastIid = this._iid;
    this.__listpath = '/test/group/case/?pgid=' + this._pgid + '&pid=' + this._pid + '&iid=' + this._iid;
    var _url = _options.referer ? new URL(_options.referer) : '';
    this.__referer = _url ? (_url.pathname + _url.search) : this.__listpath;
    this.__datatypes = {};
    this.__constraints = {};
    this.__interfaceObj = {};

    this._promises = [];

    var getListParam = function (c) {
      return {
        key: c._$getListKey(this._pid),
        data: {
          pid: this._pid
        }
      };
    }.bind(this);

    var projPromise = _cu._$getDataByPromise(_projCache._$$CachePro, 'onitemload',
      function (cache, event, promise, resolve) {
        var proj = cache._$getItemInCache(this._pid);
        if (proj.hostId > 0) {
          this._hostCache._$getItem({
            id: proj.hostId
          });
        }
        cache._$recycle();
        resolve(proj);
      }.bind(this),
      null, '_$getItem',
      {id: this._pid}, this);

    var csPromise = _cu._$getDataByPromise(_csCache._$$CacheConstraint, 'onlistload',
      null, null, '_$getList',
      getListParam, this);

    var dtPromise = _cu._$getDataByPromise(_dtCache._$$CacheDatatype, 'onlistload',
      null, null, '_$getList',
      getListParam, this);

    var infPromise = _cu._$getDataByPromise(_infCache._$$CacheInterface, 'onitemload',
      function (cache, event, promise, resolve) {
        var inf = cache._$getItemInCache(this._iid);
        cache._$recycle();
        resolve(inf);
      }.bind(this),
      null, '_$getItem',
      {id: this._iid}, this);

    Promise.all([csPromise, dtPromise, infPromise, projPromise]).then(function (listData) {
      this.__constraints = listData[0];
      this.__datatypes = listData[1];
      this.__cache._$setTestOptions({
        datatypes: this.__datatypes,
        constraints: this.__constraints
      });

      this._xlist = []; // 创建接口的测试需要先获取接口详情以取得详细参数及请求方法,路径等信息
      this._xlist.push(listData[2]);
      this.__interfaceObj[this._iid] = listData[2];
      this._renderView(listData[3].hostId > 0);
    }.bind(this)).catch(function (err) {
    });
  };

  _pro._saveData = function (iid) {
    _testInfCache._$saveResourceData(iid, _testInfCache._$resourceInf, {
      stash: JSON.stringify(this.__getSubmitOptions())
    });
  };

  _pro.__onBeforeHide = function (evt) { // 隐藏时就保存数据
    if (this._iid) {
      if (!this._isSubmitted) {
        this._saveData(this._iid);
      } else {
        _testInfCache._$removeResourceData(this._iid, _testInfCache._$resourceInf, ['origin', 'stash']);
      }
    }
    this.__super(evt);
  };

  _pro.__onMessage = function (evt) { // 接收消息
    if (evt.data.type === 'save-editor') {
      this._saveData(this._iid);
      this._isSubmitted = true;
      this.__doSendMessage(evt.from, {
        type: 'save-editor-done'
      });
    } else if (evt.data.type === 'cancel-close') {
      this._isSubmitted = false;
    }
  };

  _pro.__clearPromises = function () {
    if (this._promises && this._promises.length) {
      _u._$reverseEach(this._promises, function (p) {
        p.__cancel();
      });
    }
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    delete this.__referer;
    delete this.__reqData;
    delete this._isSubmitted;
    delete this._refreshAfterShow;
    delete this._lastIid;
    if (this._interfaceTest) {
      this._interfaceTest = this._interfaceTest.destroy();
    }
    delete this.__datatypes;
    delete this.__constraints;
    delete this.__interfaceObj;
    this.__clearPromises();
    _v._$delEvent(window, 'beforeunload', this._unloadHandler);
    delete this._unloadHandler;
  };

  _pro.__getSubmitOptions = function () {
    return this._interfaceTest ? this._interfaceTest.$getData() : undefined;
  };

  _m._$regist(
    'test-create',
    _p._$$ModuleTestCreate
  );
});
