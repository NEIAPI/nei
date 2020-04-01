NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  '3rd/fb-modules/util/mock_data',
  '3rd/ajv-i18n/index',
  'pro/cache/constraint_cache',
  'pro/cache/interface_cache',
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
  'text!./path_param_table.html'
], function (_k, _e, _u, _t, _l, _jst, _m, util, _mock, localize, _csCache, inCache, _pgCache, _usrCache, dataTypeCache, paramCache, iheaderCache, testcaseCache, paramEditor, _s2, AceEditor, _notify, GenerateRule, rb, html, _p, _pro) {

  _p._$$ModuleInterfaceDetailReq = _k._$klass();
  _pro = _p._$$ModuleInterfaceDetailReq._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-interface-detail-req')
    );
    this._inCacheOptions = {
      onitemload: function () {
        this.__interface = this._inCache._$getItemInCache(this.__id);
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this._pg = this.__pgCache._$getItemInCache(this.__interface.progroupId);
            this._project = this._pg.projects.find(function (project) {
              return project.id === this.__pid;
            }, this);
            this.httpSpec = this._pg.httpSpec;
            var role = this.__pgCache._$getRole(this.__interface.progroupId);
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
          id: this.__interface.progroupId
        });
      }.bind(this),
      onitemupdate: function () {
        this.__interface = this._inCache._$getItemInCache(this.__id);
        this.__checkSchema();
      }.bind(this)
    };
    this.__tcCache = testcaseCache._$$CacheTestCase._$allocate();
    //规则函数cache
    this.__csCache = _csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this.__renderView();
      }.bind(this)
    });
    this.__iheaderCache = iheaderCache._$$CacheIHeader._$allocate({
      onitemsadd: function () {
        this._initReqHeaderEditor();
      }.bind(this),
      onitemupdate: function () {
        this._initReqHeaderEditor();
      }.bind(this)
    });
  };

  _pro.__onShow = function (_options) {
    this._inCache = inCache._$$CacheInterface._$allocate(this._inCacheOptions);
    this._paramCache = paramCache._$$CacheParameter._$allocate();
    this.__doInitDomEvent([
      [
        inCache._$$CacheInterface, 'update',
        function (evt) {
          // 切换参数类别
          if (evt.action === 'update') {
            // 防止每次更新其他都调用这个参数表
            if (evt.options.data.path != null) {
              // 更新路径参数表
              var originalPathParams = this.__interface.params.pathParams;
              this.paramTable.$update('pathParams', this._generateActionData(originalPathParams));
            }
          }

          if (evt.ext && evt.ext.action === 'menuchange') {
            this._renderMockData();
          }
          // 接口修改后测试用例被置为disable状态,清除testcase缓存以重新加载
          if (evt.ext && evt.ext.testRelated) {
            this._clearTestlistCache();
            this.__runScript(this.__scriptCode);// 传给发送规则的参数随之改变
          }
          // 更新在线 mock 地址
          this.__initMockUrl();
        }.bind(this)
      ]
    ]);
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__id = parseInt(_options.param.id.replace('/', ''));
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__dataTypeListCacheKey = null;
    this.__tcListCacheKey = this.__tcCache._$getListKey(this.__id);
    this._inCache._$getItem({
      id: this.__id
    });
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__body.innerHTML = '';
    this.__doClearDomEvent();
    if (this.__reqInputEditor) {
      this.__reqInputEditor = this.__reqInputEditor._$recycle();
    }
    if (this.__reqHeadEditor) {
      this.__reqHeadEditor = this.__reqHeadEditor._$recycle();
    }
    if (this.__methodSelect) {
      this.__methodSelect = this.__methodSelect.destroy();
    }
    this._inCache && (this._inCache = this._inCache._$recycle());
    this._paramCache && (this._paramCache = this._paramCache._$recycle());
    this.__iheaderCache && (this.__iheaderCache = this.__iheaderCache._$recycle());
    this.__scriptResult && (this.__scriptResult.destroy());
  };

  _pro.__checkSchema = function () {
    var methodErrorTipContainer = _e._$getByClassName(this.__body, 'req-method-error-tip')[0];
    var errorTipContainer = _e._$getByClassName(this.__body, 'req-error-tip')[0];
    try {
      if (this.__interface.schema) {
        var schema = JSON.parse(this.httpSpec.interfaceSchema)[this.__interface.schema];
        var reqSchema = schema.req;
        var reqMethod = schema.reqMethod;
        if (reqMethod && reqMethod !== this.__interface.method) {
          methodErrorTipContainer.innerHTML =
            '<div><div class="error-title">规范「'
            + this.__interface.schema
            + '」校验错误：</div>';
          methodErrorTipContainer.innerHTML +=
            '<div class="error-content">请求方式应为 ' +
            reqMethod +
            '</div>';
        } else {
          methodErrorTipContainer.innerHTML = '';
        }
        if (!this.ajv) {
          this.ajv = new Ajv({allErrors: true});
        }
        var dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
        var interfaceData = this._inCache._$getItemInCache(this.__id);
        var inputs = interfaceData && interfaceData.params ? interfaceData.params.inputs : [];
        var mockData = _mock.getParams(this.__interface.reqFormat, inputs, dataTypes);
        var valid = this.ajv.validate(reqSchema, mockData.json);
        if (!valid && mockData.error.length === 0) {
          localize(this.ajv.errors);
          errorTipContainer.innerHTML =
            '<div><div class="error-title">规范「'
            + this.__interface.schema
            + '」校验错误：</div>';

          for (var i = 0; i < this.ajv.errors.length; i++) {
            var curError = this.ajv.errors[i];
            errorTipContainer.innerHTML +=
              '<div class="error-content">data' +
              curError.dataPath +
              curError.message +
              '</div>';
          }
          errorTipContainer.innerHTML += '<div>';
          return this.ajv.errors;
        }
        errorTipContainer.innerHTML = '';
        return true;
      }
      methodErrorTipContainer.innerHTML = '';
      errorTipContainer.innerHTML = '';
      return true;
    } catch (e) {
      methodErrorTipContainer.innerHTML = '';
      errorTipContainer.innerHTML = '';
      return true;
    }
  };

  /**
   * 渲染视图
   * @return {Void}
   */
  _pro.__renderView = function () {
    this.checkHttpSpec = !sessionStorage.getItem('not-check-http-spec');
    _jst._$render(this.__body, 'interface-detail-req-content', {
      path: this.__interface.path,
      mockDelay: this.__interface.mockDelay,
      search: this.__getSearch(this.__interface.method, this.__interface.params.inputs, this.__interface.path),
      id: this.__interface.id,
      permit: this._permit,
      pathActionData: JSON.stringify({
        type: 'modify',
        cache: 'interface',
        id: this.__interface.id,
        name: 'path',
        pattern: this.checkHttpSpec ? this.httpSpec.path : undefined,
        isPathInput: true,
        continueOnError: !this.__checkCreateTime(),
        errorMsg: '请求路径{{value}}不符合HTTP接口规范【' + (this.httpSpec.pathDescription ? this.httpSpec.pathDescription : _u._$escape(this.httpSpec.path)) + '】',
        ext: {testRelated: true}
      })
    });

    this.__scriptIpt = _e._$getByClassName(this.__body, 'script')[0];
    this.__quickSelectReqBodyTypeEl = _e._$getByClassName(this.__body, 'd-quick-select')[0];
    this.__scriptResultContent = _e._$getByClassName(this.__body, 'd-item-scriptResult')[0];
    this.__mockUrlCopyLink = _e._$getByClassName(this.__body, 'copy-mock-url');
    // 初始化“快速选择请求体类型”的选中状态
    this._initQuickSelectReqBodyTypeCheckedValue();
    this.__doInitDomEvent([
      [
        this.__scriptIpt, 'click',
        function () {
          var grModel = new GenerateRule({
            data: {
              pid: this.__pid,
              value: this.__interface.beforeScript,
              title: '发送规则',
              tip: '请输入调用规则函数的 JavaScript 代码, 例如: beforeSend()'
            }
          }).$on('ok', function (data) {
            this.__scriptIpt.value = data;
            if (this.__scriptCode !== data) {
              this.__scriptCode = data;
              this._inCache._$updateItem({
                id: this.__id,
                data: {
                  beforeScript: data
                }
              });
            }
            this.__runScript(data);
          }.bind(this));
        }.bind(this)
      ],
      [
        this.__mockUrlCopyLink[0], 'click',
        function (e) {
          e.preventDefault();
          util._$copyText(this.__getMockUrl('/api/apimock-v2/' + this._pg.toolKey));
          _notify.success('Mock 地址已复制');
        }.bind(this)
      ],
      [
        this.__quickSelectReqBodyTypeEl, 'click',
        function (e) {
          var target = e.target;
          if (target.tagName.toLowerCase() === 'input') {
            this.__iheaderCache._$updateOrCreateReqContentType({
              parentId: this.__id,
              defaultValue: target.value
            });
          }
        }.bind(this)
      ]
    ]);
    //方法选择器
    this._initMethodSelect();
    // Mock 地址
    this.__initMockUrl();
    //路径参数表
    var paramTable = this._getParamTable();
    var parent = _e._$getByClassName(this.__body, 'path-param')[0];
    var pathParams = this._generateActionData(this.__interface.params.pathParams);
    this.paramTable = new paramTable({
      data: {
        pathParams: pathParams,
        permit: this._permit,
        pathSource: this.__pathSource || []
      }
    }).$on('update-path-param-type', function (data) {
      this._paramCache._$updateItem({
        id: data.param.id,
        data: {
          parentId: this.__id,
          parentType: 5,
          type: data.evt.selected.id,
          typeName: data.evt.selected.name
        }
      });
    }.bind(this)).$inject(parent);

    this._initReqHeaderEditor();
    var reqInputEditorContainer = _e._$getByClassName(this.__body, 'd-item-inputs')[0];
    this.__reqInputEditor = paramEditor._$$ParamEditor._$allocate({
      parent: _e._$getByClassName(reqInputEditorContainer, 'inputs-list')[0],
      parentId: this.__id,
      parentType: 2,
      savingKey: 'PARAM_EDITOR_TEMP_PARAM_REQ_' + this.__id,
      pid: this.__interface.projectId,
      preview: true,
      pattern: this.checkHttpSpec && (this.httpSpec.param || this.httpSpec.paramdesc) ? {
        name: this.httpSpec.param,
        description: this.httpSpec.paramdesc
      } : undefined,
      schema: this.__interface.schema && this.httpSpec.interfaceSchema ? JSON.parse(this.httpSpec.interfaceSchema)[this.__interface.schema] : null,
      showModify: true,
      errorMsg: {
        name: '请求参数名称 {{path}} 不符合HTTP接口规范【' + (this.httpSpec.paramDescription ? this.httpSpec.paramDescription : _u._$escape(this.httpSpec.param)) + '】',
        description: '请求参数 {{path}} 的描述 “{{value}}” 不符合HTTP接口规范【' + (this.httpSpec.paramdescDescription ? this.httpSpec.paramdescDescription : _u._$escape(this.httpSpec.paramdesc)) + '】',
      },
      onChange: function () {
        // 当进行navigator时，onHide会比onChange先触发（onChange有请求是异步的）导致出错，故做检查
        if (this.__reqInputEditor) {
          this.__checkSchema();
          this._renderMockData();
          this._clearTestlistCache();
        }
      }.bind(this)
    });
    // 处理规则
    this._initScript();
    // 高亮范例代码
    this._initSampleCode();
  };
  _pro._initQuickSelectReqBodyTypeCheckedValue = function () {
    var contentTypeParam = this.__interface.params.reqHeaders.find(function (header) {
      return header.name.toLowerCase() === 'content-type';
    });
    if (contentTypeParam) {
      var inputs = this.__quickSelectReqBodyTypeEl.querySelectorAll('input');
      inputs.forEach(function (input) {
        if (input.value === contentTypeParam.defaultValue.toLowerCase()) {
          input.checked = true;
        }
      });
    }
  };
  _pro._initReqHeaderEditor = function () {
    //请求头和输入参数的参数编辑器
    var reqHeaderEditorContainer = _e._$getByClassName(this.__body, 'd-item-reqheaders')[0];
    var editorContainer = _e._$getByClassName(reqHeaderEditorContainer, 'header-list')[0];
    if (this.__reqHeadEditor) {
      this.__reqHeadEditor._$reset();
    }
    this.__reqHeadEditor = paramEditor._$$ParamEditor._$allocate({
      parent: editorContainer,
      parentId: this.__id,
      parentType: 0,
      isHeader: true,
      savingKey: 'PARAM_EDITOR_TEMP_HEADER_REQ_' + this.__id,
      pid: this.__interface.projectId,
      preview: true,
      onChange: function () {
        this.__runScript(this.__scriptCode);
        this._clearTestlistCache();
      }.bind(this)
    });
  };
  /**
   * 处理方法选择器
   */
  _pro._initMethodSelect = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'method-select')[0];
    var lastselect;
    if (!!this._permit) {
      var selectedMethod = {
        name: this.__interface.method,
        id: this.__interface.method
      };
      var methodList = util._$getMethodList(selectedMethod);
      this.__methodSelect = new _s2({
        data: {
          source: methodList,
          selected: selectedMethod,
          preview: true,
          choseOnly: true,
          maxLen: 30
        }
      }).$inject(selectDiv).$on('change', function (result) {
        // 防止多次触发change
        if (!result.oSelected) {
          return;
        }
        if (!result.selected.name) {
          this.__methodSelect.$select(lastselect || methodList[0]);
        } else {
          var valid = this.__checkMethod(result.selected.name);
          if (!valid) {
            _notify.show('请求方式' + result.selected.name + '不符合HTTP接口规范【' + (this.httpSpec.methodDescription ? this.httpSpec.methodDescription : _u._$escape(this.httpSpec.method)) + '】', 'error', 3000);
          }
          if (valid || !this.__checkCreateTime()) {
            this._inCache._$updateItem({
              id: this.__id,
              data: {
                method: result.selected.name
              },
              ext: {
                testRelated: true
              }
            });
          } else if (!valid) {
            this.__methodSelect.$select(result.oSelected);
          }
          _e._$getByClassName(this.__body, 'req-search')[0].innerText = this.__getSearch(result.selected.name, this.__interface.params.inputs, this.__interface.path);
          lastselect = result.selected;
        }
      }.bind(this));
    } else {
      selectDiv.innerText = this.__interface.method;
    }
  };

  _pro.__initMockUrl = function () {
    var els = _e._$getByClassName(this.__body, 'mock-url');
    var mockUrlWithProgroupContainer = els[0];
    mockUrlWithProgroupContainer.innerHTML = '';
    var url = this.__getMockUrl('/api/apimock-v2/' + this._pg.toolKey);
    if (this.__interface.method === 'GET') {
      var a = document.createElement('a');
      a.target = '_blank';
      a.href = url;
      a.innerText = url;
      mockUrlWithProgroupContainer.appendChild(a);
    } else {
      mockUrlWithProgroupContainer.innerText = mockUrlWithProgroupContainer.title = url;
    }
  };

  _pro.__getMockUrl = function (prefix) {
    var url = window.location.origin + prefix + this.__interface.path;
    if (this.__interface.method === 'GET') {
      url += this.__getSearch(this.__interface.method, this.__interface.params.inputs, this.__interface.path);
    }
    return url;
  };

  /**
   * 检查接口创建时间是否晚于规范创建时间
   * @return {Boolean} true 表示接口创建时间晚于规范创建时间，限制修改 false则反之
   */
  _pro.__checkCreateTime = function () {
    return !this.httpSpec.createTime || this.__interface.createTime >= this.httpSpec.createTime;
  };

  _pro._getParamTable = function () {
    return rb.extend({
      template: html
    });
  };

  _pro._generateActionData = function (pathParams) {
    var that = this;
    return pathParams.map(function (pathParam) {
      var inputs = ['defaultValue', 'description'];
      inputs.forEach(function (input) {
        var actionData = JSON.stringify({
          type: 'modify',
          cache: 'parameter',
          id: pathParam.id,
          name: input,
          dataExt: {
            'parentId': that.__id,
            'parentType': 5
          },
          ext: {testRelated: true}
        });
        pathParam[input + 'ActionData'] = actionData;
      });
      pathParam['typeSelected'] = {id: pathParam.type, name: pathParam.typeName};
      return pathParam;
    });
  };

  _pro._initSampleCode = function () {
    this._sampleCodeContainer = _e._$getByClassName(this.__body, 'sample-code')[0];
    this._noSampleCodeContainer = _e._$getByClassName(this.__body, 'no-sample-code')[0];
    this.__dataTypeCache = dataTypeCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        var dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
        this.__pathSource = dataTypes.filter(function (dt) {
          return dt.format === 3 || dt.format === 4;
        });
        this.paramTable.$update('pathSource', this.__pathSource);
        this._renderMockData();
        this.__checkSchema();
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

  //onclick
  _pro._initScript = function () {
    this.__scriptResult = new AceEditor({
      data: {
        className: 'script-result-edt',
        showGutter: true,
        readOnly: true,
        highlightActiveLine: true,
        empty: '无'
      }
    });

    this.__scriptResult.$inject(_e._$getByClassName(this.__body, 'script-result')[0]);
    // 初始化处理结果
    this.__scriptCode = this.__interface.beforeScript;
    this.__scriptIpt.value = this.__scriptCode;
    if (this.__scriptCode && this.__interface.params.inputs.length < 1) {
      this.__runScript(this.__scriptCode);
    }
  };

  _pro.__runScript = function (code) {
    if (!code) {
      _e._$addClassName(this.__scriptResultContent, 'f-dn');
      this.__scriptResult.$show('');
    } else {
      _e._$delClassName(this.__scriptResultContent, 'f-dn');
      var options = {
        code: code,
        params: {
          host: '',
          path: this.__interface.path,
          method: this.__interface.method,
          headers: this.__interface.params.reqHeaders.reduce(function (obj, item) {
            obj[item.name] = item.defaultValue;
            return obj;
          }, {}),
          data: this.__mockData
        },
        constraints: this.__csCache._$getListInCache(this.__csListCacheKey),
        onmessage: function (result) {
          this.__scriptResult.$show(result.data);
        }.bind(this),
        onerror: function (error) {
          this.__scriptResult.$show(error.message ? error.message : '' + error);
        }.bind(this)
      };
      this.__tcCache._$runScript(options);
    }
  };

  _pro.__getSearch = function (method, inputs, path) {
    if (method.toLowerCase() !== 'get') {
      return '';
    }
    var search = '';
    _u._$forEach(inputs, function (item, index) {
      if (!item.ignored) {
        if (index != 0) {
          search += '&';
        }
        search += item.name + '=' + item.defaultValue;
      }
    });
    if (path.indexOf('?') > -1) {
      return search ? ('&' + search) : '';
    } else {
      return search ? ('?' + search) : '';
    }
  };

  _pro._renderMockData = function () {
    var dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
    var interface = this._inCache._$getItemInCache(this.__id);
    var inputs = interface && interface.params ? interface.params.inputs : [];
    var constraints = this.__csCache._$getListInCache(this.__csListCacheKey);
    util._$initParamsSampleCode(this.__interface.reqFormat, inputs, constraints, dataTypes, this._sampleCodeContainer, this._noSampleCodeContainer, function (result) {
      this.__mockData = result;
      // 执行发送规则
      this.__runScript(this.__scriptCode);
    }.bind(this));
    // 生成url
    _e._$getByClassName(this.__body, 'req-search')[0].innerText = this.__getSearch(this.__interface.method, inputs, this.__interface.path);
  };

  /**
   * 清除指定接口的测试用例列表
   * @return {Void}
   */
  _pro._clearTestlistCache = function () {
    this.__tcCache._$clearListInCache(this.__tcListCacheKey);
  };

  /**
   * 检查某项输入是否符合
   * @return {Boolean}
   */
  _pro.__checkValidity = function (value, regexStr) {
    if (regexStr == null || regexStr === '') {
      return true;
    } else {
      try {
        var regex = new RegExp(regexStr);
        return regex.test(value);
      } catch (e) {
      }
    }
  };

  /**
   * 检查并显示错误信息
   * @return {Boolean}
   */
  _pro.__checkMethod = function (method) {
    return this.checkHttpSpec ? this.__checkValidity(method, this.httpSpec.method) : true;
  };
  _m._$regist(
    'interface-detail-req',
    _p._$$ModuleInterfaceDetailReq
  );
});
