/**
 * 弹窗控件封装文件
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'ui/layer/wrapper/window',
  'text!./poplayer.css'
], function (_k, _e, _v, _u, _l, _w, _css, _p, _pro) {
  _p._$$Poplayer = _k._$klass();
  _pro = _p._$$Poplayer._$extend(_w._$$WindowWrapper);
  var _seed_css = _e._$pushCSSText(_css);
  /**
   * 初始化控件
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__init = function (_options) {
    this.__super(_options);
  };
  /**
   * 初始化外观
   * @return {Void}
   */
  _pro.__initXGui = function () {
    this.__seed_css = _seed_css;
  };
  /**
   * 控件重置
   * @param  {Object} options 配置信息
   * @return {Void}
   */
  _pro.__reset = function (_options) {
    _options.parent = _options.parent || document.body;
    if (!!_options.clazz) {
      _options.clazz = _options.clazz + ' m-poplayer';
    } else {
      _options.clazz = 'm-poplayer';
    }
    _options.mask = 'm-poplayer-mask';
    _options.title = ' ';
    _options.draggable = true;
    this.__supReset(_options);
    this.cancelFunction = _options.onCancel;
    var confirmBtn = _e._$getByClassName(this.__body, 'j-confirm')[0];
    var closeBtn = _e._$getByClassName(document.body, 'zcls')[0];
    var cancelBtn = _e._$getByClassName(this.__body, 'j-cancel')[0];
    if (!!confirmBtn) {
      _v._$addEvent(confirmBtn, 'click', this.__confirm._$bind(this));
    }
    if (!!closeBtn) {
      _v._$clearEvent(closeBtn, 'mouseDown');
      _v._$addEvent(closeBtn, 'mouseUp', this.__cancel._$bind(this));
    }
    if (!!cancelBtn) {
      _v._$addEvent(cancelBtn, 'click', this.__cancel._$bind(this));
    }
  };
  /**
   * 点击确认按钮事件
   * @return {Void}
   */
  _pro.__confirm = function () {
    this._$dispatchEvent('onOk');
  };
  /**
   * 点击取消事件
   * @return {Void}
   */
  _pro.__cancel = function (event) {
    if (event.button == 2) {
      return;
    }
    if (this.cancelFunction) {
      this._$dispatchEvent('onCancel');
    }
    this._$hide();
  };
});
