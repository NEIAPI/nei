/**
 * 资源列表弹窗
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/modal/modal',
  'pro/stripedlist/stripedlist',
  'text!./modal_res_list.html',
  'css!./modal_res_list.css'
], function (_v, _u, _e, _cu, _modal, _stripedList, tpl, css) {
  _e._$addStyle(css);

  var Modal = _modal.extend({
    config: function () {
      _cu._$extend(this.data, {
        contentTemplate: tpl,
        class: 'm-modal-res-list',
        title: '资源编辑',
        closeButton: true,
        okButton: false,
        cancelButton: false
      }, false);
      this.supr(this.data);
    },
    init: function () {
      this.data.listOption.parent = Regular.dom.element(this).getElementsByClassName('list-content')[0];
      this.stripedList = _stripedList._$$ModuleStripedList._$allocate(this.data.listOption);
      this.supr(this.data);
    },

    redirectAction: function (evt) {
      var anchorElem = _v._$getElement(evt, 'c:stateful');
      if (anchorElem && anchorElem.target !== '_blank') {
        this.destroy();
      }
    },

    destroy: function () {
      this.stripedList._$recycle();
      delete this.stripedList;
      this.supr();
    }
  });

  return Modal;
});
