/**
 * 申请项目组弹窗控件
 */
NEJ.define([
  'pro/modal/modal',
  'pro/common/util',
  'base/element',
  'text!./p_apply_layer.html',
  'css!./p_apply_layer.css'
], function (Modal, _, _e, _html, _css) {
  _e._$addStyle(_css);
  var applyLayer = Modal.extend({
    config: function () {
      this.data.description = '';
      this.data.textareaeError = false;
      _._$extend(this.data, {
        'contentTemplate': _html,
        'class': 'm-p-apply',
        'title': '申请项目组权限',
        'closeButton': true,
        'okButton': '申请',
        'cancelButton': false
      });
      this.supr(this.data);
    },
    ok: function () {
      var desc = this.data.description.trim();
      if (desc) {
        this.$emit('apply', desc, this.data.resId);
        this.destroy();
      } else {
        this.data.textareaeError = true;
        this.$update();
      }
    },
    checkVal: function () {
      if (!!this.data.description.trim()) {
        this.data.textareaeError = false;
      }
      this.$update();
    }
  });
  return applyLayer;
});
