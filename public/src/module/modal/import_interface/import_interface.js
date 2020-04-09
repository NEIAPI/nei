/**
 * 导入接口的定义文件，swagger、json、postman、har 等
 * 参考 javabean_import2.js 实现
 */
NEJ.define([
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/modal/modal',
  'pro/tagme/tagme',
  'text!./import_interface.html',
  'css!./import_interface.css'
], function (_u, _e, util, modal, tagme, html, css) {
  _e._$addStyle(css);
  return modal.extend({
    config: function () {
      this.data = _u._$merge({
        contentTemplate: html,
        class: 'm-modal-import-interface',
        title: '导入 HTTP 接口',
        okButton: '导入',
        cancelButton: '取消',
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
    setInterfaceName: function (event, itf) {
      itf.name = event.target.value;
      if (itf.name.length <= 0 || itf.name.length > 100) {
        itf.errorTip = '接口的名称长度必须大于 0 且小于 100！';
      } else {
        itf.errorTip = null;
      }
      var list = this.searchSameName(itf);
      if (list.length > 0) {
        this.data.hasSameName = true;
        if (itf.selected) {
          itf.selected = false;
        }
      }
      this.$update();
    },
    import: function (event) { // 继续导入，将解析出的HTTP 接口添加到interfaces中，并重新初始化数据
      var files = event.target.files;
      util._$importInterfaceFiles(this.importingFileType, files, function (evt) {
        this.data.interfaces = this.data.interfaces.concat(evt.data.interfaces);
        this.data.datatypes = this.data.datatypes.concat(evt.data.datatypes);
        this.initData();
        this.$update();
      }.bind(this), this.data.pid);
      event.target.value = '';
    },
    initData: function () { //初始化数据，主要是分离重名与非重名HTTP 接口
      var names = [];//记录所有已经出现过的name
      //分别记录重名与非重名数组
      var arr1 = [];
      var arr2 = [];
      this.data.interfaces.forEach(function (itf) { //默认选中
        if (names.indexOf(itf.name) === -1) { //名称未出现过，则选中，并将name添加到数组中
          names.push(itf.name);
          var list = this.searchSameName(itf); //查找同名，将同名一起处理
          itf.selected = true;
          if (list.length > 0) {
            this.data.hasSameName = true;
            arr1.push(itf);
            itf.class = 'm-same-first';
            list.forEach(function (item, i) {
              item.selected = false;
              if (i === list.length - 1) {
                item.class = 'm-same-last';
              }
              arr1.push(item);
            });
          } else {
            arr2.push(itf);
          }
        }
      }.bind(this));
      if (arr1.length > 0) {
        arr1[arr1.length - 1].class += ' m-last';
      }
      this.data.interfaces = arr1.concat(arr2);
    },
    ok: function () {
      var items = [];
      var hasError = false;
      this.data.interfaces.forEach(function (itf) { //筛选 选中的HTTP 接口
        if (itf.selected) {
          if (itf.name.length > 0 && itf.name.length < 100) {
            var data = _u._$merge({}, itf);
            delete data.selected;
            delete data.showPreview;
            delete data.class;
            delete data.errorTip;
          } else {
            itf.errorTip = '接口的名称长度必须大于 0 且小于 100！';
            hasError = true;
          }
          items.push(data);
        }
      });
      if (items.length > 0 && !hasError) {
        var tags = this.data.tags.map(function (item) {
          return item.name;
        });
        this.$emit('ok', {
          interfaces: items,
          datatypes: this.data.datatypes,
          groupId: this.data.group ? this.data.group.id : this.data.groups[0].id,
          tag: tags.join(',')
        });
        this.destroy();
      } else {
        this.$update();
      }
    },
    searchSameName: function (itf) { //查找其他同名的HTTP 接口
      return this.data.interfaces.filter(function (item) {
        return item !== itf && item.name === itf.name;
      });
    },
    select: function (index) { //切换选中状态
      var itf = this.data.interfaces[index];
      itf.selected = !itf.selected;
      if (itf.selected) {
        var list = this.searchSameName(itf);
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
      this.data.interfaces.sort(function (a, b) {
        return a.name.localeCompare(b.name, 'zh-CN');
      });
    },
    toggle: function (index) { //展开或收起列表
      this.data.interfaces[index].showPreview = !this.data.interfaces[index].showPreview;
    }
  });
});
