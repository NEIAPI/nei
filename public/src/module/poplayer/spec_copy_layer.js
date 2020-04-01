/**
 * 规范复制弹窗控件
 */
NEJ.define([
  'base/element',
  'base/util',
  'pro/modal/modal',
  'text!./spec_copy_layer.html',
  'css!./spec_copy_layer.css'
], function (_e, _u, Modal, html, css) {
  _e._$addStyle(css);
  var copyLayer = Modal.extend({
    config: function () {
      this.data = _u._$merge({
        'contentTemplate': html,
        'class': 'm-spec-copy',
        'title': '复制规范',
        'closeButton': true,
        'okButton': true,
        'cancelButton': false,
        inputError: false,
        name: ''
      }, this.data);
      this.supr(this.data);
    },
    ok: function () {
      if (this.data.name) {
        this.$emit('copy', this.data.name);
      } else {
        this.showError();
      }
    },
    showError: function () {
      this.data.inputError = true;
    }
  });
  return copyLayer;
});
