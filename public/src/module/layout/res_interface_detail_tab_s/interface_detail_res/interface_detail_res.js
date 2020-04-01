NEJ.define([
  'base/klass',
  'base/event',
  'base/element',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  '3rd/fb-modules/util/mock_data',
  '3rd/ajv-i18n/index',
  'pro/cache/constraint_cache',
  'pro/cache/interface_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/cache/datatype_cache',
  'pro/cache/parameter_cache',
  'pro/cache/iheader_cache',
  'pro/cache/testcase_cache',
  'pro/cache/mockstore_cache',
  'pro/param_editor/param_editor',
  'pro/ace/ace',
  'pro/modal/modal',
  'pro/generate_rule/generate_rule',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _v, _e, _u, _t, _l, _m, util, _mock, localize, _csCache, _inCache, _proCache, _pgCache, _usrCache, dataTypeCache, paramCache, iheaderCache, testcaseCache, mockstoreCache, paramEditor, AceEditor, modal, GenerateRule, db, _p, _pro) {
  /**
   * HTTP 接口详情响应信息模块
   * @class   {wd.m._$$ModuleInterfaceDetailRes}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleInterfaceDetailRes = _k._$klass();
  _pro = _p._$$ModuleInterfaceDetailRes._$extend(_m._$$Module);

  var UNSUPPORTED_FORMAT_NAME = {};
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_BOOLEAN] = '布尔值';
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_ENUM] = '枚举值';
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_NUMBER] = '数值';
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_STRING] = '字符值';
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_FILE] = '文件';
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-interface-detail-res')
    );
    this.__editorParts = _e._$getByClassName(this.__body, 'd-item');
    this.__scriptIpt = _e._$getByClassName(this.__body, 'script')[0];
    this.__scriptResultContent = _e._$getByClassName(this.__body, 'd-item-scriptResult')[0];
    this.__refreshMock = _e._$getByClassName(this.__body, 'refresh-mock')[0];
    this.__btnBar = _e._$getByClassName(this.__body, 'btn-bar')[0];
    this.__tip = _e._$getByClassName(this.__body, 'tip')[0];
    this._supportMockMsg = '（Mock 数据已经持久化，可以在下方的文本框中修改范例数据。如果接口已经和数据模型<a href="https://github.com/x-orpheus/nei-toolkit/blob/master/doc/mockstore实现说明.md" target="_blank">关联</a>，则调用在线接口是在操作实际的数据模型数据）';
    this._unsupportMockMsg = '提示：${typeName}暂不支持对 Mock 数据的修改。';
    this.__inCache = _inCache._$$CacheInterface._$allocate({
      onitemload: function () {
        this.__interface = this.__inCache._$getItemInCache(this.__id);
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this._pg = this.__pgCache._$getItemInCache(this.__interface.progroupId);
            this.httpSpec = this._pg.httpSpec;
            var role = this.__pgCache._$getRole(this.__interface.progroupId);
            this._permit = true;
            if (role === 'observer') {
              this._permit = false;
            }
            this._initEditor();
            this.__checkSchema();
          }._$bind(this)
        });

        //发送项目组详情请求
        this.__pgCache._$getItem({
          id: this.__interface.progroupId
        });
      }._$bind(this)
    });
    this.__tcCache = testcaseCache._$$CacheTestCase._$allocate();
    iheaderCache._$$CacheIHeader._$allocate();
    //规则函数cache
    this.__csCache = _csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this._initScript();
      }.bind(this)
    });
    this.__msCache = mockstoreCache._$$CacheMockstore._$allocate({
      onitemload: function (options) {
        this.__mockData = this.__msCache._$getItemInCache(options.id);
        this._renderMockData();
      }.bind(this),
      onsave: function (options) {
        this.__mockData = this.__msCache._$getItemInCache(options.id);
        this._renderMockData();
      }.bind(this),
      onrefresh: function (options) {
        this.__mockData = this.__msCache._$getItemInCache(options.id);
        this._renderMockData();
      }.bind(this)
    });
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
      }.bind(this)
    });
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__id = _options.param.id.replace('/', '');
    this.__pid = _options.param.pid.replace('/', '');
    this.__dataTypewListCacheKey = null;
    this.__tcListCacheKey = this.__tcCache._$getListKey(this.__id);
    this.__super(_options);
    this.__inCache._$getItem({
      id: this.__id
    });
    this.__proCache._$getItem({
      id: this.__pid
    });
  };

  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
    this._paramCache = paramCache._$$CacheParameter._$allocate({
      onitemsadd: function (evt) {
        this._initEditor();
      }.bind(this)
    });
    this.__doInitDomEvent([
      [
        _inCache._$$CacheInterface, 'update',
        function (evt) {
          // 接口修改后测试用例被置为disable状态,清除testcase缓存以重新加载
          if (evt.ext && evt.ext.testRelated) {
            this._clearTestlistCache();
            this.__runScript(this.__scriptCode);// 传给发送规则的参数随之改变
          }
        }.bind(this)
      ],
      [
        this.__scriptIpt, 'click',
        function () {
          var grModel = new GenerateRule({
            data: {
              pid: this.__pid,
              value: this.__interface.afterScript,
              title: '接收规则',
              tip: '请输入调用规则函数的 JavaScript 代码, 例如: afterReceived()'
            }
          }).$on('ok', function (data) {
            this.__scriptIpt.value = data;
            if (this.__scriptCode !== data) {
              this.__scriptCode = data;
              this.__inCache._$updateItem({
                id: this.__id,
                data: {
                  afterScript: data
                }
              });
            }
            this.__runScript(data);
          }.bind(this));
        }.bind(this)
      ],
      [
        this.__refreshMock, 'click', this._refreshMockData.bind(this)
      ]
    ]);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    if (this.__resHeadEditor) {
      this.__resHeadEditor._$reset();
      this.__resHeadEditor = this.__resHeadEditor._$recycle();
    }
    if (this.__resEditor) {
      this.__resEditor._$reset();
      this.__resEditor = this.__resEditor._$recycle();
    }
    this._paramCache && (this._paramCache = this._paramCache._$recycle());
    this.__sampleCode && (this.__sampleCode.destroy());
    this.__scriptResult && (this.__scriptResult.destroy());
  };

  _pro.__checkSchema = function () {
    var errorTipContainer = _e._$getByClassName(this.__body, 'res-error-tip')[0];
    try {
      if (this.__interface.schema) {
        var schema = JSON.parse(this.httpSpec.interfaceSchema)[this.__interface.schema].res;
        if (!this.ajv) {
          this.ajv = new Ajv({allErrors: true});
        }
        var dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
        var interfaceData = this.__interface;
        var inputs = interfaceData && interfaceData.params ? interfaceData.params.outputs : [];
        var mockData = _mock.getParams(this.__interface.resFormat, inputs, dataTypes);
        var valid = this.ajv.validate(schema, mockData.json);
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
      errorTipContainer.innerHTML = '';
      return true;
    } catch (e) {
      errorTipContainer.innerHTML = '';
      return true;
    }
  };

  /**
   * 实例化参数编辑器
   * @return {Void}
   */
  _pro._initEditor = function () {
    this.checkHttpSpec = !sessionStorage.getItem('not-check-http-spec');
    this.__resHeadEditor && this.__resHeadEditor._$reset();
    this.__resHeadEditor = paramEditor._$$ParamEditor._$allocate({
      parent: _e._$getByClassName(this.__editorParts[0], 'header-list')[0],
      parentId: this.__id,
      parentType: 1,
      isHeader: true,
      savingKey: 'PARAM_EDITOR_TEMP_HEADER_RES_' + this.__id,
      pid: this.__interface.projectId,
      preview: true,
      onChange: function () {
        this.__runScript(this.__scriptCode);
        this._clearTestlistCache();
      }.bind(this)
    });
    this.__resEditor && this.__resEditor._$reset();
    this.__resEditor = paramEditor._$$ParamEditor._$allocate({
      parent: _e._$getByClassName(this.__editorParts[1], 'inputs-outputs')[0],
      parentId: this.__interface.id,
      parentType: 3,
      savingKey: 'PARAM_EDITOR_TEMP_PARAM_RES_' + this.__id,
      pid: this.__interface.projectId,
      pattern: this.checkHttpSpec && (this.httpSpec.param || this.httpSpec.paramdesc) ? {
        name: this.httpSpec.param,
        description: this.httpSpec.paramdesc
      } : undefined,
      resSchemaJSON: this.checkHttpSpec && util._$getValidJSON(this.httpSpec.resSchema),
      showModify: true,
      errorMsg: {
        name: '响应参数名称 {{path}} 不符合HTTP接口规范【' + (this.httpSpec.paramDescription ? this.httpSpec.paramDescription : _u._$escape(this.httpSpec.param)) + '】',
        description: '响应参数 {{path}} 的描述 “{{value}}” 不符合HTTP接口规范【' + (this.httpSpec.paramdescDescription ? this.httpSpec.paramdescDescription : _u._$escape(this.httpSpec.paramdesc)) + '】',
      },
      schemaErrorMsg: '响应参数 {{value}} 不符合HTTP接口响应参数规范' + (this.httpSpec.resSchemaDescription ? '【' + this.httpSpec.resSchemaDescription + '】' : '') + '：{{error}}',
      preview: true,
      onChange: function (options, evt) {
        if (
          this.__interface.resFormat === db.MDL_FMT_ARRAY
          || this.__interface.resFormat === db.MDL_FMT_HASH
          || this.__interface.resFormat === db.MDL_FMT_HASHMAP
        ) {
          this.__sampleCode.editor.setReadOnly(false);
          _e._$delClassName(this._sampleCodeErrorTip, 'f-dn');
          _e._$delClassName(this.__btnBar, 'f-dn');
          this.__msCache._$clearItemInCache(this.__interface.id);
          if (evt && evt.action === 'update' && options && options.data) {
            if (options.data.hasOwnProperty('name') || options.data.hasOwnProperty('type') || options.data.hasOwnProperty('ignored') || options.data.hasOwnProperty('defaultValue') || options.data.hasOwnProperty('genExpression') || (evt.ext && evt.ext.isModifyDatatype)) {
              this.__msCache._$getItem({
                interfaceId: this.__interface.id
              });
            }
          } else {
            this.__msCache._$getItem({
              interfaceId: this.__interface.id
            });
          }
          this.__tip.innerHTML = this._supportMockMsg;
        } else {
          this.__sampleCode.editor.setReadOnly(true);
          _e._$addClassName(this._sampleCodeErrorTip, 'f-dn');
          _e._$addClassName(this._sampleCodeContainer, 'f-dn');
          _e._$delClassName(this._noSampleCodeContainer, 'f-dn');
          _e._$addClassName(this.__btnBar, 'f-dn');
          this._renderBasicMockData();
          this.__tip.innerHTML = this._unsupportMockMsg.replace(/\$\{typeName\}/g, UNSUPPORTED_FORMAT_NAME[this.__interface.resFormat]);
        }
        this._checkResSchema();
        this._clearTestlistCache();
        this.__checkSchema();
      }.bind(this)
    });
    // 高亮范例代码
    this._sampleCodeContainer = _e._$getByClassName(this.__body, 'sample-code')[0];
    this._sampleCodeErrorTip = _e._$getByClassName(this.__body, 'error-tip')[0];
    this.__sampleCode && this.__sampleCode.destroy();
    this.__sampleCode = new AceEditor({
      data: {
        showGutter: true,
        readOnly: this.__interface.resFormat !== db.MDL_FMT_HASH
        && this.__interface.resFormat !== db.MDL_FMT_ARRAY
        && this.__interface.resFormat !== db.MDL_FMT_HASHMAP,
        highlightActiveLine: true,
        empty: '无'
      }
    });
    this.__sampleCode.$inject(this._sampleCodeContainer);
    this.__sampleCode.$on('blur', function (options) {
      if (
        this.__interface.resFormat === db.MDL_FMT_ARRAY
        || this.__interface.resFormat === db.MDL_FMT_HASH
        || this.__interface.resFormat === db.MDL_FMT_HASHMAP
      ) {
        var result = this._checkValidity(options.data, this.__interface.resFormat, this.__interface.params.outputs, this.__dataTypes);
        if (result !== true) {
          this._sampleCodeErrorTip.innerHTML = result.map(function (error) {
            return this._errorToMessage(error);
          }, this).join('<br>');
        } else {
          if (this.oldData !== options.data) {
            this._saveMockData();
          }
        }
      }
    }.bind(this)).$on('focus', function () {
      this.oldData = this.__sampleCode.data.value;
      if (
        this.__interface.resFormat === db.MDL_FMT_ARRAY
        || this.__interface.resFormat === db.MDL_FMT_HASH
        || this.__interface.resFormat === db.MDL_FMT_HASHMAP
      ) {
        this._sampleCodeErrorTip.innerHTML = '';
      }
    }.bind(this));
    this._noSampleCodeContainer = _e._$getByClassName(this.__body, 'no-sample-code')[0];
    if (
      this.__interface.resFormat !== db.MDL_FMT_ARRAY
      && this.__interface.resFormat !== db.MDL_FMT_HASH
      && this.__interface.resFormat !== db.MDL_FMT_HASHMAP
    ) {
      _e._$addClassName(this._sampleCodeErrorTip, 'f-dn');
      _e._$addClassName(this.__btnBar, 'f-dn');
      this.__tip.innerHTML = this._unsupportMockMsg.replace(/\$\{typeName\}/g, UNSUPPORTED_FORMAT_NAME[this.__interface.resFormat]);
    } else {
      this.__tip.innerHTML = this._supportMockMsg;
    }
    this.__dataTypeCache = dataTypeCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        this.__csListCacheKey = this.__csCache._$getListKey(this.__pid);
        this.__csCache._$getList({
          key: this.__csListCacheKey,
          data: {
            pid: this.__pid
          }
        });
        this.__dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
        this._checkResSchema();
        this.__tcCache._$setTestOptions({
          datatypes: this.__dataTypes
        });
      }.bind(this)
    });

    this.__dataTypeListCacheKey = this.__dataTypeCache._$getListKey(this.__pid);
    var datatypes = this.__dataTypeCache && this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
    if (datatypes && datatypes.length) {
      this.__dataTypes = datatypes;
      this._checkResSchema();
    }
    this.__dataTypeCache._$getList({
      key: this.__dataTypeListCacheKey,
      data: {
        pid: this.__pid
      }
    });
  };

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
    this.__scriptCode = this.__interface.afterScript;
    this.__scriptIpt.value = this.__scriptCode;
    if (this.__scriptCode && this.__interface.params.outputs.length < 1) {
      this.__runScript(this.__scriptCode);
    }
    if (
      this.__interface.resFormat === db.MDL_FMT_ARRAY
      || this.__interface.resFormat === db.MDL_FMT_HASH
      || this.__interface.resFormat === db.MDL_FMT_HASHMAP) {
      this.__msCache._$getItem({
        interfaceId: this.__interface.id
      });
    } else {
      this._renderBasicMockData();
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
          headers: this.__interface.params.resHeaders.reduce(function (obj, item) {
            obj[item.name] = item.defaultValue;
            return obj;
          }, {}),
          data: this.__mockData
        },
        rootPath: window.location.origin,
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

  _pro._renderMockData = function () {
    _e._$delClassName(this._sampleCodeContainer, 'f-dn');
    _e._$addClassName(this._noSampleCodeContainer, 'f-dn');
    this.__sampleCode.$show(JSON.stringify(this.__mockData, null, '  '));
    // 执行处理规则
    this.__runScript(this.__scriptCode);
  };

  _pro._renderBasicMockData = function () {
    var dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
    var outputs = this.__interface.params.outputs;
    var constraints = this.__csCache._$getListInCache(this.__csListCacheKey);
    util._$initParamsPureSampleCode(this.__interface.resFormat, outputs, constraints, dataTypes, function (result) {
      this.__mockData = result;
      _e._$delClassName(this._sampleCodeContainer, 'f-dn');
      _e._$addClassName(this._noSampleCodeContainer, 'f-dn');
      this.__sampleCode.$show(JSON.stringify(this.__mockData, null, '  '));
      // 执行处理规则
      this.__runScript(this.__scriptCode);
    }.bind(this));
  };

  _pro._saveMockData = function () {
    this.__msCache._$saveMockData({
      data: {
        interfaceId: this.__interface.id,
        mockdata: this.__sampleCode.data.value
      }
    });
  };

  _pro._refreshMockData = function () {
    this.__resetDialog = modal.confirm({
      content: '您确定要重置 Mock 数据吗？重置后，会按照接口定义重新生成一份的随机 Mock 数据，原先的 Mock 数据不会保留。一般情况下，只有当 Mock 数据和接口定义不一致时可以使用该功能。',
      title: '重置 Mock 数据确认',
      closeButton: true,
      okButton: '重置',
      cancelButton: true
    }).$on('ok', function () {
      this.__msCache._$refreshMockData({
        iid: this.__interface.id
      });
      this.__resetDialog = this.__resetDialog.destroy();
      this.__resetDialog = null;
    }.bind(this));
  };

  _pro._checkValidity = function (data, format, outputs, datatypes) {
    var errors = [];
    try {
      data = JSON.parse(data);
    } catch (e) {
      errors.push({
        type: 0
      });
      return errors;
    }
    var resParamRequired = this.__project.resParamRequired;

    function checkUnnecessaryData(format, data, params, keys) {
      switch (format) {
        case db.MDL_FMT_STRING:
        case db.MDL_FMT_NUMBER:
        case db.MDL_FMT_BOOLEAN:
        case db.MDL_FMT_ENUM:
          return;
        case db.MDL_FMT_ARRAY:
          if (Array.isArray(data) && data.length) {
            // 如果数组类别为数组，则可以包含不同类型的元素，只要匹配其中一个元素的类型即可
            if (params.length === 1) {
              // 只有一个类型的情况应该是大多数情况，逻辑保持不变，提示更精确
              var elementType = params[0].type;
              var datatype = datatypes.find(function (dt) {
                return dt.id === elementType;
              });
              data.forEach(function (item) {
                checkUnnecessaryData(datatype.format, item, datatype.params, keys);
              });
            } else {
              data.forEach(function (item, idx) {
                var arrayCheckResult = false;
                for (var i = 0; i < params.length; i++) {
                  var elementType = params[i].type;
                  var datatype = datatypes.find(function (dt) {
                    return dt.id === elementType;
                  });
                  var prevErrorDetailLength = errors.length;
                  checkUnnecessaryData(datatype.format, item, datatype.params, keys);
                  if (errors.length === prevErrorDetailLength) {
                    // 如果没有错误，则说明匹配到了，就可以停止了
                    arrayCheckResult = true;
                    break;
                  } else {
                    // 还原
                    errors.length = prevErrorDetailLength;
                  }
                }
                if (arrayCheckResult === false) {
                  // 说明和数组定义的所有类型都不一致
                  errors.push(
                    {
                      type: 6,
                      keys: keys.concat(idx)
                    }
                  );
                }
              });
            }
          }
          return;
        case db.MDL_FMT_HASH:
          if (data === null || Array.isArray(data) || typeof data !== 'object') {
            return;
          }
          Object.keys(data).forEach(function (key) {
            var foundParam = params.find(function (param) {
              // 需要考虑被忽略的情况
              return param.name === key && param.ignored !== 1;
            });
            if (foundParam) {
              function checkParam(value) {
                if (value !== null && typeof value === 'object') {
                  var datatype = datatypes.find(function (datatype) {
                    return datatype.id === foundParam.type;
                  });
                  checkUnnecessaryData(datatype.format, value, datatype.params, keys.concat([foundParam.name]));
                }
              }

              var value = data[key];
              if (foundParam.isArray) {
                if (Array.isArray(value) && value.length) {
                  value.forEach(function (item) {
                    checkParam(item);
                  });
                }
              } else {
                checkParam(value);
              }
            } else {
              result = false;
              errors.push({
                type: 4,
                keys: keys.concat([key])
              });
            }
          });
          return;
        case db.MDL_FMT_HASHMAP:
          if (data === null || Array.isArray(data) || typeof data !== 'object') {
            return;
          }
          var foundParam = params.find(function (param) {
            // 需要考虑被忽略的情况
            return param.name === '值' && param.ignored !== 1;
          });
          if (foundParam) {
            function checkParam(value) {
              if (value !== null && typeof value === 'object') {
                var datatype = datatypes.find(function (datatype) {
                  return datatype.id === foundParam.type;
                });
                checkUnnecessaryData(datatype.format, value, datatype.params, keys.concat([foundParam.name]));
              }
            }

            var objKeys = Object.keys(data);
            for (var i = 0; i < objKeys.length; i++) {
              value = data[objKeys[i]];
              if (foundParam.isArray) {
                if (Array.isArray(value) && value.length) {
                  value.forEach(function (item) {
                    checkParam(item);
                  });
                }
              } else {
                checkParam(value);
              }
            }
          } else {
            result = false;
            errors.push({
              type: 4,
              keys: keys.concat([key])
            });
          }
          return;
      }
    }

    function checkMissParam(data, params) {
      if (Array.isArray(data)) {
        return;
      }
      params.forEach(function (param) {
        var val = data[param.name];
        if (val === undefined && (param.ignored === 0 && ((resParamRequired === 1 && param.required === 1) || resParamRequired === 0))) {
          errors.push({
            type: 3,
            keys: [param.name]
          });
        }
      });
    }

    if (Array.isArray(data) && format === db.MDL_FMT_ARRAY) {
      if (outputs.length === 1) {
        // 数组只有一个元素，是绝大多数情况
        var dt = datatypes.find(function (item) {
          return item.id === outputs[0].type;
        });
        data.forEach(function (item, index) {
          var checkResult = this.__tcCache._$isTypeMatched(item, dt, outputs[0].isArray, [index], resParamRequired, datatypes);
          if (!checkResult.result) {
            errors = errors.concat(checkResult.errorMessage);
          }
        }, this);
      } else {
        // 数组有多个元素，可以是不同的类型
        data.forEach(function (item, index) {
          var arrayCheckResult = false;
          for (var i = 0; i < outputs.length; i++) {
            var dt = datatypes.find(function (item) {
              return item.id === outputs[i].type;
            });
            var checkResult = this.__tcCache._$isTypeMatched(item, dt, outputs[i].isArray, [index], resParamRequired, datatypes);
            if (checkResult.result) {
              arrayCheckResult = true;
              break;
            }
          }
          if (arrayCheckResult === false) {
            // 和数组的所有元素类型都不匹配
            errors = errors.concat([{
              type: 6,
              keys: [index]
            }]);
          }
        }, this);
      }
    } else if (data && data.toString() === '[object Object]' && format === db.MDL_FMT_HASH) {
      Object.keys(data).forEach(function (key) {
        var val = data[key];
        var param = outputs.find(function (item) {
          return item.name === key;
        });
        if (param) {
          var dt = datatypes.find(function (item) {
            return item.id === param.type;
          });
          var checkResult = this.__tcCache._$isTypeMatched(val, dt, param.isArray, [key], resParamRequired, datatypes);
          if (!checkResult.result) {
            errors = errors.concat(checkResult.errorMessage);
          }
        }
      }, this);
    } else if (data && data.toString() === '[object Object]' && format === db.MDL_FMT_HASHMAP) {

      var keyParam = outputs.find(function (item) {
        return item.name === '键';
      });
      var valueParam = outputs.find(function (item) {
        return item.name === '值';
      });

      var keyDataType = datatypes.find(function (item) {
        return item.id === keyParam.type;
      });

      var valueDataType = datatypes.find(function (item) {
        return item.id === valueParam.type;
      });
      Object.keys(data).forEach(function (key) {
        var keyVal = key;
        var valueVal = data[key];
        var checkKeyResult = this.__tcCache._$isTypeMatched(keyVal, keyDataType, keyParam.isArray, [key], resParamRequired, datatypes);
        if (!checkKeyResult.result) {
          errors = errors.concat(checkKeyResult.errorMessage);
        }
        var checkValueResult = this.__tcCache._$isTypeMatched(valueVal, valueDataType, valueParam.isArray, [key], resParamRequired, datatypes);
        if (!checkValueResult.result) {
          errors = errors.concat(checkValueResult.errorMessage);
        }
      }, this);
    } else {
      errors.push({
        type: 5
      });
      return errors;
    }
    checkUnnecessaryData(format, data, outputs, []);
    checkMissParam(data, outputs);
    return errors.length ? errors : true;
  };

  _pro._errorToMessage = function (error) {
    var keysPath = function (keys) {
      return keys.reduce(function (sum, item) {
        if (typeof item === 'number') {
          if (sum) {
            sum += '[' + item + ']';
          } else {
            sum += '数组第 ' + item + ' 项';
          }
        } else {
          sum && (sum += ' -> ');
          sum += item;
        }
        return sum;
      }, '');
    };
    switch (error.type) {
      case 0:
        return '不是合法的JSON！';
      case 1:
        return '类型不匹配：' + keysPath(error.keys) + ' expect ' + error.datatype;
      case 3:
        return '缺少参数：' + keysPath(error.keys);
      case 4:
        return '多余参数：' + keysPath(error.keys);
      case 5:
        return '不是数组或对象类型！';
      case 6:
        return '数组数据和定义的数组元素类型全部不匹配，' + keysPath(error.keys);
    }
  };

  _pro._checkResSchema = function () {
    var self = this;
    if (!this.checkHttpSpec) {
      return;
    }
    var resSchema = util._$getValidJSON(this.httpSpec.resSchema);
    if (resSchema && this.__interface.resFormat === db.MDL_FMT_HASH) {
      var errors = [];
      this.__interface.params.outputs.forEach(function (param) {
        if (param.ignored !== 1) {
          var checkResult = util._$checkSingleSchema(param, resSchema, this.__dataTypes);
          if (!checkResult.result) {
            errors.push(checkResult.error);
          }
        }
      }, this);
      // 检查缺少参数
      resSchema.forEach(function (rule) {
        // 只检查required为1的参数
        if (rule.required !== 0) {
          // 可能一个导入一个添加，其中的一个隐藏了，只要有非ignored即可
          var params = this.__interface.params.outputs.filter(function (p) {
            return p.name === rule.name;
          });
          if (params.length) {
            var result = params.some(function (param) {
              if (param.ignored !== 1) {
                return true;
              }
              return false;
            });
            if (!result) {
              errors.push('缺少参数：' + rule.name);
            }
          } else {
            errors.push('缺少参数：' + rule.name);
          }
        }
      }, this);
      if (errors.length) {
        errors.unshift('提示：该接口不符合该项目所定义的 HTTP 接口规范，如果是老接口，请忽略下面的错误提醒：');
        if (this.__interface.params.outputs.length === 0) {
          // 没有填写参数，一般就是新创建接口后。自动去检测有没有对应的数据模型，有的话，提示用户，然后可以一键导
          // 只检测第一层是否匹配，并且只检测名称是否匹配，感觉是能解决绝大多数场景了
          var schema = {};
          resSchema.forEach(function (item) {
            if (item.required) {
              schema[item.name] = item.type;
            }
          });
          var schemaKeys = Object.keys(schema);
          var foundDatatype = this.__dataTypes.find(function (dt) {
            if (dt.params.length === schemaKeys.length) {
              var allMatch = true;
              schemaKeys.forEach(function (key) {
                if (allMatch) {
                  var foundParam = dt.params.find(function (param) {
                    return param.name === key;
                  });
                  if (!foundParam) {
                    allMatch = false;
                  }
                }
              });
              return allMatch;
            }
          });
          if (foundDatatype) {
            var tip = '<p class="import-tip">系统找到了可能符合规范的响应数据模型 ' + foundDatatype.name + ' ，<button type="button" class="u-btn simple-import-datatype">立即导入</button></p>';
            errors.unshift(tip);
          } else {
            var tip = '<p class="import-tip">系统未找到符合规范的响应数据模型，建议创建一个统一的响应模型，或者也可以 <button type="button" class="u-btn simple-create-params">一键创建参数</button></p>';
            errors.unshift(tip);
          }
        }
        this.__resSchemaCheckResult = _e._$getByClassName(this.__body, 'check-result')[0];
        this.__resSchemaCheckResult.innerHTML = errors.join('<br>');
        _e._$delClassName(this.__resSchemaCheckResult, 'f-dn');
        var importBtn = _e._$getByClassName(this.__resSchemaCheckResult, 'simple-import-datatype')[0];
        var createParamsBtn = _e._$getByClassName(this.__resSchemaCheckResult, 'simple-create-params')[0];
        if (importBtn) {
          _v._$addEvent(
            importBtn, 'click', function (evt) {
              var options = {
                data: {
                  items: [
                    {
                      parentId: self.__interface.id,
                      parentType: db.PAM_TYP_OUTPUT,
                      imports: [
                        {
                          id: foundDatatype.id
                        }
                      ]
                    }
                  ]
                }
              };
              self._paramCache._$addItems(options);
            }, false
          );
        } else if (createParamsBtn) {
          _v._$addEvent(
            createParamsBtn, 'click', function (evt) {
              var options = {
                data: {
                  items: [
                    {
                      parentId: self.__interface.id,
                      parentType: db.PAM_TYP_OUTPUT,
                      params: []
                    }
                  ]
                }
              };
              options.data.items[0].params = resSchema.map(function (schema) {
                return {
                  name: schema.name,
                  required: schema.required || 1,
                  description: schema.description,
                  isArray: schema.isArray || 0,
                  // type 在定义规范的时候是一个数组，可以是多个值，这里自动创建的话就取第一个
                  type: util._$getSystemDatatypeIdByTypeName(schema.type[0])
                };
              });
              self._paramCache._$addItems(options);
            }, false
          );
        }
      } else {
        _e._$addClassName(this.__resSchemaCheckResult, 'f-dn');
      }
    } else {
      _e._$addClassName(this.__resSchemaCheckResult, 'f-dn');
    }
  };

  /**
   * 清除指定接口的测试用例列表
   */
  _pro._clearTestlistCache = function () {
    this.__tcCache._$clearListInCache(this.__tcListCacheKey);
  };

  // notify dispatcher
  _m._$regist(
    'interface-detail-res',
    _p._$$ModuleInterfaceDetailRes
  );
});
