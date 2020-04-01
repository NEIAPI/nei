NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/constraint_cache',
  'pro/cache/rpc_cache',
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
], function (_k, _e, _t, _l, _m, util, _csCache, rpcCache, _proCache, _pgCache, _usrCache, dataTypeCache, paramCache, iheaderCache, testcaseCache, mockstoreCache, paramEditor, AceEditor, modal, GenerateRule, db, _p, _pro) {

  _p._$$ModuleRpcDetailRes = _k._$klass();
  _pro = _p._$$ModuleRpcDetailRes._$extend(_m._$$Module);

  var UNSUPPORTED_FORMAT_NAME = {};
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_BOOLEAN] = '布尔值';
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_ENUM] = '枚举值';
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_NUMBER] = '数值';
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_STRING] = '字符值';
  UNSUPPORTED_FORMAT_NAME[db.MDL_FMT_FILE] = '文件';

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-rpc-detail-res')
    );
    this.__refreshMock = _e._$getByClassName(this.__body, 'refresh-mock')[0];
    this.__btnBar = _e._$getByClassName(this.__body, 'btn-bar')[0];
    this.__tip = _e._$getByClassName(this.__body, 'tip')[0];
    this._supportMockMsg = '（Mock 数据已经持久化，可以在下方的文本框中修改范例数据。';
    this._unsupportMockMsg = '提示：${typeName}暂不支持对 Mock 数据的修改。';
    this.rpcCacheOptions = {
      onitemload: function () {
        this.__rpc = this.rpcCache._$getItemInCache(this.__id);
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            var role = this.__pgCache._$getRole(this.__rpc.progroupId);
            this._permit = true;
            if (role === 'observer') {
              this._permit = false;
            }
            this._initEditor();
          }.bind(this)
        });

        //发送项目组详情请求
        this.__pgCache._$getItem({
          id: this.__rpc.progroupId
        });
      }.bind(this)
    };
    this.__tcCache = testcaseCache._$$CacheTestCase._$allocate();
    //规则函数cache
    this.__csCache = _csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this._renderMockData();
      }.bind(this)
    });
    this.mockstoreCacheOptions = {};
    this.mockstoreCacheOptions.onitemload = this.mockstoreCacheOptions.onsave = this.mockstoreCacheOptions.onrefresh = function (options) {
      this.__mockData = this._mockstoreCache._$getItemInCache(options.id);
      this._renderMockData();
    }.bind(this);
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
      }.bind(this)
    });
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   */
  _pro.__onRefresh = function (_options) {
    this.__id = _options.param.id.replace('/', '');
    this.__pid = _options.param.pid.replace('/', '');
    this.__super(_options);
    this.rpcCache._$getItem({
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
    this.rpcCache = rpcCache._$$CacheRpc._$allocate(this.rpcCacheOptions);
    this._mockstoreCache = mockstoreCache._$$CacheMockstore._$allocate(this.mockstoreCacheOptions);
    this._paramCache = paramCache._$$CacheParameter._$allocate();
    this.__doInitDomEvent([
      [
        rpcCache._$$CacheRpc, 'update',
        function (evt) {
          if (evt.ext && evt.ext.action === 'menuchange') {
            this._renderMockData();
          }
        }.bind(this)
      ], [
        this.__refreshMock, 'click', this._refreshMockData.bind(this)
      ]
    ]);
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    if (this.__resEditor) {
      this.__resEditor._$reset();
      this.__resEditor = this.__resEditor._$recycle();
    }
    this.rpcCache && (this.rpcCache = this.rpcCache._$recycle());
    this._paramCache && (this._paramCache = this._paramCache._$recycle());
    this.__sampleCode && (this.__sampleCode.destroy());
  };

  /**
   * 实例化参数编辑器
   */
  _pro._initEditor = function () {
    this.__resEditor = paramEditor._$$ParamEditor._$allocate({
      parent: _e._$getByClassName(this.__body, 'outputs-list')[0],
      parentId: this.__rpc.id,
      parentType: this._paramCache._dbConst.PAM_TYP_RPC_OUTPUT,
      pid: this.__rpc.projectId,
      preview: true,
      onChange: function () {
        this._renderMockData();
      }.bind(this)
    });
    // 高亮范例代码
    this._sampleCodeContainer = _e._$getByClassName(this.__body, 'sample-code')[0];
    this._sampleCodeErrorTip = _e._$getByClassName(this.__body, 'error-tip')[0];
    this.__sampleCode = new AceEditor({
      data: {
        showGutter: true,
        readOnly: this.__rpc.resFormat !== db.MDL_FMT_HASH
        && this.__rpc.resFormat !== db.MDL_FMT_ARRAY
        && this.__rpc.resFormat !== db.MDL_FMT_HASHMAP,
        highlightActiveLine: true,
        empty: '无'
      }
    });
    this.__sampleCode.$inject(this._sampleCodeContainer);
    this.__sampleCode.$on('blur', function (options) {
      if (
        this.__rpc.resFormat === db.MDL_FMT_ARRAY
        || this.__rpc.resFormat === db.MDL_FMT_HASH
        || this.__rpc.resFormat === db.MDL_FMT_HASHMAP
      ) {
        var result = this._checkValidity(options.data, this.__rpc.resFormat, this.__rpc.params.outputs, this.__dataTypes);
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
        this.__rpc.resFormat === db.MDL_FMT_ARRAY
        || this.__rpc.resFormat === db.MDL_FMT_HASH
        || this.__rpc.resFormat === db.MDL_FMT_HASHMAP
      ) {
        this._sampleCodeErrorTip.innerHTML = '';
      }
    }.bind(this));
    this._noSampleCodeContainer = _e._$getByClassName(this.__body, 'no-sample-code')[0];
    if (
      this.__rpc.resFormat !== db.MDL_FMT_ARRAY
      && this.__rpc.resFormat !== db.MDL_FMT_HASH
      && this.__rpc.resFormat !== db.MDL_FMT_HASHMAP
    ) {
      _e._$addClassName(this._sampleCodeErrorTip, 'f-dn');
      _e._$addClassName(this.__btnBar, 'f-dn');
      this.__tip.innerHTML = this._unsupportMockMsg.replace(/\$\{typeName\}/g, UNSUPPORTED_FORMAT_NAME[this.__rpc.resFormat]);
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
        this.__tcCache._$setTestOptions({
          datatypes: this.__dataTypes
        });
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
    _e._$delClassName(this._sampleCodeContainer, 'f-dn');
    _e._$addClassName(this._noSampleCodeContainer, 'f-dn');
    this.__sampleCode.$show(JSON.stringify(this.__mockData, null, '  '));
    if (
      this.__rpc.resFormat === db.MDL_FMT_ARRAY
      || this.__rpc.resFormat === db.MDL_FMT_HASH
      || this.__rpc.resFormat === db.MDL_FMT_HASHMAP
    ) {
      this._mockstoreCache._$getItem({
        id: this.__rpc.id,
        ext: {
          isRpc: true
        }
      });
    } else {
      this._renderBasicMockData();
    }
  };

  _pro._renderBasicMockData = function () {
    var dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
    var outputs = this.__rpc.params.outputs;
    var constraints = this.__csCache._$getListInCache(this.__csListCacheKey);
    util._$initParamsSampleCode(this.__rpc.resFormat, outputs, constraints, dataTypes, this._sampleCodeContainer, this._noSampleCodeContainer, function (result) {
      this.__mockData = result;
    }.bind(this));
  };


  _pro._saveMockData = function () {
    this._mockstoreCache._$saveMockData({
      data: {
        rpcId: this.__rpc.id,
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
      this._mockstoreCache._$refreshMockData({
        iid: this.__rpc.id,
        isRpc: true
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

  _m._$regist(
    'rpc-detail-res',
    _p._$$ModuleRpcDetailRes
  );
});
