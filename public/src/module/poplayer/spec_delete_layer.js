/**
 * 规范删除弹窗控件
 */
NEJ.define([
  'pro/modal/modal',
  'pro/common/util',
  'text!./spec_delete_layer.html'
], function (Modal, _, _html) {
  var deleteLayer = Modal.extend({
    config: function () {
      this.data.inputError = false;
      _._$extend(this.data, {
        'contentTemplate': _html,
        'class': 'm-spec-delete',
        'title': '删除规范确认',
        'closeButton': true,
        'okButton': '删除',
        'cancelButton': false
      });
      this.supr(this.data);
    },
    ok: function () {
      if (this.data.name == this.data.inputName) {
        this.$emit('delete', this.data.id);
      } else {
        this.showError();
      }
    },
    showError: function () {
      this.data.inputError = true;
    }
  });
  return deleteLayer;
});
