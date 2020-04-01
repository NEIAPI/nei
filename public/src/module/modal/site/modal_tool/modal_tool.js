NEJ.define([
  'base/element',
  'pro/modal/modal',
  'text!./modal_tool.html',
  'css!../modal_site.css'
], function (e, Modal, tpl, css) {
  e._$addStyle(css);
  var modal = Modal.extend({
    config: function () {
      Object.assign(this.data, {
        'contentTemplate': tpl,
        'cancelButton': false,
        'okButton': false,
        'closeButton': true,
        'title': '构建工具',
        'class': 'tool m-know-more'
      });
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
    }
  });
  return modal;
});
