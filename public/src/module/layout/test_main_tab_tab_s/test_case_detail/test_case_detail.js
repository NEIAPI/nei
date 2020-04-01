/**
 * 接口测试-用例详情
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/layout/test_main_tab_tab_s/test_tab_base',
  'pro/cache/testcase_cache',
  'pro/cache/host_cache',
  'pro/cache/interface_cache',
  'pro/cache/datatype_cache',
  'pro/cache/pro_cache',
  'pro/cache/constraint_cache',
  'pro/interface_test/interface_test',
  'pro/common/util'
], function (_k, _e, _v, _u, _l, jst, _m, tabBase, cache, hostCache, interfaceCache, datatypeCache, proCache, csCache, interfaceTest, util, _p, _pro) {

  _p._$$ModuleTestCaseDetail = _k._$klass();
  _pro = _p._$$ModuleTestCaseDetail._$extend(tabBase._$$ModuleTestTabBase);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-case-detail')
    );
    jst._$add('module-test-case-detail-title');
    this.__titleContent = _e._$getByClassName(this.__body, 'form-title')[0];
    this.__super();
    // 测试cache
    this.__cache = cache._$$CacheTestCase._$allocate({
      onitemsadd: function (result) {
        // 取得testdata列表后开始批量测试
        var host = this.__hostCache._$getItemInCache(this._hostId);
        var tdata = {
          env: host,
          datatypes: this.__datatypes,
          constraints: this.__constraints,
          checkRequiredParam: !this.__project.resParamRequired,
          data: []
        };
        result.data.forEach(function (item) {
          var addItem = tdata.data.filter(function (i) {
            return i.interface.id === item.interfaceId;
          })[0];
          var interface = this.__interfaceObj[item.interfaceId];
          var testdata = this.__cache._$getItemInCache(item.id);
          if (!addItem) {
            tdata.data.push({
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
        this.__cache._$startTests(tdata);
        // 表示已经提交,离开页面时不再弹框警告未保存数据
        this.__isSubmitted = true;
      }._$bind(this),
      onitemupdate: function (result) {
        // 测试用例update代表测试已经完成, 此时需跳转页面到测试报告
        dispatcher._$redirect('/test/group/report/?pgid=' + this.__pgid + '&pid=' + this.__pid + '&iid=' + this.__iid + '&id=' + result.data.id);
      }._$bind(this),
      onitemload: function (result) {
        // 获取测试用例数据并填入表单
        this.__testcasedata = this.__cache._$getItemInCache(result.id);
        this.__renderView(this.xlist, this.__testcasedata);
      }._$bind(this),
      onerror: function () {
        this.__isSubmitted = false;
        this.__disableBtn(this.__submitBtn, this.__btnText, false);
      }.bind(this)
    });
    // 规则函数cache
    this.__csCache = csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this.__constraints = this.__csCache._$getListInCache(this.__csListCacheKey);
        this.__cache._$setTestOptions({
          datatypes: this.__datatypes,
          constraints: this.__constraints
        });
        //请求HTTP 接口详情
        this.__interfaceCache._$getItem({id: this.__iid});
      }.bind(this)
    });

    // 数据模型cache
    this.__datatypeCache = datatypeCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        this.__datatypes = this.__datatypeCache._$getListInCache(this._listCacheKeydt);
        this.__csCache._$getList({
          key: this.__csListCacheKey,
          data: {
            pid: this.__pid
          }
        });

      }._$bind(this)
    });

    // HTTP 接口cache
    this.__interfaceCache = interfaceCache._$$CacheInterface._$allocate({
      onitemload: function () {
        // 创建接口的测试需要先获取接口详情以取得详细参数及请求方法,路径等信息,创建测试时为支持批量创建故采用批量获取
        this.xlist = [];
        var interface = this.__interfaceCache._$getItemInCache(this.__iid);
        this.xlist.push(interface);
        this.__interfaceObj[this.__iid] = interface;
        this.__cache._$getItem({id: this.__id});
      }._$bind(this)
    });
    this.__hostCache = hostCache._$$CacheHost._$allocate({
      onitemload: function (options) {
        this._hostId = options.id;
        if (this.__interfaceTest) {
          this._updateHost();
        }
      }.bind(this)
    });

    this.__projCache = proCache._$$CachePro._$allocate({
      onitemload: function (options) {
        this.__project = this.__projCache._$getItemInCache(options.id);
        if (this.__project.hostId) {
          this.__hostCache._$getItem({
            id: this.__project.hostId
          });
        }
      }.bind(this)
    });
  };

  _pro._updateHost = function () {
    var host = this.__hostCache._$getItemInCache(this._hostId);
    if (host && this.__interfaceTest) {
      this.__interfaceTest.$updateHost(host);
    }
  };

  /**
   * 渲染视图
   * @param {String} template - 该模块对应的jst模版标识
   * @param {Object} data - 渲染页面所需数据
   * @return {Void}
   */
  _pro.__renderView = function (xlist, data) {
    // 渲染表头
    jst._$render(this.__titleContent, 'module-test-case-detail-title', {
      name: this.__testcasedata.name,
      url: this.__referer
    });

    this.__interfaceTest = new interfaceTest({
      data: {
        cache: this.__cache,
        xlist: xlist,
        data: data,
        datatypes: this.__datatypes,
        constraints: this.__constraints,
        isCreateTest: false,
        pid: this.__pid
      }
    });
    this.__interfaceTest.$inject(_e._$getByClassName(this.__body, 'form-body')[0])
      .$on('ready', function (event) {
        this.__reqData = event.reqData;
        var host = this.__hostCache._$getItemInCache(this._hostId);
        event.data.forEach(function (item) {
          item.env = host;
        });
        this.__handleSubmit(event.data, event.button, event.createTest);
      }.bind(this)).$on('show-hosts-dialog', function (event) {
      this.__doSendMessage('/m/test/group', {
        type: 'show-hosts-dialog'
      });
    }.bind(this));
    if (this._hostId) {
      this._updateHost();
    }
  };

  /**
   * 处理表单提交事件
   * @param {Boolean} data
   * @param {Boolean} btn
   * @return {Void}
   */
  _pro.__handleSubmit = function (data, btn, createTest) {
    this.__isSubmitted = true;
    this.__btnText = btn.innerText;
    this.__submitBtn = btn;
    this.__disableBtn(btn, '提交中...', true);
    var submitdata = {
      data: {items: data}
    };
    if (createTest) {
      if (this._listCacheKeytc) {
        submitdata.key = this._listCacheKeytc;
      }
      this.__cache._$addItems(submitdata);
    } else {
      var host = this.__hostCache._$getItemInCache(this._hostId);
      var tdata = {
        env: host,
        datatypes: this.__datatypes,
        constraints: this.__constraints,
        checkRequiredParam: !this.__project.resParamRequired,
        data: [{
          interface: this.__interfaceObj[this.__iid],
          testcases: [{
            testcase: data[0],
            reqData: this.__reqData[this.__iid],
            oldTest: this.__testcasedata
          }]
        }]
      };
      this.__cache._$startTests(tdata);
    }
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__id = _options.param.id;
    this.__pid = _options.param.pid;
    this.__pgid = _options.param.pgid;
    this.__iid = _options.param.iid;
    this.__projCache._$getItem({
      id: this.__pid
    });
    this.__csListCacheKey = this.__csCache._$getListKey(this.__pid);
    this._listCacheKeytc = this.__cache._$getListKey(this.__iid);
    this._listCacheKeydt = this.__datatypeCache._$getListKey(this.__pid);
    this.__listpath = '/test/group/case/?pgid=' + this.__pgid + '&pid=' + this.__pid + '&iid=' + this.__iid;
    var _url = _options.referer ? new URL(_options.referer) : '';
    this.__referer = _url ? _url.pathname + _url.search : this.__listpath;
    if (this.__interfaceTest) {
      this.__interfaceTest = this.__interfaceTest.destroy();
    }
    delete this.__isSubmitted;
    // 数据模型哈希表
    this.__datatypes = {};
    // 待测试接口数据
    this.__interfaceObj = {};
    // 全部请求表单
    this.__datatypeCache._$getList({
      key: this._listCacheKeydt,
      data: {
        pid: this.__pid
      }
    });
  };
  _pro.__onShow = function (_options) {
    this.__doInitDomEvent([[
      proCache._$$CachePro, 'update',
      function (_result) {
        this._hostId = _result.options.data.hostId;
        this._updateHost();
      }._$bind(this)
    ]]);
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    delete this.__referer;
    delete this.__reqData;
    delete this.__isSubmitted;
    if (this.__interfaceTest) {
      this.__interfaceTest = this.__interfaceTest.destroy();
    }
    delete this.__datatypes;
    delete this.__interfaceObj;
  };

  _m._$regist(
    'test-case-detail',
    _p._$$ModuleTestCaseDetail
  );
});
