/*
 * 用户信息组件-------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'text!./userinfo.html'
], function (base, v, u, e, _, tpl) {
  var ProcessList = base.extend({
    template: tpl,
    name: 'user-info',
    config: function () {
      _._$extend(this.data, {});
      this.supr();
    },
    init: function () {
      this.supr();
    },
    destroy: function () {
      this.supr();
    }
  }).filter({
    fixname: function (name) {
      return (name || '').slice(0, 1);
    }
  });
  return ProcessList;
});
