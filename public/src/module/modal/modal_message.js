/*
 * 发送消息组件-------------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/common/util',
  'pro/modal/modal',
  'text!./modal_message.html',
  'css!./modal_message.css',
], function (e, v, u, _, Modal, tpl, css) {
  e._$addStyle(css);
  var modal = Modal.extend({
    config: function () {
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'title': '消息窗口',
        'closeButton': true,
        'placeholder': '请填写消息内容',
        'okButton': '发送',
        'cancelButton': true,
        inputError: false,
        inputName: '',
        description: '',
      });
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
    },
    ok: function () {
      this.$emit('ok', {
        message: this.data.message
      });

    },
    checkVal: function () {
      if (!!this.data.inputName.trim()) {
        this.data.inputError = false;
      } else {
        this.data.inputError = true;
      }
      this.$update();
    },
    destroy: function () {
      this.supr();
    }
  });
  return modal;
});
