/**
 * 标签组件
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'util/template/jst',
  'pro/common/module',
  'pro/common/jst_extend',
  'pro/common/regular/regular_base',
  'pro/common/util',
  'text!./tagme.html',
  'css!./tagme.css'
], function (k, u, e, v, jst, m, jstex, rb, util, html, css, p, pro) {

  p._$$ModuleTagme = k._$klass();
  pro = p._$$ModuleTagme._$extend(m._$$Module);

  var BACK_SPACE = 8;
  var ARROW_UP_KEY = 38;
  var ARROW_DOWN_KEY = 40;
  var ENTER_KEY = 13;
  e._$addStyle(css);

  // 默认配置参数
  var defaultOptions = {
    // 父容器
    parent: document.body,
    // 自动提示的搜索缓存
    searchCache: null,
    // 自动提示的搜索缓存 key
    searchCacheKey: null,
    // 搜索结果列表数据处理函数
    searchResultFilter: function (result) {
      return result;
    },
    // 已有标签列表, 支持两种格式, 一种是字符串, 一种是对象, 对象的时候必须要有 id 字段
    // 格式一, 每项都是字符串:
    // ['A', 'B', 'C']
    // 格式二, 每项是个完整的对象, name 是显示的名称, title 是鼠标 hover 的提示, 如果不传则等同于 name
    //        namePinyin 是 name 的拼音, 以便输入时支持拼音联想
    // [{id: 1, name: 'A', namePinyin: 'A', title: 'A', tags: ['xxx', 'yyy']}, {id: 2, name: 'B'}, {id: 3, name: 'C'}]
    tags: [],
    // 自动提示中的标签列表, 包括已有的标签列表, 格式同 tags
    list: [],
    // 是否为预览模式
    preview: true,
    // 是否可以编辑
    editable: true,
    // 是否只能选择自动提示中的选项
    choseOnly: true,
    // 是否根据输入框的值进行搜索
    isSearchByValue: false,
    // 是否只搜索一次
    isSearchOnce: null,
    // 输入框的 placeholder
    placeholder: '',
    // 搜索时需要发送的查询参数
    queryData: null,
    // 失去焦点后的回调, 包含两个字段:
    // data.tags 当前标签列表
    // data.change 标签列表是否发生变化
    done: function (data) {
    },
    // 没有标签时的提示文案
    noTagTip: '暂无标签',
    tagName: '标签',
    // 下拉列表最多渲染的个数
    maxNum: Infinity,
    // 强制隐藏可选提示框，适用于无需提示场景
    foreceHideDropdown: false,
    // 标签样式
    itemStyle: {
      backgroundColor: '#aaa',
    }
  };

  pro.__reset = function (options) {
    this.__super(options);
    this._options = u._$merge({}, defaultOptions, options);
    if (!this._options.placeholder) {
      this._options.placeholder = (this._options.choseOnly ? '请选择' : '请输入') + this._options.tagName;
    }
    if (this._options.searchCache) {
      // 如果是通过缓存加载的自动提示列表, 强制将其转为空数组, 防止误传参数
      this._options.list = [];
    }
    // 将字符串格式的tag转为对象格式的tag
    if (typeof (this._options.list[0] || this._options.tags[0]) === 'string') {
      this._options.list = this._convertStrTagList(this._options.list);
      this._options.tags = this._convertStrTagList(this._options.tags);
    }
    // 去除无效 tag, 即 id 为空字符串的 tag
    this._options.tags = this._options.tags.filter(function (tag) {
      return tag.id !== '';
    });
    this._options.tags = this._options.tags.sort(function (itemA, itemB) {
      return itemA.name.localeCompare(itemB.name, 'zh-CN');
    });
    var tagList = this._getList();
    this.tagList = new tagList({
      data: {
        xlist: this._options.tags,
        alist: this._options.list,
        preview: this._options.preview,
        choseOnly: this._options.choseOnly,
        editable: this._options.editable !== false,
        isSearchByValue: this._options.isSearchByValue,
        done: this._options.done,
        placeholder: this._options.placeholder,
        noTagTip: this._options.noTagTip,
        maxNum: this._options.maxNum,
        foreceHideDropdown: this._options.foreceHideDropdown,
        itemStyle: this._options.itemStyle,
      }
    }).$inject(this._options.parent);
  };

  pro._convertStrTagList = function (list) {
    return list.map(function (item) {
      return {
        name: item,
        id: item,
        title: item
      };
    }, this);
  };

  pro._getList = function () {
    var that = this;
    return rb.extend({
      template: html,
      config: function () {
        // 是否在加载数据
        this._isRequesting = false;
        // 备份用, 回调时需要有没有变化的信息
        this.data.oxlist = this.data.xlist.map(function (item) {
          return {
            id: item.id,
            name: item.name
          };
        });
        this.data.opreview = this.data.preview;
        this.data.sIndex = null;
        this.data.hideDropdown = true;
        this.data.editMode = false;
        this.updateYList();
      },

      updateYList: function () {
        this.data.ylist = this.data.alist.filter(function (item) {
          delete item.__uiName;
          var found = this.data.xlist.find(function (itm) {
            return itm.id === item.id;
          });
          return !found;
        }, this);
        this.checkYList();
      },

      checkYList: function () {
        if (this.data.ylist.length === 0) {
          if (this._isRequesting === true) {
            this.data.ylist.push({
              id: -1,
              name: '正在请求列表数据...'
            });
          } else {
            this.data.ylist.push({
              id: -1,
              name: '没有可选择的项'
            });
          }
        }
      },

      remove: function (tagIndex, evt) {
        evt && evt.event.stopPropagation();
        this.data.xlist.splice(tagIndex, 1);
        this.updateYList();
        setTimeout(function () {
          this.$refs.input.focus();
          // 解决原有的无法失焦的问题
          if (!this.data.editable) {
            // 不可修改
            return;
          }
          this._addEventOnce();
          this.$update();
        }.bind(this), 0);
      },

      input: function (evt) {
        evt.event.preventDefault();
        this.data.hideDropdown = false;
        if (that._options.searchCache && !this.acListLoaded) {
          // 加载远程的自动提示列表
          this.getRemoteData();
        }
        var value = evt.target.value.trim();
        this.data.inputValue = value;
        if (!value) {
          this.data.ylist = this.data.alist.filter(function (item) {
            delete item.__uiName;
            return true;
          });
          return;
        }
        this.data.ylist = this.data.alist.filter(function (item) {
          delete item.__uiName;
          var found = this.data.xlist.find(function (itm) {
            return itm.name.indexOf(item.name) > -1;
          });
          if (found) {
            return false;
          }
          var iv = item.name + (item.nameDesc || '');
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
        this.checkYList();
      },

      add: function (evt, item) {
        evt && evt.event.stopPropagation();
        if (item.id === -1) {
          // 点击了提示信息
          return;
        }
        if (this.data.choseOnly) {
          // 只能选择自动提示列表中的项
          if (this.data.sIndex !== null) {
            // 方向键选取
            this.data.xlist.push(this.data.ylist[this.data.sIndex]);
          } else if (item.hasOwnProperty('id')) {
            // 点击选择自动提示中的选项
            this.data.xlist.push(item);
          } else if (item.name) {
            // 试着查找匹配, 如果唯一并且不是"没有可选择的项", 就添加
            if (this.data.ylist.length === 1 && this.data.ylist[0].hasOwnProperty('id') && this.data.ylist[0].id !== -1) {
              this.data.xlist.push(this.data.ylist[0]);
            }
          }
        } else {
          // 可以添加输入的项
          var found = this.data.xlist.find(function (itm) {
            return itm.name === item.name;
          });
          if (item.name && !/^(,|，)$/.test(item.name) && !found) {
            // 添加新项
            item.id = item.name;
            this.data.xlist.push(item);
          }
        }
        // 不论哪种情况都清空内容
        this.data.inputValue = null;
        this.data.sIndex = null;
        this.updateYList();
        this.$refs.input.focus();
      },

      keydown: function (evt) {
        var keyCode = evt.event.keyCode;
        if (keyCode === ENTER_KEY) {
          evt.event.preventDefault();
          var value = this.$refs.input.value.trim();
          this.add(null, {
            name: value
          });
        } else if (keyCode === ARROW_UP_KEY) {
          evt.event.preventDefault();
          if (this.data.sIndex === null) {
            this.data.sIndex = this.data.ylist.length - 1;
          } else {
            this.data.sIndex -= 1;
            if (this.data.sIndex < 0) {
              this.data.sIndex = this.data.ylist.length - 1;
            }
          }
          if (this.data.ylist[this.data.sIndex].id !== -1) {
            this.data.inputValue = this.data.ylist[this.data.sIndex].name;
            this._setListScrollTop();
          } else {
            // 没有可选择的项
            this.data.sIndex = null;
          }
        } else if (keyCode === ARROW_DOWN_KEY) {
          evt.event.preventDefault();
          if (this.data.sIndex === null) {
            this.data.sIndex = 0;
          } else {
            this.data.sIndex += 1;
            if (this.data.sIndex > this.data.ylist.length - 1) {
              this.data.sIndex = 0;
            }
          }
          if (this.data.ylist[this.data.sIndex].id !== -1) {
            this.data.inputValue = this.data.ylist[this.data.sIndex].name;
            this._setListScrollTop();
          } else {
            // 没有可选择的项
            this.data.sIndex = null;
          }
        } else if (keyCode === BACK_SPACE) {
          if (!this.$refs.input.value) {
            // input 没有值的时候删除最后一个tag
            evt.event.preventDefault();
            this.remove(this.data.xlist.length - 1);
          }
        }
      },

      _setListScrollTop: function () {
        if (this.data.sIndex > 6) {
          this.$refs.listcon.scrollTop = (this.data.sIndex - 6) * 40;
        } else {
          this.$refs.listcon.scrollTop = 0;
        }
      },

      focus: function (evt) {
        if (!this.data.editable) {
          // 不可修改
          return;
        }
        this.data.hideDropdown = !this.data.hideDropdown;
        this.data.preview = false;
        this._addEventOnce();
        if (that._options.searchCache && !this.acListLoaded) {
          // 加载远程的自动提示列表
          this.getRemoteData();
        }
      },

      _addEventOnce: function () {
        this._hideHandler = this._hideHandler || function (evt) {
            if (evt.target === this.$refs.input
              || evt.target === this.$refs.tagmecon) {
              this.$refs.input.focus();
              return;
            }
            this.blur();
          }.bind(this);
        // 需要先移除事件, 不然反复点击时会重复触发
        Regular.dom.off(document, 'click', this._hideHandler);
        Regular.dom.on(document, 'click', this._hideHandler);
      },

      blur: function () {
        this.data.hideDropdown = true;
        // 根据初始状态复位
        if (this.data.opreview) {
          this.data.preview = true;
        }
        var value = this.$refs.input.value.trim();
        this.add(null, {
          name: value
        });
        var tagIdsNames = this.getTags();
        this.data.done({
          tags: tagIdsNames,
          oTags: this.data.oxlist,
          change: tagIdsNames.map(function (item) {
            return item.id;
          }).join(',') !== this.data.oxlist.sort(sortById).map(function (item) {
            return item.id;
          }).join(',')
        });
        this.data.oxlist = this.data.xlist.map(function (item) {
          return {
            id: item.id,
            name: item.name
          };
        });
        Regular.dom.off(document, 'click', this._hideHandler);
        // todo: 有时输入框无法失焦?
        this.$refs.input.blur();
        this.$update();
      },

      getNameAndId: function () {
        return this.data.xlist.map(function (item) {
          return {id: item.id, name: item.name};
        });
      },

      getTags: function () {
        return this.getNameAndId().sort(sortById);
      },

      getRemoteData: function () {
        var searchKey = this.$refs.input.value.trim();
        var handler = function (alist) {
          alist = that._options.searchResultFilter(alist);
          if (typeof alist[0] === 'string') {
            alist = that._convertStrTagList(alist);
          }
          // 排序
          alist.sort(function (itemA, itemB) {
            return itemA.name.localeCompare(itemB.name, 'zh-CN');
          });
          // 去除搜索提示列表中已经选中的项
          this.data.alist = alist;
          this.data.ylist = [];
          alist.forEach(function (item) {
            var found = this.data.xlist.find(function (itm) {
              return itm.id === item.id;
            });
            if (!found) {
              this.data.ylist.push(item);
            }
          }, this);
          this.checkYList();
        }.bind(this);
        var cache;
        // 根据用户输入的关键词进行搜索
        if (this.data.isSearchByValue) {
          cache = that._options.searchCache._$allocate({
            onlistload: function (evt) {
              this._isRequesting = false;
              if (that._options.isSearchOnce) {
                this.acListLoaded = true;
              }
              handler(cache._$getDataInCache(searchKey));
              this.$update();
            }.bind(this)
          });
          if (this.acListLoaded) {
            return;
          }
          var data = cache._$getDataInCache(searchKey);
          if (data) {
            if (that._options.isSearchOnce) {
              this.acListLoaded = true;
            }
            return handler(data);
          }
          this._isRequesting = true;
          cache._$getList({
            key: searchKey,
            data: {
              v: searchKey
            }
          });

        } else {
          // 加载资源列表
          cache = that._options.searchCache._$allocate({
            onlistload: function (evt) {
              // 列表加载完成标记, 加载一次即可
              this.acListLoaded = true;
              handler(cache._$getListInCache(that._options.searchCacheKey));
              this.$update();
            }.bind(this)
          });
          if (this.acListLoaded) {
            return;
          }
          cache._$getList({
            key: that._options.searchCacheKey,
            data: that._options.queryData
          });
        }
      }
    });
  };

  /**
   * 获取当前的tag列表
   * @return  {Array} tags - 标签列表
   */
  pro._$getTags = function () {
    return this.tagList.getTags();
  };

  /**
   * 清空
   */
  pro._$empty = function () {
    this.tagList.data.xlist = [];
    this.tagList.$update();
  };

  /**
   * 组件回收
   */
  pro._$recycle = function (options) {
    this.__super(options);
    this.tagList && this.tagList.destroy();
    this.tagList = null;
  };

  /**
   * 添加一个或者一组标签
   * @param  {Object|Array} tags - 要添加的标签列表
   */
  pro._$add = function (tags) {
    if (!u._$isArray(tags)) {
      tags = [tags];
    }
    if (typeof tags[0] === 'string') {
      tags = this._convertStrTagList(tags);
    }
    // 是否加可以添加到选中的以及自动提示的列表中
    tags.forEach(function (tag) {
      var foundTag = this.tagList.data.xlist.find(function (item) {
        return item.id === tag.id;
      });
      // 如果当前的选中列表中不存在, 就添加
      if (!foundTag) {
        this.tagList.data.xlist.push(tag);
      }
      foundTag = this.tagList.data.alist.find(function (item) {
        return item.id === tag.id;
      });
      // 如果当前的自动完成列表不存在, 就添加
      if (!foundTag) {
        this.tagList.data.alist.push(tag);
      }
    }, this);
    // 排序
    this.tagList.data.alist.sort(function (itemA, itemB) {
      return itemA.name.localeCompare(itemB.name, 'zh-CN');
    });
    this.tagList.$update();
  };

  /**
   * 移除一个或者一组标签
   * @param  {Object|Array} tags - 要删除的标签列表
   */
  pro._$remove = function (tags) {
    if (!u._$isArray(tags)) {
      tags = [tags];
    }
    if (typeof tags[0] === 'string') {
      tags = this._convertStrTagList(tags);
    }
    var existTagRemoved = false;
    // 从选中的列表以及自动提示的列表中删除标签
    tags.forEach(function (tag) {
      var foundIndex = null;
      this.tagList.data.xlist.find(function (item, idx) {
        if (item.id === tag.id) {
          foundIndex = idx;
          existTagRemoved = true;
          return true;
        }
      });
      // 如果在当前的选中列表中存在, 就删除
      if (foundIndex !== null) {
        this.tagList.data.xlist.splice(foundIndex, 1);
      }
      foundIndex = null;
      this.tagList.data.alist.find(function (item, idx) {
        if (item.id === tag.id) {
          foundIndex = idx;
          return true;
        }
      });
      // 如果当前的自动完成列表存在, 就删除
      if (!foundIndex) {
        this.tagList.data.alist.splice(foundIndex, 1);
      }
    }, this);
    // 不需要重新排序
    this.tagList.$update();
    // 如果有已经存在的标签被移除了, 则触发 change 事件
    if (existTagRemoved) {
      var tagIdsNames = this.tagList.getTags();
      this.tagList.data.done({
        tags: tagIdsNames,
        change: true
      });
    }
  };

  /**
   * 从自动提示的列表中移除一个或者一组标签, 此时不需要修改显示的标签列表
   * 在有多个 tagme 实例并且有相互关系的时候此方法会用到
   * @param  {Object|Array} tags - 要删除的标签列表
   */
  pro._$removeFromList = function (tags) {
    if (!u._$isArray(tags)) {
      tags = [tags];
    }
    if (typeof tags[0] === 'string') {
      tags = this._convertStrTagList(tags);
    }
    // 从自动提示的列表中删除标签
    tags.forEach(function (tag) {
      var foundIndex = null;
      this.tagList.data.alist.find(function (item, idx) {
        if (item.id === tag.id) {
          foundIndex = idx;
          return true;
        }
      });
      // 如果当前的自动完成列表存在, 就删除
      if (!foundIndex) {
        this.tagList.data.alist.splice(foundIndex, 1);
      }
    }, this);
    // 不需要重新排序
    this.tagList.$update();
  };

  /**
   * 从自动提示的列表中添加一个或者一组标签, 此时不需要修改显示的标签列表
   * 在有多个 tagme 实例并且有相互关系的时候此方法会用到
   * @param  {Object|Array} tags - 要添加的标签列表
   */
  pro._$addToList = function (tags) {
    if (!u._$isArray(tags)) {
      tags = [tags];
    }
    if (typeof tags[0] === 'string') {
      tags = this._convertStrTagList(tags);
    }
    // 从自动提示的列表中删除标签
    tags.forEach(function (tag) {
      var found = this.tagList.data.alist.find(function (item) {
        return item.id === tag.id;
      });
      // 如果当前的自动完成列表不存在, 就添加
      if (!found) {
        this.tagList.data.alist.push(tag);
      }
    }, this);
    // 排序
    this.tagList.data.alist.sort(function (itemA, itemB) {
      return itemA.name.localeCompare(itemB.name, 'zh-CN');
    });
    this.tagList.$update();
  };

  function sortById(itemA, itemB) {
    return itemA.id.toString().localeCompare(itemB.id.toString(), 'zh-CN');
  }
});
