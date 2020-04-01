/*
 * @desc 测试tab基类
 */
NEJ.define([
  'base/klass',
  'base/element',
  'pro/common/module',
  'pro/modal/modal',
  'pro/cache/progroup_interface_cache'
], function (_k, _e, _m, modal, _infCache, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleResCreate}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleTestTabBase = _k._$klass();
  _pro = _p._$$ModuleTestTabBase._$extend(_m._$$Module);

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
      _e._$addClassName(btn, 'u-btn-disabled');
      _e._$attr(btn, 'disabled', 'disabled');
    } else {
      _e._$delClassName(btn, 'u-btn-disabled');
      btn.removeAttribute('disabled');
    }
  };

  /**
   * 隐藏前事件
   * @param  {Object} evt
   * @return {Void}
   */
  _pro.__onBeforeHide = function (evt) {
    var isTestModule = this.__getPathFromUMI({
        basePath: evt.target.path
      }).indexOf('/test/') === 0;
    if (!isTestModule && _infCache._$getModifiedStatus()) {
      this.__stop(evt);
      this.__leaveLayer = modal.confirm({
        'content': '您确定要离开接口测试页面吗？未保存数据将不会为您保存。',
        'title': '离开此页确认',
        'closeButton': true,
        'okButton': '离开',
        'cancelButton': true
      }).$on('ok', function () {
        this.__leaveLayer.destroy();
        delete this.__leaveLayer;
        this.__dispatcher._$redirect(
          evt.target.href, {
            exitable: !0
          }
        );
      }.bind(this));
    }
  };
});
