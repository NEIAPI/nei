NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/constraint_cache',
  'pro/cache/rpc_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/cache/datatype_cache',
  'pro/cache/parameter_cache',
  'pro/cache/iheader_cache',
  'pro/cache/testcase_cache',
  'pro/param_editor/param_editor',
  'pro/select2/select2',
  'pro/ace/ace',
  'pro/notify/notify',
  'pro/generate_rule/generate_rule',
  'pro/common/regular/regular_base',
  'text!./path_param_table.html',
], function (_k, _e, _u, _t, _l, _jst, _m, util, _csCache, rpcCache, _pgCache, _usrCache, dataTypeCache, paramCache, iheaderCache, testcaseCache, paramEditor, _s2, AceEditor, _notify, GenerateRule, rb, html, _p, _pro) {

  _p._$$ModuleRpcDetailReq = _k._$klass();
  _pro = _p._$$ModuleRpcDetailReq._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-rpc-detail-req')
    );
    this._rpcCacheOptions = {
      onitemload: function () {
        this.__rpc = this._rpcCache._$getItemInCache(this.__id);
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this._pg = this.__pgCache._$getItemInCache(this.__rpc.progroupId);
            this._project = this._pg.projects.find(function (project) {
              return project.id === this.__pid;
            }, this);
            var role = this.__pgCache._$getRole(this.__rpc.progroupId);
            this._permit = true;
            if (role === 'observer') {
              this._permit = false;
            }
            this.__csListCacheKey = this.__csCache._$getListKey(this.__pid);
            this.__csCache._$getList({
              key: this.__csListCacheKey,
              data: {
                pid: this.__pid
              }
            });
          }.bind(this)
        });
        //发送项目组详情请求
        this.__pgCache._$getItem({
          id: this.__rpc.progroupId
        });
      }.bind(this)
    };
    //规则函数cache
    this.__csCache = _csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this.__renderView();
      }.bind(this)
    });
  };

  _pro.__onShow = function (_options) {
    this._rpcCache = rpcCache._$$CacheRpc._$allocate(this._rpcCacheOptions);
    this._paramCache = paramCache._$$CacheParameter._$allocate();
    this.__doInitDomEvent([
      [
        rpcCache._$$CacheRpc, 'update',
        function (evt) {
          if (evt.ext && evt.ext.action === 'menuchange') {
            this._renderMockData();
          }
        }.bind(this)
      ]
    ]);
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__id = parseInt(_options.param.id.replace('/', ''));
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__dataTypeListCacheKey = null;
    this._rpcCache._$getItem({
      id: this.__id
    });
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    if (this.__reqInputEditor) {
      this.__reqInputEditor = this.__reqInputEditor._$recycle();
    }
    this._rpcCache && (this._rpcCache = this._rpcCache._$recycle());
    this._paramCache && (this._paramCache = this._paramCache._$recycle());
  };
  /**
   * 渲染视图
   */
  _pro.__renderView = function () {
    _jst._$render(this.__body, 'rpc-detail-req-content', {
      path: this.__rpc.path,
      mockDelay: this.__rpc.mockDelay,
      id: this.__rpc.id,
      permit: this._permit
    });

    this.__mockUrlCopyLinks = _e._$getByClassName(this.__body, 'copy-mock-url');
    // 请求参数的参数编辑器
    this.__reqInputEditor = paramEditor._$$ParamEditor._$allocate({
      parent: _e._$getByClassName(this.__body, 'inputs-list')[0],
      parentId: this.__id,
      parentType: this._paramCache._dbConst.PAM_TYP_RPC_INPUT,
      pid: this.__rpc.projectId,
      preview: true,
      onChange: function () {
        this._renderMockData();
      }.bind(this)
    });
    this.__doInitDomEvent([
      [
        this.__mockUrlCopyLinks[0], 'click',
        function (e) {
          e.preventDefault();
          util._$copyText(this.__getMockUrl('/api/rpcmock-v2/' + this._pg.toolKey));
          _notify.success('Mock 地址已复制');
        }.bind(this)
      ]
    ]);
    // 高亮范例代码
    this._initSampleCode();
    // Mock 地址
    this.__initMockUrl();
  };

  _pro._initSampleCode = function () {
    this._sampleCodeContainer = _e._$getByClassName(this.__body, 'sample-code')[0];
    this._noSampleCodeContainer = _e._$getByClassName(this.__body, 'no-sample-code')[0];
    this.__dataTypeCache = dataTypeCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        this._renderMockData();
      }.bind(this)
    });
    this.__dataTypeListCacheKey = this.__dataTypeCache._$getListKey(this.__pid);
    this.__dataTypeCache._$getList({
      key: this.__dataTypeListCacheKey,
      data: {
        pid: this.__pid
      }
    });
  };

  _pro._renderMockData = function () {
    var dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
    var rpc = this._rpcCache._$getItemInCache(this.__id);
    var inputs = rpc && rpc.params ? rpc.params.inputs : [];
    var constraints = this.__csCache._$getListInCache(this.__csListCacheKey);
    util._$initParamsSampleCode(this.__rpc.reqFormat, inputs, constraints, dataTypes, this._sampleCodeContainer, this._noSampleCodeContainer, function (result) {
      this.__mockData = result;
    }.bind(this));
  };

  _pro.__initMockUrl = function () {
    var els = _e._$getByClassName(this.__body, 'mock-url');
    var mockUrlProgroupContainer = els[0];
    var mockUrlProgroup = this.__getMockUrl('/api/rpcmock-v2/' + this._pg.toolKey);
    mockUrlProgroupContainer.title = mockUrlProgroup;
    mockUrlProgroupContainer.innerText = 'POST ' + mockUrlProgroup;
  };

  _pro.__getMockUrl = function (prefx) {
    var className = this.__rpc.className;
    var method = this.__rpc.path;
    // 将 url 转换成小写，并将类名中的 '.' 转换成 '-'
    return (window.location.origin + prefx + '/' + className.split('.').join('-') + '-' + method).toLowerCase();
  };

  _m._$regist(
    'rpc-detail-req',
    _p._$$ModuleRpcDetailReq
  );
});
