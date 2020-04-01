NEJ.define([
  'base/element',
  'pro/modal/modal',
  'text!./modal_spec.html',
  'css!../modal_site.css'
], function (e, Modal, tpl, css) {
  var modal = Modal.extend({
    config: function () {
      Object.assign(this.data, {
        'contentTemplate': tpl,
        'cancelButton': false,
        'okButton': false,
        'closeButton': true,
        'title': '工程规范',
        'class': 'spec m-know-more'
      });
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
    }
  });
  return modal;
});
