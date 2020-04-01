/*
 * 参数编辑器-命令行规则组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/cliarg_cache',
  'pro/params_preview/params_origin',
  'pro/select2/select2',
  'text!./params_cli.html'
], function (v, u, e, _, cache, Origin, Select2, tpl) {
  var Cli = Origin.extend({
    name: 'cliPreview',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        verifyName: 'key'
      });
      this.data.params = this.data.params.slice(0);
      this.supr(this.data);
    },
    add: function (option) {
      this.data.params.push(option || {
          isAdding: true,
          key: '',
          value: ''
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
      var $cache = this._getCacheInstance('cliArg');
      var _ext = {
        cache: 'cliArg',
        uuid: this.data.uuid,
        index: index
      };
      this.data.isSending = true;
      $cache._$addItems({
        key: this.data.listKey,
        data: {
          key: item.key || '',
          value: item.value,
          projectId: this.data.pid,
          type: this.data.specType
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
