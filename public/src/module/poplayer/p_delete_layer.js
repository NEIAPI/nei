/**
 * 项目/项目组删除弹窗控件
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'pro/modal/modal',
  'pro/common/util',
  'text!./pg_delete_layer.html',
  'text!./pro_delete_layer.html',
  'css!./p_delete_layer.css'
], function (_e, _v, _u, _l, _Modal, _, _pgHtml, _proHtml, _css) {
  _e._$addStyle(_css);
  var deleteLayer = _Modal.extend({
    config: function () {
      this.inputError = false;
      this.data.inputName = '';
      var _template;
      switch (this.data.type) {
        case 'progroup':
          this.data.title = '删除项目组确认';
          _template = _pgHtml;
          break;
        case 'project':
          this.data.title = '删除项目确认';
          _template = _proHtml;
          break;
      }
      _._$extend(this.data, {
        'contentTemplate': _template,
        'class': 'm-p-delete',
        'title': this.data.title,
        'closeButton': true,
        'okButton': '删除',
        'cancelButton': false,
      });
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
    },
    ok: function () {
      if (!!this.data.inputName.trim() && this.data.name == this.data.inputName) {
        this.$emit('onOk', this.data.id);
      } else {
        this.data.inputError = true;
        this.$update();
      }
    },
    checkVal: function () {
      if (!!this.data.inputName.trim()) {
        this.data.inputError = false;
      }
      this.$update();
    }
  });
  return deleteLayer;
});
