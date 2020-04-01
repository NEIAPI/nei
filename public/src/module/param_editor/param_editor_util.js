/**
 * 参数编辑器组件
 */
NEJ.define([
  'base/event',
  'base/element',
  'pro/common/util',
  'pro/cache/config_caches',
  './param_editor_config.js',
  'json!3rd/fb-modules/config/db.json',
], function (v, e, util, caches, editorConfig, dbConst, pro) {

  // 全屏切换
  pro.toggleFullScreen = function (switchToFullScreen, node, exitFullScreenCallback) {
    var parentNode = node.parentNode;
    var arrNode = [];
    if (switchToFullScreen) {
      while (parentNode && parentNode.nodeName.toLowerCase() != 'html') {
        var _value = e._$getStyle(parentNode, 'position');
        if (_value == 'relative' || _value == 'absolute') {
          arrNode.push({
            node: parentNode,
            prop: _value
          });
        }
        parentNode = parentNode.parentNode;
      }
    } else {
      while (parentNode && parentNode.nodeName.toLowerCase() != 'html') {
        if (e._$hasClassName(parentNode, 'editor-full-screen')) {
          arrNode.push({
            node: parentNode
          });
        }
        parentNode = parentNode.parentNode;
      }
    }
    if (!this.escHandle) {
      this.escHandle = function (event) {
        event.witch = event.keyCode || event.witch;
        if (event.witch == 27) {
          this.toggleFullScreen(false, node);
          exitFullScreenCallback();
        }
      }.bind(this);
    }
    if (switchToFullScreen) {
      e._$style(node, {
        'position': 'fixed',
        'width': document.documentElement.clientWidth + 'px',
        'height': document.documentElement.clientHeight + 'px',
        'left': '0px',
        'padding': '30px',
        'top': '0px',
        'background': '#fff',
        'z-index': '99',
        'box-sizing': 'border-box',
        'overflow': 'scroll'
      });
      e._$addClassName(node, 'editor-full-screen');
      arrNode.forEach(function (item) {
        e._$setStyle(item.node, 'position', 'static');
        e._$addClassName(item.node, 'editor-full-screen');
      });
      v._$addEvent(window, 'keyup', this.escHandle);
    } else {
      node.style = null;
      arrNode.forEach(function (item) {
        item.node.style = null;
        e._$delClassName(item.node, 'editor-full-screen');
      });
      e._$delClassName(node, 'editor-full-screen');
      v._$delEvent(window, 'keyup', this.escHandle);
    }
  };

  // 设置参数的 originals 属性
  pro.setParamsOriginals = function (params) {
    if (!Array.isArray(params)) {
      params = [params];
    }
    params.forEach(function (param) {
      param.originals = {
        name: param.name,
        type: param.type,
        isArray: param.isArray,
        defaultValue: param.defaultValue,
        genExpression: param.genExpression,
        description: param.description,
        ignored: param.ignored,
        position: param.position
      };
    });
  };

  // 格式化单个参数
  pro.formatParam = function (param, datatypeList, options) {
    // 保留初始值，更新的时候会先和初始值比较
    this.setParamsOriginals(param);
    if (param.type === util.db.MDL_SYS_VARIABLE) {
      param.originalType = param.type;
    }
    // HTTP 接口中的请求头及响应头参数，不可能是 Object 匿名类型
    if (options.parentType === util.db.API_HED_REQUEST && options.isHeader
      || options.parentType === util.db.API_HED_RESPONSE && options.isHeader
      || param.typeName !== '' || param.circular) {
      // 不是匿名类型，返回参数本身
      return param;
    } else {
      // 匿名类型
      var result = Object.assign({}, param, {
        isObject: 1,
        objectId: param.type,
        type: editorConfig.customDatatypes.OBJECT_ID
      });
      result.originals.type = result.type;
      var anonymousDatatype = datatypeList.find(function (dt) {
        return dt.id === param.type;
      });
      // 检查匿名类型中是否导入了自身，防止出现循环引用
      var params = anonymousDatatype.params.map(function (p) {
        if (p.type === anonymousDatatype.id || options.parentId && (options.parentId === p.originalDatatypeId)) {
          return Object.assign(p, {
            circular: true,
            circularTip: '导入 ' + p.datatypeName + ' 后产生了循环引用'
          });
        }
        return p;
      });
      result.params = this.formatParams(params, datatypeList, options);
      return result;
    }
  };

  // 格式化参数列表，使之符合组件要求的格式
  pro.formatParams = function (params, datatypeList, options) {
    var result = [];
    var importedDatatypeIds = {};
    params.forEach(function (param) {
      // circular 表示是循环引用时的提示（也算作一个参数来统一处理，显示为参数行）
      if (param.datatypeId && !param.circular) {
        if (!importedDatatypeIds[param.datatypeId]) {
          var importedPosition = param.position;
          importedDatatypeIds[param.datatypeId] = 1;
          var importedDatatypeParams = params.filter(function (p) {
            return p.datatypeId === param.datatypeId;
          });

          // 去数据模型里面拿导入数据模型的参数的原始 position
          // 因为导入的数据模型本身也有个位置信息（相对于和它同级的参数），导入的数据模型的参数也有位置
          var dt = datatypeList.find(function (dt) {
            return dt.id === param.datatypeId;
          });
          // 获取 params 的真实顺序
          var datatypeCache = caches.datatype._$allocate();
          var paramsWithRealPosition = datatypeCache._$getParamsByPosition(options.pid, dt.id);
          importedDatatypeParams.forEach(function (param) {
            param.position = paramsWithRealPosition.find(function (p) {
              return p.id === param.id;
            }).position;
          });
          datatypeCache._$recycle();

          // 导入的数据模型
          result.push({
            imported: 1,
            position: importedPosition,
            id: param.datatypeId,
            name: param.datatypeName,
            params: importedDatatypeParams.map(function (param) {
              return this.formatParam(param, datatypeList, options);
            }, this)
          });
        }
      } else {
        result.push(this.formatParam(param, datatypeList, options));
      }
    }, this);
    var sort = function (params) {
      // 按 position 排序
      params.sort(function (a, b) {
        return a.position - b.position;
      });
      params.forEach(function (param) {
        if (param.params) {
          sort(param.params);
        }
      });
    };
    sort(result);
    return result;
  };

  // 获取编辑器参数
  pro.getParams = function (params, format) {
    var paramRequiredKey = this.getParamRequiredKeyName(format);
    var isOverWritten = function (param) {
      // 只要有一个字段被覆写就需要添加这个参数
      return param.defaultValue && (param.defaultValue !== param.originals.defaultValue)
        || param.genExpression && (param.genExpression !== param.originals.genExpression)
        || param.description && (param.description !== param.originals.description);
    };
    var getImportedParams = function (params) {
      var result = [];
      params.forEach(function (param) {
        var item = {
          id: param.id,
          name: param.name,
          isArray: Number(param.isArray) || 0
        };
        var addItem = false;
        if (param.originalType === util.db.MDL_SYS_VARIABLE) {
          // 可变类型
          if (param.isObject) {
            // 匿名类型
            addItem = true;
            Object.assign(item, getParams(param.params));
          } else {
            addItem = isOverWritten(param);
            if (addItem) {
              Object.assign(item, {
                type: param.type,
                // 以下是可能被覆写的字段
                defaultValue: param.defaultValue || '',
                genExpression: param.genExpression || '',
                description: param.description || '',
                ignored: param.ignored
              });
            }
          }
        } else {
          addItem = isOverWritten(param);
          if (addItem) {
            Object.assign(item, {
              // 以下是可能被覆写的字段
              defaultValue: param.defaultValue || '',
              genExpression: param.genExpression || '',
              description: param.description || '',
              ignored: param.ignored
            });
          }
        }
        if (addItem) {
          result.push(item);
        }
      });
      return result;
    };
    var getParams = function (params) {
      var normalParams = [];
      var rawImports = [];
      // 2 的 14 次方
      var position = 16384;
      params.forEach(function (param) {
        // 位置字段
        param.position = position;
        position = position + 1024;
        if (param.imported) {
          rawImports.push(param);
        } else {
          if (Array.isArray(param.params)) {
            param = Object.assign({}, param, getParams(param.params));
          }
          if (!paramRequiredKey || (param[paramRequiredKey] && param[paramRequiredKey].trim())) {
            normalParams.push(param);
          }
        }
      });
      var importedParams = rawImports.map(function (item) {
        return {
          id: item.id,
          position: item.position,
          vars: getImportedParams(item.params)
        };
      });
      return {
        params: normalParams,
        imports: importedParams
      };
    };

    return getParams(params);
  };

  pro.getParamRequiredKeyName = function (format, params) {
    if (format === util.db.MDL_FMT_HASH) {
      return 'name';
    }
    // 枚举类型的 name 是选填，defaultValue 是必填
    if (format === util.db.MDL_FMT_ENUM) {
      return 'defaultValue';
    }
    // 数组可以添加多个参数，放开了这个限制，所有参数的name都是空
    if (format === util.db.MDL_FMT_ARRAY) {
      return false;
    }
    // 集合类型
    if (format === util.db.MDL_FMT_HASHMAP) {
      return false;
    }
    // 其他类型没有必填字段
    return '';
  };

  // 检查编辑器是否有重复参数
  pro.checkDuplicate = function (params, format) {
    var key = this.getParamRequiredKeyName(format, params);
    var result = {};
    // 检查是否存在重复的 name 值
    var hasDuplicate = false;
    var errorInfo = editorConfig.editorErrorMap.DUMPLICATE;
    var checkDuplicate = function (params) {
      var names = [];
      params.forEach(function (param) {
        // 忽略的字段不算
        if (param.ignored) {
          return;
        }
        // 同级的导入参数
        if (param.imported) {
          param.params.forEach(function (p) {
            if (p.ignored) {
              return;
            }
            names.push(p[key]);
          });
        } else {
          names.push(param[key]);
        }
      });
      var nameCounts = names
        .map(function (name) {
          return {count: 1, name: name};
        })
        .reduce(function (a, b) {
          a[b.name] = (a[b.name] || 0) + b.count;
          return a;
        }, {});
      var duplicateNames = Object.keys(nameCounts).filter(function (a) {
        return nameCounts[a] > 1;
      });
      var checkParam = function (param) {
        delete param.inputError;
        delete param.inputErrorType;

        // 忽略的字段不算
        if (!param.ignored && duplicateNames.indexOf(param[key]) > -1) {
          param.inputError = true;
          param.inputErrorType = errorInfo.type;
          hasDuplicate = true;
        }
      };
      params.forEach(function (param) {
        checkParam(param);
        // 同级的导入参数
        if (param.imported) {
          param.params.forEach(checkParam);
        } else if (param.hasOwnProperty('params')) {
          checkDuplicate(param.params);
        }
      });
    };
    // `key` 字段 为空的不检查
    checkDuplicate(params.filter(function (p) {
      return p[key] && p[key].trim();
    }));
    result.pass = !hasDuplicate;
    if (hasDuplicate) {
      result = Object.assign(result, errorInfo);
    }
    return result;
  };

  pro.isInWordStock = function (params, words, options) {
    var key = this.getParamRequiredKeyName(options.format, params);
    var result = {};
    var errorInfo = editorConfig.editorErrorMap.NOT_IN_WORD_STOCK;
    var WORD_ERROR_TYPE_UNDEFINED = 0;
    var WORD_ERROR_TYPE_FORBID = 1;
    var undefinedNames = [];
    var forbidNames = [];
    var checkDataTypeResult = {};
    var dataTypeCheckedMap = {};
    options.errorType = errorInfo.type;
    var isValidFn = function (value, checkResult) {
      if (!checkResult) {
        checkResult = {};
      }
      var word = words.find(function (w) {
        return w.name === value;
      });
      if (!word) {
        checkResult.wordErrorType = WORD_ERROR_TYPE_UNDEFINED;
        return false;
      }
      if (word && word.forbidStatus !== dbConst.WORD_STATUS_NORMAL) {
        checkResult.wordErrorType = WORD_ERROR_TYPE_FORBID;
        return false;
      }
      return true;
    };

    var saveInvalidName = function (checkResult, name) {
      if (checkResult.wordErrorType === WORD_ERROR_TYPE_UNDEFINED) {
        undefinedNames.push(name);
      } else {
        forbidNames.push(name);
      }
    };

    var isInStock = function (param, key) {
      delete param.inputError;
      delete param.inputErrorType;

      var checkResult = {};
      if (!isValidFn(param[key], checkResult)) {
        saveInvalidName(checkResult, param[key]);
        param.inputError = true;
        param.inputErrorType = errorInfo.type;
      }
    };

    var checkValid = function (params) {
      params.forEach(function (param) {
        // 忽略的字段不算
        if (param.ignored) {
          return;
        }

        // 参数类型是自定义的且不是导入平铺进来
        if (param.type > 10003 && !param.imported) {
          if (dataTypeCheckedMap[param.type]) {
            return;
          }
          dataTypeCheckedMap[param.type] = 1;
          var valid = pro.checkParamFieldValidity(param, key, isValidFn, checkDataTypeResult, options);
          if (!valid && checkDataTypeResult.hasOwnProperty('inputErrorPath')) {
            saveInvalidName(checkDataTypeResult, checkDataTypeResult.inputErrorPath);
          }
          return;
        }

        // 导入数据模型，其参数是平铺进来的，导入数据模型本身的名字无需做校验。
        if (!param.imported) {
          isInStock(param, key);
        }

        if (param.imported || param.hasOwnProperty('params')) {
          // 递归检查子参数
          checkValid(param.params);
        }
      });
    };

    // `key` 字段 为空的不检查
    checkValid(params.filter(function (p) {
      return p[key] && p[key].trim();
    }));
    result.pass = undefinedNames.length === 0 && forbidNames.length === 0;
    if (!result.pass) {
      result = Object.assign(result, errorInfo);
      result.msg = '参数名称 ';
      if (undefinedNames.length) {
        result.msg += undefinedNames.join(', ') + ' 未在参数字典内定义 ';
      }
      if (forbidNames.length) {
        result.msg += forbidNames.join(', ') + ' 在参数字典内被禁用';
      }
    }
    return result;
  };

  /**
   * {options.format}
   * {options.parentType}
   * {options.parentId}
   * {options.datatype}
   * {options.errorType} 可选
   */
  pro.checkParamFieldValidity = function (param, checkField, isValidFn, checkValidityResult, options) {
    function check(param, path, stack) {
      if (param == null) {
        return true;
      }
      delete param.inputError;
      delete param.inputErrorType;
      var newPath = path ? path + ' -> ' + param.name : param.name;
      // 如果是基本类型，不做检查
      if (options.format !== util.db.MDL_FMT_HASH && options.format !== util.db.MDL_FMT_ARRAY) {
        return true;
      }
      // 如果没有在输入框中输入值，默认没有这个字段，取到的值为 undefined。需要设置为空字符串
      param[checkField] = param[checkField] || '';

      // 如果是数组，且当前检查的参数为第一个参数，则校验通过
      if (!isValidFn(param[checkField], checkValidityResult) && (options.format !== util.db.MDL_FMT_ARRAY || (param.parentType !== options.parentType && param.parentId !== options.parentId))) {
        param.inputError = true;
        if (options.errorType) {
          param.inputErrorType = options.errorType;
        }
        checkValidityResult.inputErrorPath = newPath;
        checkValidityResult.inputErrorValue = param[checkField];
        checkValidityResult.inputErrorField = checkField;
        return false;
      }
      if (Array.isArray(param.params) && param.params.length > 0) {
        return param.params.every(function (item) {
          // 如果是匿名导入的数据模型
          if (item.imported) {
            return item.params.every(function (subItem) {
              return check(subItem, newPath, stack);
            });
          } else {
            return check(item, newPath, stack);
          }
        });
      } else {
        var dt = options.datatypes.filter(function (item) {
          return item.id === param.type;
        })[0];
        // 如果是基本类型，不需要往下判断参数列表
        if (dt && dt.format !== util.db.MDL_FMT_HASH) {
          return true;
        }
        if (dt && dt.params) {
          if (stack.indexOf(dt.id) !== -1) {
            return true;
          } else {
            stack.push(dt.id);
          }
          return dt.params.every(function (item) {
            return check(item, newPath, stack);
          });
        } else {
          return true;
        }
      }
    }

    return check(param, null, []);
  };

});
