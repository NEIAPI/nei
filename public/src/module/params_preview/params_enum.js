/*
 * 参数编辑器-枚举组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/params_preview/params_origin',
  'text!./params_enum.html',
  'pro/modal/modal'
], function (v, u, e, _, Origin, tpl, Modal) {
  var Haxi = Origin.extend({
    name: 'enumPreview',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        source: [
          {name: 'String', id: '10001'},
          {name: 'Number', id: '10002'}
        ],
        noArray: true,
        noObject: true,
        verifyName: 'defaultValue',
        checkStatus: {}
      });
      if (this.data.action == 'modify') {
        this.data.params = [];
        this.add();
      } else {
        this.data.params = this.formatParamsSource(_._$clone(this.data.params));
        // this.$update();
      }
      this.supr();
    },
    init: function () {
      this.supr();
      this.listenHeadStatusChange(false);
    },
    add: function () {
      this.data.params.push({
        isImport: _.db.CMN_BOL_NO,
        isAdding: true,
        name: '',
        type: 10001,
        typeName: 'String',
        isArray: _.db.CMN_BOL_NO,
        defaultValue: ''
      });
      this.data.isAdding = true;
      this.$update();
    },
    import: function (type) {
      this.supr(type);

    },
    /**
     *保存参数数据 数据来源为直接添加或导入
     * @param index
     * @param importType importType = 'type' 是导入数据模型 ，否则是导入json 或在线接口
     */
    update: function (index, importType) {
      this.supr(index, importType);

    },
    /**
     *
     * @param index 删除的项索引
     */
    remove: function (index) {
      if (typeof index !== 'number') {//批量删除
        index = {};
        var imports = [], params = [];
        for (var key in this.data.checkStatus) {
          if (this.data.checkStatus[key]) {
            if (key.indexOf('dr') === 0) {
              imports.push(key.slice(2));
            } else {
              params.push(key);
            }
          }
        }
        index.params = params;
        index.imports = imports;
      }
      this.supr(index);
    },
    /**
     * 转换json
     * @param _json
     * @returns {Array}
     */
    formatJSONData: function (_json) {
      return this.supr(_json);
    }
  });
  return Haxi;
});
