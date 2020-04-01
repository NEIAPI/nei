NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'css!./head.css',
  'text!./head.html'
], function (base, v, u, e, _, css, tpl) {
  e._$addStyle(css);
  var head = base.extend({
    name: 'res-header',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        list: [],
        highlight: {}
      });
      var arr = [];
      if (u._$isObject(this.data.list)) {
        for (k in this.data.list) {
          arr.push({key: k, value: this.data.list[k]});
        }
      }
      this.data.list = arr;
    },
    init: function () {
    },
    $highlight: function (items) {
      if (!items) return;
      items.forEach(function (item) {
        this.data.highlight[item.keys.slice(-1)[0]] = !0;
      }.bind(this));
      this.$update();
    },
    destroy: function () {
      this.supr();
    }
  });
  return head;
});
