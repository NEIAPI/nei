/**
 * 资源批量设置状态
 */
NEJ.define([
  'base/element',
  'base/util',
  'pro/modal/modal',
  'pro/select2/select2',
  'text!./res_state.html',
  'css!./res_state.css'
], function (_e, _u, modal, select2, html, css) {
  _e._$addStyle(css);
  var resState = modal.extend({
    name: 'resState',
    config: function (data) {
      this.data = _u._$merge({
        'contentTemplate': html,
        'class': 'm-modal-res-group',
        'closeButton': true,
        'okButton': '确定',
        'cancelButton': '取消',
        'noScroll': true,
        title: '设置状态',
        hasCreate: false,
        ids: [],
      }, data);
      this.listCacheKey = this.data.cache._$getListKey(this.data.pid);
      this.supr(data);
    },
    destroy: function () { //销毁时隐藏新建业务分组模块
      this.supr();
    },
    ok: function () { //确定
      this.$emit('ok', {
        ids: this.data.ids,
        statusId: this.data.state
      });
      this.destroy();
    },
    setState: function (event) { //选择分组
      this.data.state = event.selected.id;
    }
  });
  return resState;
});
