/*
 * 参数编辑器-数组组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/parameter_cache',
  'pro/params_preview/params_origin',
  'text!./params_base.html'
], function (v, u, e, _, cache, Origin, tpl) {
  var String2 = Origin.extend({
    name: 'stringPreview',
    template: tpl,
    config: function () {
      this.supr();
      _._$extend(this.data, {
        noArray: true,
        noObject: true
      });

      var baseType = [
        {id: _.db.MDL_FMT_STRING, typeName: 'String', type: _.db.MDL_SYS_STRING, name: '字符'},
        {id: _.db.MDL_FMT_NUMBER, typeName: 'Number', type: _.db.MDL_SYS_NUMBER, name: '数值'},
        {id: _.db.MDL_FMT_BOOLEAN, typeName: 'Boolean', type: _.db.MDL_SYS_BOOLEAN, name: '布尔'},
        {id: _.db.MDL_FMT_FILE, typeName: 'File', type: _.db.MDL_SYS_FILE, name: '文件'}
      ];

      this.data.origin = baseType.find(function (item) {
        return item.id === this.data.format;
      }._$bind(this));

    },
    init: function () {
      this.supr();
    }
  });
  return String2;
});
