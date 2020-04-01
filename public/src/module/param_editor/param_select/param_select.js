/*
 * 数据类型下拉框组件
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/common/jst_extend',
  '../param_editor_config.js',
  'pro/modal/modal_version_select',
  'text!./param_select.html',
  'text!./param_select.css'
], function (rb, v, u, e, util, jstex, editorConfig, VSModal, html, css) {
  // 加载一次
  e._$addStyle(css);
  // 常量
  var ARROW_UP_KEY = 38;
  var ARROW_DOWN_KEY = 40;
  var ENTER_KEY = 13;
  // 字符类型的id
  var STRING_TYPE_ID = 10001;

  // 默认选项
  var defaultOptions = {
    // 自动提示的数据源
    source: [],
    // 初始化时选中的项
    selected: null,
    // 是否打开列表, 如果没有这个值, 则初始时, config 中的 this.$watch('isOpen',...) 不会触发
    isOpen: false,
    // 是否为预览模式
    preview: false,
    // 是否可以编辑
    editable: true,
    // 输入框最大长度
    maxLen: null,
    emptyTip: '没有匹配的数据模型',
    // 是否是普通参数，比如HTTP 接口的请求头和响应头，不会有自定义类型
    isNormalParam: false,
    // 是否接口请求参数中的必需字段
    isRequiredField: false,
    // 字段的名称，再设置 source 时会用到
    key: false,
    // 是否是集合的key
    isHashMapKey: false,
    // 字段所属的参数，再设置 source 时会用到
    param: {},
    // 是否是被导入的数据模型中的匿名类型
    readonlyNestEditor: false,
    // 强制只读
    forceReadonly: false,
    placeholder: '未设置'
  };

  // 支持事件:
  // 1. change: 选项有变化时触发
  //    select.$on('change', function(evt) {
  //      evt.sender
  //      evt.selected
  //    })

  var ParamSelect = rb.extend({
    name: 'param-select',

    template: html,

    config: function () {
      this.data = u._$merge({}, defaultOptions, this.data);
      Object.assign(this.data, {
        showDetail: false,
        headers: editorConfig.options.headers,
        formats: editorConfig.options.formats,
        iHeaderNames: util.headname.map(function (name) {
          return {id: name, name: name};
        }),
        iHeaderValues: util.headvalue.map(function (name) {
          return {id: name, name: name};
        }),
        requiredFieldSource: [
          {name: '否', id: 0},
          {name: '是', id: 1}
        ],
        isRequiredField: this.data.key === 'required'
      });
      this._source = this.data.source;
      this.data.selected = {};
      this.setDefaultSelected();
      this._resetXlist();
      this.data.versionsMap = util._$getVersionsMap(this._source);
      // 强制为只读模式
      if (this.data.forceReadonly) {
        this.data.editable = false;
      }
      this.$watch('isOpen', function (isOpen) {
        if (isOpen) {
          this._handleData();
          if (this.data.selected) {
            this.data.__oSelected = this.data.selected;
          }
          this._resetXlist();
          this._setListScrollTop();
          this._addEventOnce();
          this.$refs.input.select();
          return;
        } else {
          if (!this.data.selected) {
            if (this.data.isNormalParam) {
              // 普通参数，都是可以任意输入的
              this.data.selected = {
                name: this.data.inputValue,
                id: this.data.inputValue
              };
            } else {
              // 如果没有匹配项，则选择之前的值
              this.data.selected = this.data.__oSelected || {};
              this.data.inputValue = this.data.selected.name;
            }
          } else if (this.data.isNormalParam) {
            this.data.selected = {
              name: this.data.inputValue,
              id: this.data.inputValue
            };
          }
        }
        var emitChange = function () {
          this.data.sorted = false;
          this.$emit('change', {
            sender: this,
            selected: this.data.selected || {},
            oSelected: this.data.__oSelected || {},
            key: this.data.key,
            param: this.data.param,
            isNormalParam: this.data.isNormalParam,
            isRequiredField: this.data.isRequiredField
          });
        }.bind(this);
        if (this.data.__oSelected) {
          emitChange();
        }
        // 关闭时清除高亮选中状态
        this.data.sIndex = null;
      }.bind(this));
    },
    modify: function (event, selected) {
      event.preventDefault();
      event.stopPropagation();
      this.$emit('modify', {
        ref: this,
        selected: selected,
        callback: function (evt) {
          this._source = this.data.source;
          this.setDefaultSelected();
          this._resetXlist();
          this.data.versionsMap = util._$getVersionsMap(this._source);
          this.data.sorted = false;
          this.$update();
        }.bind(this)
      });
    },
    setDefaultSelected: function () {
      if (this.data.isRequiredField) {
        var fieldIndex = this.data.param.required === 0 ? 0 : 1;
        // 是和否下拉框都是可以修改的
        this.data.editable = !this.data.readonlyNestEditor;
        this.data.selected = this.data.requiredFieldSource[fieldIndex];
        this.data.inputValue = this.data.selected.name;
        if (Array.isArray(this._source)) {
          this.data.__datatype = this._source.find(function (dt) {
            return dt.id === this.data.selectedId;
          }, this);
        }
        return;
      }
      if (this.data.isNormalParam) {
        // 普通参数没有默认选项，比如HTTP 接口的请求头名称
        Object.assign(this.data.selected, this.data.param);
        this.data.inputValue = this.data.param[this.data.key];
        if (this.data.key !== 'name') {
          this.data.editable = true;
        }
        return;
      }
      // selectedId 是传入的需要选中的类型，默认是 String
      this.data.selected.id = this.data.selectedId || STRING_TYPE_ID;
      var selectedDatatype = this._source.find(function (dt) {
        return dt.id === this.data.selected.id;
      }, this);
      Object.assign(this.data.selected, this._getFields(selectedDatatype));
    },

    _getFields: function (item) {
      return {
        id: item.id,
        name: item.name,
        title: item.title || (item.description ? (item.name + '(' + item.description + ')') : item.name),
        projectId: item.projectId,
        format: item.format,
        params: item.params,
        __hide: item.__hide,
        __datatype: item
      };
    },

    _handleData: function () {
      var source = [];
      if (this.data.isRequiredField) {
        source = this.data.requiredFieldSource;
      } else if (this.data.isNormalParam) {
        // HTTP 接口的请求头及响应头名称
        if (this.data.key === 'name') {
          source = this.data.iHeaderNames;
        } else if (this.data.key === 'defaultValue'
          && this.data.param.name
          && this.data.param.name.toLowerCase() === 'content-type'
        ) {
          source = this.data.iHeaderValues;
        }
      } else {
        // 过滤掉匿名类型
        source = this._source.filter(function (dt) {
          return !dt.__isAnon;
        });
        var filterList = util._$filterVersion(source);
        var _find = function (id) {
          return filterList.find(function (item) {
            return item.id == id;
          });
        };
        source.forEach(function (item) {
          if (!_find(item.id)) {
            item.__hide = true;
          }
        });

        var systemDataTypes = [], normalDataTypes = [];
        source.forEach(function (dt) {
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
        source = systemDataTypes.concat(normalDataTypes);
      }
      this.data.source = source;
    },

    _resetXlist: function () {
      this.data.xlist = this.data.source.map(function (item, index) {
        if (this.data.selected && this.data.selected.id === item.id) {
          this.data.sIndex = index;
          this.data.inputValue = item.name;
        }
        return this._getFields(item);
      }, this);
    },

    toggle: function (evt) {
      this.data.showDetail = false;
      this.$emit('toggle');
      if (!this.data.editable) {
        // 不可编辑模式
        return;
      }
      this.data.isOpen = !this.data.isOpen;
      this.$refs.input.focus();
    },

    focusInput: function (evt) {
      // 记住打开前的选中项, 关闭时做对比, 如果有变化就发出 change 事件
      this.data.__oSelected = this.data.selected;
      this.$emit('focus');
    },

    _addEventOnce: function () {
      this._hideHandler = this._hideHandler || function (evt) {
          if (this._selectingVersion ||
            (evt && this.$refs && evt.target === this.$refs.input) ||
            (evt && this.$refs && evt.target === this.$refs.trigon)
          ) {
            return;
          }
          this.data.isOpen = false;
          Regular.dom.off(document, 'click', this._hideHandler);
          this.$update();
        }.bind(this);
      // 需要先移除事件, 不然反复点击时会重复触发
      Regular.dom.off(document, 'click', this._hideHandler);
      Regular.dom.on(document, 'click', this._hideHandler);
    },

    select: function (evt, item, index, versionCheck) {
      if (item.disabled) {
        return evt.event.stopPropagation();
      }
      if (versionCheck && this.checkVersion(item.id)) {
        this._selectingVersion = true;
        this.selectVersion(item);
      } else {
        this.data.isOpen = false;
        this.data.selected = item;
        this.data.sIndex = index;
        this.data.inputValue = item.name;
      }
    },

    input: function (evt) {
      evt.event.preventDefault();
      // 只要有输入动作, 就需要打开下拉框
      this.data.isOpen = true;
      this.data.sIndex = null;
      this.data.selected = null;
      this.matchXlist();
      this.data.inputValue = this.$refs.input.value.trim();
    },

    // 版本选择弹框
    selectVersion: function (dt) {
      var that = this;
      var getVersions = function (id) {
        if (that.data.versionsMap[id]) {
          return that.data.versionsMap[id];
        }
        for (var key in that.data.versionsMap) {
          var found = that.data.versionsMap[key].find(function (item) {
            return item.id == id;
          });
          if (found) {
            return that.data.versionsMap[key];
          }
        }
      };
      var versions = getVersions(dt.id);
      new VSModal({
        data: {
          versions: versions,
          selected: dt.id
        }
      }).$on('ok', function (selected) {
        var index;
        (this._source || []).some(function (it, ind) {
          if (it.id === selected) {
            index = ind;
            return true;
          }
        });
        var item = this._source[index];
        this._selectingVersion = false;
        this.select(null, item, index, false);
      }.bind(this)).$on('cancel', function () {
        this._selectingVersion = false;
      }.bind(this));
    },

    // 判断当前id是否具有相关历史版本
    checkVersion: function (id) {
      if (this.data.versionsMap[id]) {
        return true;
      }
      for (var key in this.data.versionsMap) {
        var found = this.data.versionsMap[key].find(function (item) {
          return item.id == id;
        });
        if (found) {
          return true;
        }
      }
      return false;
    },

    matchXlist: function () {
      var value = this.$refs.input.value.trim();
      this.data.xlist = this.data.source.filter(function (item) {
        delete item.__uiName;
        if (!value) {
          return true;
        }
        var iv = item.name;
        var hitIndex = iv.toLowerCase().indexOf(value.toLowerCase());
        if (hitIndex !== -1) {
          item.__uiName = jstex.escapeHtml(iv.substr(0, hitIndex)) + '<b class="hl">' + jstex.escapeHtml(iv.substr(hitIndex, value.length)) + '</b>' + jstex.escapeHtml(iv.substr(hitIndex + value.length, iv.length - 1));
          return true;
        }
        var ivpy = item.namePinyin;
        var matchPinyinResult = util.highlightPinyin(iv, ivpy, value);
        if (matchPinyinResult) {
          item.__uiName = matchPinyinResult;
          return true;
        }
      }, this);
      this.checkXList();
    },

    keydown: function (evt) {
      var keyCode = evt.event.keyCode;
      if (keyCode === ENTER_KEY) {
        evt.event.preventDefault();
        this.data.isOpen = !this.data.isOpen;
        if (!this.data.isOpen) {
          if (this.data.sIndex) {
            this.data.selected = this.data.xlist[this.data.sIndex];
          } else {
            var firstItem = this.data.xlist[0];
            if (firstItem && firstItem.id) {
              this.data.selected = firstItem;
            } else {
              // 没有可选项的时候, 选择 source 里面的第一个
              this.data.selected = this.data.source[0];
              // 更新自动提示列表, 以便再次打开时的状态保持一致
              this.data.xlist = [this.data.selected];
            }
            this.data.inputValue = this.data.selected ? this.data.selected.name : this.data.inputValue;
          }
          this._hideHandler();
        }
      } else if (keyCode === ARROW_UP_KEY) {
        evt.event.preventDefault();
        if (!this.data.isOpen) {
          this.data.isOpen = true;
        }
        if (this.data.sIndex === null) {
          this.data.sIndex = this.data.xlist.length - 1;
        } else {
          this.data.sIndex -= 1;
          if (this.data.sIndex < 0) {
            this.data.sIndex = this.data.xlist.length - 1;
          }
        }
        if (this.data.xlist[this.data.sIndex].id) {
          this.data.selected = this.data.xlist[this.data.sIndex];
          this.data.inputValue = this.data.selected.name;
          this._setListScrollTop();
        } else {
          // 没有可选择的项
          this.data.sIndex = null;
        }
      } else if (keyCode === ARROW_DOWN_KEY) {
        evt.event.preventDefault();
        if (!this.data.isOpen) {
          this.data.isOpen = true;
        }
        if (this.data.sIndex === null) {
          this.data.sIndex = 0;
        } else {
          this.data.sIndex += 1;
          if (this.data.sIndex > this.data.xlist.length - 1) {
            this.data.sIndex = 0;
          }
        }
        if (this.data.xlist[this.data.sIndex].id) {
          this.data.selected = this.data.xlist[this.data.sIndex];
          this.data.inputValue = this.data.selected.name;
          this._setListScrollTop();
        } else {
          // 没有可选择的项
          this.data.sIndex = null;
        }
      }
    },

    checkXList: function () {
      if (this.data.xlist.length === 0) {
        this.data.xlist.push({
          name: '没有可选择的项',
          disabled: true
        });
      }
    },

    _setListScrollTop: function () {
      setTimeout(function () {
        if (this.$refs && this.$refs.listcon) {
          if (this.data.sIndex > 5) {
            this.$refs.listcon.scrollTop = (this.data.sIndex - 5) * 36;
          } else {
            this.$refs.listcon.scrollTop = 0;
          }
        }
      }.bind(this), 0);
    },

    create: function (evt) {
      this.$emit('create', this);
    },

    /**
     * 选择某一项, 如果该项不在 source 中, 就将它添加到 source 中
     * @param {Object} item -  需要选中的项
     **/
    $select: function (item) {
      var index = null;
      var found = this.data.source.find(function (it, idx) {
        if (it.id === item.id) {
          index = idx;
          return true;
        }
      });
      var oSelected = this.data.selected;
      // 判断该项是否和已经选中的相同
      if (found && this.data.selected && this.data.selected.id === found.id) {
        return;
      }
      if (!found) {
        // 如果列表中不存在, 就将它添加到列表中
        this._source.push(item);
        this._handleData();
        this.data.selected = this.data.source.find(function (it, idx) {
          if (it.id === item.id) {
            index = idx;
            return true;
          }
        });
      } else {
        this.data.selected = found;
      }
      this.data.sIndex = index;
      this.data.inputValue = this.data.selected.name;
      this.$update();
      // 触发 change 事件
      this.$emit('change', {
        sender: this,
        selected: this.data.selected,
        oSelected: oSelected
      });
      this.data.sorted = false;
    },

    mouseWheel: function (e) {
      // 滚动到底后，不让滚动页面
      var delta = e.event.wheelDelta || -e.event.detail;
      // 默认显示 7 项
      var minusNum = 7;
      if (this.data.isArrayElement) {
        // 如果是数组元素的类型，因为 array 是用 css 隐藏的，这里再减去 1
        minusNum = 8;
      }
      if (delta < 0 && this.$refs.listcon.scrollTop >= (this.data.source.length - minusNum) * 30
        || delta > 0 && this.$refs.listcon.scrollTop <= 0
      ) {
        e.preventDefault();
      }
    },

    isComplexType: function () {
      if (this.data.isNormalParam) {
        return false;
      }
      var selected = this.data.selected;
      if (selected && (selected.id > 10003)) {
        // 数据模型是自定义类型
        return true;
      }
    },
    checkJump: function (event) {
      this.$emit('checkJump');
    },
    showDatatypeDetail: function (evt, show) {
      if (this.data.isNormalParam || !this.data.selected || this.data.selected.id <= 10003) {
        // 基本类型无需显示详情
        return;
      }
      clearTimeout(this.mouseleaveTime);
      var handler = function () {
        this.data.showDetail = show;
        var selected = this.data.selected;
        this.data.xheaders = this.data.headers[selected.format];
        if (!this.data.sorted) {
          this.data.sorted = true;
          this.data.params = (selected.params || []).sort(function (itemA, itemB) {
            return itemA.position - itemB.position;
          });
        }
        var selectedDT = (this.data.source || []).filter(function (dt) {
          return dt.id === selected.id;
        })[0];
        if (selectedDT && selectedDT.version && selectedDT.version.name) {
          this.data.versionName = selectedDT.version.name;
        }
        this.$update();
      }.bind(this);
      if (evt.type === 'mouseleave') {
        this.mouseleaveTime = setTimeout(handler, 100);
      } else {
        handler();
      }
    },

    getFormatName: function () {
      var format = this.data.selected.format;
      return (this.data.formats.find(function (f) {
        return f.format === format;
      }) || {}).name;
    },

    getFieldName: function (param, key) {
      var selected = this.data.selected;
      var result = '';
      if (param.isArray && key === 'typeName') {
        result += 'Array ';
      }
      if (param.type <= 10003 || key !== 'typeName') {
        result += param[key];
      } else {
        // 自定义类型，如果没有 typeName，则是匿名类型，显示为 Object
        result += '<a href="' + this.getDatatypeDetailLink(this.data.docPreview, selected.projectId, selected.id) + '" class="stateful" title="' + param[key] + '">' + (param[key] || 'Object') + '</a>';
      }
      return result;
    },
    getDatatypeDetailLink: util._$getDatatypeDetailLink
  });

  return ParamSelect;
});
