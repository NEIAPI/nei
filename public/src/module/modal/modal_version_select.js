/**
 * 历史版本选择弹框
 * Created by hzyuyanan on 2017/6/21.
 */
NEJ.define([
  'base/element',
  'pro/common/util',
  'pro/modal/modal',
  'text!./modal_version_select.html',
  'css!./modal_version_select.css'
], function (_e, _cu, _modal, _html, _css) {
  _e._$addStyle(_css);

  var Modal = _modal.extend({
    config: function () {
      _cu._$extend(this.data, {
        contentTemplate: _html,
        class: 'm-modal-version-select',
        title: '版本选择',
        closeButton: false,
        okButton: true,
        cancelButton: true
      }, false);
      this.supr(this.data);
    },
    ok: function () {
      this.$emit('ok', this.data.selected);
      this.close();
    },
    select: function (index) {
      this.data.selected = this.data.versions[index].id;
    }

  });

  return Modal;
});
