/*
 * 参数编辑器-暴露给模板的实例名和类名的映射规则组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/jarmap_cache',
  'pro/params_preview/params_origin',
  'pro/select2/select2',
  'text!./params_jar.html'
], function (v, u, e, _, cache, Origin, Select2, tpl) {
  var Cli = Origin.extend({
    name: 'jarPreview',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        verifyName: 'instanceName'
      });
      this.data.params = this.data.params.slice(0);
      this.supr(this.data);
    },
    add: function (option) {
      this.data.params.push(option || {
          isAdding: true,
          instanceName: '',
          klassName: ''
        });
      this.data.isAdding = true;
    },
    /**
     *保存参数数据 数据来源为直接添加
     * @param index
     * @param
     */
    update: function (index) {
      if (this.data.isSending) return;
      var item = this.data.params[index];
      var $cache = this._getCacheInstance('jarmap');
      var _ext = {
        cache: 'jarmap',
        uuid: this.data.uuid,
        index: index
      };
      this.data.isSending = true;
      $cache._$addItems({
        key: this.data.listKey,
        data: {
          instanceName: item.instanceName || '',
          klassName: item.klassName,
          specId: this.data.parentId
        },
        ext: _ext
      });
    },
    /**
     *
     * @param index 删除的项索引
     */
    remove: function (index) {
      this.supr(index);
    },

    validate: function (item) {
      return this.supr(item);
    }
  });
  return Cli;
});
