/*
 *  项目组同意操作组件-------------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/select2/select2',
  'pro/common/util',
  'text!./modal_agree.html',
  'css!./modal_agree.css'
], function (e, v, u, Modal, select2, _, tpl, css) {
  e._$addStyle(css);
  var modal = Modal.extend({
    config: function () {
      var that = this;
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'closeButton': true,
        'okButton': this.data.bottonText || '通过',
        'cancelButton': false,
        noScroll: true
      });
      this.data.class = this.data.class || 'm-modal-agree';
      this.data.title = this.data.title || '通过验证';
      this.data.source = this.data.source || [
          {name: '观察者', id: _.db.PRG_ROL_GUEST},
          {name: '管理员', id: _.db.PRG_ROL_ADMIN},
          {name: '开发者', id: _.db.PRG_ROL_DEVELOPER},
          {name: '测试者', id: _.db.PRG_ROL_TESTER}
        ];
      this.data.selected = this.data.selected || this.data.source[0];
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
    },
    ok: function () {
      this.$emit('ok', this.data.selected);
      this.destroy();
    },
    _change: function (option) {
      this.data.selected = option.selected;
    },
    destroy: function () {
      this.supr();
    }
  });
  return modal;
});
