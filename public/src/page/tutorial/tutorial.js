/**
 * 官网视频页面
 */
NEJ.define([
  'base/klass',
  '/src/modules/module.js',
  'lib/base/element',
  'lib/base/event'
], function (k, m, e, v, p, pro) {
  /**
   * 页面模块实现类
   *
   * @class   _$$Module
   * @extends pro/widget/module._$$Module
   * @param  {Object} options - 模块输入参数
   */
  p._$$Module = k._$klass();
  pro = p._$$Module._$extend(m._$$Module);

  pro.__getQueryString = function (name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
  };
  /**
   * 模块初始化
   * @private
   * @param  {Object} options - 输入参数信息
   * @return {Void}
   */
  pro.__init = function (options) {
    this.__super(options);
    this.__interface = e._$getByClassName(document, 'interface')[0];
    this.__spec = e._$getByClassName(document, 'spec')[0];
    this.__test = e._$getByClassName(document, 'test')[0];
    this.__mock = e._$getByClassName(document, 'mock')[0];
    this.__cooperation = e._$getByClassName(document, 'cooperation')[0];
    this.__audit = e._$getByClassName(document, 'audit')[0];
    this.__changeConfirm = e._$getByClassName(document, 'changeconfirm')[0];
    this.__tool = e._$getByClassName(document, 'tool')[0];
    this.__btnMap = {
      'interface': this.__interface,
      'spec': this.__spec,
      'test': this.__test,
      'mock': this.__mock,
      'tool': this.__tool,
      'cooperation': this.__cooperation,
      'audit': this.__audit,
      'changeconfirm': this.__changeConfirm
    };

    this.__resMap = {
      'interface': 'https://neires.nos-eastchina1.126.net/interface_spec.mp4',
      'spec': 'https://neires.nos-eastchina1.126.net/spec.mp4',
      'test': 'https://neires.nos-eastchina1.126.net/interface_test.mp4',
      'mock': 'https://neires.nos-eastchina1.126.net/interface_mock.mp4',
      'tool': 'https://neires.nos-eastchina1.126.net/toolkit.mp4',
      'cooperation': 'https://neires.nos-eastchina1.126.net/cooperation.mp4',
      'audit': 'https://neires.nos-eastchina1.126.net/interface_audit.mp4',
      'changeconfirm': 'https://neires.nos-eastchina1.126.net/interface_change_confirm.mp4'
    };
    this.__video = e._$getByClassName(document, 'video')[0];
    v._$addEvent(document, 'click', function (evt) {
      var node = v._$getElement(evt, 'd:click');
      if (!node) return;
      var type = e._$dataset(node, 'click');
      this.__pageChange(type);

    }.bind(this));
  };
  /**
   * 模块重置逻辑
   * @private
   * @param  {Object} options - 输入参数信息
   * @return {Void}
   */
  pro.__reset = function (options) {
    this.__super(options);
    var res = window.location.hash;
    res = res.replace('#', '');
    if (!res) {
      res = 'interface';
    }
    this.__pageChange(res);

  };

  pro.__pageChange = function (res) {
    for (var btn in this.__btnMap) {
      e._$delClassName(this.__btnMap[btn], 'active');
    }
    var currentBtn = this.__btnMap[res];
    e._$addClassName(currentBtn, 'active');

    var videoUrl = this.__resMap[res];
    this.__video.src = videoUrl;
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
