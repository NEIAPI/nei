/*
 * 参数编辑器-数组组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/params_preview/params_origin',
  'pro/cache/datatype_cache',
  'text!./params_array.html'
], function (v, u, e, _, Origin, datatypecache, tpl) {
  var Array2 = Origin.extend({
    name: 'arrayPreview',
    template: tpl,
    config: function () {
      _._$extend(this.data, {});
      this.supr();
      this.data.params = this.formatParamsSource(_._$clone(this.data.params));
    },
    init: function () {
      this.supr();
    },
    /**
     *保存参数数据 数据来源为直接添加
     * @param index
     */
    update: function (index) {
      //添加的参数包含有匿名类型
      if ((typeof index == 'number') && this.data.params[index].isObjectType) {
        if (!this.validate(this.data.params[index])) return;
        var _data = this.$refs['editor'].$getEditorParams();
        var _ext = {
          index: index,
          action: 'add'
        };
        this.data.params[index].attrs = _data.result.params;
        this.data.params[index].imports = _data.result.imports;
        this._doUpdateParams([this.data.params[index]], [], _ext);
      } else {
        this.supr(index);
      }
    }
    // doUpdateParams:function (options) {
    //     var index = options.ext.index;
    //     this.data.params[index].type = options.data.id;
    //     this.data.params[index].typeName = "";
    //     this.update(index);
    // }

  });
  return Array2;
});
