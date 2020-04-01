/*
 * 更多操作菜单组件-------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/parameter_cache',
  'pro/common/regular/regular_base',
  'json!./menu.json',
  'text!./operate_menu.html'
], function (v, u, e, _, cache, Base, config, tpl) {

  var Menu = Base.extend({
    name: 'param-menu',
    template: tpl,
    config: function (data) {
      _._$extend(this.data, {
        format: 'haxi'
      });
      this.data.list = config[this.data.format];
      if (this.data.parentType == 0 || this.data.parentType == 1) {
        this.data.list = this.data.list.filter(function (item) {
          return item.action != 'modify';
        });
      }
      this.supr(this.data);
    },
    init: function () {
      this.supr();
    },
    select: function (action, format) {
      this.$emit('check', {
        action: action,
        format: format
      });
    }

  });
  return Menu;
});
