/*
 *  弹窗基类组件-------------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/element',
  'text!./modal.html',
  'css!./modal.css'
], function (base, e, tpl, css, Modal) {
  // 加载一次即可
  e._$addStyle(css);

  Modal = base.extend({
    template: tpl,
    /**
     * @protected
     */
    config: function (data) {
      this.data.title = this.data.title || '提示';
      this.data.show = this.data.show || true;
      this.data.modalType = this.data.modalType;
      //设定modal的尺寸参数
      this.data.size = this.data.size || 'normal';
      this.data.noTitle = this.data.noTitle || false;
      if (this.data.okButton === undefined) {
        this.data.okButton = true;
      }
      if (this.data.cancelButton === undefined) {
        this.data.cancelButton = true;
      }
      this.supr(this.data);
    },
    /**
     * @protected
     */
    init: function () {
      this.supr();
      // 证明不是内嵌组件
      if (this.$root === this) {
        this.$inject(document.body);
      }
    },
    /**
     * @method close(result) 关闭模态对话框
     * @public
     * @param  {boolean} result 点击确定还是取消
     * @return {void}
     */
    close: function () {
      this.$emit('close');
      this.destroy();
    },
    /**
     * @override
     */
    ok: function () {
      this.$emit('ok');
      this.destroy();
    },
    /**
     * @override
     */
    cancel: function () {
      /**
       * @event cancel 取消对话框时触发
       */
      this.$emit('cancel');
      this.destroy();
    },

    hide: function () {
      this.data.show = false;
      this.$update();
    },

    show: function () {
      this.data.show = true;
      this.$update();
    },

    destroy: function () {
      this.supr();
    },

    _onclickBody: function ($event) {
      //$event.stopPropagation();
    }
  });


  /**
   * @method alert([content][,title]) 弹出一个alert对话框。关闭时始终触发确定事件。
   * @static
   * @param  {string=''} content 对话框内容
   * @param  {string='提示'} title 对话框标题
   * @return {void}
   */
  Modal.alert = function (option) {
    var modal = new Modal({
      data: {
        'class': 'm-modal-alert ' + (option.clazz || ''),
        contentTemplate: option.contentTemplate,
        content: option.content,
        modalType: 'alert',
        title: option.title || '',
        okButton: true,
        cancelButton: false,
        closeButton: true
      }
    });
    return modal;
  };

  /**
   * @method confirm([content][,title]) 弹出一个confirm对话框
   * @static
   * @param  {string=''} content 对话框内容
   * @param  {string='提示'} title 对话框标题
   * @return {void}
   */
  Modal.confirm = function (option) {
    var modal = new Modal({
      data: {
        'class': 'm-modal-confirm ' + (option.clazz || ''),
        contentTemplate: '<h3 class="message">' + option.content + '</h3>',
        confirmIcon: option.confirmIcon || false,
        content: option.content || '',
        modalType: 'confirm',
        title: option.title || '提示',
        closeButton: typeof option.closeButton === 'boolean' ? option.closeButton : true,
        okButton: true,
        cancelButton: true
      }
    });
    modal.$refs['ok-btn'].focus();
    return modal;
  };
  return Modal;
});
