/**
 * 接口测试-测试报告模块
 *
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/layout/test_main_tab_tab_s/test_tab_base',
  'pro/common/util',
  'pro/cache/testcase_cache',
  'pro/cache/pro_cache',
  'pro/cache/interface_cache',
  'pro/cache/constraint_cache',
  'pro/cache/datatype_cache',
  'pro/layout/test_main_tab_tab_s/test_report/head',
  'pro/ace/ace',
  'json!3rd/fb-modules/config/db.json'
], function (k, e, u, l, jst, _m, tabBase, util, cache, proCache, interfaceCache, csCache, datatypeCache, Head, AceEditor, db, p, pro) {
  p._$$ModuleTestReport = k._$klass();
  pro = p._$$ModuleTestReport._$extend(tabBase._$$ModuleTestTabBase);

  /**
   * 构建模块
   * @return {Void}
   */
  pro.__doBuild = function () {
    this.__super();
    this.__body = e._$html2node(
      l._$getTextTemplate('module-test-report')
    );
    this.__cache = cache._$$CacheTestCase._$allocate({
      onitemload: function (options) {
        this.__testcase = this.__cache._$getItemInCache(options.id);
        this.__datatypeCache._$getList({
          key: this._listCacheKeydt,
          data: {
            pid: this.__pid
          }
        });
      }._$bind(this)
    });
    //规则函数cache
    this.__csCache = csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this.__interfaceCache._$getItem({id: this.__testcase.interfaceId});
      }.bind(this)
    });
    // HTTP 接口cache
    this.__interfaceCache = interfaceCache._$$CacheInterface._$allocate({
      onitemload: function (result) {
        this.__interface = this.__interfaceCache._$getItemInCache(result.id);
        this.__proCache = proCache._$$CachePro._$allocate({
          onitemload: function () {
            this.__project = this.__proCache._$getItemInCache(this.__pid);
            this.__initPage(this.__testcase, this.__interface);
          }.bind(this)
        });
        this.__proCache._$getItem({
          id: this.__pid
        });
      }._$bind(this)
    });
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
    var _list = e._$getByClassName(this.__body, 'j-flag');
    this.__eValidateTip = _list[0];
    this.__eResponsedata = _list[1];
    this.__afterScript = _list[2];
    this.__responseTime = _list[3];
    this.__eOrigindata = _list[4];
    this.__eResponsehead = _list[5];
    this.__eScriptResult = e._$getByClassName(this.__body, 'd-item-script')[0];
    this.__eTitle = e._$getByClassName(this.__body, 'title')[0];

    this.__noDataElem = e._$getByClassName(this.__body, 'no-item-tip')[0];
    this.__cntWrap = e._$getByClassName(this.__body, 'case-content-wrap')[0];
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  pro.__onRefresh = function (_options) {
    this.__pid = _options.param.pid;
    this.__id = _options.param.id;
    this.__super(_options);
    if (this.__id) {
      e._$addClassName(this.__noDataElem, 'f-dn');
      e._$delClassName(this.__cntWrap, 'f-dn');
    } else { // 没有选中接口
      e._$addClassName(this.__cntWrap, 'f-dn');
      e._$delClassName(this.__noDataElem, 'f-dn');
      return;
    }
    // 通过测试用例进入页面时未经过onHide，这里手动清除原页面上初始化的组件。
    this.__clearModules([this.__editorreq, this.__editorres, this.__requestHead, this.__responseHead, this.__scriptResult, this.__resEdt]);
    this.__eValidateTip.innerHTML = '';
    this._listCacheKeydt = this.__datatypeCache._$getListKey(this.__pid);
    this.__csListCacheKey = this.__csCache._$getListKey(this.__pid);
    this.__resError = [];
    this.__cache._$getItem({id: this.__id});
  };

  /**
   * 渲染页面
   * @param  {Object} testcase - 测试用例详情
   * @param  {Object} interface - 接口详情
   * @return {Void}
   */
  pro.__initPage = function (testcase, interface) {
    this.__eTitle.innerText = '测试报告 - ' + testcase.name;
    //初始化编辑器
    this.__resEdt = new AceEditor({
      data: {
        className: 'res-edt',
        showGutter: true,
        readOnly: true,
        maxLines: 20,
        highlightActiveLine: true,
        empty: '无',
        defaultValue: (function (data) {
          try {
            data = JSON.parse(data);
          } catch (ex) {
            return data;
          }
          return JSON.stringify(data, null, '\t');
        })(testcase.resData)
      }
    });
    // 初始化接收规则处理结果编辑器
    this.__scriptResult = new AceEditor({
      data: {
        className: 'res-edt',
        showGutter: true,
        readOnly: true,
        maxLines: 20,
        highlightActiveLine: true,
        empty: '无'
      }
    });
    this.__scriptResult.$inject(this.__eResponsedata);
    if (testcase.state === db.API_TST_PASS) {
      this.__eValidateTip.innerHTML = '<p class="testsuccess">测试通过</p>';
    } else {
      if (this.__testcase.report) {
        this.__showErrMessage(this.__testcase.report, this.__eValidateTip);
      } else {
        // 检查返回数据是合法json
        var JSONCheckResult = this.__cache._$checkJSON(testcase.resData);
        if (!JSONCheckResult.result) this.__showErrMessage([JSONCheckResult.errorMessage], this.__eValidateTip);
      }
    }

    this.__responseHead = this.__initHead(testcase.resHeader, this.__eResponsehead);
    if (!interface.afterScript) {
      e._$addClassName(this.__eScriptResult, 'f-dn');
      this.__afterScript.innerText = '无';
      if (JSONCheckResult && JSONCheckResult.result) {
        var errs = this.__cache._$check({
          datatypes: this.__datatypes,
          format: this.__interface.resFormat,
          resDefine: this.__interface.params.outputs,
          resData: testcase.resData,
          resHeader: testcase.resHeader,
          resExpect: testcase.resExpect,
          resHeaderExpect: testcase.resExpectHeader,
          checkRequiredParam: !this.__project.resParamRequired
        });
        if (errs !== true) {
          this.__resEdt.$highlight(errs[0]);
          this.__responseHead.$highlight(errs[1]);
          this.__showErrMessage(errs, this.__eValidateTip);
        } else {
          this.__eValidateTip.innerHTML = '<p class="testsuccess">测试通过</p>';
        }
      }
    } else {
      e._$delClassName(this.__eScriptResult, 'f-dn');
      this.__afterScript.innerText = interface.afterScript;
      if (!JSONCheckResult || JSONCheckResult && JSONCheckResult.result) {
        this.__runScript(testcase, interface, JSONCheckResult && JSONCheckResult.result);
      }
    }
    this.__resEdt.$inject(this.__eOrigindata);
    this.__responseTime.innerHTML = (testcase.testEndTime - testcase.testBegTime) + 'ms';
  };


  pro.__runScript = function (testcase, itf, doCheck) {
    var options = {
      code: itf.afterScript,
      params: {
        host: testcase.host,
        path: itf.path,
        method: itf.method,
        headers: this.__parseRes(testcase.resHeader),
        data: this.__parseRes(testcase.resData)
      },
      constraints: this.__csCache._$getListInCache(this.__csListCacheKey),
      onmessage: function (result) {
        this.__scriptResult.$show(result.data);
        if (doCheck) {
          var opt = JSON.parse(result.data);
          var errs = this.__cache._$check({
            datatypes: this.__datatypes,
            format: this.__interface.resFormat,
            resDefine: this.__interface.params.outputs,
            resData: JSON.stringify(opt.data),
            resHeader: JSON.stringify(opt.headers),
            resExpect: testcase.resExpect,
            resHeaderExpect: testcase.resExpectHeader,
            checkRequiredParam: !this.__project.resParamRequired
          });
          errs.forEach(function (error) {
            this.__scriptResult.$highlight(error);
          }.bind(this));
          this.__showErrMessage(errs, this.__eValidateTip);
        }
      }.bind(this),
      onerror: function (error) {
        this.__scriptResult.$show(error.message ? error.message : '' + error);
        this.__eValidateTip.innerHTML = '<p class="testfail">接收规则执行失败</p>';
      }.bind(this)
    };
    this.__cache._$runScript(options);
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  pro.__onHide = function () {
    this.__super();
    this.__eValidateTip.innerHTML = '';
    delete this.__resError;
    this.__clearModules([this.__editorreq, this.__editorres, this.__requestHead, this.__responseHead, this.__scriptResult, this.__resEdt]);
  };

  /**
   * 清除组件
   * @param {Array} modulelist - 需要清除的组件列表
   * @return {Void}
   */
  pro.__clearModules = function (modulelist) {
    modulelist.forEach(function (module) {
      module && module.destroy();
    });
  };

  /**
   * 初始化代请求/响应头
   * @param {Object} data
   * @param {Array} params
   * @param {Node} content
   * @return {Void}
   */
  pro.__initHead = function (data, content) {
    var head;
    try {
      data = JSON.parse(data);
    } catch (ex) {
      // ignore
    }
    head = new Head({
      data: {
        list: data || []
      }
    }).$inject(content);
    return head;
  };

  pro.__parseRes = function (data) {
    try {
      data = JSON.parse(data);
    } catch (ex) {
      return data;
    }
    return data;
  };

  /**
   * 显示输入错误提示信息
   * @param {Object} errors - 错误信息对象
   * @param {Node} content - 错误信息容器
   * @return {Void}
   */
  pro.__showErrMessage = function (errors, content) {
    if (!errors || errors.length < 1) return;
    var validateTip;
    try {
      errors = JSON.parse(errors);
    } catch (e) {
      // ignore
    }
    if (Array.isArray(errors)) {
      validateTip = jst._$add('<p class="testfail">测试失败 <a href="https://github.com/x-orpheus/nei-toolkit/blob/master/doc/NEI平台接口测试使用说明.md#faq" target="_blank">常见失败原因</a></p>' +
        '{list errors as errorlist}{if errorlist && errorlist.length>0}' +
        '<h3>${errorlist_index === 0?"响应数据：":"响应头："}</h3>' +
        '<ol>{list errorlist as error}' +
        '{if error.type === 0}<li>JSON格式错误：${error.message}{if error.row}，行:${error.row}{/if}</li>' +
        '{elseif error.type === 1}<li>类型不匹配：<code class="err-data">${error.keys.join(" -> ")} {if error.message}${error.message|escape}{/if}，期望是 ${error.expect}，实际是 ${error.data} </code></li>' +
        '{elseif error.type === 2}<li>{if error.message}${error.message|escape}{else}期望值不匹配{/if}：expect ${error.expect} -> got <code title=${error.data|escape} class="err-data">${error.data|escape} </code>{if error.row}，行:${error.row}{/if}</li>' +
        '{elseif error.type === 4}<li>{if error.message}${error.message|escape}{else}不支持的字段{/if}：${error.keys.join(" -> ")}</li>' +
        '{elseif error.type === 5}<li>{if error.message}${error.message|escape}{else}多余字段{/if}：${error.keys.join(" -> ")}</li>' +
        '{else}<li>${errorlist_index === 0?"缺少字段":"缺少"}：${error.keys.join(" -> ")}</li>' +
        '{/if}{/list}</ol>{/if}{/list}');
      jst._$render(content, validateTip, {errors: errors});
    } else {
      content.innerHTML = '<p class="testfail">测试失败:</p>' + errors;
    }
  };

  /**
   * 判断是否空对象
   * @param {Object} obj
   * @return {Boolean}
   */
  pro.__isEmptyObject = function (obj) {
    for (var t in obj) return false;
    return true;
  };

  _m._$regist(
    'test-report',
    p._$$ModuleTestReport
  );
});
