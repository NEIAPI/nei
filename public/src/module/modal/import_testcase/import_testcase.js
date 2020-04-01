/**
 * 导入测试用例的定义文件
 * Created by wanghongkai on 2018/10/16
 */
NEJ.define([
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/modal/modal',
  'text!./import_testcase.html',
  'css!./import_testcase.css'
], function (_u, _e, util, modal, html, css) {
  _e._$addStyle(css);
  return modal.extend({
    config: function () {
      this.data = _u._$merge({
        contentTemplate: html,
        class: 'm-modal-import-testcase',
        title: '导入测试用例',
        okButton: '导入',
        cancelButton: '取消',
        importData: [],
        checkSameInterface: false
      }, this.data);
      this.sortByName();
      this.initData();
      this.supr(this.data);
    },
    init: function () {
      this.supr();
    },
    destroy: function () {
      this.supr();
    },
    setTestcaseName: function (event, ipt, index) {
      var tc = ipt.testcases[index];
      tc.name = event.target.value;
      var list = this.searchSameName(ipt, tc);
      if (list.length > 0) {
        this.data.hasSameName = true;
        if (tc.selected) {
          tc.selected = false;
        }
      }
      this.$update();
    },
    import: function (event) { // 继续导入，将解析出的测试用例添加到testcases中，并重新初始化数据
      var files = event.target.files;
      util._$importTestcaseFiles(this.importingFileType, files, function (importData) {
        if (Array.isArray(importData)) {
          if (this.data.checkSameInterface) {
            importData = importData.filter(function (ipt) {
              return ipt.interface.id === this.data.iid;
            }, this);
          }
          if (importData.length) {
            importData.forEach(function (ipt) {
              var findImport = this.data.importData.find(function (i) {
                return i.interface.id === ipt.interface.id;
              });
              if (findImport) {
                findImport.testcases = findImport.testcases.concat(ipt.testcases);
              } else {
                this.data.importData.push(ipt);
              }
            }, this);
            this.initData();
            this.$update();
          } else {
            modal.alert({
              title: '导入测试用例失败',
              content: '在用例管理只能导入当前接口的用例！',
              clazz: 'modal-exp-error'
            });
          }
        }
      }.bind(this), this.data.pid);
      event.target.value = '';
    },
    initData: function () {
      this.data.importData.forEach(function (ipt) {
        //初始化数据，主要是分离重名与非重名测试用例
        var names = [];//记录所有已经出现过的name
        //分别记录重名与非重名数组
        var arr1 = [];
        var arr2 = [];
        ipt.testcases.forEach(function (tc) { //默认选中
          if (names.indexOf(tc.name) === -1) { //名称未出现过，则选中，并将name添加到数组中
            names.push(tc.name);
            var list = this.searchSameName(ipt, tc); //查找同名，将同名一起处理
            tc.selected = true;
            if (list.length > 0) {
              ipt.hasSameName = true;
              arr1.push(tc);
              tc.class = 'm-same-first';
              list.forEach(function (item, i) {
                item.selected = false;
                if (i === list.length - 1) {
                  item.class = 'm-same-last';
                }
                arr1.push(item);
              });
            } else {
              arr2.push(tc);
            }
          }
        }.bind(this));
        if (arr1.length > 0) {
          arr1[arr1.length - 1].class += ' m-last';
        }
        ipt.testcases = arr1.concat(arr2);
      }, this);
    },
    ok: function () {
      var items = [];
      this.data.importData.forEach(function (ipt) {
        var selectedTestcases = [];
        ipt.testcases.forEach(function (tc) { //筛选 选中的用例
          if (tc.selected) {
            var data = _u._$merge({}, tc);
            delete data.selected;
            delete data.showPreview;
            delete data.class;
            selectedTestcases.push(data);
          }
        });
        if (selectedTestcases.length) {
          items.push({
            interface: ipt.interface,
            testcases: selectedTestcases
          });
        }
      });
      if (items.length > 0) {
        this.$emit('ok', {
          data: items
        });
        this.destroy();
      } else {
        this.$update();
      }
    },
    searchSameName: function (ipt, tc) { //查找其他同名的测试用例
      return ipt.testcases.filter(function (item) {
        return item !== tc && item.name === tc.name;
      });
    },
    select: function (ipt, index) { //切换选中状态
      var tc = ipt.testcases[index];
      tc.selected = !tc.selected;
      if (tc.selected) {
        var list = this.searchSameName(ipt, tc);
        list.forEach(function (item) {
          item.selected = false;
        });
      }
    },
    showImport: function (importingFileType) { //显示文件选择
      this.$refs.fileInput.click();
      this.importingFileType = importingFileType;
    },
    sortByName: function () { //按照名称排序
      this.data.importData.forEach(function (ipt) {
        ipt.testcases.sort(function (a, b) {
          return a.name.localeCompare(b.name, 'zh-CN');
        });
      });
      this.data.importData.sort(function (a, b) {
        return a.interface.name.localeCompare(b.interface.name, 'zh-CN');
      });
    },
    toggle: function (ipt, index) { //展开或收起列表
      ipt.testcases[index].showPreview = !ipt.testcases[index].showPreview;
    }
  });
});
