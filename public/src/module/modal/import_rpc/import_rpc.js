/**
 * 导入 PRC 接口的定义文件，json、rpc controller 等
 * 参考 import_interface.js 实现
 */
NEJ.define([
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/modal/modal',
  'pro/tagme/tagme',
  'text!./import_rpc.html',
  'css!./import_rpc.css'
], function (_u, _e, util, modal, tagme, html, css) {
  _e._$addStyle(css);
  return modal.extend({
    config: function () {
      this.data = _u._$merge({
        contentTemplate: html,
        class: 'm-modal-import-rpc',
        title: '导入 RPC 接口',
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
    import: function (event) { // 继续导入，将解析出的 RPC 接口添加到rpcs中，并重新初始化数据
      var files = event.target.files;
      util._$importRPCFiles(this.importingFileType, files, function (result) {
        this.data.rpcs = this.data.rpcs.concat(result.data.rpcs);
        this.data.datatypes = this.data.datatypes.concat(result.data.datatypes);
        this.initData();
        this.$update();
      }.bind(this));
      event.target.value = '';
    },
    initData: function () { //初始化数据，主要是分离重名与非重名 PRC 接口
      var names = [];//记录所有已经出现过的name
      //分别记录重名与非重名数组
      var arr1 = [];
      var arr2 = [];
      this.data.rpcs.forEach(function (itf) { //默认选中
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
      this.data.rpcs = arr1.concat(arr2);
    },
    ok: function () {
      var items = [];
      this.data.rpcs.forEach(function (itf) { //筛选 选中的 RPC 接口
        if (itf.selected) {
          var data = _u._$merge({}, itf);
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
          rpcs: items,
          datatypes: this.data.datatypes,
          groupId: this.data.group ? this.data.group.id : this.data.groups[0].id,
          tag: tags.join(',')
        });
        this.destroy();
      }
    },
    searchSameName: function (itf) { //查找其他同名的 RPC 接口
      return this.data.rpcs.filter(function (item) {
        return item !== itf && item.name === itf.name;
      });
    },
    select: function (index) { //切换选中状态
      var itf = this.data.rpcs[index];
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
      this.data.rpcs.sort(function (a, b) {
        return a.name.localeCompare(b.name, 'zh-CN');
      });
    },
    toggle: function (index) { //展开或收起列表
      this.data.rpcs[index].showPreview = !this.data.rpcs[index].showPreview;
    }
  });
});
