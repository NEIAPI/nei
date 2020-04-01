/*
 *  项目组拒绝操作组件-------------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/select2/select2',
  'pro/common/util',
  'text!./modal_reject.html',
  'css!./modal_reject.css'
], function (e, v, u, Modal, select2, _, tpl, css) {
  e._$addStyle(css);
  var modal = Modal.extend({
    config: function () {
      var that = this;
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-modal-reject',
        'title': '拒绝通过',
        'closeButton': true,
        'okButton': '拒绝',
        'cancelButton': false,
        message: ''
      });
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
    },
    ok: function () {
      this.$emit('ok', {message: this.data.message});
      this.destroy();
    },
    destroy: function () {
      this.supr();
    }
  });
  return modal;
});
