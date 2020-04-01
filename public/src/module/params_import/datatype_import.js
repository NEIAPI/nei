NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/common/util',
  'pro/cache/datatype_cache',
  'text!./datatype_import.html',
  'text!./datatype_import.css'
], function (e, v, u, Modal, _, cache, tpl, css) {
  var modal = Modal.extend({
    config: function () {
      var that = this;
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-modal-import',
        'title': '导入数据模型',
        'closeButton': true,
        'okButton': true,
        'cancelButton': true,
        size: 'large',
        checkStatus: {},
        importedList: [],
        format: 0 //0 哈希 1 枚举
      });
      //this.data.noObject属性如果为true时 说明不能再导入匿名类型了
      this.__pid = this.data.pid;

      this.__listCacheKey = null;
      this.__cache = cache._$$CacheDatatype._$allocate({
        onlistload: function () {
          var _list = that.__cache._$getListInCache(this.__listCacheKey, true);
          //取指定数据模型 过滤掉系统类型和匿名类型，同时还要过滤掉没有属性的类型
          var arr = _list.filter(function (item) {
            return item.format == that.data.format && item.id > 10003 && !item.__isAnon && !!item.params.length;
          });
          this.data.versionsMap = _._$getVersionsMap(arr);
          //过滤掉已经导入的类型
          u._$reverseEach(arr, function (dt, index) {
            u._$reverseEach(that.data.importedList, function (imp0rtedId) {
              if (dt.id === imp0rtedId) {
                arr.splice(index, 1);
              } else {
                Object.keys(that.data.versionsMap).forEach(function (it) {
                  var versions = [it].concat(
                    (that.data.versionsMap[it] || []).map(function (vit) {
                      return vit.id;
                    })
                  );
                  if (versions.includes(dt.id) && versions.includes(imp0rtedId)) {
                    arr.splice(index, 1);
                  }
                });
              }
            });
          }._$bind(this));

          that.data.list = arr;
          that.data.xlist = _._$filterVersion(arr);
          that.data.xlist.sort(function (a, b) {
            return a.name.localeCompare(b.name, 'zh-CN');
          });
          that.data.sourceList = that.data.xlist.map(function (item) {
            var source = [];
            if (that.data.versionsMap[item.id]) {
              source = that.data.versionsMap[item.id];
            }
            return {id: item.id, source: source};
          });
          that.data.sortFunc = function (v1, v2) {
            return v2.id - v1.id;
          };
          that.data.hasVersion = !!that.data.sourceList.find(function (item) {
            return item.source.length;
          });
          that.$update();
        }.bind(this)
      });
      this.__listCacheKey = this.__cache._$getListKey(this.__pid);
      this.__cache._$getList({
        key: this.__listCacheKey,
        data: {
          pid: this.__pid
        },
        ext: {
          needVersions: true
        }
      });
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
      e._$addStyle(css);
    },
    selectAll: function (xlist) {
      var checked = this.data.selectAll = !this.data.selectAll;
      var that = this;
      if (!xlist) {
        return;
      }
      xlist.forEach(function (item, index) {
        that.data.checkStatus[index] = checked;
      });
      this.data.checkArray = this.data.xlist.filter(function (item, index) {
        return that.data.checkStatus[index];
      });
    },
    selectItem: function (event, index) {
      var that = this;
      if (v._$getElement(event, 'c:u-select')) {
        return false;
      }
      this.data.checkStatus[index] = !this.data.checkStatus[index];
      this.data.checkArray = this.data.xlist.filter(function (item, item_index) {
        return that.data.checkStatus[item_index];
      });
      if (this.data.checkArray.length != this.data.xlist.length) {
        this.data.selectAll = false;
      } else {
        this.data.selectAll = true;
      }
    },
    ok: function () {
      this.$emit('ok', this.data.checkArray);
      this.destroy();
    },
    _onListenInput: function ($event) {
      var value = this.$refs.input.value.trim();
      if (value == '') {
        this.data.xlist = _._$filterVersion(this.data.list);
        return;
      }
      this.data.xlist = _._$filterVersion(this.data.list).filter(function (item) {
        return item.name.toLowerCase().indexOf(value.toLowerCase()) !== -1;
      });
    },
    destroy: function () {
      this.supr();
    },
    changeVersion: function (event, item) {
      item.id = event.selected.id;
    }

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
