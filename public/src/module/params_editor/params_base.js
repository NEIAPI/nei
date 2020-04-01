/*
 * 参数编辑器-基本数据模型(String、Number、Boolean、File)
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/params_editor/params_origin',
  'text!./params_base.html'
], function (v, u, e, _, Origin, tpl) {
  var Base = Origin.extend({
    name: 'baseEditor',
    template: tpl,
    config: function () {
      var baseType = [
        {id: _.db.MDL_FMT_STRING, typeName: 'String', type: _.db.MDL_SYS_STRING},
        {id: _.db.MDL_FMT_NUMBER, typeName: 'Number', type: _.db.MDL_SYS_NUMBER},
        {id: _.db.MDL_FMT_BOOLEAN, typeName: 'Boolean', type: _.db.MDL_SYS_BOOLEAN},
        {id: _.db.MDL_FMT_FILE, typeName: 'File', type: _.db.MDL_SYS_FILE}
      ];
      var dataType = baseType.find(function (item) {
        return item.id === this.data.format;
      }.bind(this));
      _._$extend(this.data, {
        isFile: dataType.typeName == 'File',
        params: [{
          type: dataType.type,
          typeName: dataType.typeName,
          defaultVale: '',
          genExpression: '',
          valExpression: '',
          description: ''
        }]
      });
    },
    _change: function (opt) {
      this.data.params[0].defaultValue = opt.selected.name;
    },
    destroy: function () {
      this.supr();
    }
  });
  return Base;
});
