/**
 * 资源变更确认记录列表弹窗
 */
NEJ.define([
  'base/element',
  'pro/common/util',
  'pro/modal/modal',
  'util/template/jst',
  'util/list/waterfall',
  'text!./change_confirm_log.html',
  'text!./change_confirm_log_list.html',
  'css!./change_confirm_log.css',
  'pro/cache/config_caches'
], function (_e, _cu, _modal, jst, waterfall, html, listHtml, css, caches) {
  _e._$addStyle(css);
  var Modal = _modal.extend({
    config: function () {
      _cu._$extend(this.data, {
        contentTemplate: html,
        class: 'm-modal-change-confirm-log',
        title: '变更确认记录',
        closeButton: true,
        okButton: false,
        cancelButton: false
      }, false);
      this.supr(this.data);
    },
    init: function () {
      var opt = {
        limit: 10,
        // scroll body, 滚动条所在容器，支持 onscroll 事件
        sbody: this.$refs.log,
        parent: this.$refs.list,
        delta: 320,
        item: jst._$add(listHtml),
        cache: {
          lkey: 'notification-res-changeconfirmlog-' + this.data.type + '-' + this.data.id,
          klass: caches.notification,
          data: {
            id: this.data.id,
            type: this.data.type
          },
          clear: true
        },
        onafterlistload: function (evt) {
          this.data.hideLoading = true;
          this.$update();
        }.bind(this)
      };
      waterfall._$$ListModuleWF._$allocate(opt);
      this.supr();
    },
    ok: function () {
      this.$emit('ok', this.data.selected);
      this.close();
    }
  });

  return Modal;
});
