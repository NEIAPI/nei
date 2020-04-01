/**
 * 参数编辑器组件核心模块
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/notify/notify',
  'pro/modal/modal',
  'pro/params_import/datatype_import',
  'pro/params_import/json_import',
  'pro/params_import/interface_import',
  'pro/params_import/javabean_import',
  'pro/generate_rule/generate_rule',
  'pro/param_editor/param_advice/param_advice',
  './param_editor_util.js',
  './param_editor_config.js',
  'text!./param_editor_format.html',
  'text!./param_editor_core_row.html',
  'text!./param_editor_core_row_imported.html',
  'text!./param_editor_tip.html',
  'text!./param_editor_core.html',
  'css!./param_editor_core.css'
], function (rb, v, u, e, util, jstex, notify, Modal, DTImport, JSImport, INTImport, JBImport, GRule, ParamAdvice, editorUtil, editorConfig, formatTpl, paramRowTpl, importedParamRowTpl, paramTipTpl, html, css) {
  e._$addStyle(css);

  var options = {
    name: 'param-editor-core',

    template: html,

    config: function () {
      this.data = Object.assign({
        importTypes: editorConfig.importTypes,
        customDatatypes: editorConfig.customDatatypes,
        dbConst: util.db,
        hideTip: true,
        readonlyNestEditor: false,
        // 默认可以拖动
        draggableRow: true,
        // 类别模板
        formatTpl: formatTpl,
        // 普通字段的模板
        paramRowTpl: paramRowTpl,
        // 导入数据模型的字段的模板
        importedParamRowTpl: importedParamRowTpl,
        // 一些提示信息
        paramTipTpl: paramTipTpl,
        // 强制只读模式，比如在 项目文档页面预览模式
        forceReadonly: false,
        // 项目文档页面预览模式
        docPreview: false,
      }, editorConfig.options, this.data);
      this.initParams();
      // 保存完整的 source 列表
      this._source = this.data.source;

      //add version info to imported param with versions
      (this.data.params || []).forEach(function (it) {
        if (it.imported) {
          (this._source || []).some(function (sit) {
            if (sit.id === it.id) {
              if (sit.version) {
                it.version = sit.version;
              }
              return true;
            }
          });
        }
      }.bind(this));
      this.setXheaders();
      // 拖动的字段行元素
      this.draggingRow = null;
      this.checkParams();
      this.handleHasArray();
      this.checkValid();
    },
    init: function () {
      this.supr();
      if (this.shouldUseLocalStorage()) {
        this.checkParamChange(true);
      }
    },
    destroy: function () {
      this.supr();
      if (this.shouldUseLocalStorage()) {
        this.autoSaving(false);
        this.checkParamChange(false);
      }
    },
    getSelectSource: function (isHashMapKey) {
      var source = [];
      if (this.data.format === util.db.MDL_FMT_ENUM) {
        // 枚举的类型只可以是字符、数值或者布尔
        source = this._source.filter(function (dt) {
          return dt.format === util.db.MDL_FMT_STRING
            || dt.format === util.db.MDL_FMT_NUMBER
            || dt.format === util.db.MDL_FMT_BOOLEAN;
        });
      } else if (this.data.format === util.db.MDL_FMT_HASHMAP && isHashMapKey) {
        // 枚举的类型只可以是字符
        source = this._source.filter(function (dt) {
          return dt.format === util.db.MDL_FMT_STRING;
        });
      } else {
        source = this._source;
      }
      return source;
    },
    setXheaders: function () {
      if (this.data.isNormalParam) {
        // HTTP 接口
        this.data.xheaders = this.data.headers.iheader;
      } else {
        // 根据 format 值设置表头
        this.data.xheaders = this.data.headers[this.data.format];
        if (!this.data.showRequired) {
          // 非 HTTP 接口请求参数，去掉“必需”选项
          this.data.xheaders = this.data.xheaders.filter(function (header) {
            return header.key !== 'required';
          });
        }
      }
    },
    getDefaultParam: function () {
      var field = {
        isArray: util.db.CMN_BOL_NO,
        // 无论哪个类别，后端都需要 type 值
        type: util.db.MDL_SYS_VARIABLE
      };
      var format = this.data.format;
      // 哈希、枚举、数组的默认类型为 string
      if (format === util.db.MDL_FMT_HASH || format === util.db.MDL_FMT_ENUM || format === util.db.MDL_FMT_ARRAY) {
        field.type = util.db.MDL_SYS_STRING;
      }
      if (format === util.db.MDL_FMT_HASHMAP) {
        field.type = util.db.MDL_SYS_STRING;
      }
      switch (format) {
        case util.db.MDL_FMT_HASH:
        case util.db.MDL_FMT_ENUM:
        case util.db.MDL_FMT_ARRAY:
        case util.db.MDL_FMT_STRING:
          // 哈希、枚举、数组、字符的默认类型为 string
          field.type = util.db.MDL_SYS_STRING;
          break;
        case  util.db.MDL_FMT_NUMBER:
          // 数值的默认类型为 number
          field.type = util.db.MDL_SYS_NUMBER;
          break;
        case  util.db.MDL_FMT_BOOLEAN:
          // 布尔的默认类型为 boolean
          field.type = util.db.MDL_SYS_BOOLEAN;
          break;
        case util.db.MDL_FMT_HASHMAP:
          field.type = util.db.MDL_SYS_STRING;
          var key = Object.assign({}, field, {name: '键'});
          var value = Object.assign({}, field, {name: '值'});
          field = [key, value];
        default:
          break;
      }
      return field;
    },
    // 检查 params，保证至少会有一个参数
    checkParams: function () {
      if (!this.data.preview && !(this.data.params && this.data.params.length)) {
        this.resetParams();
      }
    },
    // 重置 params
    resetParams: function () {
      // 删除所有
      this.data.params.splice(0);

      var defaultParam = this.getDefaultParam();
      if (Array.isArray(defaultParam)) {
        for (var i = 0; i < defaultParam.length; i++) {
          this.data.params.push(defaultParam[i]);
        }
      } else {
        this.data.params.push(this.getDefaultParam());
      }

      this.handleHasArray();
    },
    // 换成其他 params
    swapParams: function (params) {
      // 删除所有
      this.data.params.splice(0);
      params.unshift(0, 0);
      this.data.params.splice.apply(this.data.params, params);
      this.handleHasArray();
    },
    // 添加一个字段
    addParam: function () {
      var newParam = this.getDefaultParam();
      // 控制样式
      newParam.adding = true;
      // 加一个临时id
      var tempId = Date.now();
      newParam.id = tempId;
      this.addParams([newParam]);
      // 使第一个input获取焦点
      setTimeout(function () {
        var row = this.$root.parentNode.querySelector('#param-editor-x-row-' + tempId);
        row && row.querySelectorAll('input')[0].focus();
      }.bind(this), 100);
    },
    changeNormalParam: function (evt) {
      evt.param[evt.key] = evt.selected.id;
      // 更新参数
      this.updateParam([evt.key], evt.param);
    },
    // 修改字段的类型
    changeDatatype: function (evt, paramIndex, isArrayElement, importedParamIndex) {
      // 在Modal打开后$event被置空，临时保存一下
      this.data.evt = evt;
      // 在修改普通参数
      if (evt.isNormalParam || evt.isRequiredField) {
        return this.changeNormalParam(evt);
      }
      var selected = evt.selected;
      var selectedIsArray = function () {
        return Number(selected.id === editorConfig.customDatatypes.ARRAY_ID);
      };
      var selectedIsObject = function () {
        return Number(selected.id === editorConfig.customDatatypes.OBJECT_ID);
      };
      var selectedIsCustomType = function () {
        return selected.id > 10003;
      };

      // 两个id对应的数据模型是否具有相同的origin
      var _change = function () {
        // 选择的是数组元素
        if (isArrayElement) {
          param.type = selected.id;
          param.isObject = selectedIsObject();
        } else {
          param.isArray = selectedIsArray();
          param.isObject = selectedIsObject();
          if (param.isArray) {
            // 如果选择了数组，数组元素的类型默认为 String
            param.type = util.db.MDL_SYS_STRING;
          } else {
            // 字段类型
            param.type = selected.id;
          }
          this.handleHasArray();
        }
        if (param.isObject) {
          if (this.data.preview) {
            // 从非 object 类型修改成 object 类型
            if (param.adding) {
              var defaultParam = this.getDefaultParam();
              defaultParam.adding = true;
              param.params = [defaultParam];
            } else {
              if (isArrayElement) {
                // 修改的是数组元素类型
                if (param.originals.type !== editorConfig.customDatatypes.OBJECT_ID) {
                  // 有 params 就可以表示匿名类型
                  param.params = [];
                  this.updateParam(['params'], param);
                }
              } else {
                if (param.originals.isArray) {
                  // 只更新 isArray，原来数组元素的类型保留
                  param.isArray = 0;
                  this.updateParam(['isArray'], param);
                } else if (param.originals.type !== editorConfig.customDatatypes.OBJECT_ID) {
                  param.params = [];
                  param.isArray = 0;
                  this.updateParam(['isArray', 'params'], param);
                }
              }
            }
          }
        } else {
          this.updateParam(['isArray', 'type'], param);
        }
      }.bind(this);
      var param = this.getParamByIndex(paramIndex, importedParamIndex);
      if (this.data.preview) {
        // 如果选择的是自定义类型，需要校验其中的参数是否在参数词库内。
        if (this.needCheckWordStock() && selectedIsCustomType() && selected.params) {
          var checkResult = this.checkInWordStock(selected.params);
          if (!checkResult.pass) {
            notify.show('类型' + evt.selected.name + '中的' + checkResult.msg, 'info', 5000);
            evt.sender.$select(evt.oSelected);
            return;
          }
        }

        if (!param.adding && (param.originals.type === editorConfig.customDatatypes.OBJECT_ID) && !selectedIsObject()) {
          // 从匿名类型切换成其他类型，需要提示用户
          return this.$root.$emit('change-from-object-confirm', {
            ok: function () {
              _change();
            },
            cancel: function () {
              // 还原为旧类型
              evt.sender.$select(evt.oSelected);
            },
            formatName: evt.selected.name
          });
        }
      }
      _change();
    },
    // 批量添加字段
    addParams: function (params, position) {
      // 先设置 position
      params.forEach(function (param) {
        param.position = this.getNewPosition();
        // 如果是匿名类型的参数，则是在为该匿名类型添加属性，有可能是在数据模型页面，也有可能是在接口页面
        // 这里的 parentType 已经在 html 模板中处理好了
        param.parentType = this.data.parentType;
        // parentId 不一定有值，比如匿名类型还未保存
        if (this.data.parentId) {
          param.parentId = this.data.parentId;
        }
      }, this);
      if (position !== undefined) {
        // 在指定位置插入一组参数
        params.unshift(position, 0);
        this.data.params.splice.apply(this.data.params, params);
      } else {
        this.data.params = this.data.params.concat(params);
      }
      this.handleHasArray();
      // 程序添加的参数需要手动 update，比如导入
      this.$update();
    },
    // 判断参数中是否有数组类型的字段，包括导入的数据模型中的字段
    handleHasArray: function () {
      // hasArray 表示字段中有数组类型，用来控制样式
      this.data.hasArray = !!this.data.params.find(function (item) {
        if (item.isArray) {
          return true;
        } else if (item.imported) {
          return !!item.params.find(function (p) {
            return p.isArray;
          });
        }
      });
    },
    // 删除字段
    removeParam: function (index, parentParam) {
      var param = this.data.params[index];
      var remove = function () {
        this.data.params.splice(index, 1);
        this.checkParams();
        this.checkValid();
      }.bind(this);
      // 预览状态下的 parentParam 也可以是 adding 状态
      // 第一层的参数没有 parentParam，需要加判断
      if (param.adding || parentParam && parentParam.adding || !this.data.preview) {
        return remove();
      }
      Modal.confirm({
        content: '确定要删除 ' + param.name + ' 字段吗？删除后无法恢复。<p class="tip">请注意：如果删除的是数据模型的字段，则它会影响所有引用以及导入了该数据模型的资源，包括 HTTP 接口、数据模型等等。</p>',
        title: '请确认',
        clazz: 'delete-param-confirm-modal'
      }).$on('ok', function () {
        var sendData = {
          parentId: this.data.parentId,
          parentType: this.data.parentType
        };
        if (param.imported) {
          sendData.imports = param.id;
        } else {
          sendData.params = param.id;
          sendData.paramName = param.name;
        }
        // 删除参数
        this.$root.$emit('delete-params', {
          data: sendData,
          callback: function () {
            remove();
            this.$update();
          }.bind(this)
        });
      }.bind(this));
    },
    // 删除空的字段，在导入的时候，做此操作较为合理
    removeEmptyParams: function () {
      var key = editorUtil.getParamRequiredKeyName(this.data.format);
      this.data.params = this.data.params.filter(function (param) {
        return param[key] && param[key].trim();
      });
    },
    // 是否有正在添加的参数
    hasAddingParam: function () {
      var hasAdding = false;
      var findAddingParam = function (params) {
        params.forEach(function (param) {
          if (param.adding) {
            hasAdding = true;
          } else if (param.params) {
            findAddingParam(param.params);
          }
        });
      };
      findAddingParam(this.data.params);
      return hasAdding;
    },
    // 将当前数据保存为数据模型
    saveAsDatatype: function () {
      this.$root.$emit('create-datatype', JSON.parse(JSON.stringify(this.data.params)));
    },
    // 将当前数据保存为数据模型
    copyEnum: function () {
      var params = this.data.params;
      var enumObject = {};
      params.forEach(function (param) {
        var datatype = this.data.source.find(function (s) {
          return s.id === param.type;
        });
        var format = datatype.format;
        switch (format) {
          case util.db.MDL_FMT_STRING:
            enumObject[param.name] = String(param.defaultValue);
            break;
          case util.db.MDL_FMT_NUMBER:
            enumObject[param.name] = Number(param.defaultValue);
            break;
          case util.db.MDL_FMT_BOOLEAN:
            enumObject[param.name] = param.defaultValue !== false;
            break;
        }
      }, this);
      util._$copyText(JSON.stringify(enumObject, null, '\t'));
      notify.show('所有键值对已复制', 'success', 5000);
    },
    // 保存所有正在添加的参数
    saveAllParams: function () {
      var data = this.$root.data;
      var key = editorUtil.getParamRequiredKeyName(data.format, data.params);
      if (this.$root.data.isHeader) {
        var result = this.checkHeaderDuplicate();
        if (result) {
          notify.show('包含重复的 HTTP 头！', 'error', 3000);
          return;
        }
      }
      const checkResult = this.checkValid();
      if (checkResult.pass) {
        var result = editorUtil.getParams(data.params, data.format);
        var addingParams = [];
        // 需要保存的数据可能不在同一层，需要递归查找
        var findAddingParams = function (params) {
          var addingParam = {
            params: []
          };
          params && params.forEach(function (param) {
            if (param.hasOwnProperty('vars')) {
              // 导入类型
              param.vars.forEach(function (vr) {
                findAddingParams(vr.params);
                findAddingParams(vr.imports);
              });
            } else if (param.adding) {
              if (key === false || param[key] && param[key].trim()) {
                // key 为 false 时表示不需要 key，比如数组添加多个不同类型的元素项时
                addingParam.params.push(param);
              }
            } else {
              // 查找下一层的数据
              if (param.params) {
                findAddingParams(param.params);
                findAddingParams(param.imports);
              }
            }
          });
          if (addingParam.params.length) {
            addingParam.parentType = addingParam.params[0].parentType;
            if (addingParam.params[0].parentId) {
              addingParam.parentId = addingParam.params[0].parentId;
            }
            addingParams.push(addingParam);
          }
        };
        findAddingParams(result.params);
        // 导入类型中可以有可变类型，也可以修改，比如修改成匿名类型
        findAddingParams(result.imports);
        this.createParams(addingParams);

        // 保存后清除本地存储
        this.removeParamsFromLocalStorage();
      } else if (checkResult.msg) {
        notify.show(checkResult.msg, 'info', 5000);
      }
    },
    // 取消保存所有正在添加的参数
    cancelAddingParams: function () {
      function removeAddingParams(params) {
        return params.filter(function (param) {
          if (param.params) {
            param.params = removeAddingParams(param.params);
          }
          return !param.adding;
        });
      }

      this.data.params = removeAddingParams(this.data.params);
      // 可能会有名称重复的提示红框，还原一下
      this.checkValid();
    },
    // 在输入框中粘贴 json 字符串的检测
    onPasteInput: function (evt, paramIndex, itemIndex) {
      if (this.data.readonlyNestEditor || this.data.forceReadonly || itemIndex !== 0) {
        return;
      }
      setTimeout(function () {
        var value = evt.target.value;
        var json;
        try {
          json = JSON.parse(value);
        } catch (err) {
          console.log('使用 JSON.parse 方法 解析失败：' + err);
          try {
            json = eval('(' + value + ')');
          } catch (err) {
            console.log('使用 eval 方法解析失败：' + err);
          }
        }
        if (typeof json === 'object') {
          this.addJSONData(json, paramIndex + 1);
          this.removeParam(paramIndex);
          this.$update();
        }
      }.bind(this), 0);
    },
    onHoverInput: function (evt, param, itemKey, isImported) {
      // 渲染参数词库建议
      this.renderParamAdvice(evt, param, itemKey, isImported);
    },
    // 输入框获取焦点
    onFocusInput: function (evt, paramIndex, itemIndex, isInNestEditor) {
      // 聚焦输入框时，禁止拖动，以便可以选择元素
      this.data.draggableRow = false;
      // 嵌套中的编辑器、只读输入框以及 HTTP 接口中的请求头，不需要显示"可以粘贴JSON"的tip
      if (this.data.readonlyNestEditor || this.data.forceReadonly || evt.target.readonly || this.data.isNormalParam) {
        return;
      }
      evt.target.select();
      if (!isInNestEditor
        && paramIndex === 0
        && itemIndex === 0
        && (this.data.format == util.db.MDL_FMT_HASH || this.data.format == util.db.MDL_FMT_ENUM)) {
        // 第一个输入框（非嵌套编辑器中）获取焦点时，显示可粘贴json字符串的提示
        this.data.hideTip = false;
      }
    },
    // 失去焦点
    onBlurInput: function (evt, paramKey, paramIndex, importedParamIndex) {
      // 失焦时仍旧可以拖动排序
      this.data.draggableRow = true;
      if (evt.target.readOnly) {
        return;
      }
      this.data.hideTip = true;
      var param = this.getParamByIndex(paramIndex, importedParamIndex);
      if (!param || param.adding) {
        this.checkValid();
        // 正在添加中的参数，无需更新处理
        return;
      }
      // 检查名称是否有重复
      var checkResult = this.checkValid();
      if (checkResult.pass) {
        this.updateParam(paramKey, param);
      } else {
        if (checkResult.type === editorConfig.editorErrorMap.NOT_IN_WORD_STOCK.type) {
          return;
        }
        notify.show(checkResult.msg, 'info', 5000);
        setTimeout(function () {
          param[paramKey] = param.originals[paramKey];
          // 还原状态
          this.checkValid();
          this.$update();
        }.bind(this), 3000);
      }
    },
    // 渲染参数词库建议
    renderParamAdvice: function (evt, param, itemKey, isImported) {

      function isTargetError(param) {
        return param.inputErrorType === editorConfig.editorErrorMap.NOT_IN_WORD_STOCK.type;
      }

      if (itemKey !== 'name' || param[itemKey] === '' || !isTargetError(param)) {
        return;
      }

      var paramAdvice = ParamAdvice.getInstance({
        data: {
          pid: this.data.pid,
          words: this.data.words,
          userInput: param[itemKey],
        }
      });

      paramAdvice.$on('select', function (evt) {
        if (this.data.readonlyNestEditor || isImported) {
          notify.show('请前往数据模型详情页修改', 'info', 3000);
          return;
        }

        if (this.data.forceReadonly) {
          notify.show('当前为只读模式，无法修改', 'info', 3000);
          return;
        }

        ParamAdvice.recycleInstance();
        param[itemKey] = evt.advice;
        this.updateParam(itemKey, param);

        delete param.inputErrorType;
        delete param.inputError;

        this.$update();
      }.bind(this));

      paramAdvice.$inject(evt.origin, 'before');
    },
    // 输入框回车，预览模式下就新增这条参数
    onKeydownInput: function (evt, paramKey, paramIndex, importedParamIndex) {
      if (!this.data.preview || evt.event.keyCode !== 13) {
        return;
      }
      evt.target.blur();
      this.saveAllParams();
    },
    createParams: function (params) {
      if (!Array.isArray(params) || params.length === 0) {
        return;
      }
      var sendData = {};
      // todo: 创建请求头传递的数据格式，后端还没和创建参数的统一，仍旧使用原来的格式
      if (this.$root.data.isHeader) {
        sendData = {
          params: params[0].params,
          parentId: this.data.parentId,
          parentType: this.data.parentType
        };
      } else {
        sendData.items = params;
      }
      // 值有变化，更新参数
      this.$root.$emit('create-params', {
        data: sendData,
        callback: function (evt, params) {
          // 新增的情况太过复杂，直接按初始化逻辑重新赋值参数
          this.$root.data.params = params;
          this.$root.$update();
        }.bind(this)
      });
    },
    updateParam: function (paramKeys, param) {
      var evt = this.data.evt;
      if (this.data.preview && !param.adding) {
        // 检查HTTP头
        if (paramKeys.indexOf('name') !== -1 && this.$root.data.isHeader) {
          var result = this.checkHeaderDuplicate();
          if (result) {
            notify.show('HTTP 头 ' + param.name + ' 与其他头冲突！', 'error', 3000);
            if (evt.sender) {
              var name = evt.oSelected && evt.oSelected.name ? evt.oSelected.name : param.originals.name;
              evt.sender.data.selected = {
                id: name,
                name: name
              };
              evt.sender.data.inputValue = name;
            }
            return;
          }
        }
        // 预览模式下，判断是否需要更新参数
        var sendData = {
          parentId: this.data.parentId,
          parentType: this.data.parentType
        };
        if (param.datatypeId !== 0) {
          sendData.datatypeId = param.datatypeId;
        }
        var valueChanged = false;
        if (!Array.isArray(paramKeys)) {
          paramKeys = [paramKeys];
        }
        var requiredKeyName = editorUtil.getParamRequiredKeyName(this.data.format);
        paramKeys.forEach(function (key) {
          // 必填字段不能为空
          if (key === requiredKeyName && !param[key]) {
            param[key] = param.originals[key];
            return;
          }
          if (param.originals && param[key] !== param.originals[key]) {
            sendData[key] = param[key];
            valueChanged = true;
          }
        });
        if (valueChanged) {
          // 值有变化，更新参数
          this.$root.$emit('update-param', {
            data: sendData,
            param: param,
            sender: (this.data.$event || (this.data.evt || {})).sender,
            oSelected: (this.data.$event || (this.data.evt || {})).oSelected,
            callback: function () {
              this.$update();
            }.bind(this)
          });
        }
      }
    },
    // 显示或者隐藏导入数据模型的所有字段，可以对字段进行忽略or恢复的操作
    toggleIgnoredEditing: function (importedDatatypeId, editing) {
      // 显示和隐藏的时候需要重新计算样式
      this.data.params.forEach(function (param) {
        if (param.id === importedDatatypeId) {
          param.editingIgnored = editing;
        }
      });
    },
    // 显示或者隐藏导入数据模型的某个字段
    toggleParamIgnored: function (param, ignored) {
      param.ignored = ignored;
      this.updateParam('ignored', param);
    },
    createExp: function (paramKey, paramIndex, importedParamIndex) {
      if (this.data.readonlyNestEditor || this.data.forceReadonly) {
        return;
      }
      var param = this.data.params[paramIndex];
      if (importedParamIndex !== undefined) {
        param = param.params[importedParamIndex];
      }
      new GRule({
        data: {
          pid: this.data.pid,
          value: param[paramKey]
        }
      }).$on('ok', function (val) {
        param[paramKey] = val;
        this.$update();
        this.updateParam(paramKey, this.getParamByIndex(paramIndex, importedParamIndex));
      }.bind(this));
    },
    // 创建数据模型
    createDatatype: function (evt) {
      this.$root.$emit('create-datatype', evt);
    },
    // 修改数据类型
    modifyDatatype: function (evt, param) {
      this.$root.$emit('modify-datatype', {
        param: param,
        ref: evt.ref,
        selected: evt.selected,
        callback: function (e) {
          this._source = this.data.source;
          this.$update();
          evt.callback(e);
        }.bind(this)
      });
    },
    checkJump: function () {
      this.$root.$emit('checkJump');
    },
    // 检查参数输入是否正确，目前只检是否有重复的名称、是否符合参数词库
    checkValid: function () {
      // 该检查会产生副作用，即有重复时会在参数上添加 inputError 信息
      var checkDuplicateResult = editorUtil.checkDuplicate(this.data.params, this.data.format);
      this.$update();

      // 若重名未通过 或 无需检查参数词库 则直接返回
      if (!checkDuplicateResult.pass || !this.needCheckWordStock()) {
        return checkDuplicateResult;
      }

      var isInWordStock = this.checkInWordStock(this.data.params);
      this.$update();
      return isInWordStock;
    },
    checkInWordStock: function (params) {
      var options = {
        format: this.data.format,
        parentType: this.data.parentType,
        parentId: this.data.parentId,
        datatypes: this.data.datatypes,
      };
      return editorUtil.isInWordStock(params, this.data.words, options);
    },
    // 是否需要检查参数字典功能
    needCheckWordStock: function () {
      if (sessionStorage.getItem('not-check-word-stock')) {
        return false;
      }
      if (this.$root && this.$root.data.isHeader) {
        return false;
      }
      return !!this.data.useWordStock;
    },
    // 获取编辑器的参数及类别信息
    getData: function () {
      var checkResult = this.checkValid();
      return Object.assign(checkResult, {
        format: this.data.format,
        params: this.data.params
      });
    },
    getParamByIndex: function (paramIndex, importedParamIndex) {
      var param = this.data.params[paramIndex];
      if (param.params && importedParamIndex !== undefined) {
        param = param.params[importedParamIndex];
      }
      return param;
    },
    getNewPosition: function () {
      var lastParam = this.data.params[this.data.params.length - 1];
      return lastParam ? lastParam.position + 1024 : 16384;
    },
    isNotEditableRow: function () {
      var format = this.data.format;
      if (format !== util.db.MDL_FMT_HASH && format !== util.db.MDL_FMT_ENUM && format !== util.db.MDL_FMT_ARRAY) {
        return true;
      }
      if (!this.data.preview) {
        return this.data.params.length === 1;
      }
    },
    isNotSortableRow: function () {
      var format = this.data.format;
      if (format !== util.db.MDL_FMT_HASH && format !== util.db.MDL_FMT_ENUM && format !== util.db.MDL_FMT_ARRAY) {
        return true;
      }
      return this.data.params.length === 1;
    },
    checkHeaderDuplicate: function () {
      var names = [];
      this.data.params.forEach(function (item) {
        if (item.imported) {
          item.params.forEach(function (i) {
            names.push(i.name.trim().toLowerCase());
          });
        } else {
          item.name && names.push(item.name.trim().toLowerCase());
        }
      });
      return names.some(function (item, idx, obj) {
        return obj.indexOf(item) !== idx;
      });
    },
    getDatatypeDetailLink: util._$getDatatypeDetailLink
  };

  // 类别 format 相关操作
  var formatAction = {
    // 点击单选按钮修改数据模型的类别
    changeFormat: function (evt, item) {
      var _changeFormat = function () {
        if (this.data.format === item.format) {
          return;
        }
        this.data.format = item.format;
        // 根据 format 值设置表头
        this.data.xheaders = this.data.headers[this.data.format];
      }.bind(this);
      if (this.data.preview) {
        evt.event.preventDefault();
        this.$root.$emit('change-format', {
          data: {
            format: item.format
          },
          formatName: item.name,
          id: this.data.parentId,
          callback: function (evt, params) {
            _changeFormat();
            this.swapParams(params);
            this.data.modifyingFormat = false;
            this.$update();
          }.bind(this)
        });
      } else {
        _changeFormat();
        this.resetParams();
      }
    },
    modifyFormat: function (evt, modify) {
      evt.preventDefault();
      this.data.modifyingFormat = modify;
    }
  };

  // 导入相关的操作
  var importOptions = {
    // 导入数据模型
    import: function (type, parentParam) {
      var modal = null;
      var self = this;
      switch (type) {
        case editorConfig.importTypes.DATATYPE:
          var getImportTypeList = function () {
            //只需要把哈希的类型显示出来就行,同时把已经导入的过滤掉(含嵌套导入)
            var arr = [];
            // 把已经导入的过滤掉
            self.data.params.forEach(function (item) {
              if (item.imported && arr.indexOf(item.id) == -1) {
                arr.push(item.id);
              }
            });
            return arr;
          };
          var importedList = getImportTypeList();
          // 如果是数据模型，也要把自己过滤掉
          if (self.data.parentType === util.db.PAM_TYP_ATTRIBUTE) {
            importedList.push(self.data.parentId);
          }
          modal = new DTImport({
            data: {
              format: this.data.format,
              pid: this.data.pid,
              importedList: importedList
            }
          });
          modal.$on('ok', function (list) {
            if (!list) {
              return;
            }
            var addParams = function () {
              var params = [];
              list.forEach(function (item) {
                params.push({
                  imported: true,
                  id: item.id,
                  datatypeId: item.id,
                  params: editorUtil.formatParams(item.params, self._source, self.data),
                  name: item.name
                });
              });
              self.removeEmptyParams();
              self.addParams(params);
            };
            if (self.data.preview && !(parentParam && parentParam.adding)) {
              var checkResult = self.checkImportDuplicateParams(list);
              if (checkResult) {
                notify.show('导入的数据模型含有重名参数！', 'error', 3000);
                return;
              }
              // 先发请求
              var param = {
                parentId: self.data.parentId,
                parentType: self.data.parentType,
                imports: list.map(function (item) {
                  return {
                    id: item.id,
                    position: self.getNewPosition()
                  };
                })
              };
              var sendData = {};
              if (self.$root.data.isHeader) {
                sendData = param;
              } else {
                sendData.items = [param];
              }
              self.$root.$emit('import-datatypes', {
                data: sendData,
                callback: function (evt, params) {
                  // 按初始化逻辑重新赋值参数
                  self.$root.data.params = params;
                  self.$root.$update();
                  // 导入的数据模型中可能有数组字段，更新当前编辑器
                  self.handleHasArray();
                  self.$update();
                }
              });
            } else {
              addParams();
            }
          });
          break;
        case editorConfig.importTypes.JSON:
          modal = new JSImport({});
          modal.$on('ok', function (json) {
            if (json) {
              self.removeEmptyParams();
              self.addJSONData(json);
            } else {
              Modal.alert({
                title: '导入JSON失败',
                content: 'JSON 格式错误！',
                clazz: 'modal-exp-error'
              });
            }
          });
          break;
        case editorConfig.importTypes.INTERFACE:
          modal = new INTImport({
            data: {
              source: [
                {name: 'GET', id: 'get'},
                {name: 'POST', id: 'post'}
              ]
            }
          });
          modal.$on('ok', function (json) {
            self.removeEmptyParams();
            self.addJSONData(json);
          });
          break;
        case editorConfig.importTypes.JAVABEAN:
          modal = new JBImport({
            data: {
              pid: self.data.pid
            }
          });
          modal.$on('ok', function (javabeans) {
            self.removeEmptyParams();
            javabeans.forEach(function (param) {
              param.adding = true;
            });
            self.addParams(javabeans);
          });
          break;

        default:
          break;
      }
    },
    addJSONData: function (json, position) {
      var params = util.getParamsFromJSONData(json, this.data.pid, this.$root.data.isHeader, this.$root.data.format);
      this.addParams(params, position);
    },
    checkImportDuplicateParams: function (list) {
      // 目前只检查HTTP头，其他的可以覆盖
      if (!this.$root.data.isHeader) {
        return false;
      }
      var parentParams = this.data.params;
      var paramNames = [];
      parentParams.forEach(function (item) {
        if (item.imported) {
          item.params.forEach(function (i) {
            paramNames.push(i.name);
          });
        } else if (item.name) {
          paramNames.push(item.name);
        }
      });
      list.forEach(function (item) {
        item.params.forEach(function (i) {
          paramNames.push(i.name);
        });
      });
      // HTTP 头case insensitive
      paramNames = paramNames.map(function (item) {
        return item.toLowerCase();
      });
      return (paramNames.some(function (item, index) {
        return paramNames.indexOf(item) !== index;
      }));
    }
  };

  // 拖动相关的操作
  var dragOptions = {
    // 移动操作相关
    dragStart: function (evt, paramIndex) {
      evt.event.dataTransfer.effectAllowed = 'copyMove';
      this.draggingRow = evt.origin;
      this.data.params[paramIndex].dragging = true;
    },
    dragEnd: function (evt, paramIndex) {
      this.data.params[paramIndex].dragging = false;
      // 计算被移到哪去了
      // 这里不直接取 children 属性，因为会有嵌套的匿名数据模型
      var rows = this.draggingRow.parentNode.querySelectorAll(':scope >.x-row, :scope >.x-row-imported');
      var movedIndex = paramIndex;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i] === this.draggingRow) {
          movedIndex = i;
          break;
        }
      }
      if (movedIndex !== paramIndex) {
        var movedParam = this.data.params.splice(paramIndex, 1)[0];
        this.data.params.splice(movedIndex, 0, movedParam);
        this.updatePosition(paramIndex, movedIndex);
      }
      this.draggingRow = null;
    },
    dragOver: function (evt) {
      evt.preventDefault();
    },
    dragEnter: function (evt) {
      evt.preventDefault();
      var overingNode = evt.origin;
      if (!this.draggingRow
        || overingNode === this.draggingRow
        || this.draggingRow.parentNode !== overingNode.parentNode
      ) {
        return;
      }
      this.moveNode(this.draggingRow, overingNode);
    },
    moveNode: function (draggingNode, overingNode) {
      var parentNode = overingNode.parentNode;
      var overTop = overingNode.getBoundingClientRect().top;
      var draggedTop = draggingNode.getBoundingClientRect().top;
      if (draggedTop > overTop) {
        parentNode.insertBefore(draggingNode, overingNode);
      } else {
        parentNode.insertBefore(overingNode, draggingNode);
      }
    },
    updatePosition: function (oldParamIndex, newParamIndex) {
      // 因为老数据没有 position 字段，它的值默认为 0
      // 新创建的数据，都会带上 position 信息，所以理论上是不存在某几个参数的position为0的情况，即要么有值，要么都为0
      var movedParam = this.data.params[newParamIndex];
      var getSortParamIno = function (param) {
        var key = editorUtil.getParamRequiredKeyName(this.data.format);
        var obj = {
          position: param.position
        };
        obj[key] = param[key];
        if (param.imported) {
          obj.datatypeId = param.id;
        } else {
          obj.id = param.id;
        }
        return obj;
      }.bind(this);
      var sortAll = function () {
        var position = 16384;
        return this.data.params.map(function (param) {
          param.position = position;
          position += 1024;
          return getSortParamIno(param);
        });
      }.bind(this);
      var sortedParams;
      var hasNullPosition = this.data.params.find(function (p) {
        return p.position === 0;
      });
      if (hasNullPosition) {
        // 第一次调整顺序的老数据，更新所有参数的position
        sortedParams = sortAll();
      } else {
        var prevParam = this.data.params[newParamIndex - 1];
        var nextParam = this.data.params[newParamIndex + 1];
        var newPosition;
        if (prevParam && nextParam) {
          newPosition = (prevParam.position + nextParam.position) / 2;
        } else {
          if (!prevParam) {
            // 移到了第一个
            newPosition = nextParam.position / 2;
          } else if (!nextParam) {
            // 移到了最后一个
            newPosition = prevParam.position * 2;
          }
        }
        // position 须为整数，防止小数出现以免精度导致的可能不准确问题
        newPosition = parseInt(newPosition);
        var existParamWithSamePosition = this.data.params.find(function (p) {
          return p.position === newPosition;
        });
        if (existParamWithSamePosition) {
          // 有重复出现就重排
          sortedParams = sortAll();
        } else {
          movedParam.position = newPosition;
          sortedParams = [getSortParamIno(movedParam)];
        }
      }
      if (!this.data.preview || movedParam.adding) {
        return;
      }
      this.$root.$emit('update-params-position', {
        data: {
          params: sortedParams,
          parentId: this.data.parentId,
          parentType: this.data.parentType
        }
      });
    },
    /**
     * 判断是否需要使用本地存储
     */
    shouldUseLocalStorage: function () {
      return !(
        this.data.readonlyNestEditor ||
        this.data.forceReadonly ||
        !this.data.savingKey
      );
    },
    /**
     * 初始化params
     */
    initParams: function () {
      if (this.shouldUseLocalStorage()) {
        var storedParams = util._$getItemFromLocalStorage(this.data.savingKey);
        if (storedParams) {
          try {
            var parseStoredParams = JSON.parse(storedParams).data;
            var addingParams = [];
            // 仅取本地存储中的新增参数
            // 并与最新参数进行合并
            for (var i = 0; i < parseStoredParams.length; i++) {
              if (parseStoredParams[i].adding) {
                addingParams.push(parseStoredParams[i]);
              }
            }
            this.data.params = (this.data.params || []).concat(addingParams);
          } catch (e) {
            // 可能本地存储格式有问题
            // 清除本地存储
            this.removeParamsFromLocalStorage();
            // 原方法初始化内容
            this.data.params = this.data.params || [];
          }
        } else {
          // 原方法初始化内容
          this.data.params = this.data.params || [];
        }
      } else {
        // 原方法初始化内容
        this.data.params = this.data.params || [];
      }
    },

    /**
     * 移除本地存储params
     */
    removeParamsFromLocalStorage: function () {
      util._$removeFromLocalStorage(this.data.savingKey);
    },

    /**
     * 自动保存
     * @param {Boolean} start 是否启动
     */
    autoSaving: function (start) {
      var self = this;
      if (start) {
        util._$adjustLocalStorageLimit(
          'PARAM_EDITOR_TEMP',
          this.data.savingKey,
          20
        );
        this.data.autoSavingIntervalId = setInterval(
          function () {
            util._$saveToLocalStorage(
              self.data.savingKey,
              self.data.params
            );
          },
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
        this.data.initialParams = JSON.stringify(this.data.params);
        this.data.checkParamChangeIntervalId = setInterval(
          function () {
            if (JSON.stringify(self.data.params) !== self.data.initialParams) {
              // 检查到变更，开启存储
              // 开启自动存储
              self.autoSaving(true);
              clearInterval(self.data.checkParamChangeIntervalId);
            }
          },
          1000
        );
      } else {
        clearInterval(self.data.checkParamChangeIntervalId);
      }
    }
  };

  var ParamEditorCore = rb.extend(Object.assign(options, formatAction, importOptions, dragOptions));

  return ParamEditorCore;
});
