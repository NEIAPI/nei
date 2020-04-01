/**
 * index 官网主页模块
 */
NEJ.define([
  'base/klass',
  'util/ajax/xdr',
  '/src/modules/module.js',
  'lib/base/element',
  'lib/base/event',
  'pro/modal/modal',
  'pro/modal/site/modal_interface/modal_interface',
  'pro/modal/site/modal_mock/modal_mock',
  'pro/modal/site/modal_test/modal_test',
  'pro/modal/site/modal_cooperation/modal_cooperation',
  'pro/modal/site/modal_spec/modal_spec',
  'pro/modal/site/modal_tool/modal_tool',
], function (k, xhr, m, e, v, _Modal, _modalInterface, _modalMock, _modalTest, _modalCooperation, _modalSpec, _modalTool, p, pro) {
  /**
   * 页面模块实现类
   *
   * @class   _$$Module
   * @extends pro/widget/module._$$Module
   * @param  {Object} options - 模块输入参数
   */
  p._$$Module = k._$klass();
  pro = p._$$Module._$extend(m._$$Module);
  /**
   * 模块初始化
   * @private
   * @param  {Object} options - 输入参数信息
   * @return {Void}
   */
  pro.__init = function (options) {
    this.__super(options);
    this.__eTest = e._$getByClassName(document, 'm-test')[0];
    this.__eInterface = e._$getByClassName(document, 'm-interface')[0];
    this.__eMock = e._$getByClassName(document, 'm-mock')[0];
    this.__eCooperation = e._$getByClassName(document, 'm-cooperation')[0];
    this.__eSpec = e._$getByClassName(document, 'm-spec')[0];
    this.__eTool = e._$getByClassName(document, 'm-tool')[0];
  };
  /**
   * 模块重置逻辑
   * @private
   * @param  {Object} options - 输入参数信息
   * @return {Void}
   */
  pro.__reset = function (options) {
    this.__super(options);
    var comp0nents = [this.__eInterface, this.__eMock, this.__eTest, this.__eCooperation, this.__eSpec, this.__eTool];
    var modals = [_modalInterface, _modalMock, _modalTest, _modalCooperation, _modalSpec, _modalTool];
    comp0nents.forEach(function (node, index) {
      var txtArea = e._$getByClassName(node, 'u-pic')[0];
      v._$addEvent(txtArea, 'click', function () {
        new (modals[index])();
      });
    });
    var localstorageKey = 'nei_mockstore_call_times';
    var clock = new FlipClock(jQuery('.flip-clock-container'), window.localStorage[localstorageKey], {
      clockFace: 'Counter'
    });

    function reqCallTimes() {
      xhr._$request('/api/apimock/calltimes', {
        type: 'json',
        timeout: 1000000,
        method: 'GET',
        onload: function (data) {
          window.localStorage[localstorageKey] = data.result;
          clock.setValue(data.result);
          setTimeout(reqCallTimes, 5000);
        }
      });
    }

    reqCallTimes();
  };
  /**
   * 模块销毁逻辑
   * @private
   * @return {Void}
   */
  pro.__destroy = function () {
    this.__super();
  };
});
