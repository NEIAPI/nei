NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  '/src/modules/component/base.js',
  '/src/modules/validation/validation.js',
  'text!./input2.html'
], function (v, u, e, b, Validation, tpl, pro) {
  var Base = b.Component;
  var defautConfig = {
    value: '',
    rules: [],
    isFoucs: false,
    pass: true
  };
  var Input2 = Base.extend({
    name: 'input2',
    template: tpl,
    config: function (data) {
      this.data = Object.assign({}, defautConfig, data);
      this.supr();
      var $outer = this.$outer;
      if ($outer && $outer instanceof Validation) {
        $outer.controls.push(this);
      }
    },
    init: function () {
      this.supr();
    },
    blur: function () {
      this.data.isFoucs = false;
      this.data.pass = this.validate();
    },
    focus: function () {
      this.data.isFoucs = true;
      this.data.pass = this.validate();
    },
    gatherData: function () {
      var result = {};
      this.$outer.controls.forEach(function (control) {
        var name = control.data.name;
        result[name] = control.data.value;
      });
      return result;
    },
    validate: function (context) {
      context = context || {data: this.gatherData()};
      var pass = true;
      var _value = this.data.value;
      var globalData = context.data;
      this.data.rules.forEach(function (item) {
        if (typeof item.reg === 'function') {
          item.pass = !!item.reg(_value, globalData);
        } else {
          item.pass = item.reg.test(_value);
        }
        if (!item.pass) {
          pass = false;
        }
      });
      return pass;
    }
  });

  return Input2;
});
