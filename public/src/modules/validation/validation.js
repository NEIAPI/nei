NEJ.define([
  '/src/modules/component/base.js',
  'base/event',
  'base/util'
], function (b, v, u, pro) {
  var Base = b.Component;
  var Validation = Base.extend({
    name: 'validation',
    template: '{#inc this.$body}',
    config: function (data) {
      this.controls = [];
      u._$merge(data, {});
      this.supr();
    },
    init: function () {
      this.supr();
    },
    gatherData: function () {
      var result = {};
      this.controls.forEach(function (control) {
        var name = control.data.name;
        result[name] = control.data.value;
      });
      return result;
    },
    validate: function () {
      var pass = true;
      var inputData = this.gatherData();
      this.controls.forEach(function (control) {
        var result = control.validate({data: inputData});
        control.data.pass = result;
        if (!result) {
          pass = !1;
        }
      });
      return {
        data: inputData,
        pass: pass
      };
    },
    destroy: function () {
      this.supr();
    }

  });
  return Validation;
});
