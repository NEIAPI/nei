NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'util/ajax/xdr',
  '/src/modules/component/base.js',
  '/src/modules/extend/util.js',
  '/src/modules/validation/validation.js',
  'text!./input3.html'
], function (v, u, e, j, b, _, Validation, tpl, pro) {
  var Base = b.Component;
  var Input3 = Base.extend({
    name: 'input3',
    template: tpl,
    config: function (data) {
      u._$merge(data, {
        pass: true,
        value: '',
        placeholder: data.rules.placeholder
      });
      this.supr();
      var $outer = this.$outer;

      if ($outer && $outer instanceof Validation) {
        $outer.controls.push(this);
      }
      if (this.data.verify) {
        this.__intervalTime = this.data.verify.time;
      }
    },
    init: function () {
      var dom = Regular.dom;
      if (this.$outer && this.$outer.controls.length == 1) {
        var input = e._$getByClassName(dom.element(this, true)[1], 'u-input')[0];
        setTimeout(function () {
          input.focus();
        }, 0);
      }
    },
    countDown: function () {
      var that = this;
      if (that.__intervalTime == 0) {
        that.data.verify.content = '重新发送';
        that.data.verify.isSending = false;
        that.__intervalTime = that.data.verify.time;
      } else {
        that.__intervalTime--;
        that.data.verify.content = that.__intervalTime + '秒后重发';
        that.data.verify.isSending = true;
        that.__interval = setTimeout(that.countDown._$bind(that), 1000);
      }
      that.$update();
    },
    sendCode: function () {
      //if(this.data.value == "" ) return;
      var node = document.activeElement;
      if (node) {
        node.focus();
        v._$stop(event);
      }
      var that = this;
      var _opt = {
        method: 'post',
        data: that.data.verify.info,
        type: 'json',
        onload: function () {

        }
      };
      j._$request(this.data.verify.url, _opt);
      that.countDown();
    },
    stopCountDown: function (options) {
      clearInterval(this.__interval);
      this.data.verify.content = '重新发送';
      this.data.verify.isSending = false;
      this.__intervalTime = this.data.verify.time;
      if (options && options.tip) {
        this.data.pass = false;
        this.data.tip = options.tip;
      }
    },
    blur: function () {
      this.validate();
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
      [this.data.rules].forEach(function (item) {
        if (typeof item.reg === 'function') {
          item.pass = !!item.reg(_value, globalData);
        } else {
          item.pass = item.reg.test(_value);
        }
        if (!item.pass) {
          pass = !1;
        }
      });
      this.data.pass = pass;
      return pass;
    },
    _listenKeydown: function (event) {
      event.event.witch = event.event.witch || event.event.keyCode;
      if (event.event.witch == 13) {
        event.event.preventDefault();
        this.$emit('enter');
      }
    }

  }).filter({
    'accessInfo': function (info) {
      if (!info) return;
      if (info.phone) return info.phone;
      if (info.email) return info.email;
    }
  });
  return Input3;
});
