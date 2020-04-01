/*
 * @资源创建基类
 */
NEJ.define([
  'base/klass',
  'base/element',
  'pro/common/module',
  'pro/modal/modal'
], function (_k, e, _m, modal, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleResCreate}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResBase = _k._$klass();
  _pro = _p._$$ModuleResBase._$extend(_m._$$Module);

  /**
   * 隐藏前事件
   * @param  {Objec} event
   * @return {Void}
   */
  _pro.__onBeforeHide = function (event) {
    // if (!this.__submit && !this.__isSubmitting &&
    //   JSON.stringify(this.__getSubmitOptions()) !== this.__initialData) {
    //   this.__stop(event);
    //   this.__leaveLayer = modal.confirm({
    //     "content": "您确定要离开创建页面吗？未保存数据将不会为您保存。",
    //     'title': '离开此页确认',
    //     'closeButton': true,
    //     "okButton": '离开',
    //     "cancelButton": true
    //   }).$on('ok', function () {
    //     this.__leaveLayer = this.__leaveLayer.destroy();
    //     this.__leaveLayer = null;
    //     this.__dispatcher._$redirect(
    //       event.target.href, {
    //         exitable: !0
    //       }
    //     );
    //   }.bind(this));
    // }
  };

  /**
   * 禁用或恢复按钮
   * @param  {Node} btn
   * @param  {String} text - 设置按钮文本
   * @param  {Boolean} disable - 是否禁用按钮
   * @return {Void}
   */
  _pro.__disableBtn = function (btn, text, disable) {
    btn.innerText = text;
    if (disable) {
      e._$addClassName(btn, 'u-btn-disabled');
      e._$attr(btn, 'disabled', 'disabled');
    } else {
      e._$delClassName(btn, 'u-btn-disabled');
      btn.removeAttribute('disabled');
    }
  };
});
