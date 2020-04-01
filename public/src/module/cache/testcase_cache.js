/**
 * 测试用例缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './interface_cache.js',
  './testcollection_cache.js',
  'json!3rd/fb-modules/config/db.json',
  'pro/notify/notify',
  'pro/common/util',
  'pro/modal/modal',
  'pro/interface_tester/src/main'
], function (_k, _u, _v, _c, _d, _infCache, _collectCache, db, notify, util, modal, t, _p, _pro) {
  _p._$$CacheTestCase = _k._$klass();
  _pro = _p._$$CacheTestCase._$extend(_d._$$Cache);
  _p._$cacheKey = 'testcase';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
    // 数据检查错误类型常量
    this.ERROR_TYPE = {
      JSON_ERROR: 0, // json格式错误
      TYPE_ERROR: 1, // 数据类型错误
      EXPECT_ERROR: 2, // 期望值不匹配
      MISS_ERROR: 3, // 缺少字段
      ARRAY_MATCH_ERROR: 6 // 数组数据和定义的数组元素类型全部不匹配
    };
    // 测试用例state增加TESTING状态
    this.API_TST_TESTING = 4;
    // 测试队列最大长度,如果某时刻有超过此数量的请求未得到响应则此时不继续发送请求，等待有响应到达后继续
    this.__MAX_TEST_NUM = 3;
    this.__testQueue = this.__getDataInCache('testqueue') || this.__setDataInCache('testqueue', []) || this.__getDataInCache('testqueue'); //请求排队，待进入testingqueue，且这里是单独一个接口的！，要保证请求顺序
    this.__testingQueue = this.__getDataInCache('testingqueue') || this.__setDataInCache('testingqueue', []) || this.__getDataInCache('testingqueue'); //请求处于长度受控制的待发送队伍，蓄势待发
    this.__testedQueue = this.__getDataInCache('testedqueue') || this.__setDataInCache('testedqueue', []) || this.__getDataInCache('testedqueue'); //请求在路上
    this.__allTestList = this.__getDataInCache('alltest') || this.__setDataInCache('alltest', []) || this.__getDataInCache('alltest');
    this.__interfaceTester = new t.InterfaceTester({
      MAX_TEST_NUM: this.__MAX_TEST_NUM,
      testQueue: this.__testQueue,
      testingQueue: this.__testingQueue,
      testedQueue: this.__testedQueue,
      allTestList: this.__allTestList
    });
    // 避免重复添加事件
    if (!this.constructor.__isItemsAddedEventListened) {
      this.constructor.__isItemsAddedEventListened = true;
      _v._$addEvent(
        this.constructor, 'update', function (evt) {
          var testQueue = this._$getTestQueue();
          var caseId = evt.data.id;
          var state = evt.data.state;
          _u._$forIn(testQueue, function (test) {
            // 找到被更新的一项并修改测试状态
            if (test.id === caseId) {
              test.state = state;
            }
          });
        }.bind(this)
      );
    }
  };

  _pro._$getAllTestList = function () {
    return this.__interfaceTester.getAllTestList();
  };

  /**
   * 获取正在测试的队列
   */
  _pro._$getTestQueue = function () {
    // 三个队列合起来是测试进度要显示的全部队列
    // return this.__getDataInCache('testedqueue').concat(this.__getDataInCache('testingqueue').concat(this.__getDataInCache('testqueue')));
    return this.__interfaceTester.getTestQueue();
  };

  /**
   * 设置测试所需的参数
   * @param {Object} options - 参数对象
   * @param {Object} options.datatype - 参数对象
   * @param {Object} options.constraints - 参数对象
   */
  _pro._$setTestOptions = function (options) {
    // 这个函数用来设置一些测绘必须的参数，其实应该在需要这些东西的函数里传，但是好几个函数都需要，传着很烦，所以直接先在这里配置一下了，但不呢么优雅，待优化
    this.__datatypes = {};
    _u._$forEach(options.datatypes, function (datatype) {
      this.__datatypes[datatype.id] = datatype;
    }._$bind(this));
    if (options.constraints) {
      this.__constraints = options.constraints;
    }
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 测试用例 id
   * 支持更新的字段有:
   * @property {String} [options.name] - 名称
   * @property {String} [options.description] - 描述信息
   * @property {Number} [options.testerId] - 执行者id
   * @property {Number} [options.testBeginTime] - 开始时间
   * @property {Number} [options.testEndTime] - 结束时间
   * @property {String} [options.reqHeader] - 接口请求头，JSON串
   * @property {String} [options.reqData] - 接口请求消息体
   * @property {String} [options.resHeader] - 接口响应头，JSON串
   * @property {String} [options.resData] - 接口响应消息体
   * @property {String} [options.report] - 用例运行后结果报告
   * @success dispatch event: onitemupdate
   */
  _pro.__doUpdateItem = function (options) {
    this.__super(options);
  };

  _pro._$getListInCache = function (key) {
    var list = this.__super(key);
    if (/(\d+)-collection-(\d+)/.test(key)) {
      var cache = _infCache._$$CacheInterface._$allocate();
      var ids = [];
      _u._$reverseEach(list, function (caseItem, index) {
        if (!cache._$getItemInCache(caseItem.interfaceId) || !this.__getHash()[caseItem.id]) {
          ids.push(index);
        }
      }, this);
      ids.forEach(function (index) {
        list.splice(index, 1);
      });
      cache._$recycle();

      // 按照接口排序
      var iid = RegExp.$1;
      if (iid === '0') {
        var cid = parseInt(RegExp.$2, 10);
        var collectCache = _collectCache._$$CacheTestcollection._$allocate({});
        var collect = collectCache._$getItemInCache(cid);
        var infIds = collect.data.split(',').map(Number);
        list.sort(function (case1, case2) {
          return infIds.indexOf(case1.interfaceId) > infIds.indexOf(case2.interfaceId + '');
        });
        collectCache._$recycle();
      }
    }
    return list;
  };

  _pro._$deleteItems = function (options) {
    options.onload = function (event) {
      var deletedList = event.data;
      deletedList.forEach(function (item) {
        delete this.__getHash()[item.id];
      }, this);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url;
    if (options.key.indexOf('collection') > -1) {
      url = '/api/testcases/?collection';
    }
    else if (options.key.indexOf(_p._$cacheKey) > -1) {
      url = '/api/testcases/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };


  _pro._$getListKeyByCollection = function (cid, id) {
    return this.__cacheKey + '-' + (id || 0) + '-collection-' + cid;
  };

  /**
   * 将数据转换为指定类型
   * @param {} value - 待转换数据
   * @param {Number} type - 目标数据模型类别
   * @param {Boolean} isArray - 目标数据模型是否数组
   * @return {} value - 转换后数据
   */
  _pro.__transformToType = function (value, type, isArray, datatypes) {
    // 把从表单里新鲜取出的统一字符串转换为定义的格式
    var typeobj = datatypes[type];
    if (isArray) {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (err) {
          // ignore
        }
      }
    } else {
      switch (typeobj.format) {
        case db.MDL_FMT_STRING:
          // 数据从页面传回默认string类型，此处去掉用户可能自己输入的多余引号
          if (value !== '""') {
            if ((value[0] === '\'' && value[value.length - 1] === '\'') || (value[0] === '"' && value[value.length - 1] === '"')) {
              value = value.slice(1, -1);
            }
            value += '';
          }
          break;
        case db.MDL_FMT_NUMBER:
          value = /^[0-9.]+$/.test(value) ? Number(value) : value;
          break;
        case db.MDL_FMT_BOOLEAN:
          value = /^([01]|true|false)?$/.test(value) ? !!('' + value).match(/^([01]|true|false)?$/)[0] : value;
          break;
        case db.MDL_FMT_ENUM:
          // 转换为数字或布尔类型
          value = this.__transformToType(value, typeobj.params[0].type, null, datatypes);
          break;
        case db.MDL_FMT_HASH:
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (err) {
              // ignore
            }
          }
      }
    }
    return value;
  };

  /**
   * 按照定义转换数据模型
   * @param {} value - 待转换数据
   * @param {Number} format - 目标数据模型类别
   * @param {Array} params - 目标数据模型参数列表
   * @return {} value - 转换后数据
   */
  _pro._$doTransformType = function (value, format, params, datatypes) {
    var datatypesMap = Array.isArray(datatypes) ? datatypes.reduce(function (obj, item) {
      obj[item.id] = item;
      return obj;
    }, {}) : datatypes;
    switch (format) {
      case db.MDL_FMT_ENUM:
        value = this.__transformToType(value, params[0].type, null, datatypesMap);
        break;
      case db.MDL_FMT_ARRAY:
        value = this.__transformToType(value, params[0].type, params[0].isArray + 1, datatypesMap);
        break;
      case db.MDL_FMT_HASH:
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch (err) {
            // ignore
          }
        }
        _u._$forEach(params, function (param) {
          if (value && value[param.name]) {
            value[param.name] = this.__transformToType(value[param.name], param.type, param.isArray, datatypesMap);
          }
        }, this);
        break;
      // 解析跨域插件拿回的响应头
      case 'resheaders':
        var valueArr = value.split('\n');
        value = {};
        valueArr.forEach(function (item) {
          if (item) {
            var index = item.indexOf(':');
            value[item.slice(0, index)] = item.slice(index + 1).trim();
          }
        });
        break;
      default:
        value = this.__transformToType(value, params[0].type, false, datatypesMap);
        break;
    }
    return value;
  };

  _pro._$checkJSON = function (value) {
    // 检查响应数据是否是合法json，不是的话抛出对应错误
    var isLegal = true;
    var errorMessage;
    try {
      value = JSON.parse(value);
    } catch (err) {
      errorMessage = [{type: this.ERROR_TYPE.JSON_ERROR, message: err}];
      isLegal = false;
    }
    return {
      result: isLegal,
      errorMessage: errorMessage,
      value: value
    };
  };


  /**
   * 检查数据模型是否匹配
   * @param {String} value - 待检测值
   * @param {String} datatype - 待匹配数据模型详情
   * @param {Number} isArray - 待匹配数据模型是否是数组
   * @param {Array} keys - 检测字段路径
   * @return {Object} options
   * @property {Boolean} options.result - 是否匹配
   * @property {Boolean} options.value - result为true时为转换后的值
   * @property {Array} options.errorMessage - 错误信息数组
   * @property {Number} options.errorMessage.type - 错误类型标识
   * @property {String} options.errorMessage.data - 出错值
   * @property {String} options.errorMessage.datatype - 期待数据类型名称
   */
  _pro._$isTypeMatched = function (value, datatype, isArray, keys, resParamRequired, datatypes) {
    var isMatched = true;
    var errorMessage = [];
    var datatypeName, checkResult;
    var params = datatype.params || [];
    var datatypesMap = Array.isArray(datatypes) ? datatypes.reduce(function (obj, item) {
      obj[item.id] = item;
      return obj;
    }, {}) : datatypes;
    keys = keys || [];
    if (value === null) {
      return {
        result: true,
        errorMessage: errorMessage,
        value: value
      };
    }
    // 先处理数组类型情况
    if (isArray > 0) {
      checkArray.call(this);
    } else {
      switch (datatype.format) {
        case db.MDL_FMT_STRING:
          datatypeName = 'string';
          isMatched = (typeof value === datatypeName);
          if (!isMatched) {
            errorMessage = {
              type: this.ERROR_TYPE.TYPE_ERROR,
              data: JSON.stringify(value),
              datatype: datatype.name || datatypeName,
              keys: keys
            };
          }
          break;
        case db.MDL_FMT_NUMBER:
          datatypeName = 'number';
          isMatched = typeof value === datatypeName;
          if (!isMatched) {
            errorMessage = {
              type: this.ERROR_TYPE.TYPE_ERROR,
              data: JSON.stringify(value),
              datatype: datatype.name || datatypeName,
              keys: keys
            };
          }
          break;
        // boolean使用正则表达式检查
        case db.MDL_FMT_BOOLEAN:
          datatypeName = 'boolean';
          isMatched = typeof value === 'boolean' && /^([01]|true|false)?$/.test(value);
          if (!isMatched) {
            errorMessage = {
              type: this.ERROR_TYPE.TYPE_ERROR,
              data: JSON.stringify(value),
              datatype: datatype.name || datatypeName,
              keys: keys
            };
          }
          break;
        // 检查枚举类型
        case db.MDL_FMT_ENUM:
          datatypeName = 'enum';
          // 先假设匹配失败
          isMatched = false;
          _u._$forIn(params, function (param) {
            // 若value等于枚举中任一项，并且类型匹配，则匹配成功，并跳出循环
            value = this.__transformToType(value, param.type, null, datatypesMap);// 现转换参数类型再严格比较
            if (value == param.defaultValue) {
              return (isMatched = true);
            }
          }._$bind(this));
          if (!isMatched) {
            errorMessage = {
              type: this.ERROR_TYPE.TYPE_ERROR,
              data: JSON.stringify(value),
              datatype: datatype.name || '枚举',
              keys: keys
            };
          }
          break;
        case db.MDL_FMT_ARRAY:
          checkArray.call(this);
          break;
        // 检查哈希和匿名类型
        case db.MDL_FMT_HASH:
          datatypeName = 'hash';
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (err) {
              isMatched = false;
              errorMessage = {type: this.ERROR_TYPE.JSON_ERROR, message: err, keys: keys};
            }
          }
          if (isMatched) {
            if (!_u._$isObject(value) && value !== null) {
              isMatched = false;
              errorMessage = {
                type: this.ERROR_TYPE.TYPE_ERROR,
                data: JSON.stringify(value),
                datatype: datatype.name || 'object',
                keys: keys
              };
            } else {
              errorMessage = [];
              _u._$forEach(this._$clearRepeatedParam(params), function (param) {
                // 判断该属性是否存在
                if (param && value && typeof value[param.name] !== 'undefined') {
                  // 判断属性类型是否匹配
                  checkResult = this._$isTypeMatched(value[param.name],
                    datatypesMap[param.type],
                    param.isArray, keys.concat(param.name), resParamRequired, datatypesMap);
                  if (checkResult.result !== true) {
                    // 这里只能concat新数组不能push直接传，否则会引起引用类型问题
                    errorMessage = errorMessage.concat(checkResult.errorMessage);
                    isMatched = false;
                  }
                } else {
                  // 判断忽略情况
                  if ((param.ignored === 0 && ((resParamRequired === 1 && param.required === 1) || resParamRequired === 0))) {
                    errorMessage = errorMessage.concat({
                      type: this.ERROR_TYPE.MISS_ERROR,
                      keys: keys.concat(param.name)
                    });
                    isMatched = false;
                  }
                }
              }._$bind(this));
            }
          }
          break;
        // 检查哈希和匿名类型
        case db.MDL_FMT_HASHMAP:
          datatypeName = 'hashmap';
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (err) {
              isMatched = false;
              errorMessage = {type: this.ERROR_TYPE.JSON_ERROR, message: err, keys: keys};
            }
          }
          if (isMatched) {
            if (!_u._$isObject(value) && value !== null) {
              isMatched = false;
              errorMessage = {
                type: this.ERROR_TYPE.TYPE_ERROR,
                data: JSON.stringify(value),
                datatype: datatype.name || 'object',
                keys: keys
              };
            } else {
              errorMessage = [];
              var kkeys = Object.keys(value);
              var vals = [];
              for (var i = 0; i < kkeys.length; i++) {
                vals.push(value[kkeys[i]]);
              }
              _u._$forEach(this._$clearRepeatedParam(params), function (param) {
                var curValue;
                if (param && param.name === '键') {
                  curValue = kkeys;
                } else if (param && param.name === '值') {
                  curValue = vals;
                }
                if (curValue && curValue.length > 0) {
                  for (var i = 0; i < curValue.length; i++) {
                    checkResult = this._$isTypeMatched(
                      curValue[i],
                      datatypesMap[param.type],
                      param.isArray,
                      keys.concat(kkeys[i]).concat(param.name),
                      resParamRequired,
                      datatypesMap
                    );
                    if (checkResult.result !== true) {
                      // 这里只能concat新数组不能push直接传，否则会引起引用类型问题
                      errorMessage = errorMessage.concat(checkResult.errorMessage);
                      isMatched = false;
                    }
                  }
                }
              }._$bind(this));
            }
          }
          break;
      }
    }
    return {
      result: isMatched,
      errorMessage: errorMessage,
      value: value
    };

    function checkArray() {
      if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch (err) {
          isMatched = false;
          errorMessage = {type: this.ERROR_TYPE.JSON_ERROR, message: err, keys: keys};
        }
      }
      if (isMatched) {
        if (Array.isArray(value)) {
          value.forEach(function (value, index) {
            var isArrayBack = isArray;
            // 数组现在可以包含不同类型的元素了，只要匹配其中一个元素的类型即可
            var finalCheckResult = false;
            if (datatype.id > 10003) {
              for (var i = 0; i < params.length; i++) {
                // 默认生成的循环引用的 mock 数据，比如 {
                //  "user": "<User>"
                // }
                if (value === '<' + datatype.name + '>') {
                  finalCheckResult = true;
                  break;
                } else {
                  checkResult = this._$isTypeMatched(value, isArray > 0 ? datatype : datatypesMap[params[i].type], --isArray, keys.concat(index), resParamRequired, datatypesMap);//--isArray 用来表示请求类型为数组时嵌套数组
                  if (checkResult.result === true) {
                    finalCheckResult = true;
                    break;
                  }
                }
              }
            } else {
              // 基本类型
              checkResult = this._$isTypeMatched(value, datatype, 0, keys.concat(index), resParamRequired, datatypesMap);
              if (checkResult.result === true) {
                finalCheckResult = true;
              }
            }
            if (finalCheckResult === false) {
              errorMessage = errorMessage.concat({
                type: this.ERROR_TYPE.ARRAY_MATCH_ERROR,
                keys: keys.concat(index)
              });
              isMatched = false;
            }
            isArray = isArrayBack;
          }, this);
        } else {
          isMatched = false;
          errorMessage = {
            type: this.ERROR_TYPE.TYPE_ERROR,
            data: JSON.stringify(value, null, '\t'),
            datatype: isArray > 0 ? 'Array' : datatype.name, // 用isArray标记数组时数据类型存储省略一层Array，datatype.name,不是类型名而是数组参数的类型名
            keys: keys
          };
        }
      }
    }
  };

  /**
   * 导入测试用例，创建多个用例，不用指定key，因为有可能创建的用例不来自于同一个interface，原有的逻辑更新前端缓存需要用key，是不符合当前的情况的
   */
  _pro._$createBatch = function (options) {
    this.__doAction({
      headers: options.headers || {},
      data: options.data,
      ext: options.ext,
      method: 'POST',
      triggerListchange: true,
      onload: function (event) {
        var addedList = event.data;
        if (!Array.isArray(addedList)) {
          addedList = [addedList];
        }
        addedList.forEach(function (item) {
          var key = this._$getListKey(item.interfaceId);
          var list = this._$getListInCache(key);
          item = this.__doSaveItemToCache(item, key);
          item && list.push(item);
        }, this);
        // 有些缓存还需要处理额外的逻辑, 比如参数缓存, 添加项后还需要更新相应缓存(比如数组模型缓存)中的数据
        if (options.onload) {
          options.onload(event);
        }
      }.bind(this)
    });
  };

  /**
   * 删除重复的参数
   * @param {Array} params - 参数数组
   * @return {Array} 去重后的参数数组
   */
  _pro._$clearRepeatedParam = function (params) {
    var newparams = [];
    var k = {}; //记录某一名字的属性是否已存在
    var i, n;
    for (i = params.length - 1; i >= 0; i--) {
      n = params[i].name; //属性名
      // 属性名唯一或为空时保留，重复则丢弃
      if (!k[n] || n === '') {
        newparams.push(params[i]);
        k[n] = true;
      }
    }
    return newparams;
  };

  /**
   * 检查XHR proxy tool插件是否安装
   * @param {Function} callback
   * @return {Void}
   */
  _pro._$checkXhrpt = function (callback) {
    var that = this, sendId = Date.now();
    document.addEventListener('check-xhrpt-ext-res', function (e) {
      if (!e.detail || !e.detail.reqData || e.detail.reqData.sendId !== sendId) {
        return;
      }
      callback.apply(that);
    }._$bind(this), false);
    var event = new CustomEvent('check-xhrpt-ext', {
      detail: {
        sendId: sendId
      }
    });
    document.dispatchEvent(event);
  };
  _pro._$startTests = function (tdata) {
    var totalTestcase = tdata.data.reduce(function (sum, item) {
      return sum + item.testcases.length;
    }, 0);
    var tip = (totalTestcase === 1 ? '' : (totalTestcase + '个')) + '测试开始';
    notify.show(tip, 'success', 1200);
    tdata.onStatusChange = function (testcase) {
      var testcaseStatus = testcase.statusMap[testcase.id];
      var TEST_STATUS = this.__interfaceTester.TEST_STATUS;
      if (testcaseStatus !== TEST_STATUS.TEST_NOT_FINISHED) {
        testcase.updatedata.actionMsg = false;
        // update
        delete testcase.updatedata.data.error;
        this._$updateItem(testcase.updatedata);
      } else {
        // 触发全局的 update 事件
        // _v._$dispatchEvent(
        //   this.constructor, 'update', {
        //     data: testcase,
        //     action: 'update',
        //     key: this.__cacheKey
        //   }
        // );
      }
    }.bind(this);
    tdata.onError = function (result) {
      this._$dispatchEvent('onerror', result.error[0].error);
      if (!this.__afterScriptErrorModal) {
        this.__afterScriptErrorModal = new modal({
          data: {
            'content': result.error[0].error.message,
            'title': result.error[0].message,
            'closeButton': true,
            'okButton': '修改接口',
            'cancelButton': true
          }
        }).$on('ok', function () {
          this.__afterScriptErrorModal = this.__afterScriptErrorModal.destroy();
          dispatcher._$redirect('/interface/detail/res/?pid=' + result.testcase.pid + '&id=' + result.testcase.iid);
        }._$bind(this)).$on('cancel', function () {
          this.__afterScriptErrorModal = this.__afterScriptErrorModal.destroy();
        }.bind(this)).$on('close', function () {
          this.__afterScriptErrorModal = null;
        }.bind(this));
      }
    }.bind(this);
    this.__interfaceTester.startTests(tdata);
  };
  _pro._$startDependencyTests = function (tdata) {
    this.__interfaceTester.startDependencyTests(tdata);
  };
  _pro._$getDependencyTestPath = function (path) {
    return this.__interfaceTester.getDependencyTestPath(path);
  };
  _pro._$runScript = function (options) {
    this.__interfaceTester.runScript(options);
  };
  _pro._$check = function (options) {
    return this.__interfaceTester.check(options);
  };
});
