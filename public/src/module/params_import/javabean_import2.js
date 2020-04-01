/**
 * 批量导入JavaBean确认弹框
 */
NEJ.define([
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/modal/modal',
  'pro/tagme/tagme',
  'text!./javabean_import2.html',
  'css!./javabean_import2.css'
], function (_u, _e, util, Modal, tagme, html, css) {
  _e._$addStyle(css);
  var JavaBeanImport2 = Modal.extend({
    config: function () {
      this.data = _u._$merge({
        'contentTemplate': html,
        'class': 'm-modal-jbimport2',
        'title': '导入数据模型',
        'closeButton': true,
        'okButton': '创建',
        'cancelButton': '取消',
        hasSameName: false,
        group: null,
        tags: []
      }, this.data);
      this.sortByName();
      this.initData();
      this.supr(this.data);
    },
    init: function () {
      //初始化tagme组件
      this.tag = tagme._$$ModuleTagme._$allocate({
        parent: this.$refs.tags,
        searchCache: this.data.searchCache,
        searchCacheKey: this.data.listCacheKey,
        searchResultFilter: function () {
          return this.data.cache._$getTagList(this.data.listCacheKey);
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
      this.supr();
    },
    destroy: function () {
      this.tag && this.tag._$recycle();
      this.tag = null;
      this.supr();
    },
    import: function (event) { // 继续导入，将解析出的数据模型添加到dts中，并重新初始化数据
      var files = event.target.files;
      util._$importDatatypeFiles(this.importingFileType, files, function (importDT) {
        this.data.dts = this.data.dts.concat(importDT);
        this.initData();
        this.$update();
      }.bind(this));
      event.target.value = '';
    },
    initData: function () { //初始化数据，主要是分离重名与非重名数据模型
      var names = [],//记录所有已经出现过的name
        arr1 = [],  //分别记录重名与非重名数组
        arr2 = [];
      this.data.dts.forEach(function (dt) { //默认选中
        if (names.indexOf(dt.name) === -1) { //名称未出现过，则选中，并将name添加到数组中
          names.push(dt.name);
          var list = this.searchSameName(dt); //查找同名，将同名一起处理
          dt.selected = true;
          if (list.length > 0) {
            this.data.hasSameName = true;
            arr1.push(dt);
            dt.class = 'm-same-first';
            list.forEach(function (item, i) {
              item.selected = false;
              if (i === list.length - 1) {
                item.class = 'm-same-last';
              }
              arr1.push(item);
            });
          } else {
            arr2.push(dt);
          }
        }
      }.bind(this));
      if (arr1.length > 0) {
        arr1[arr1.length - 1].class += ' m-last';
      }
      this.data.dts = arr1.concat(arr2);
      this.data.names = names;
    },
    ok: function () {
      var callback = function () {
        var items = [];
        this.data.dts.forEach(function (dt) { //筛选 选中的数据模型
          if (dt.selected) {
            var data = _u._$merge({}, dt);
            delete data.selected;
            delete data.showPreview;
            delete data.class;
            items.push(data);
          }
        });
        if (items.length > 0) {
          var tags = this.data.tags.map(function (item) {
            return item.name;
          });
          this.$emit('ok', {
            names: this.data.names,
            items: items,
            groupId: this.data.group ? this.data.group.id : this.data.groups[0].id,
            tag: tags.join(',')
          });
          this.destroy();
        }
      }.bind(this);
      if (!this.tag.tagList.data.hideDropdown) {
        // 这个地方ok比tagme中的focus blur 的eventhandler早触发，且ok会destroy self，导致tagme的handler一些属性被清空而出错，故等到下一个周期再执行callback
        setTimeout(function () {
          callback();
        }.bind(this), 0);
      } else {
        callback();
      }
    },
    searchSameName: function (dt) { //查找其他同名的数据类型
      var list = this.data.dts.filter(function (item) {
        return item !== dt && item.name === dt.name;
      });
      return list;
    },
    select: function (index) { //切换选中状态
      var dt = this.data.dts[index];
      dt.selected = !dt.selected;
      if (dt.selected) {
        var list = this.searchSameName(dt);
        list.forEach(function (item) {
          item.selected = false;
        });
      }
    },
    setGroup: function (event) { //选择分组
      this.data.group = event.selected;
    },
    showImport: function (type, importingFileType) { //显示文件选择
      type ? this.$refs.dirInput.click() : this.$refs.fileInput.click();
      this.importingFileType = importingFileType;
    },
    sortByName: function () { //按照名称排序
      this.data.dts.sort(function (a, b) {
        return a.name.localeCompare(b.name, 'zh-CN');
      });
    },
    toggle: function (index) { //展开或收起列表
      this.data.dts[index].showPreview = !this.data.dts[index].showPreview;
    }
  });
  return JavaBeanImport2;

});
