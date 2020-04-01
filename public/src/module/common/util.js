/*
 * 公共方法------------------------------------------------
 */
NEJ.define([
  'base/util',
  'base/element',
  'base/event',
  'util/template/tpl',
  'util/template/jst',
  '3rd/jsonbean/src/jsonbean',
  '3rd/rpc_to_json/src/rpc_to_json',
  '3rd/path_to_regexp/index',
  '3rd/freemarker/src/index',
  'json!3rd/fb-modules/config/db.json',
  'json!3rd/fb-modules/config/httpreqheaders.json',
  'json!3rd/fb-modules/config/mediatypes.json',
  'pro/common/mockdata/mock_data_worker_util',
  'pro/modal/modal',
  'pro/notify/notify',
  'pro/common/jst_extend',
  'pro/cache/datatype_cache',
  'pro/cache/testcase_cache',
  'pro/cache/interface_cache',
  'pro/cache/user_cache'
], function (u, e, v, t, jst, jsonbean, rpcToJson, ptr, freemarker, db, headname, headvalue, MockDataWorkerUtil, Modal, notify, jstExt, dtCache, tcCache, _infCache, _usrCache, p) {

  var formatNameMap = {};
  formatNameMap[db.MDL_FMT_BOOLEAN] = 'Boolean';
  formatNameMap[db.MDL_FMT_NUMBER] = 'Number';
  formatNameMap[db.MDL_FMT_STRING] = 'String';
  formatNameMap[db.MDL_FMT_FILE] = 'File';
  formatNameMap[db.MDL_FMT_ARRAY] = 'Array';
  formatNameMap[db.MDL_FMT_ENUM] = 'Enum';
  formatNameMap[db.MDL_FMT_HASH] = 'Object';

  /**
   *对象扩展
   * @param target 目标对象
   * @param source 扩展来源
   * @param override 是否重写
   * return {object}
   */
  p._$extend = function (target, source, override) {
    for (var i in source) {
      if (typeof target[i] === 'undefined' || target[i] === null || override) {
        target[i] = source[i];
      }
    }
    return target;
  };
  /**
   *
   * @param {object} obj
   * @returns {object}
   */
  p._$clone = function (obj) {
    if (!obj) {
      return [];
    }
    var newobj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
      return;
    }
    for (var i in obj) {
      if (typeof obj[i] === 'object') {
        newobj[i] = arguments.callee.call(null, obj[i]);
      } else {
        newobj[i] = obj[i];
      }
    }
    return newobj;

  };
  //前后端公用常量
  p.db = db;
  p.headname = headname;
  p.headvalue = headvalue;
  p.dtSysType = [db.MDL_SYS_UNKNOWN, db.MDL_SYS_FILE, db.MDL_SYS_VARIABLE, db.MDL_SYS_STRING, db.MDL_SYS_NUMBER, db.MDL_SYS_BOOLEAN];
  /**
   * 将字符串转换为JSON对象
   * @param {String} _value
   * return {Object}
   */
  p._$getValidJSON = function (_value) {
    var _json = null;
    try {
      _json = JSON.parse(_value);
    } catch (_er) {
      try {
        _json = eval('(' + _value + ')');
      } catch (_err) {
      }
    }
    return _json;
  };
  /**
   * 数组排序
   * @param  {Array}   arr  排序数组
   * @param  {String}  type 排序类型 (String,Number)
   * @param  {String}  tag  排序字段
   * @param  {Boolean} flag 排序标志 (true:升序,false:降序)
   * @return {Void}
   */
  p._$sortBy = function (arr, type, tag, flag) {
    if (!arr.length) {
      return;
    }
    if (!!flag) {
      if (type == 'string') {
        arr.sort(function (a, b) {
          return b[tag].localeCompare(a[tag]);
        });
      } else {
        arr.sort(function (a, b) {
          return a[tag] - b[tag];
        });
      }
    } else {
      if (type == 'string') {
        arr.sort(function (a, b) {
          return a[tag].localeCompare(b[tag], 'zh-CN');
        });
      } else {
        arr.sort(function (a, b) {
          return b[tag] - a[tag];
        });
      }
    }
  };

  /**
   * 根据对象计算 css class 名
   * @param  {Object} config - 配置对象
   * @return {String} - 类名
   */
  p.classNames = function (config) {
    if (typeof config === 'string') {
      return config;
    } else {
      var classStr = '';
      Object.keys(config).forEach(function (key, index) {
        if (config[key]) {
          if (index !== 0) {
            classStr += ' ' + key;
          } else {
            classStr += key;
          }
        }
      });
      return classStr;
    }
  };

  /**
   * 匹配拼音
   * @param  {String} pinyin - 拼音字符串
   * @param  {String} value - 输入字符串
   * @return {Boolean|Array} - 不匹配返回 false, 否则返回匹配的索引值信息
   */
  p.matchPinyin = function (pinyin, value) {
    if (!pinyin) {
      return false;
    }
    // todo: 多个标签以逗号分隔, 它的拼音是这样的: tag: "资源,模板", tagPinyin: "zi'yuan','mo'ban"
    // 也就是, 拼音字段的最前面和最后面可能会出现多余的单引号, 需要去掉, 这里使用正则
    pinyin = pinyin.replace(/^'|'$/g, '');
    var pys = pinyin.split('\'');
    var py;
    var chars = value.split('');
    var i;
    var hitIndexes = [];
    var index = 0;
    while (py = pys.shift()) {
      if (py.startsWith(chars[0])) {
        for (i = 0; i < py.length; i++) {
          if (py[i] === chars[0]) {
            chars.shift();
          } else {
            break;
          }
        }
        hitIndexes.push(index);
      }
      index++;
    }
    // 没有消耗完就说明匹配不成功
    if (chars.length) {
      return false;
    } else {
      return hitIndexes;
    }
  };

  /**
   * 匹配拼音, 返回高亮字符串，转义非高亮字符
   * @param  {String} name - 原始字符串
   * @param  {String} namePinyin - 原始对应的拼音字符串
   * @param  {String} value - 输入字符串
   * @return {Boolean|String} - 不匹配返回 false, 否则返回匹配的含高亮信息的html字符串
   */
  p.highlightPinyin = function (name, namePinyin, value) {
    var matchResult = this.matchPinyin(namePinyin, value);
    if (matchResult) {
      namePinyin = namePinyin.replace(/^'|'$/g, '');
      var pys = namePinyin.split('\'');
      var charIndex = 0;
      var uiName = '';
      pys.forEach(function (py, idx) { // eg: pys = [ 1a, wo, 2b, ai, 3c, ni ] 字符单词或者拼音, name = '1a我2b爱3c你'
        var stepChars = name.substr(charIndex, py.length); // 取单词长度的连续字符
        if (stepChars.toLowerCase() === py.toLowerCase()) { // 肯定是非中文
          uiName += jstExt.escape2(py);
          charIndex += py.length;
        } else { // 中文
          stepChars = name.substr(charIndex, 1);
          if (matchResult.indexOf(idx) !== -1) { // 命中的字
            uiName += ('<b class="hl">' + stepChars + '</b>');
          } else {
            uiName += stepChars;
          }
          charIndex++;
        }
      });
      return uiName;
    }
    return false;
  };

  /**
   * 提取列表中tag字段信息
   * @param {Array} list header列表
   * @returns {Array}
   */
  p.getTagList = function (list) {
    var pinYinlist = {};
    list.map(function (item) {
      if (!item.tag) {
        return;
      }
      var tags = item.tag.split(',');
      var tagPinyins = item.tagPinyin.split(',');
      tags.forEach(function (tag, idx) {
        // 会有空字符串 NEI-277
        if (tag) {
          pinYinlist[tag] = tagPinyins[idx];
        }
      });
    });
    var tags = Object.keys(pinYinlist).map(function (tag) {
      return {
        id: tag,
        name: tag,
        value: tag,
        /*stripedlist 头部标签会用到这个属性*/
        namePinyin: pinYinlist[tag]
      };
    });
    tags.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    return tags;
  };
  /**
   * 添加导入参数的时候进行转换成后端对应的参数格式
   * @param _imports
   * @returns {Array}
   */
  p._$getImportsParams = function (_imports) {
    //将导入的参数进行归类
    var _obj = {
      id: '',
      vars: []
    };
    var _temp = [];
    u._$forEach(_imports, function (item, i) {
      if (item.parentId == _obj.id) {
        _obj.vars.push(item);
      } else {
        if (_obj.id != '') {
          _temp.push(u._$merge({}, _obj));
        }
        _obj.id = item.parentId;
        _obj.vars = [item];
      }
      if (i == _imports.length - 1) {
        _temp.push(u._$merge({}, _obj));
      }
    });
    return _temp;
  };
  /**
   * 高亮代码
   * @param{Object} json - json 数据
   * @param{Node} container - DOM 容器
   */
  p._$initSampleCode = function (json, container) {
    var str = JSON.stringify(json, null, '\t');
    var editor = ace.edit(container);
    editor.setTheme('ace/theme/eclipse');
    editor.getSession().setMode('ace/mode/json');
    editor.setOptions({
      maxLines: 20,
      tabSize: 2
    });
    editor.setOption('showPrintMargin', false);
    editor.$blockScrolling = Infinity;
    editor.setValue(str, -1);
    editor.setReadOnly(true);
  };
  /**
   * 初始化 ace 编辑器
   * @param{String} mode - 模式，比如 xml
   * @param{String} content - 内容
   * @param{Node} container - DOM 容器
   * @param{Boolean} readOnly - 是否只读
   * @param{Number} [maxLines] - 最多行数
   */
  p._$initNormalEditor = function (mode, content, container, readOnly, maxLines) {
    var editor = ace.edit(container);
    editor.setTheme('ace/theme/eclipse');
    editor.getSession().setMode('ace/mode/' + mode);
    editor.setOptions({
      maxLines: maxLines || 20,
      tabSize: 2
    });
    editor.setOption('showPrintMargin', false);
    editor.$blockScrolling = Infinity;
    editor.setValue(content, -1);
    if (readOnly) {
      editor.setReadOnly(true);
    }
    return editor;
  };
  /**
   * 判断数据类型是否是系统类型
   * @param {Number} id - 数据模型id
   * @return {Boolean} 是否为系统类型
   */
  p._$isSystem = function (id) {
    return this.dtSysType.indexOf(id) != -1;
  };
  /**
   * 高亮数据模型范例代码
   * @param{Number} id - 数据模型的 id
   * @param{Array} dataTypes - 所有数据模型列表
   * @param{Array} constraints - 所有规则函数列表
   * @param{Node} container1 - 范例代码 DOM 容器
   * @param{Node} container2 - 没有范例代码时显示提示的 DOM 容器
   */
  p._$initDataTypeSampleCode = function (id, dataTypes, constraints, container1, container2) {

    MockDataWorkerUtil.getDataTypeMockData(
      window.location.origin,
      constraints,
      id,
      dataTypes,
      function (result) {
        if (result.checkError) {
          e._$addClassName(container1, 'f-dn');
          e._$delClassName(container2, 'f-dn');
          container2.innerHTML = result.checkError;
        } else {
          e._$delClassName(container1, 'f-dn');
          e._$addClassName(container2, 'f-dn');
          this._$initSampleCode(result.json, container1);
        }
      }.bind(this),
      function (error) {
        var content = '';
        error.forEach(function (item) {
          content += (item.name ? '参数' + item.name + ' : ' : '') + (item.message ? item.message : '' + item) + '\n';
        });
        Modal.alert({
          title: '生成规则JS脚本错误',
          content: content,
          clazz: 'modal-exp-error'
        });
      }.bind(this)
    );
  };
  /**
   * 高亮参数范例代码
   * @param{Number} format - 参数类别
   * @param{Array} params - 参数数组
   * @param{Array} dataTypes - 所有数据模型列表
   * @param{Node} container1 - 范例代码 DOM 容器
   * @param{Node} container2 - 没有范例代码时显示提示的 DOM 容器
   */
  p._$initParamsSampleCode = function (format, params, constraints, dataTypes, container1, container2, callback) {
    if (params && params.length === 0) {
      // 没有参数
      e._$addClassName(container1, 'f-dn');
      e._$delClassName(container2, 'f-dn');
      (typeof callback === 'function') && callback({});
      return container2.innerHTML = '无';
    }
    MockDataWorkerUtil.getParameterMockData(
      window.location.origin,
      constraints,
      format,
      params,
      dataTypes,
      function (result) {
        if (result.checkError) {
          e._$addClassName(container1, 'f-dn');
          e._$delClassName(container2, 'f-dn');
          container2.innerHTML = result.checkError;
        } else {
          e._$delClassName(container1, 'f-dn');
          e._$addClassName(container2, 'f-dn');
          this._$initSampleCode(result.json, container1);
          (typeof callback === 'function') && callback(result.json);
        }
      }.bind(this),
      function (error) {
        var content = '';
        error.forEach(function (item) {
          content += (item.name ? '参数' + item.name + ' : ' : '') + (item.message ? item.message : '' + item) + '\n';
        });
        Modal.alert({
          title: '生成规则JS脚本错误',
          content: content,
          clazz: 'modal-exp-error'
        });
      }.bind(this)
    );
  };
  /**
   * 根据参数列表生成Mock数据
   * @param{Number} format - 参数类别
   * @param{Array} params - 参数数组
   * @param{Array} dataTypes - 所有数据模型列表
   */
  p._$initParamsPureSampleCode = function (format, params, constraints, dataTypes, callback) {
    if (params && params.length === 0) {
      (typeof callback === 'function') && callback({});
      return;
    }
    MockDataWorkerUtil.getParameterMockData(
      window.location.origin,
      constraints,
      format,
      params,
      dataTypes,
      function (result) {
        if (result.checkError) {
          Modal.alert({
            title: '生成规则JS脚本错误',
            contentTemplate: result.checkError,
            clazz: 'modal-exp-error'
          });
        } else {
          (typeof callback === 'function') && callback(result.json);
        }
      }.bind(this),
      function (error) {
        var content = '';
        error.forEach(function (item) {
          content += (item.name ? '参数' + item.name + ' : ' : '') + (item.message ? item.message : '' + item) + '\n';
        });
        Modal.alert({
          title: '生成规则JS脚本错误',
          content: content,
          clazz: 'modal-exp-error'
        });
      }.bind(this)
    );
  };
  /**
   * 获取 http method 列表
   */
  p._$getMethodList = function () {
    return [{
      name: 'GET',
      id: 'GET'
    },
      {
        name: 'POST',
        id: 'POST'
      },
      {
        name: 'PUT',
        id: 'PUT'
      },
      {
        name: 'PATCH',
        id: 'PATCH'
      },
      {
        name: 'DELETE',
        id: 'DELETE'
      },
      {
        name: 'HEAD',
        id: 'HEAD'
      }
    ];
  };
  /**
   * 上传头像默认背景及首字母
   * @param {Array} list 要处理的数组
   * @param {String} name 名称字段
   * @param {String} namePinyin 名称拼音字段
   */
  p._$resetLogo = function (list, name, namePinyin) {
    var v;
    var letterMap = {
      b: v = 'u-avatar-second',
      h: v,
      n: v,
      t: v,
      z: v,
      c: v = 'u-avatar-third',
      i: v,
      o: v,
      u: v,
      d: v = 'u-avatar-fourth',
      j: v,
      p: v,
      v: v,
      e: v = 'u-avatar-fifth',
      l: v,
      q: v,
      w: v,
      f: v = 'u-avatar-sixth',
      k: v,
      r: v,
      x: v
    };

    list.forEach(function (item) {
      if (item.logo) {
        return;
      }
      item.letterText = item[name].trim().charAt(0).toUpperCase();
      item.bgClassName = letterMap[item[namePinyin].trim().charAt(0)] || 'u-avatar-default';
    });
  };
  /**
   * 根据字符串模板和数据, 返回替换后的字符串
   * @param{String} str - 字符串模板
   * @param{Object} data - 数据
   * @return{String} 替换后的字符串
   */
  p._$renderByJst = function (str, data) {
    return jst._$get(jst._$add(str), data);
  };
  /**
   * 清除选中
   */
  p.__clearSelections = function () {
    if (window.getSelection) {
      // 获取选中
      var selection = window.getSelection();
      // 清除选中
      selection.removeAllRanges();
    } else if (document.selection && document.selection.empty) {
      // 兼容 IE8 以下，但 IE9+ 以上同样可用
      document.selection.empty();
    }
  };
  /**
   * 初始化排序方式
   * @param  {Number} orderType 排序方式
   * @param {String} sortType 当前排序方式（字符串）
   */
  p.__initOrder = function (orderType, sortType) {
    switch (orderType) {
      case 0:
        sortType = '';
        break;
      case 1:
        sortType = 'name-up';
        break;
      case 2:
        sortType = 'name-down';
        break;
      case 3:
        sortType = 'time-up';
        break;
      case 4:
        sortType = 'time-down';
        break;
      case 5:
        sortType = 'count-up';
        break;
      case 6:
        sortType = 'count-down';
        break;
    }
    return sortType;
  };
  /**
   * 项目，项目组按字段排序
   * @param  {Object} resList 项目组，项目列表
   * @param {String} tag 当前排序字段名称
   * @param {String}sortType 排序方式 比如'name-up'
   * @param {Array} toplist 置顶数组
   * @param {Array} noToplist 非置顶数组
   * @param {Array} publist 默认||公共数组
   * @param {Boolean} isChangeSort 是否改变当前排序方式
   */
  p.__sortByField = function (tag, sortType, toplist, noToplist, publist, isChangeSort) {
    var typeX = tag === 'name' ? 'string' : 'number';
    var flag, exchange, typeNum;
    var pids = [];
    if (tag == sortType.split('-')[0]) {
      if (isChangeSort) {
        flag = sortType.split('-')[1] == 'up' ? false : true;
        exchange = sortType.split('-')[1] == 'up' ? 'down' : 'up';
      } else {
        flag = sortType.split('-')[1] == 'up' ? true : false;
        exchange = sortType.split('-')[1] == 'up' ? 'up' : 'down';
      }
    } else {
      flag = true;
      exchange = 'up';
    }
    switch (tag) {
      case 'name':
        if (flag == true) {
          typeNum = db.CMN_ORD_NAME_ASC;
        } else {
          typeNum = db.CMN_ORD_NAME_DESC;
        }
        break;
      case 'time':
        if (flag == true) {
          typeNum = db.CMN_ORD_TIME_ASC;
        } else {
          typeNum = db.CMN_ORD_TIME_DESC;
        }
        break;
      case 'count':
        if (flag == true) {
          typeNum = db.CMN_ORD_COUNT_ASC;
        } else {
          typeNum = db.CMN_ORD_COUNT_DESC;
        }
        break;
    }

    var sortPROs = noToplist;
    this._$sortBy(sortPROs, typeX, tag, flag);
    sortPROs = toplist.concat(sortPROs);
    if (publist.constructor == Array) {
      sortPROs = sortPROs.concat(publist);
    } else {
      sortPROs = sortPROs.concat([publist]);
    }
    sortType = tag + '-' + exchange;
    u._$forEach(sortPROs, function (item) {
      pids.push(item.id);
    });
    var _returnData = {
      pids: pids,
      typeNum: typeNum,
      sortType: sortType
    };
    return _returnData;
  };
  /**
   * 解析javabean文件并获得数据模型相关属性
   * @param {Files} 所有文件数据
   * @param {Function} 文件解析完成之后执行的函数
   *
   */
  p._$importFtlTemplate = function (files, callback) {
    var importFiles = [];
    for (var i = 0; i < files.length; i++) {
      if (files[i].name.match(/.+\.ftl$/)) { //ftl文件
        importFiles.push(files[i]);
      }
    }
    //当前用户作为负责人
    var user = _usrCache._$$CacheUser._$allocate();
    var currentUserId = user._$getUserInCache().id;
    var importDT = [],
      fileLength = importFiles.length,
      index = 0;
    var that = this;
    for (var i = 0; i < fileLength; i++) {
      (function (file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function () {
          var baseName = file.name;
          var name = baseName.substring(0, baseName.lastIndexOf('.'));
          var path = file.webkitRelativePath;

          path = path.substring(path.indexOf('/'), path.length);
          path = path.replace('.ftl', '');
          //解析参数
          var params = [];
          var expressions = freemarker.parse(this.result);
          expressions.forEach(function (expr) {
            var res = that._$getVariableFromFtl(expr);
            var theSameParam = params.filter(function (param) {
              return param.name == res.name;
            });
            if (theSameParam.length == 0) {
              params.push(res);
            }
            //变量去重
          });

          importDT.push({ //一个数据类型
            name: name,
            path: path,
            respoId: currentUserId,
            status: '未开始',
            params: params
          });

          index++;
          if (index === fileLength && importDT.length > 0) {
            //弹框
            callback(importDT);
          }
        };
      })(importFiles[i]);
    }
  };

  p._$getVariableFromFtl = function (expr) {
    var systemModel = {
      'String': db.MDL_SYS_STRING,
      'Number': db.MDL_SYS_NUMBER,
      'Boolean': db.MDL_SYS_BOOLEAN,
      'Unknown': db.MDL_SYS_UNKNOWN,
      'File': db.MDL_SYS_FILE,
      'Variable': db.MDL_SYS_VARIABLE,
    };
    var defaultRes = {
      typeName: '',
      name: '',
      type: '',
      isArray: db.CMN_BOL_NO,
      description: ''
    };
    var name = expr.expr;
    name = name.replace(/\s*/g, '');
    name = name.replace(/!*/g, '');
    name = name.replace('"', '');
    name = name.replace('\'', '');
    if (name.indexOf('?keys') > -1) {
      name = name.substring(0, name.indexOf('?keys'));
      defaultRes.typeName = 'MDL_SYS_VARIABLE';
      defaultRes.name = name;
      defaultRes.type = 'Variable';
      defaultRes.isArray = db.CMN_BOL_NO;
    } else if (name.indexOf('.') > -1) {
      //直接是匿名类型
      name = name.split('.');
      defaultRes.typeName = 'MDL_SYS_VARIABLE';
      defaultRes.name = name[0];
      defaultRes.type = 'Variable';
      defaultRes.isArray = db.CMN_BOL_NO;

    } else if (name.indexOf('[') > -1 && name.indexOf(']') > -1) {
      name = name.substring(0, name.indexOf('['));
      defaultRes.typeName = 'MDL_SYS_VARIABLE';
      defaultRes.name = name;
      defaultRes.type = 'Variable';
      defaultRes.isArray = db.CMN_BOL_NO;

    } else {
      if (expr.children) {
        //也有可能是数组，可进一步判断
        defaultRes.typeName = 'MDL_SYS_VARIABLE';
        defaultRes.name = name;
        defaultRes.type = 'Variable';
        defaultRes.isArray = db.CMN_BOL_NO;

      } else if (expr.type == 'replace') {
        //插值语句
        defaultRes.typeName = 'MDL_SYS_STRING';
        defaultRes.name = name;
        defaultRes.type = 'String';
        defaultRes.isArray = db.CMN_BOL_NO;
      } else if (expr.type == 'ifsize') {
        defaultRes.typeName = 'MDL_SYS_STRING';
        defaultRes.name = name;
        defaultRes.type = 'String';
        defaultRes.isArray = db.CMN_BOL_NO;
      } else if (expr.type == 'ifempty') {
        defaultRes.typeName = 'MDL_SYS_Boolean';
        defaultRes.name = name;
        defaultRes.type = 'Boolean';
        defaultRes.isArray = db.CMN_BOL_NO;
      }
    }
    return defaultRes;
  };

  /**
   * 是否是字符、数字、下划线组成
   * @param str
   * @returns {boolean}
   * @private
   */
  p._$isNumberStr = function (str) {
    return /^[\d|a-zA-Z|_]+$/.test(str);
  };

  /**
   * localstorage 字符串转布尔值
   */
  p._$toBool = function (str) {
    return str !== 'false';
  };

  /**
   * 对象与数组深拷贝
   * @param {Object || Array} obj 要拷贝的对象
   */
  p._$cloneObj = function (obj) {
    var str, newobj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
      return;
    } else if (window.JSON) {
      str = JSON.stringify(obj), //系列化对象
        newobj = JSON.parse(str); //还原
    } else {
      for (var i in obj) {
        newobj[i] = typeof obj[i] === 'object' ?
          cloneObj(obj[i]) : obj[i];
      }
    }
    return newobj;
  };

  p._$getDataByPromise = function (cacheClazz, onloadFunc, onload, oncancel, fetchFunc, prepareData, thisObj) {
    var onreject;
    var onresolve;
    var cache;
    if (!oncancel) {
      oncancel = function (cache) {
        cache._$recycle();
      };
    }
    if (!onload) {
      onload = function (cache, event, promise, resolve) {
        var listData = cache._$getListInCache(event.key);
        cache._$recycle();
        onresolve(listData);
      }.bind(thisObj);
    }
    var promise = new Promise(function (resolve, reject) {
      onreject = reject;
      onresolve = resolve;
      var cacheOption = {};
      cacheOption[onloadFunc] = function (event) {
        delete promise.__cancel;
        var index = this._promises.indexOf(promise);
        this._promises.splice(index, 1);
        onload(cache, event, promise, resolve);
      }.bind(this);
      cache = cacheClazz._$allocate(cacheOption);
      if (typeof prepareData === 'function') {
        prepareData = prepareData(cache);
      }
      setTimeout(function () {
        cache[fetchFunc](prepareData);
      }, 0);
    }.bind(thisObj));
    thisObj._promises.push(promise);
    promise.__cancel = function () {
      var index = this._promises.indexOf(promise);
      this._promises.splice(index, 1);
      onreject('cancel');
      oncancel(cache);
    }.bind(thisObj);
    return promise;
  };

  /**
   * 执行规则函数
   * @param {String} options
   * @property {String} options.code - 待执行的函数
   * @property {Object} options.params - 传给函数的参数
   * @property {Array} options.constraints - 传给函数的参数
   * @property {String} options.rootPath - 传给函数的参数
   * @property {Function} options.onmessage
   * @property {Function} options.onerror
   */
  p._$runScript = function (options) {
    var cache = tcCache._$$CacheTestCase._$allocate();
    cache._$runScript(options);
  };
  /**
   * 根据id获取历史版本（不包括本身），按照id降序
   * @param {Number} id  -  资源id
   * @param {Array} list -  资源列表
   * @return {Array}     -  历史版本数组
   */
  p._$getVersionsById = function (id, list) {
    var dt = list.find(function (item) {
      return item.id === id;
    });
    if (dt) {
      var originId = dt.version ? dt.version.origin : undefined,
        versions = [];
      if (originId) {
        list.forEach(function (item) {
          if ((item.id == originId || (item.version && item.version.origin == originId)) &&
            item.id !== id
          ) {
            var versionName = item.version ? item.version.name : '初始版本';
            var temp = this._$extend(item, {
              versionName: versionName
            });
            versions.push(temp);
          }
        }.bind(this));
        versions.sort(function (a, b) {
          return b.id - a.id;
        });
      }
    }
    return versions;
  };

  /**
   * 根据列表中所有的历史版本映射
   * @param {Array} list -  资源列表
   * @return {Object}    -  历史版本映射(key:最新版本的id,value:与最新版本资源的origin相同的历史版本的数组)
   */
  p._$getVersionsMap = function (list) {
    var sortFunc = function (a, b) {
      return b.id - a.id;
    };

    var versionsMap = {},
      originMap = {},
      tmp, latestId;
    u._$reverseEach(list, function (item) {
      if (item.version) {
        latestId = originMap[item.version.origin];
        if (latestId) {
          tmp = versionsMap[latestId];
        } else {
          originMap[item.version.origin] = latestId = item.id;
          tmp = [];
        }
        tmp.push({
          id: item.id,
          name: item.version.name
        });
        versionsMap[latestId] = tmp;
      }
    }, this);
    for (var item in versionsMap) {
      versionsMap[item].sort(sortFunc);
    }
    return versionsMap;
  };
  /**
   * 过滤历史版本的数据
   * @param  {Array} list - 资源列表
   * @param  {Boolean} [needSort] - 需要排序（针对数据模型需要区分系统类型和自定义类型分别按照名称排序）
   * @return {Array}      - 过滤掉历史版本的资源列表
   */
  p._$filterVersion = function (list, needSort) {
    var sortFuncById = function (a, b) {
      return b.id - a.id;
    };
    var result = [],
      originList = [];
    this._$clone(list).sort(sortFuncById).forEach(function (item) {
      var version = item.version;
      if (version) {
        if (!originList.includes(version.origin)) {
          originList.push(version.origin);
          result.push(item);
        }
      } else {
        result.push(item);
      }
    });
    // 排序
    if (needSort) {
      var systemDataTypes = [],
        normalDataTypes = [];
      result.forEach(function (dt) {
        if (dt.id <= 10003) {
          systemDataTypes.push(dt);
        } else {
          normalDataTypes.push(dt);
        }
      });
      var sortFuncByName = function (itemA, itemB) {
        return itemA.name.toLowerCase().localeCompare(itemB.name.toLowerCase(), 'zh-CN');
      };
      systemDataTypes.sort(sortFuncByName);
      normalDataTypes.sort(sortFuncByName);
      return systemDataTypes.concat(normalDataTypes);
    }
    return result;
  };

  /**
   * 生成范例数据
   * @param {Node} 列表根节点
   * @param {String} 列表类型(datatypes,pages,templates,interfaces,groups,constraints)
   * @return {Void}
   */
  p._$createSampleCodeHtml = function (allData, constraints, dataTypes) {
    var indexedData = [];
    var nodeParams = [];
    Object.keys(allData).forEach(function (objKey) {
      // loop through interfaces, datatypes, pages, templates
      var dataArr = allData[objKey];
      for (var i = 0; i < dataArr.length; i++) {
        var dataItem = dataArr[i];
        if (objKey === 'interfaces') {
          var id = dataItem.id;
          var keys = ['inputs', 'outputs'];
          var formats = [dataItem.reqFormat, dataItem.resFormat];
          for (var j = 0; j < keys.length; j++) {
            var nodeParam = {};
            nodeParam.type = 'interfaces';
            var res = dataItem;
            var key = keys[j];
            var format = formats[j];
            var params = res.params[key];
            nodeParam.format = format;
            nodeParam.params = params;
            nodeParams.push(nodeParam);
            indexedData.push(dataItem);
          }
        } else {
          var nodeParam = {};
          nodeParam.type = objKey;
          if (objKey === 'datatypes') {
            nodeParam.id = dataItem.id;
          } else {
            nodeParam.format = 0;
            nodeParam.params = dataItem.params;
          }
          nodeParams.push(nodeParam);
          indexedData.push(dataItem);
        }
      }
    });

    MockDataWorkerUtil.getDocMockData(
      window.location.origin,
      constraints,
      nodeParams,
      dataTypes,
      function (result) {
        var mockResult;
        if (result.checkError) {
          mockResult = result.checkError;
        } else {
          mockResult = hljs.highlight('json', JSON.stringify(result.json, null, 4)).value;
        }
        //update interfaces
        if (allData.interfaces && allData.interfaces.length > 0 &&
          result.index >= 0 &&
          result.index <= allData.interfaces.length * 2 - 1) {
          // within the interface range
          // need specify mockHtml array index
          if (!indexedData[result.index].mockHtml) {
            // not exist
            // create empty array
            indexedData[result.index].mockHtml = ['', ''];
          }
          // even => 0 => inputs
          // odd => 1 => outputs
          var mockIndex = result.index % 2;
          indexedData[result.index].mockHtml[mockIndex] = mockResult;
        } else {
          // datatypes, pages, templates case
          indexedData[result.index].mockHtml = mockResult;
        }
        v._$dispatchEvent(document, 'mockLoad');
      }.bind(this)
    );
  };

  p._$createSampleCode = function (rootNode, type, data, constraints, dataTypes, allFinishedCallback) {
    var findResById = function (id, resArray) {
      for (var i = 0, res; res = resArray[i]; i++) {
        if (res.id === id) {
          return res;
        }
      }
      return undefined;
    };

    var nodes = e._$getByClassName(rootNode, 'sample-code');
    //封装参数数组
    var nodeParams = [];
    nodes.forEach(function (item) {
      var id = Number(e._$dataset(item, 'id'));
      var nodeParam = {};
      nodeParam.type = type;
      if (type === 'datatypes') {
        nodeParam.id = id;
      } else {
        var res = findResById(id, data);
        var key = e._$dataset(item, 'key');
        var format = 0,
          params;
        if (type === 'interfaces' || type === 'rpcs') {
          format = Number(e._$dataset(item, 'format'));
          params = res.params[key];
        } else {

          params = res[key];
        }
        nodeParam.format = format;
        nodeParam.params = params;
      }
      nodeParams.push(nodeParam);
    }.bind(this));

    var count = 0;
    MockDataWorkerUtil.getDocMockData(
      window.location.origin,
      constraints,
      nodeParams,
      dataTypes,
      function (result) {
        count++;
        //根据node标记更新UI
        var index = result.index;
        var node = nodes[index];
        if (result.checkError) {
          node.innerHTML = result.checkError;
          e._$delClassName(node, 'lang-json');
        } else {
          node.innerHTML = hljs.highlight('json', JSON.stringify(result.json, null, 2)).value;
        }
        if (count === nodeParams.length) {
          allFinishedCallback && allFinishedCallback();
        }
      }.bind(this)
    );
  };

  /**
   * 数组差集（source有，target没有的）
   * @param {Array} source 源数组
   * @param {Array} target 目标数组
   * @return {Array} 差集
   */
  p._$arrayDiff = function (source, target) {
    var result = [];

    source.forEach(function (item) {
      if (!target.includes(item)) {
        result.push(item);
      }
    });

    return result;
  };

  /**
   * 读取所有文件的内容
   * @param {File} files - 所有文件数据
   * @param {Function} callback -  文件读取完后的回调
   */
  p._$readFiles = function (files, callback) {
    var readFileActions = [];
    [].slice.call(files).forEach(function (file) {
      readFileActions.push(new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function () {
          resolve({
            file: {name: file.name, size: file.size},
            content: reader.result,
            webkitRelativePath: file.webkitRelativePath
          });
        }.bind(this);
      }));
    });
    Promise.all(readFileActions).then(callback);
  };

  p._$importTestcaseFiles = function (fileType, files, callback, pid) {
    this._$readFiles(files, function (data) {
      switch (fileType) {
        case 'json':
          try {
            var importMap = {};
            var importData = [];
            var infCache = _infCache._$$CacheInterface._$allocate({
              oncustomlistload: function () {
                Object.keys(importMap).forEach(function (id) {
                  var itf = infCache._$getItemInCache(id);
                  importData.push({
                    interface: itf,
                    testcases: importMap[id]
                  });
                });
                // 生成名字，格式为接口名-时间-序号，由于批量导入用例，时间可能一样，故这里再用序号进行区分，如果用户提供了名字，则以用户为准，否则自动生成。
                var time = new Date().getTime();
                importData.forEach(function (ipt) {
                  var noNameTestcases = ipt.testcases.filter(function (tc) {
                    return tc.name == null;
                  });
                  if (noNameTestcases.length === 1) {
                    noNameTestcases[0].name = ipt.interface.name + '-' + time;
                  } else {
                    noNameTestcases.forEach(function (tc, index) {
                      tc.name = ipt.interface.name + '-' + time + '-' + index;
                    });
                  }
                });
                callback(importData);
                infCache._$recycle();
              }
            });
            var jsonData = JSON.parse(data[0].content);
            var infList = infCache._$getListInCache(infCache._$getListKey(pid));
            Object.keys(jsonData).forEach(function (key) {
              var data = key.split(' '),
                method = data[0],
                path = data[1];
              var infs = infList.filter(function (itf) {
                if (itf.method.toUpperCase() === method.toUpperCase()) {
                  if (itf.path === path) {
                    return true;
                  } else {
                    var pathRegex = ptr.pathToRegexp(itf.path);
                    return pathRegex.test(path);
                  }
                } else {
                  return false;
                }
              });
              infs = infs.sort(function (inf1, inf2) {
                return inf2.path.length - inf1.path.length;
              });
              if (infs.length) {
                var inf = infs[0];
                if (importMap[inf.id]) {
                  importMap[inf.id] = importMap[inf.id].concat(jsonData[key]);
                } else {
                  importMap[inf.id] = jsonData[key];
                }
              }
            });
            if (Object.keys(importMap).length) {
              infCache._$getCustomList({
                ids: Object.keys(importMap).join(',')
              });
            } else {
              infCache._$recycle();
              Modal.alert({
                title: '导入测试用例失败',
                content: '没有要导入的测试用例！请检查格式是否正确！',
                clazz: 'modal-exp-error'
              });
            }
          } catch (e) {
            console.error(e);
          }
          break;
      }
    }.bind(this));
  };
  /**
   * 解析文件并获得数据模型相关属性
   * @param {String} fileType - 文件类型，json、javabean等
   * @param {File} files - 所有文件数据
   * @param {Function} callback - 文件解析完成之后执行的函数
   */
  p._$importDatatypeFiles = function (fileType, files, callback) {
    var typeNameMap = {
      'MDL_SYS_STRING': {
        reg: /^(string|byte|char|character)$/i,
        typeName: 'String'
      },
      'MDL_SYS_NUMBER': {
        reg: /^(short|int|integer|long|float|double)$/i,
        typeName: 'Number'
      },
      'MDL_SYS_BOOLEAN': {
        reg: /^(boolean)$/i,
        typeName: 'Boolean'
      }
    };
    /**
     * 读取文件内容解析出数据模型
     * @param {String} content 文件内容
     * @param {File} file 文件
     */
    var parseJavaBean = function (content, file) {
      var data = jsonbean.parse(content);
      var params = [];
      //数据类型的属性数组
      if (data.attributes) {
        data.attributes.forEach(function (item) {
          var obj = getTypeName(item.typeName);
          params.push({
            typeName: obj.typeName,
            name: item.name,
            isArray: item.isArray ? db.CMN_BOL_YES : db.CMN_BOL_NO,
            description: item.description
          });
        });
      }
      if (params.length > 0) {
        return {
          name: file.name.replace('.java', ''),
          params: params
        };
      }
    };
    /**
     * javabean类型名称转换
     * @param {String} typeName 原类型名称
     */
    var getTypeName = function (typeName) {
      var realTypeName = Object.keys(typeNameMap).find(function (item) {
        return typeNameMap[item].reg.test(typeName);
      }.bind(this));
      if (realTypeName) {
        return {
          typeName: typeNameMap[realTypeName].typeName,
        };
      } else {
        return {
          typeName: typeName,
        };
      }
    };
    var importJavabean = function (data) {
      var importingDatatypes = [];
      data.forEach(function (item) {
        var result = parseJavaBean(item.content, item.file);
        importingDatatypes.push(result);
      });
      return importingDatatypes;
    };
    this._$readFiles(files, function (data) {
      switch (fileType) {
        case 'json':
          var jsonData = [];
          var parseResult;
          try {
            data.forEach(function (item) {
              parseResult = JSON.parse(item.content);
              if (!Array.isArray(parseResult)) {
                parseResult = [parseResult];
              }
              jsonData = jsonData.concat(parseResult);
            });
            var hasInvalidData = false;
            jsonData.forEach(function (item) {
              item.params.forEach(function (param) {
                if (!param.typeName) {
                  hasInvalidData = true;
                }
                Object.assign(param, getTypeName(param.typeName));
              });
            });
            jsonData = jsonData.filter(function (item) {
              return item.params.find(function (param) {
                return param.typeName;
              });
            });
            if (hasInvalidData) {
              notify.show('导入的数据格式不正确！', 'error', 2000);
            }
          } catch (e) {
            Modal.alert({
              title: '导入JSON文件失败',
              content: '解析失败：' + e.message,
              clazz: 'modal-exp-error'
            });
            return;
          }
          return callback(jsonData);
        case 'javabean':
          try {
            var result = importJavabean(data);
          } catch (e) {
            Modal.alert({
              title: '导入Java Bean 文件失败',
              content: '解析失败：' + e.message,
              clazz: 'modal-exp-error'
            });
            return;
          }
          return callback(result);
      }
    });
  };

  /**
   * 解析导入的接口文件，如果是 swagger, 则调用 worker 解析 swagger 文件
   * @param {String} fileType - 文件类型
   * @param {File} files - 所有文件数据
   * @param {Function} callback -  文件解析完成之后执行的函数
   */
  p._$importInterfaceFiles = function (fileType, files, callback, pid) {
    var importSwagger = function (data) {
      // 发给 worker
      var s = [];
      // 注入解析Swagger的脚本
      s.push('importScripts(\'' + window.location.origin + '/src/lib/NEI_import/dist/NEISwagger.js\');');
      var blob = new Blob(s);
      var worker = new Worker(URL.createObjectURL(blob));
      worker.onmessage = worker.onerror = callback;
      worker.postMessage(JSON.stringify(data));
    };
    this._$readFiles(files, function (data) {
      var result = [];
      var countId = -1;
      // 获取参数需要添加的数据类型，在HAR解析及postman解析中用到，由于没有定义名字，所有需要添加的统一定义为匿名类型
      var getAddDatatypes = function (params) {
        var createDatatype = function (param) {
          if (param.type === db.MDL_SYS_OBJECT && param.isObject) {
            var datatype = {
              name: '',
              id: countId,
              description: '',
              format: 0,
              params: [],
              type: 2
            };
            param.type = countId;
            countId--;
            param.params.forEach(function (p) {
              var dt = createDatatype(p);
              if (dt) {
                p.type = dt.id;
              }
              datatype.params.push(p);
            });
            result.push(datatype);
            return datatype;
          }
        };
        Object.keys(params).forEach(function (field) {
          params[field].forEach(function (param) {
            createDatatype(param);
          });
        });
        return result;
      };

      var parseUrl = function (url) {
        var protocolDiv = url.indexOf('://');
        var protocol;
        if (protocolDiv === -1) {
          protocol = 'http';
        } else {
          protocol = url.slice(0, protocolDiv);
          url = url.slice(protocolDiv + 3);
        }
        var pathDiv = url.indexOf('/');
        var host;
        if (pathDiv !== -1) {
          host = url.slice(0, pathDiv);
          url = url.slice(pathDiv);
        } else {
          host = url;
        }
        var pathname;
        var queryStringDiv = url.indexOf('?');
        var queryString;
        if (queryStringDiv === -1) {
          pathname = url;
        } else {
          pathname = url.slice(0, queryStringDiv);
          url = url.slice(queryStringDiv + 1);
          queryString = url;
        }
        return {
          pathname: pathname,
          protocol: protocol,
          host: host,
          queryString: queryString
        };
      };

      var processGetParams = function (params) {
        params.forEach(function (param) {
          if (/^\d+$/.test(param.defaultValue)) {
            param.typeName = 'Number';
            param.type = db.MDL_SYS_NUMBER;
          } else if (/^(true|false)$/.test(param.defaultValue)) {
            param.typeName = 'Boolean';
            param.type = db.MDL_FMT_BOOLEAN;
          }
        });
      };

      var processRequired = function (params) {
        Object.keys(params).forEach(function (field) {
          params[field].forEach(function (param) {
            param.required = true;
            if (param.type === db.MDL_SYS_OBJECT) {
              param.typeName = 'Object';
            }
          });
        });
      };

      switch (fileType) {
        case 'json':
          try {
            callback({
              data: JSON.parse(data[0].content)
            });
          } catch (e) {
            Modal.alert({
              title: '导入JSON文件失败',
              content: '解析错误：' + e.message,
              clazz: 'modal-exp-error'
            });
          }
          break;
        case 'swagger':
          try {
            importSwagger(data);
          } catch (e) {
            Modal.alert({
              title: '导入Swagger文件失败',
              content: '解析错误：' + e.message,
              clazz: 'modal-exp-error'
            });
          }
          break;
        case 'har':
          var har = function processHar(harContent) {
            var entries = (harContent && harContent.log && harContent.log.entries) || [];
            var interfaces = entries.filter(function (it) {
                return it.response.content.mimeType.indexOf('json') != -1;
              } //第一轮筛选，我们认为只有json格式才可以被接受为接口
            );
            return interfaces.map(function (itr) {
              var request = itr.request;
              var method = request.method;
              var urlObj = parseUrl(request.url);
              var path;
              // 如果是GET请求，queryString里面的内容需要放到请求数据中
              // 如果是其他类型的请求，则将queryString都放到path里面
              var requestData;
              var responseData;
              if (method === 'GET') {
                path = urlObj.pathname;
                var search = '';
                requestData = request.queryString.reduce(function (obj, item) {
                  var regexStr = '(^|&)' + item.name + '=';
                  var regex = new RegExp(regexStr);
                  if (regex.test(urlObj.queryString)) {
                    obj[item.name] = item.value;
                  } else {
                    search && (search += '&');
                    search += item.name;
                  }
                  return obj;
                }, {}, this);
                if (search) {
                  path += '?' + search;
                }
              } else {
                path = urlObj.pathname + (urlObj.queryString ? ('?' + urlObj.queryString) : '');
                try {
                  requestData = JSON.parse(itr.request.postData.text);
                } catch (e) {
                  requestData = {};
                }
              }
              // queryString 不必从path这里拿, har有提供, 这是一个json类型，直接让nei系统去判断类型
              try {
                responseData = JSON.parse(itr.response.content.text);
              } catch (e) {
                responseData = {};
              }
              var neiBean = {};
              neiBean.params = {};
              neiBean.params.inputs = this.getParamsFromJSONData(requestData, pid, false, 0);
              neiBean.method = method;
              var params = this.getParamsFromJSONData(responseData, pid, false, 0);
              neiBean.params.outputs = params;
              // GET请求对inputs做额外处理
              if (method === 'GET') {
                processGetParams(neiBean.params.inputs);
              }
              processRequired(neiBean.params);
              neiBean.name = path;
              neiBean.path = path;
              getAddDatatypes(neiBean.params);
              return neiBean;
            }, this);
          }.bind(this);
          try {
            var data = har(JSON.parse(data[0].content));
            if (data.length === 0) {
              Modal.alert({
                title: '解析HAR接口文件错误',
                content: '接口为空！',
                clazz: 'modal-exp-error'
              });
              return;
            }
            callback({
              data: {
                interfaces: data,
                datatypes: result
              }
            });
          } catch (e) {
            Modal.alert({
              title: '解析HAR接口文件错误',
              content: '格式不正确！',
              clazz: 'modal-exp-error'
            });
            console.error(e);
          }
          break;
        case 'postman':
          try {
            var data = JSON.parse(data[0].content);
            if (!data.item) {
              Modal.alert({
                title: '解析Postman接口文件错误',
                content: '暂不支持v1版本的Postman接口文件解析！',
                clazz: 'modal-exp-error'
              });
              return;
            } else {
              var entries = [];
              var getInterfaces = function (obj) {
                obj.item.forEach(function (o) {
                  if (o.request) {
                    entries.push(o);
                  } else {
                    getInterfaces(o);
                  }
                });
              };
              getInterfaces(data);
              var interfaces = entries.map(function (interface) {
                var responseData;
                var request = interface.request;
                var method = request.method;
                var urlObj = parseUrl(typeof request.url === 'string' ? request.url : request.url.raw);
                var path;
                var requestData;
                if (method === 'GET') {
                  var path = urlObj.pathname;
                  var search = '';
                  requestData = {};
                  if (request.url.query) {
                    requestData = request.url.query.reduce(function (obj, item) {
                      if (item.value != null) {
                        obj[item.key] = item.value;
                      } else {
                        search && (search += '&');
                        search += item.key;
                      }
                      return obj;
                    }, {}, this);
                  }
                  if (search) {
                    path += '?' + search;
                  }
                } else {
                  path = urlObj.pathname + (urlObj.queryString ? ('?' + urlObj.queryString) : '');
                  try {
                    requestData = JSON.parse(request.body.raw);
                  } catch (e) {
                    requestData = {};
                  }
                }
                try {
                  responseData = interface.response.length > 0 ? JSON.parse(interface.response[0].body) : {};
                } catch (e) {
                  return null;
                }
                requestData = this.getParamsFromJSONData(requestData, pid, false, 0);
                responseData = this.getParamsFromJSONData(responseData, pid, false, 0);
                var params = {
                  inputs: requestData,
                  outputs: responseData
                };
                if (method === 'GET') {
                  processGetParams(params.inputs);
                }
                processRequired(params);
                getAddDatatypes(params);
                return {
                  name: interface.name,
                  // path 最大长度为 150
                  path: path.substr(0, 150),
                  method: method,
                  params: params
                };
              }, this).filter(function (item) {
                return item;
              });

              if (interfaces.length === 0) {
                Modal.alert({
                  title: '解析Postman接口文件错误',
                  content: '接口为空！',
                  clazz: 'modal-exp-error'
                });
                return;
              }
              callback({
                data: {
                  interfaces: interfaces,
                  datatypes: result
                }
              });
            }
          } catch (e) {
            Modal.alert({
              title: '解析Postman接口文件错误',
              content: '格式不正确！',
              clazz: 'modal-exp-error'
            });
            console.error(e);
          }
          break;
      }
    }.bind(this));
  };

  /**
   * 解析导入的RPC接口文件
   * @param {String} fileType - 文件类型
   * @param {File} files - 所有文件数据
   * @param {Function} callback -  文件解析完成之后执行的函数
   */
  p._$importRPCFiles = function (fileType, files, callback) {
    var getAnonymousDatatypeId = (function () {
      var startId = -9999;
      // 约定通过负数的id来建立联系
      return function () {
        return startId--;
      };
    })();
    var typeNameMap = {
      'MDL_SYS_STRING': {
        reg: /^(string|byte|char|character)$/i,
        typeName: 'String'
      },
      'MDL_SYS_NUMBER': {
        reg: /^(short|int|integer|long|float|double)$/i,
        typeName: 'Number'
      },
      'MDL_SYS_BOOLEAN': {
        reg: /^(boolean)$/i,
        typeName: 'Boolean'
      }
    };
    // 保存所有需要导入的数据模型
    var allImportingDatatypes = [];
    var saveDatatype = function (datatype) {
      if (!/^(String|Number|Boolean)$/.test(datatype.name)) {
        allImportingDatatypes.push(datatype);
      }
    };
    // 根据 typeName 获取数据模型
    var getDatatypeByTypeName = function (typeName) {
      // 非系统类型，也就是自定义数据模
      if (typeName === 'Object') {
        // 匿名类型，通过一个临时的负数id（后端代码有要求，见 DatatypeService.js@addList）和真正引用它的参数建立联系
        // 后端在创建完这个匿名类型后，会通过这个匿名的真实id再和引用它的参数建立联系
        return {
          name: '',
          id: getAnonymousDatatypeId()
        };
      } else {
        // 这里不判断这个数据模型是否已经在当前项目中存在，在res_rpc.js文件中会进行整体的判断
        return {
          name: typeName
        };
      }
    };
    /**
     * 类型名称转换
     * @param {String} typeName 原类型名称
     */
    var getTypeName = function (typeName) {
      var result = typeName;
      var realTypeName = Object.keys(typeNameMap).find(function (item) {
        return typeNameMap[item].reg.test(typeName);
      }.bind(this));
      if (realTypeName) {
        result = typeNameMap[realTypeName].typeName;
      }
      return {
        typeName: result,
      };
    };

    // 获取返回结果的类别
    function getResInfo(output) {
      var typeName = getTypeName(output.type).typeName;
      // 默认为哈希类别
      var format = db.MDL_FMT_HASH;
      // 构造响应结果参数，只会从 rpc 接口中提取一个响应结果参数
      var param = null;
      if (typeName === 'Object') {
        // 如果类型是 Object 的返回值，说明用法不规范，一律忽视
        return {
          format: format,
          param: param
        };
      }
      // 返回值是一个导入类型，只考虑是哈希，虽然其他类别也是可能的
      if (output.importType) {
        // datatypeName 表示是导入了名称为 typeName 的数据模型
        param = {
          datatypeName: output.importType
        };
        saveDatatype({
          name: output.importType
        });
      } else if (output.isArray) {
        format = db.MDL_FMT_ARRAY;
        param = getDatatypeByTypeName(typeName);
        saveDatatype(param);
      } else {
        switch (typeName) {
          case 'String':
            format = db.MDL_FMT_STRING;
            break;
          case 'Number':
            format = db.MDL_FMT_NUMBER;
            break;
          case 'Boolean':
            format = db.MDL_FMT_BOOLEAN;
            break;
          default:
            // 如果返回值是一个自定义类型，比如 RpcResult，则它也是导入类型
            param = {
              datatypeName: typeName
            };
            saveDatatype({
              name: typeName
            });
        }
      }
      return {
        format: format,
        param: param
      };
    }

    /**
     * 读取文件内容解析出数据模型
     * @param {String} content 文件内容
     * @param {File} file 文件
     */
    function parseRpc(content, file) {
      var result = [];
      try {
        var data = rpcToJson.parse(content);
        // 每一个方法都会生成一个 RPC 接口
        result = data.methods.map(function (method) {
          var responseInfo = getResInfo(method.output);
          // 构造 RPC 接口数据
          return {
            // 接口名称优先使用方法的描述，如果没有描述信息，就用方法名
            name: method.description || method.method,
            description: method.description,
            // 接口类名，即包名
            className: data.package + '.' + data.interfaceName,
            // 这是方法名称字段
            path: method.method,
            reqFormat: db.MDL_FMT_HASH,
            resFormat: responseInfo.format,
            params: {
              // 入参
              inputs: method.inputs.map(function (input) {
                var typeName = getTypeName(input.type).typeName;
                var datatype = getDatatypeByTypeName(typeName);
                saveDatatype(datatype);
                // 构造入参列表
                return {
                  name: input.name,
                  description: input.description,
                  isArray: input.isArray ? db.CMN_BOL_YES : db.CMN_BOL_NO,
                  typeName: typeName,
                  required: db.CMN_BOL_YES
                };
              }),
              outputs: responseInfo.param ? [responseInfo.param] : []
            }
          };
        });
      } catch (e) {
        console.log('文件解析错误: ' + file.name + ' ' + e.message);
      }
      return result;
    }

    function getImportingRpcs(data) {
      var importingRpcs = [];
      data.forEach(function (item) {
        var result = parseRpc(item.content, item.file);
        importingRpcs = importingRpcs.concat(result);
      });
      return importingRpcs;
    }

    this._$readFiles(files, function (data) {
      switch (fileType) {
        case 'json':
          try {
            callback({
              data: JSON.parse(data[0].content)
            });
          } catch (e) {
            Modal.alert({
              title: '导入JSON文件错误',
              content: '解析失败：' + e.message,
              clazz: 'modal-exp-error'
            });
          }
          break;
        case 'rpc':
          try {
            return callback({
              data: {
                rpcs: getImportingRpcs(data),
                datatypes: allImportingDatatypes
              }
            });
          } catch (e) {
            Modal.alert({
              title: '导入RPC文件错误',
              content: '解析失败：' + e.message,
              clazz: 'modal-exp-error'
            });
          }
        default:
          break;
      }
    });
  };

  p._$importWordJSONFiles = function (files, callback) {
    this._$readFiles(files, function (data) {
      var jsonData = [];
      var parseResult;
      try {
        data.forEach(function (item) {
          parseResult = JSON.parse(item.content);
          if (!Array.isArray(parseResult)) {
            parseResult = [parseResult];
          }
          jsonData = jsonData.concat(parseResult);
        });
        var hasInvalidData = false;
        jsonData.forEach(function (item) {
          if (!item.name) {
            hasInvalidData = true;
          }
          if (item.associatedWord) {
            item.associatedWord = item.associatedWord
              .split(',')
              .map(function (word) {
                return word.trim();
              })
              .join(',');
          }
        });
        if (hasInvalidData) {
          notify.show('导入的数据格式不正确！', 'error', 2000);
        }
      } catch (e) {
        Modal.alert({
          title: '导入JSON文件失败',
          content: '解析失败：' + e.message,
          class: 'modal-exp-error'
        });
        return;
      }
      return callback(jsonData);
    });
  };

  /**
   * 获取数据模型的详情链接，分内部页面和文档页面
   * @param {Boolean} isDocPreview - 是否是文档页面
   * @param {String} pid - 项目id
   * @param {String} datatypeId - 数据模型id
   * @return {String} 数据模型的详情链接
   */
  p._$getDatatypeDetailLink = function (isDocPreview, pid, datatypeId) {
    if (isDocPreview) {
      // 文档页面
      return '/doc/datatypes/?id=' + pid + '&resid=' + datatypeId;
    } else {
      // 主页面
      return '/datatype/detail/?pid=' + pid + '&id=' + datatypeId;
    }
  };

  // 从 json 中提取参数
  p.getParamsFromJSONData = function (json, pid, isHeader, format) {
    if (!json) {
      return null;
    }
    var setDefaultValue = function (value, param) {
      // json 里面没有 undefined 值, see http://json.org/
      if (value === null || value === undefined) {
        param.genExpression = 'NEI.null()';
      } else if (typeof (value) === 'object') {
        // 如果默认值长度超过500，则直接截断
        // 数组或者对象
        param.defaultValue = JSON.stringify(value).slice(0, 500);
      } else {
        param.defaultValue = (value !== undefined ? value.toString() : '').slice(0, 500);
      }
    };
    var baseTypesMap = {
      string: db.MDL_SYS_STRING,
      boolean: db.MDL_SYS_BOOLEAN,
      number: db.MDL_SYS_NUMBER
    };
    // 如果是数组，则取第一项
    if (Array.isArray(json)) {
      if (format === db.MDL_FMT_ENUM) {
        // 如果是数组，则数组的每一项当作枚举的值
        var params = [];
        json.forEach(function (param) {
          var subParam = {
            type: baseTypesMap[typeof param] || db.MDL_SYS_STRING,
            params: []
          };
          setDefaultValue(param, subParam);
          params.push(subParam);
        });
        return params;
      } else {
        json = json[0];
      }
    }
    var datatypeCache = dtCache._$$CacheDatatype._$allocate();
    var getParams = function (json) {
      var params = [];
      for (var item in json) {
        var param = {
          name: item,
          adding: true,
        };
        var value = json[item];
        if (isHeader) {
          // 请求头参数都是字符串
          param.type = db.MDL_SYS_STRING;
          setDefaultValue(value, param);
        } else if (format === db.MDL_FMT_ENUM) {
          // 枚举类型的值可能是字符串、数值、布尔，其他类型则转为字符串
          param.type = baseTypesMap[typeof value] || db.MDL_SYS_STRING;
          setDefaultValue(value, param);
        } else {
          var type = datatypeCache._$getTypeByJson(value, pid);
          if (type) {
            param.type = type;
            param.isArray = 0;
            setDefaultValue(value, param);
          } else {
            if (Array.isArray(value)) {
              param.isArray = 1;
              type = datatypeCache._$getTypeByJson(value[0], pid);
              if (type) {
                param.type = type;
              } else {
                if (Array.isArray(value[0])) {
                  // 多维数组，但在系统中又没找到相应的数据模型，类型设置为 String
                  param.type = db.MDL_SYS_STRING;
                } else {
                  // 肯定是 Object 类型了
                  param.isObject = 1;
                  param.type = 8999;
                  param.params = getParams(value[0]);
                }
              }
            } else {
              // 肯定是 Object 类型了
              param.isObject = 1;
              param.isArray = 0;
              param.type = 8999;
              param.params = getParams(value);
            }
          }
        }
        params.push(param);
      }
      return params;
    };
    return getParams(json);
  };

  /**
   * 节流
   */
  p._$throttle = function (fn, threshhold) {
    var last;
    var timer;
    threshhold || (threshhold = 250);
    return function () {
      var context = this;
      var args = arguments;
      var now = +new Date();
      if (last && now < last + threshhold) {
        clearTimeout(timer);
        timer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

  /**
   * 复制文本到剪贴板
   */
  p._$copyText = function (text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
    }
    document.body.removeChild(textArea);
  };

  /**
   * 生成 uuid
   */
  p._$uuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  /**
   * 根据resSchema检验参数
   */
  p._$checkSingleSchema = function (param, resSchema, datatypes) {
    // 如果参数为 Variable，则不检查，直接通过
    if (resSchema == null || param.type === 10000/*Variable类型*/) {
      return {
        result: true
      };
    }
    var getBasicTypeName = function (param) {
      var datatype = datatypes.find(function (dt) {
        return param.type === dt.id;
      });
      if (!datatype || param.type === 8999) {
        return (param.isArray ? 'Array ' : '') + 'Object';
      } else {
        if (datatype.type === 0) {
          // 普通类型
          var innerType = formatNameMap[datatype.format];
          switch (innerType) {
            case 'String':
            case 'Number':
            case 'File':
            case 'Boolean':
            case 'Object':
              return (param.isArray ? 'Array ' : '') + innerType;
            // Enum检查第一个元素
            case 'Enum':
              // Enum只有基础类型
              return (param.isArray ? 'Array ' : '') + getBasicTypeName(datatype.params[0]);
            case 'Array':
              if (param.isArray) {
                return 'Array Array';
              } else {
                return 'Array ' + getBasicTypeName(datatype.params[0]);
              }
          }
        } else if (datatype.type === 1) {
          // 基本类型
          return (param.isArray ? 'Array ' : '') + datatype.name;
        } else {
          // 匿名类型
          return (param.isArray ? 'Array ' : '') + 'Object';
        }
      }
    };
    var foundParam = false;
    var typeMatch = false;
    var error = '';
    resSchema.forEach(function (rule) {
      if (rule.name === param.name) {
        foundParam = true;
        if (rule.required && param.required === 0) {
          error = '响应参数' + param.name + '不是必需参数！';
          return;
        }
        var paramTypeName = getBasicTypeName(param);
        if (Array.isArray(rule.type)) {
          var datatype = datatypes.find(function (dt) {
            return param.type === dt.id;
          });
          var result = rule.type.some(function (typeName) {
            if (typeof typeName === 'string') {
              if (typeName.toUpperCase().trim() === 'Variable'.toUpperCase()) {
                return true;
              } else if (typeName.toUpperCase().trim() === 'Array Variable'.toUpperCase()) {
                // 检查是否是数组即可
                if (paramTypeName.trim().toUpperCase().startsWith('ARRAY')) {
                  return true;
                } else {
                  error = '响应参数' + param.name + '类型不匹配：预期为 ' + rule.type.join(' 或 ') + '，但实际为 ' + (param.isArray ? 'Array ' : '') + paramTypeName;
                }
              } else if (typeName.toUpperCase().trim() === paramTypeName.toUpperCase().trim()) {
                return true;
              } else {
                error = '响应参数' + param.name + '类型不匹配：预期为 ' + rule.type.join(' 或 ') + '，但实际为 ' + (param.isArray ? 'Array ' : '') + paramTypeName;
              }
            }
          });
          typeMatch = result;
        } else {
          // 当作没有规则
          typeMatch = true;
        }
      }
    });
    if (!foundParam) {
      return {
        result: false,
        error: '多余参数：' + param.name
      };
    } else if (!typeMatch) {
      return {
        result: false,
        error: error
      };
    }
    return {
      result: true
    };
  };

  // 根据名称获取系统内置的数据模型 id
  p._$getSystemDatatypeIdByTypeName = function (typeName) {
    switch (typeName) {
      case 'String':
        return db.MDL_SYS_STRING;
      case 'Number':
        return db.MDL_SYS_NUMBER;
      case 'Boolean':
        return db.MDL_SYS_BOOLEAN;
      case 'Variable':
        return db.MDL_SYS_VARIABLE;
      case 'Object':
        return db.MDL_SYS_OBJECT;
      default:
        // 默认返回字符串
        return db.MDL_SYS_STRING;
    }
  };

  /**
   * 本地存储限制检查
   */
  p._$adjustLocalStorageLimit = function (prefix, currentKey, limit) {
    var keys = [];
    var oldestItem = null;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (
        key.includes(prefix) &&
        key !== currentKey
      ) {
        keys.push(key);
        var curItem = JSON.parse(localStorage.getItem(key));
        if (
          !oldestItem ||
          (
            oldestItem &&
            oldestItem[Object.keys(oldestItem)[0]] &&
            curItem.timestamp < oldestItem[Object.keys(oldestItem)[0]]
          )
        ) {
          oldestItem = {};
          oldestItem[key] = curItem.timestamp;
        }
      }
    }
    // 超出存放限制
    // 移除最旧一条
    if (keys.length >= limit) {
      var removedKey = Object.keys(oldestItem)[0];
      localStorage.removeItem(removedKey);
    }
  };

  /**
   * 本地存储params
   */
  p._$saveToLocalStorage = function (key, data) {
    localStorage.setItem(
      key,
      JSON.stringify({
        data: data,
        timestamp: +new Date()
      })
    );
  };

  /**
   * 获取本地存储
   */
  p._$getItemFromLocalStorage = function (key) {
    return localStorage.getItem(key);
  };

  /**
   * 移除本地存储
   */
  p._$removeFromLocalStorage = function (key) {
    localStorage.removeItem(key);
  };

  return p;
});
