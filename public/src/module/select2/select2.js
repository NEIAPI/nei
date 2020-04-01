/*
 * Select2 下拉框组件
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/common/jst_extend',
  'text!./select2.html',
  'css!./select2.css'
], function (rb, v, u, e, util, jstex, html, css) {
  // 加载一次
  e._$addStyle(css);
  // 常量
  var ARROW_UP_KEY = 38;
  var ARROW_DOWN_KEY = 40;
  var ENTER_KEY = 13;
  var COLLATOR = new Intl.Collator(['zh-CN']);

  // 默认选项
  var defaultOptions = {
    // 自动提示的数据源
    source: [],
    // 初始化时选中的项
    selected: undefined,
    // input 的 placeholder
    placeholder: '',
    // 是否打开列表, 如果没有这个值, 则初始时, config 中的 this.$watch('isOpen',...) 不会触发
    isOpen: false,
    // 是否只可选择
    choseOnly: true,
    // 是否要选中第一项, 前提是 choseOnly 为 true, 并且没有设置 selected
    selectFirst: true,
    // 是否为预览模式
    preview: false,
    // 是否可以编辑
    editable: true,
    // 是否有新创建的按钮
    hasCreate: false,
    // 初始化赋值时, 是否要触发 change 事件
    initSilent: false,
    // 是否是数据模型下拉框
    isDataType: false,
    // 是否是状态下拉框
    isStatus: false,
    // 是否要对列表进行排序
    sortList: true,
    // 没有选中项, 并且preview为true时的提示
    emptyTip: '无',
    // 输入框最大长度
    maxLen: null
  };

  // 支持事件:
  // 1. change: 选项有变化时触发
  //    select.$on('change', function(evt) {
  //      evt.sender
  //      evt.selected
  //    })

  var Select2 = rb.extend({
    name: 'select2',

    template: html,

    config: function () {
      this.data = u._$merge({}, defaultOptions, this.data);
      this._sortData();
      this.initSelected = null;
      //有时候传过来的selected不是一个对象，可能是一个数值或字符串 ，这时候就要转换为对象 add by lihl 2016.12.16
      if (typeof this.data.selected === 'string' || typeof this.data.selected === 'number') {
        this.data.selected = {
          id: this.data.selected
        };
        this.data.source.forEach(function (item) {
          if (item.id == this.data.selected.id) {
            this.data.selected = util._$extend(this.data.selected, item, true);
          }
        }, this);
        if (!this.data.selected.name) {
          this.data.selected.name = this.data.selected.id;
        }
      }
      if (this.data.selected) {
        this.initSelected = this.data.selected;
        this.data.inputValue = this.data.selected.name;
        if (!this.data.choseOnly) {
          // 不是只选择模式, 如果选中的值不在列表中, 则将它添加到列表中
          var found = this.data.source.find(function (m) {
            return m.id === this.data.selected.id;
          }, this);
          if (!found) {
            this.data.source.push(this.data.selected);
          }
        }
      }
      this._resetXlist();
      this.$watch('isOpen', function (isOpen) {
        if (isOpen) {
          // 这个值只对初始化赋值时有用
          this.data.initSilent = false;
          if (this.data.selected) {
            this.data.__oSelected = this.data.selected;
          }
          this._resetXlist();
          this._setListScrollTop();
          this._addEventOnce();
          return;
        } else {
          if (!this.data.selected) {
            var value = this.$refs.input.value.trim();
            if (this.data.choseOnly) {
              if (this.data.selectFirst) {
                // 如果是只可选择下拉列表中的某一项
                var firstItem = this.data.xlist[0];
                if (firstItem && typeof (firstItem.id) !== 'undefined') {
                  this.data.selected = firstItem;
                  // 自动选择某一项时需要设置input的值
                  this.data.inputValue = this.data.selected.name;
                } else if (this.data.source[0]) {
                  // 没有可选项的时候, 选择 source 里面的第一个
                  this.data.selected = this.data.source[0];
                  // 自动选择某一项时需要设置input的值
                  this.data.inputValue = this.data.selected.name;
                }
              } else {
                // 选择之前的值
                this.data.selected = this.data.__oSelected || {};
                this.data.inputValue = this.data.selected.name;
              }
            } else if (value) {
              this.data.selected = {
                name: value,
                id: value
              };
            }
          }
        }
        var emitChange = function () {
          // 初始化赋值时, 不需要触发 change 事件
          if (this.initSelected !== null && this.data.initSilent) {
            this.data.initSilent = false;
            return;
          }
          this.$emit('change', {
            sender: this,
            selected: this.data.selected || {},
            oSelected: this.data.__oSelected || {}
          });
        }.bind(this);
        // 打开前和关闭后都没有选中项, 不处理
        if (!this.data.__oSelected && !this.data.selected) {
          return;
        }
        if (!this.data.__oSelected && this.data.selected) {
          // 打开前没有选中项, 关闭时有选中项, 抛事件
          emitChange();
        } else if (this.data.__oSelected && !this.data.selected) {
          // 打开前有选中项, 关闭时没有选中项, 抛事件
          emitChange();
        } else if (this.data.__oSelected.id !== this.data.selected.id) {
          // 打开前和关闭后都有选中项, 比较两者的 id, 如果不相等, 抛事件
          emitChange();
        }
        // 删除__oSelected, 每次打开会重新设置
        // delete this.data.__oSelected;
        // 关闭时清除高亮选中状态
        this.data.sIndex = null;
      }.bind(this));
    },

    _sortFunc: function (itemA, itemB) {
      if (this.data && this.data.sortFunc) {
        return this.data.sortFunc(itemA, itemB);
      }
      // default to sort by name
      if (itemA.name && itemB.name) {
        // 直接使用 String 的 str.localeCompare(str1, 'zh-CN') 性能很差
        return COLLATOR.compare(itemA.name.toLowerCase(), itemB.name.toLowerCase());
      }
    },

    _sortData: function () {
      if (!this.data.sortList) return;
      if (this.data.isDataType) {
        // 如果是数据模型下拉框
        var systemDataTypes = [];
        var normalDataTypes = [];
        var hasArrayType = false;
        var hasObjectType = false;
        this.data.source.forEach(function (dt) {
          if (dt.id <= 10003 || /^(array|object)$/.test(dt.id)) {
            systemDataTypes.push(dt);
            if (dt.id === 'array') {
              hasArrayType = true;
            } else if (dt.id === 'object') {
              hasObjectType = true;
            }
          } else {
            normalDataTypes.push(dt);
          }
        });
        var handlerDataType = function (configName, dataType, dataTypeName, hasType) {
          if (this.data[configName]) {
            // 移除该类型
            var index = null;
            var found = systemDataTypes.find(function (dt, idx) {
              if (dt.id === dataType) {
                index = idx;
                return true;
              }
            });
            if (found) {
              systemDataTypes.splice(index, 1);
              // 如果选中的是该类型, 则默认换成选中 String 类型
              if (this.data.selected && this.data.selected.id === dataType) {
                this.data.selected = {
                  id: 10001,
                  name: 'String'
                };
              }
            }
          } else if (!hasType) {
            // 添加该类型
            systemDataTypes.push({
              name: dataTypeName,
              id: dataType
            });
          }
        }.bind(this);
        handlerDataType('noArray', 'array', 'Array', hasArrayType);
        handlerDataType('noObject', 'object', 'Object', hasObjectType);
        systemDataTypes.sort(this._sortFunc.bind(this));
        normalDataTypes.sort(this._sortFunc.bind(this));
        this.data.source = systemDataTypes.concat(normalDataTypes).map(function (item) {
          return {
            id: item.id,
            name: item.name,
            title: item.title || (item.description ? (item.name + '(' + item.description + ')') : item.name)
          };
        });
      } else {
        // 按名称排序
        this.data.source.sort(this._sortFunc.bind(this));
      }
    },

    _resetXlist: function () {
      this.data.xlist = this.data.source.map(function (item, index) {
        if (this.data.selected && this.data.selected.id === item.id) {
          this.data.sIndex = index;
          this.data.inputValue = this.data.selected.name;
        }
        return {
          id: item.id,
          name: item.name,
          title: item.title
        };
      }, this);
    },

    toggle: function (evt) {
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
          if (evt && this.$refs && evt.target === this.$refs.input
            || evt && this.$refs && evt.target === this.$refs.trigon
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

    select: function (evt, item, index) {
      if (item.disabled) {
        return evt.event.stopPropagation();
      }
      this.data.isOpen = false;
      this.data.selected = item;
      this.data.sIndex = index;
      this.data.inputValue = item.name;
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
            if (this.data.choseOnly) {
              var firstItem = this.data.xlist[0];
              if (firstItem.id) {
                this.data.selected = firstItem;
              } else {
                // 没有可选项的时候, 选择 source 里面的第一个
                this.data.selected = this.data.source[0];
                // 更新自动提示列表, 以便再次打开时的状态保持一致
                this.data.xlist = [this.data.selected];
              }
              this.data.inputValue = this.data.selected.name;
            }
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
        if (this.$refs) {
          if (this.data.sIndex > 5) {
            this.$refs.listcon.scrollTop = (this.data.sIndex - 5) * 36;
          } else {
            this.$refs.listcon.scrollTop = 0;
          }
        }
      }.bind(this), 0);
    },

    create: function (evt) {
      this.$emit('create');
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
      // 判断该项是否和已经选中的相同
      if (found && this.data.selected && this.data.selected.id === found.id) {
        // 如果相同就返回, 不处理
        return;
      }
      if (!found) {
        // 如果列表中不存在, 就将它添加到列表中
        this.data.source.push(item);
        this._sortData();
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
        selected: this.data.selected
      });
    },

    /**
     * 更新 source
     * @param {Array} source -  新的数据源
     * @param {Object} [selected]-  选中的项, 如果不传就默认为当前选中的项, 如果当前没有选中的项, 走初始化的逻辑:
     *                              1. 有 placeholder, 不处理
     *                              2. 没有 placeholder, 选中第一项
     * @return  {Void}
     **/
    $updateSource: function (source, selected) {
      selected = selected || this.data.selected;
      this.data.source = source;
      this._sortData();
      this._resetXlist();
      if (selected) {
        var index = null;
        this.data.selected = this.data.source.find(function (it, idx) {
          if (it.id === selected.id) {
            index = idx;
            return true;
          }
        });
        if (!this.data.selected) {
          // 说明之前的选中项在新的 source 中不存在
          if (!this.data.placeholder) {
            this.data.selected = this.data.source[0];
            this.data.sIndex = 0;
            this.data.inputValue = this.data.selected.name;
          } else {
            this.data.inputValue = null;
          }
        } else {
          this.data.sIndex = index;
          this.data.inputValue = this.data.selected.name;
        }
      } else {
        if (!this.data.placeholder) {
          this.data.selected = this.data.source[0];
          this.data.sIndex = 0;
          this.data.inputValue = this.data.selected.name;
        }
      }
      this.$update();
    },

    /**
     * 清空选择
     */
    $clearSelect: function () {
      if (this.data.selected && this.data.selected.id) {
        this.data.oSelected = this.data.selected;
        this.data.selected = {};
        this.data.inputValue = this.data.selected.name;
        this.$emit('change', {
          sender: this
        });
        this.$update();
      }
    }
  });

  return Select2;
});
