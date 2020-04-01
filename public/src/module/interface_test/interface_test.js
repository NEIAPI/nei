/*
 * 接口测试公共模块
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/modal/modal',
  'pro/ace/ace',
  'json!3rd/fb-modules/config/db.json',
  'pro/cache/datatype_cache',
  'text!./interface_test.html',
  'css!./interface_test.css'
], function (rb, v, u, e, util, modal, aceEditor, db, dtCache, html, css) {
  // 加载一次
  e._$addStyle(css);

  // 默认选项
  var defaultOptions = {
    // 待测试的接口列表
    xlist: [],
    // 用到的缓存对象
    cache: {},
    // 是否是创建测试,false则显示测试详情
    isCreateTest: true,
    // 安装后需要刷新页面
    refreshAfterIst: false,
    // 详情模式下的需填入的数据
    data: {},
    // 是否只读
    readOnly: false,
    // 代码编辑器对象
    editors: {},
    // 表单是否合法可提交
    errCount: 0,
    // 是否安装了测试所需的插件proxy tool
    isxhrptIst: false,
    defaultHost: '',

    // 本地存储需要变量
    autoSavingIntervalId: null,
    interfaceId: null,
    submit: false,
    isFirstHostUpdated: false,
    TYPE: {
      system: db.MDL_TYP_SYSTEM,
      normal: db.MDL_TYP_NORMAL,
      hidden: db.MDL_TYP_HIDDEN
    },

    FORMAT: {
      file: db.MDL_FMT_FILE,
      hash: db.MDL_FMT_HASH,
      enum: db.MDL_FMT_ENUM,
      array: db.MDL_FMT_ARRAY,
      string: db.MDL_FMT_STRING,
      number: db.MDL_FMT_NUMBER,
      boolean: db.MDL_FMT_BOOLEAN,
      hashmap: db.MDL_FMT_HASHMAP
    }
  };

  var InterfaceTest = rb.extend({
    name: 'interfaceTest',
    template: html,
    config: function () {
      this.data = u._$merge({}, defaultOptions, this.data);
      // 把传过来的数据类型列表转换成需要的样子
      this.datatypeObj = {};
      this.data.datatypes.forEach(function (datatype) {
        this.datatypeObj[datatype.id] = datatype;
      }, this);

      // 检查XHR proxy tool插件是否安装
      this.data.cache._$checkXhrpt(function () {
        this.data.isxhrptIst = true;
      }.bind(this));

      // 初始化xlist
      this.initXlist();

      var reqContentTypeParam = this.data.xlist[0].params.reqHeaders.find(function (header) {
        return header.name.toLowerCase() === 'content-type';
      });
      this.data.reqContentType = reqContentTypeParam ? reqContentTypeParam.defaultValue.toLowerCase() : '';
      // 执行发送规则（如果有）
      this.data.xlist.forEach(function (x) {
        this.runScript(x);
      }, this);

      if (location.origin !== 'https://nei.netease.com') { // 不能内联安装
        this.data.refreshAfterIst = true;
      }
      this.data.hiddenIgnored = true;
    },

    init: function () {
      this.supr();
      if (this.data.isCreateTest) {
        // 等待mock数据及host更新完毕
        var self = this;
        this.data.checkParamSetTimeoutId = setTimeout(function () {
          self.checkParamChange(true);
        }, 700);
      }
    },

    destroy: function () {
      this.supr();
      if (this.data.isCreateTest) {
        clearTimeout(this.data.checkParamSetTimeoutId);
        this.autoSaving(false);
        this.checkParamChange(false);
        if (this.data.submit) {
          // 已提交移除本地存储
          this.removeXlistFromLocalStorage();
        }
      }
    },

    /**
     * 检查某一项输入是否符合定义
     */
    checkValidity: function (item, format, params, x, ignoreMissError) {
      if (item.__value === null || item.__value === undefined || item.__value === '') {
        item.__transformedValue = '';
        x && this.runScript(x);
        return;
      }
      var value = this.data.cache._$doTransformType(item.__value, item.__datatype.format, params || [item], this.data.datatypes);
      var checkResult = this.data.cache._$isTypeMatched(value, params ? {
        format: format,
        params: params
      } : item.__datatype,
        (format == db.MDL_FMT_ARRAY) + item.isArray, null, null, this.data.datatypes);
      if (!checkResult.result) {
        var errors = [].concat(checkResult.errorMessage);
        item.__errState = item.__errState || [];
        // 为了实现检查响应预期时忽略缺少参数的错误
        if (ignoreMissError) {
          errors = errors.filter(function (err) {
            return value && err.type !== 3;
          });
        }
        // 错误计数器，标记输入和发状态，控制是否可提交
        this.data.errCount += errors.length;
        item.__errState = item.__errState.concat(errors);
        // 缺少参数，也要设置transformedValue，如深层Object对象的确实，否则测试用例无法保存
        item.__transformedValue = checkResult.value;
      } else {
        item.__transformedValue = checkResult.value;
      }
      x && this.runScript(x);
    },

    onEditorChange: function (event, item, key) {
      key = key || '__value';
      item[key] = event.data;
    },

    onFileChoosen: function (event, item) {
      item.__value = item.__transformedValue = event.target.files[event.target.files.length - 1];
    },

    onSubmitClick: function (event, createTest) {
      if (!this.data.isxhrptIst) {
        new modal({
          data: {
            'content': '测试依赖XHR Proxy Tool插件,请安装:',
            'title': '请安装插件',
            'closeButton': true,
            'okButton': '安装',
            'cancelButton': true
          }
        }).$on('ok', function () {
          this.installXhrExt();
        }._$bind(this));
        return;
      }
      // 检查一遍必须值
      if (this.data.errCount < 1) {
        this.data.xlist.forEach(function (x, index) {
          this.checkEmpty(x.__test.name, 'value');
          index === 0 && (this.checkEmpty(x.__test.host, 'value'));
          x.params.inputs.forEach(function (input, index) {
            //留一手枚举，否则重复调用checkValidity引起错误计数混乱
            if (x.reqFormat !== this.data.FORMAT.enum || index < 1) {
              this.checkValidity(
                input, x.reqFormat,
                x.reqFormat === this.data.FORMAT.enum && x.params.inputs
              );
            }
          }, this);
          x.params.outputs.forEach(function (output, index) {
            if (x.resFormat !== this.data.FORMAT.enum || index < 1) {
              this.checkValidity(
                output,
                x.resFormat,
                x.resFormat === this.data.FORMAT.enum && x.params.outputs,
                x,
                true
              );
            }
          }, this);
          x.params.pathParams && x.params.pathParams.forEach(function (param) {
            this.checkPathParam(param, '__value');
          }, this);
        }, this);
      }
      if (this.data.errCount < 1) {
        this.$emit('ready', {
          data: this.$getData(true),
          button: event.origin,
          createTest: createTest,
          reqData: (function () {
            var reqData = {};
            this.data.xlist.forEach(function (x) {
              reqData[x.id] = this._getReqData(x);
            }, this);
            return reqData;
          }.bind(this))()
        });
        this.data.submit = true;
      }
    },

    manageHosts: function () {
      this.$emit('show-hosts-dialog');
    },

    /**
     * 检查输入是否为空
     * @param {Object} item
     * @param {String} field - 输入字段
     * @param {Boolean} runScript - 检查合法后是否执行发送规则
     */
    checkEmpty: function (item, field, runScript) {
      if (!item[field]) {
        this.data.errCount++;
        item.error = !0;
      } else {
        item.error && (this.data.errCount--); // 如果刚进入页面输入正确后错误计数机不减一,因为刚进去计数器为零，再减就负了。。。
        item.error = !1;
        if (runScript) {
          this.data.xlist.forEach(function (x) {
            this.runScript(x);
          }, this);
        }
      }
    },
    checkPathParam: function (item, field) {
      this.checkEmpty(item, field);
      if (!item.error) {
        var value = item[field];
        if (item.__datatype.format === 4) {
          if (!/^\d+$/.test(value.trim())) {
            item.errorMsg = '"' + item[field] + '" 不是' + item.typeName + '类型！';
          } else {
            item.errorMsg = '';
          }
        } else {
          item.errorMsg = '';
        }
      }
    },
    /**
     * 根据错误信息列表生成错误提示
     * @param {Array} errList - 错误信息列表
     * @return {String} 错误提示
     */
    getErrMsg: function (errList) {
      var errs = [];
      errList.forEach(function (err) {
        switch (err.type) {
          case 0:
            errs.push('JSON格式错误!');
            break;
          case 1:
            errs.push(err.data + ' 不是' + err.datatype + '类型');
            break;
          case 3:
            errs.push('缺少字段：' + err.keys.join(' -> '));
            break;
        }
      });
      return errs.join(',');
    },

    installXhrExt: function (evt) {
      evt && evt.preventDefault();
      window.open('https://chrome.google.com/webstore/detail/fbakmpanchidgmjopcmcddoihgjkfcjn');
    },

    /**
     * 隐藏输入框旁的错误提示
     * @param {Array} errState - 该项对应的错误信息列表
     */
    hideErrMsg: function (errState) {
      if (!errState) {
        return;
      }
      this.data.errCount -= errState.length;
      errState.length = 0;
    },

    /**
     * 对该用例运行发送规则
     * @param {Object} x
     */
    runScript: function (x) {
      var data = this._getDataFromTest(this._getData(x));
      var items = ['beforeScript', 'inputs', 'reqHeaders', 'beforeScriptResult'];
      if (x[items[0]]) {
        var options = {
          code: x[items[0]],
          params: {
            host: data.host,
            path: x.path,
            method: x.method,
            headers: data[items[2]],
            data: data[items[1]]
          },
          rootPath: window.location.origin,
          constraints: this.data.constraints,
          onmessage: function (result) {
            x[items[3]] = result.data;
            this.$update();
          }.bind(this),
          onerror: function (error) {
            x[items[3]] = error.message ? error.message : '' + error;
            this.$update();
          }.bind(this)
        };
        util._$runScript(options);
      }
    },

    /**
     * 更新host
     * @param {string} host 默认服务器
     */
    $updateHost: function (host) {
      var envName = host.value + '<' + host.name + '>';
      this.data.xlist[0].__test.host.value = envName;
      this.data.xlist[0].__test.host.oValue = host.value;
      this.data.defaultHost = envName;
      this.checkEmpty(this.data.xlist[0].__test.host, 'value');
      this.$update();
    },

    sortParams: function (params) {
      var pos = {};
      params.forEach(function (p) {
        if (p.datatypeId) {
          var dt = this.datatypeObj[p.datatypeId];
          var dtParam = dt.params.filter(function (p1) {
            return p1.id === p.id;
          });
          pos[p.id] = parseFloat(p.position + '.' + dtParam[0].position);
        } else {
          pos[p.id] = p.position;
        }
      }, this);
      params = params.sort(function (a, b) {
        return pos[a.id] < pos[b.id];
      });
      return params;
    },

    /**
     * 组织视图数据
     * @param {Array} xlist
     * @param {Array} data
     * @return {Array}
     */
    _copyXlist: function (xlist, data, genMockData) {
      genMockData = typeof genMockData === 'boolean' ? genMockData : true;
      var dataMap = {};
      if (data && u._$isArray(data)) {
        data.forEach(function (caseData) {
          dataMap[caseData.interfaceId] = caseData;
        });
      }
      return xlist.map(function (x) {
        data && (data = this._getDataFromTest(dataMap[x.id] || data));
        var basicItems = ['name', 'host', 'description'];
        var interfaceParams = ['reqHeaders', 'resHeaders', 'inputs', 'outputs', 'pathParams'];
        x = this.copy(x);
        x.__test = {};

        ['inputs', 'outputs'].forEach(function (p) {
          if (Array.isArray(x.params[p])) {
            x.params[p] = x.params[p].filter(function (param) {
              return !param.ignored;
            });
            x.params[p] = this.sortParams(x.params[p]);
          }
        }, this);
        // 填入数据或初始化为空
        interfaceParams.forEach(function (item) {
          x.params[item].forEach(function (param) {
            var itemData = data ? data[item] : null;
            if (itemData && u._$isObject(itemData)) {
              itemData = itemData[param.name];
            }
            if (item === 'outputs' || item === 'resHeaders') {
              // 响应期望值不使用默认值，两者不等价
              // param.__value = itemData ? itemData.value : param.defaultValue;
              param.__value = itemData ? itemData.value : '';
              param.__error = itemData ? itemData.error : '';
            } else {
              param.__value = itemData === null ? param.defaultValue : itemData;
            }
            if (item === 'inputs') {
              param.__options = data ? data.inputOptions[param.id] || {} : {};
            }
            param.__transformedValue = param.__value;
            (typeof param.__value !== 'string' && this.datatypeObj[param.type].format !== db.MDL_FMT_HASH) && (param.__value = JSON.stringify(param.__value));
          }, this);
        }, this);

        basicItems.forEach(function (item) {
          x.__test[item] = {value: data ? data[item] : ''};
          if (item === 'name') {
            // 生成默认用例名
            x.__test[item] = {value: data ? data[item] : x.name + '-用例-' + u._$format(new Date(), 'yyyyMMddHHmmss')};
          } else if (item === 'host') {
            x.__test[item] = {value: this.data.defaultHost};
          }
        }, this);

        if (this.data.isCreateTest && genMockData) {
          this.generateMockData(x, 'inputs');
          this.generateMockData(x, 'pathParams');
        }

        // 处理重复的属性
        x.params.inputs = this.data.cache._$clearRepeatedParam(x.params.inputs, x.reqFormat);
        x.params.outputs = this.data.cache._$clearRepeatedParam(x.params.outputs, x.resFormat);

        // 为模版提供数据类型信息
        [x.params.inputs, x.params.outputs, (x.params.pathParams || [])].forEach(function (params) {
          params.forEach(function (param) {
            param && (param.__datatype = this.datatypeObj[param.type]);
          }, this);
        }, this);

        ['inputs', 'outputs'].forEach(function (p) {
          if (Array.isArray(x.params[p])) {
            if (
              p === 'inputs' && x.reqFormat === db.MDL_FMT_HASHMAP
              || p === 'outputs' && x.resFormat === db.MDL_FMT_HASHMAP
            ) {
              var val = x.params[p].find(function (param) {
                return param.name === '值';
              });
              var key = x.params[p].find(function (param) {
                return param.name === '键';
              });
              x.params[p] = [key, val];
            }
          }
        });

        return x;
      }, this);
    },

    _getDataFromTest: function (test) {
      // 就是一堆JOSN.parse把数据从测试用例详情中解析出来方便整合
      test = this.copy(test);
      var _reqdata = test.reqData ? JSON.parse(test.reqData) : {};
      test.reqHeaders = test.reqHeader ? JSON.parse(test.reqHeader) : {};
      test.resHeaders = test.resExpectHeader ? JSON.parse(test.resExpectHeader) : {};
      test.outputs = test.resExpect ? JSON.parse(test.resExpect).__onlyParam || JSON.parse(test.resExpect) : {};//兼容之前数据格式__onlyParam，之后不再使用,下同
      test.inputs = _reqdata.reqParams && _reqdata.reqParams.__onlyParam || _reqdata.reqParams;
      test.inputOptions = _reqdata.reqParamsOptions || {};
      test.pathParams = _reqdata.pathParams || {};
      return test;
    },

    /**
     * 获取指定测试用例数据
     * @param {Object} x
     * @param {Boolean} useError - 是否需要取得错误提示（用于执行接收规则时取得没有错误提示的数据，目前只执行发送规则时用不到）
     * @return {Object}
     */
    _getData: function (x, useError) {
      return {
        // 获取基础信息
        host: this.data.xlist[0].__test.host.oValue,
        interfaceId: x.id,
        name: x.__test.name.value,
        description: x.__test.description.value || '',
        state: db.API_TST_TODO,
        // 获取请求头数据
        reqHeader: (function (items) {
          var rhObj = {};
          items.forEach(function (item) {
            // 填什么存什么
            rhObj[item.name] = item.__value;
          });
          return JSON.stringify(rhObj);
        })(x.params.reqHeaders),

        // 获取响应头预期值
        resExpectHeader: (function (items) {
          var rehObj = {};
          items.forEach(function (item) {
            // 预期值没有填写的不存
            if (item.__value) {
              rehObj[item.name] = {
                value: item.__value,
                error: item.__error
              };
            }
          });
          return JSON.stringify(rehObj);
        })(x.params.resHeaders),

        // 获取输入请求数据
        reqData: (function (pathParams) {
          var rdObj = {};
          rdObj.reqParams = this._getReqData(x);
          if (pathParams) {
            rdObj.pathParams = {};
            pathParams.forEach(function (param) {
              rdObj.pathParams[param.name] = param.__value;
            });
          }
          // 获取reqData选项
          rdObj.reqParamsOptions = {};
          x.params.inputs.forEach(function (param) {
            rdObj.reqParamsOptions[param.id] = param.__options;
          });
          return JSON.stringify(rdObj);
        }.bind(this))(x.params.pathParams),

        // 获取响应预期
        resExpect: (function (items) {
          if (items.length < 1) {
            return '';
          }
          var repObj = {};
          if (x.resFormat == db.MDL_FMT_HASH || x.resFormat === db.MDL_FMT_HASHMAP) {
            items.forEach(function (item) {
              if (item.__value) {
                repObj[item.name] = useError ? {
                  value: item.__transformedValue,
                  error: item.__error
                } : item.__transformedValue;
              }
            });
          } else {
            repObj = useError ? {
              value: items[0].__transformedValue,
              error: items[0].__error
            } : items[0].__transformedValue;
          }
          return JSON.stringify(repObj);
        }.bind(this))(x.params.outputs)
      };
    },

    /**
     * 获取请求数据
     * @return {Array}
     */
    _getReqData: function (x) {
      var rdObj;
      // 请求数据类型为哈希时
      if (x.reqFormat == db.MDL_FMT_HASH) {
        rdObj = {};
        x.params.inputs.forEach(function (item) {
          if (!item.__options.ignored) {
            if (item.__transformedValue === '') {
              if (this.datatypeObj[item.type].format === db.MDL_FMT_STRING && item.isArray === 0) {
                rdObj[item.name] = item.__transformedValue;
              }
            } else {
              rdObj[item.name] = item.__transformedValue;
            }
          }
        }, this);
      } else {
        if (!x.params.inputs[0].__options.ignored) {
          rdObj = x.params.inputs[0].__transformedValue; // 请求数据类型不为哈希时直接存储值
        }
      }
      return rdObj;
    },

    /**
     * 获取全部测试用例数据
     * @return {boolean} useCreateTime - 是否包括createTime字段（false时用于localhost的存储，去除createTime，从而避免误判为输入发生变化从而离开时弹框）
     * @return {Array}
     */
    $getData: function (useCreateTime) {
      return this.data.xlist.map(function (x) {
        var submitdata = this._getData(x, true);
        if (useCreateTime) {
          submitdata.createTime = Date.now();
        } else { // 只是保存数据
          if (submitdata.host === this.data.defaultHost) {
            submitdata.host = '';
          }
        }
        return submitdata;
      }, this);
    },

    /**
     * 生成参数的Mock数据
     * @param {Object} x interface对象
     * @param {String} paramsField 生成Mock对象参数的字段
     * @param {String} valueField 存储Mock数据的字段
     */
    generateMockData: function (x, paramsField, hashOmitIds) {
      hashOmitIds = hashOmitIds ? hashOmitIds : {};
      if (Array.isArray(x.params[paramsField]) && x.params[paramsField].length > 0) {
        util._$initParamsPureSampleCode(x.reqFormat, x.params[paramsField], this.data.constraints, this.data.datatypes, function (result) {
          switch (x.reqFormat) {
            case db.MDL_FMT_HASHMAP:
              var keyItem = x.params[paramsField].filter(function (item) {
                return item.name === '键' && !hashOmitIds[item.id];
              })[0];
              if (keyItem) {
                keyItem.__value = Object.keys(result)[0];
                if (this.$refs[keyItem.id]) {
                  this.$refs[keyItem.id].$show(keyItem.__value);
                }
              }
              var valueItem = x.params[paramsField].filter(function (item) {
                return item.name === '值' && !hashOmitIds[item.id];
              })[0];
              if (valueItem) {
                valueItem.__value = result[Object.keys(result)[0]];
                if (this.$refs[valueItem.id]) {
                  this.$refs[valueItem.id].$show(valueItem.__value);
                }
              }
              break;
            case db.MDL_FMT_HASH:
              Object.keys(result).forEach(function (key) {
                var item = x.params[paramsField].filter(function (item) {
                  return item.name === key && !hashOmitIds[item.id];
                })[0];
                if (item) {
                  // 仅当不忽略此id时修改mock数据
                  if (
                    item.__datatype
                    && (
                      item.__datatype.format === db.MDL_FMT_HASH
                      || item.__datatype.format === db.MDL_FMT_HASHMAP
                      || item.__datatype.format === db.MDL_FMT_STRING
                    )
                  ) {
                    item.__value = result[key];
                    if (this.$refs[item.id]) {
                      this.$refs[item.id].$show(item.__value);
                    }
                  } else {
                    item.__value = item.isArray ? JSON.stringify(result[key]) : result[key];
                  }
                }
              }, this);
              break;
            case db.MDL_FMT_ARRAY:
            case db.MDL_FMT_ENUM:
            case db.MDL_FMT_BOOLEAN:
            case db.MDL_FMT_NUMBER:
            case db.MDL_FMT_STRING:
            case db.MDL_FMT_FILE:
              var item = x.params[paramsField][0];
              if (!hashOmitIds[item.id]) {
                item.__value = result;
                if (this.$refs[item.id] && (x.reqFormat === db.MDL_FMT_ARRAY || x.reqFormat === db.MDL_FMT_STRING)) {
                  this.$refs[item.id].$show(item.__value);
                }
              }
          }
          this.$update();
        }.bind(this));
      }
    },
    clearMockData: function (x) {
      x.params.inputs.forEach(function (item) {
        item.__value = item.__transformedValue = '';
      }, this);
      Object.keys(this.$refs).forEach(function (key) {
        if (this.$refs[key]) {
          this.$refs[key].$show('', true);
        }
      }, this);
    },
    changeContentType: function (evt) {
      var self = this;
      var target = evt.target;
      if (target.tagName.toLowerCase() === 'input') {
        var reqHeaderOfContentTypeParam = this.data.xlist[0].params.reqHeaders.find(function (header) {
          return header.name.toLowerCase() === 'content-type';
        });
        if (reqHeaderOfContentTypeParam) {
          reqHeaderOfContentTypeParam.__value = target.value;
        }
      }
    },

    /**
     * 初始化xlist
     */
    initXlist: function () {
      // 获取接口id
      this.data.interfaceId = +new URL(document.location.href).searchParams.get('iid');
      var localStorageKey = 'INTERFACE_TEST_CREATE_TEMP_' + this.data.interfaceId;
      var storedXlist = util._$getItemFromLocalStorage(localStorageKey);

      if (storedXlist && this.data.isCreateTest) {
        try {
          // copyXlist 方法生成mock数据延后
          this.data.xlist = this.mergeXlist(this._copyXlist(this.data.xlist, this.data.data, false), JSON.parse(storedXlist).data);
        } catch (e) {
          // 可能本地存储格式有问题
          // 清除本地存储
          this.removeXlistFromLocalStorage();
          // 使用原方法初始化内容
          this.data.xlist = this._copyXlist(this.data.xlist, this.data.data);
        }
      } else {
        // 原方法初始化内容
        this.data.xlist = this._copyXlist(this.data.xlist, this.data.data); // 创建模式下需要预填本地存储的输入值
      }
    },
    /**
     * 校验是否为同类param
     */
    isSameParam: function (param1, param2) {
      var checkFields = [
        'id',
        'name',
        'defaultValue',
        'genExpression',
        'parentId',
        'parentType',
        'type',
        'isArray'
      ];

      for (var i = 0; i < checkFields.length; i++) {
        if (param1[checkFields[i]] !== param2[checkFields[i]]) {
          return false;
        }
      }
      return true;
    },

    /**
     * 合并最新数据与本地存储的数据
     */
    mergeXlist: function (newXlist, localStorageXlist) {
      if (
        newXlist.length === 1
        && localStorageXlist.length === 1
      ) {
        var that = this;
        var mergedParams = {};
        var paramNames = Object.keys(newXlist[0].params);
        var oldParamIds = {};
        for (var i = 0; i < paramNames.length; i++) {
          var curParamArray = newXlist[0].params[paramNames[i]];
          if (!mergedParams[paramNames[i]]) {
            mergedParams[paramNames[i]] = [];
          }
          for (var j = 0; j < curParamArray.length; j++) {
            var localStorageParam = localStorageXlist[0]
              .params[paramNames[i]]
              .find(function (localParam) {
                return that.isSameParam(localParam, curParamArray[j]);
              });
            if (localStorageParam) {
              // 本地存储含该参数
              // 取用本地存储内的值
              mergedParams[paramNames[i]].push(localStorageParam);
              oldParamIds[curParamArray[j].id] = true;
            } else {
              // 取用最新的值
              mergedParams[paramNames[i]].push(curParamArray[j]);
            }
          }
        }

        var mergedXlist = Object.assign(newXlist[0], {params: mergedParams});
        // 仅为新参数生成mock数据
        this.generateMockData(mergedXlist, 'inputs', oldParamIds);
        this.generateMockData(mergedXlist, 'pathParams', oldParamIds);
        return [mergedXlist];
      } else {
        // 默认返回最新列表
        return newXlist;
      }
    },
    /**
     * 本地存储xlist
     */
    saveXlistToLocalStorage: function () {
      util._$saveToLocalStorage('INTERFACE_TEST_CREATE_TEMP_' + this.data.interfaceId, this.data.xlist);
    },
    /**
     * 移除本地存储xlist
     */
    removeXlistFromLocalStorage: function () {
      util._$removeFromLocalStorage('INTERFACE_TEST_CREATE_TEMP_' + this.data.interfaceId);
    },
    /**
     * 自动保存
     * @param {Boolean} start 是否启动
     */
    autoSaving: function (start) {
      var self = this;
      if (start) {
        util._$adjustLocalStorageLimit(
          'INTERFACE_TEST_CREATE_TEMP',
          'INTERFACE_TEST_CREATE_TEMP_' + this.data.interfaceId,
          10
        );
        this.data.autoSavingIntervalId = setInterval(
          function saving() {
            self.saveXlistToLocalStorage();
            return saving;
          }(),
          1000
        );
      } else {
        clearInterval(this.data.autoSavingIntervalId);
      }
    },
    /**
     * 数据是否有改动
     */
    checkParamChange: function (start) {
      var self = this;
      if (start) {
        this.data.initialXlist = JSON.stringify(this.data.xlist);
        this.data.checkParamChangeIntervalId = setInterval(
          function startAutoSaving() {
            if (JSON.stringify(self.data.xlist) !== self.data.initialXlist) {
              // 检查到变更，开启存储
              // 开启自动存储
              self.autoSaving(true);
              clearInterval(self.data.checkParamChangeIntervalId);
            }
            return startAutoSaving;
          }(),
          1000
        );
      } else {
        clearInterval(self.data.checkParamChangeIntervalId);
      }
    }
  }).filter('escape', function (data) {
    return data;
  });

  return InterfaceTest;
});


