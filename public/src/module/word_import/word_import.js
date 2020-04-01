NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'util/page/page',
  'pro/modal/modal',
  'pro/common/util',
  'pro/cache/word_cache',
  'pro/cache/group_cache',
  'pro/tagme/tagme',
  'text!./word_import.html',
  'text!./word_import.css'
], function (e, v, u, p, Modal, _, wordCache, groupCache, tagme, tpl, css) {
  var modal = Modal.extend({
    config: function () {
      var that = this;
      var pid = this.data.pid;
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-modal-import',
        'title': this.data.jsonList ? '导入JSON数据' : this.data.importProgroup ? '导入项目组已有参数' : '导入项目已有参数',
        'closeButton': true,
        'okButton': true,
        'cancelButton': true,
        size: 'large',
        checkStatus: {},
        pageSelectStatus: {},
        currentIndex: 1,
        pageSize: 100,
        showPage: false,
        selectAllPage: false,
        group: null,
        tags: []
      });

      this.__groupCache = groupCache._$$CacheGroup._$allocate({
        onlistload: function () {
          this.data.groups = this.__groupCache._$getGroupSelectSource(pid);
        }.bind(this)
      });

      this.__groupCache._$getList({
        key: this.__groupCache._$getListKey(pid),
        data: {
          pid: pid
        }
      });

      this.__wordCache = wordCache._$$CacheWord._$allocate({
        oncandidateload: function (evt) {
          this.data.list = evt.data || [];
          this.data.list = this.data.list.sort(function (a, b) {
            return b.times - a.times;
          });
          this.data.loading = false;
          this.initPage();
        }.bind(this),
        onlistload: function (evt) {
          var words = this.__wordCache._$getListInCache(evt.key);
          this.data.list = this.data.jsonList.filter(function (candidate) {
            return words.findIndex(function (word) {
                return word.name === candidate.name;
              }) === -1;
          });
          this.data.loading = false;
          this.initPage();
        }.bind(this)
      });

      this.data.loading = true;
      this.cacheKey = this.__wordCache._$getListKey(pid);

      if (this.data.jsonList) {
        this.__wordCache._$clearDirtyList(pid);
        this.__wordCache._$getList({
          key: this.cacheKey,
          data: {pid: pid}
        });
      } else {
        this.__wordCache._$getCandidateList({
          data: {
            pid: pid,
            importProgroup: this.data.importProgroup
          }
        });
      }

      this.supr(this.data);
    },
    init: function () {
      //初始化tagme组件
      this.__tag = tagme._$$ModuleTagme._$allocate({
        parent: this.$refs.tags,
        searchCache: wordCache._$$CacheWord,
        searchCacheKey: this.cacheKey,
        searchResultFilter: function () {
          return this.__wordCache._$getTagList(this.cacheKey);
        }.bind(this),
        preview: false,
        choseOnly: false,
        editable: true,
        tags: [],
        done: function (data) {
          if (!!data.change) {
            this.data.tags = data.tags;
          }
        }.bind(this),
        queryData: {
          pid: this.data.pid
        }
      });
      this.supr(this.data);
      e._$addStyle(css);
    },
    initPage: function () {
      var totalItem = this.data.list.length;
      var pageSize = this.data.pageSize;
      var total = parseInt((totalItem / pageSize), 10) + (totalItem % pageSize === 0 ? 0 : 1);
      this.data.total = total;
      this.setPage(1);

      if (total <= 1) {
        return;
      }
      var _list = e._$getChildren('word-import-page');
      this.__page = p._$$PageFragment._$allocate({
        list: e._$getByClassName('word-import-page', 'zpgi'),
        event: 'click',
        pbtn: _list[1],
        nbtn: _list[11],
        sbtn: _list[0],
        ebtn: _list[12],
        index: 1,
        total: total,
        onchange: function (_event) {
          this.setPage(_event.index);
        }.bind(this)
      });
      this.data.showPage = true;
      this.$update();
    },
    setPage: function (index) {
      var startOffset = (index - 1) * this.data.pageSize;
      this.data.xlist = this.data.list.slice(startOffset, startOffset + this.data.pageSize);
      this.data.currentIndex = index;
      this.data.selectAll = this.getSelectAllState();
      this.$update();
    },
    selectAllPage: function () {
      var that = this;
      var checked = this.data.selectAllPage = !this.data.selectAllPage;
      for (var i = 1; i <= this.data.total; i++) {
        this.data.pageSelectStatus[i] = checked;
      }
      this.setSelectAllState(checked);
      this.data.list.forEach(function (item) {
        that.data.checkStatus[item.name] = checked;
      });
      this.updateCheckArray();
    },
    selectAll: function (xlist) {
      var selectAll = this.getSelectAllState();
      var checked = selectAll = !selectAll;
      this.setSelectAllState(selectAll);

      var that = this;
      if (!xlist) {
        return;
      }
      xlist.forEach(function (item) {
        that.data.checkStatus[item.name] = checked;
      });
      this.updateCheckArray();
    },
    updateCheckArray: function () {
      var that = this;
      this.data.checkArray = this.data.list.filter(function (item) {
        return that.data.checkStatus[item.name];
      });
    },
    selectItem: function (event, name) {
      var that = this;
      if (v._$getElement(event, 'c:u-select')) {
        return false;
      }
      this.data.checkStatus[name] = !this.data.checkStatus[name];
      this.updateCheckArray();

      var currentPageCheckArray = this.data.xlist.filter(function (item) {
        return that.data.checkStatus[item.name];
      });

      if (currentPageCheckArray.length != this.data.xlist.length) {
        this.setSelectAllState(false);
      } else {
        this.setSelectAllState(true);
      }
    },
    getSelectAllState: function () {
      return this.data.pageSelectStatus[this.data.currentIndex];
    },
    setSelectAllState: function (state) {
      this.data.selectAll = state;
      this.data.pageSelectStatus[this.data.currentIndex] = state;

      var selectAllPage = true;
      for (var i = 1; i <= this.data.total; i++) {
        if (!this.data.pageSelectStatus[i]) {
          selectAllPage = false;
          break;
        }
      }
      this.data.selectAllPage = selectAllPage;
    },
    ok: function () {
      if (this.data.creating) {
        return;
      }
      this.data.creating = true;
      this.data.showPage = false;
      if (this.data.checkArray.length < 1) {
        return;
      }
      var tags = this.data.tags.map(function (item) {
        return item.name;
      });
      this.__wordCache._$batchCreate({
        data: {
          words: this.data.checkArray,
          projectId: this.data.pid,
          groupId: this.data.group ? this.data.group.id : this.data.groups[0].id,
          tag: tags.join(',')
        },
        onload: function () {
          delete this.data.creating;
          this.$emit('ok');
          this.destroy();
        }.bind(this)
      });
    },
    setGroup: function (event) { //选择分组
      this.data.group = event.selected;
    },
    destroy: function () {
      if (this.__page) {
        this.__page._$recycle();
        this.__page = null;
      }
      if (this.__tag) {
        this.__tag._$recycle();
        this.__tag = null;
      }
      this.supr();
    },
  }).filter({
    'formatCheck': function (arr) {
      var _tmp = [];
      arr.forEach(function (item) {
        _tmp.push(item.name);
      });
      return _tmp.join(',');
    }
  });
  return modal;
});
