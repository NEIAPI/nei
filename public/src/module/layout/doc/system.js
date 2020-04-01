NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'pro/common/module'
], function (_k, _e, tpl, module, cache, _p, _pro) {
  _p._$$ModuleLayoutSystem = _k._$klass();
  _pro = _p._$$ModuleLayoutSystem._$extend(module._$$Module);
  /**
   * 解析模块所在容器节点
   * @param  {Object} 配置信息
   * @return {Node}   模块所在容器节点
   */
  _pro.__doParseParent = function (_options) {
    return _e._$get('doc');
  };

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      tpl._$getTextTemplate('layout-system')
    );
    this.__export = {
      parent: _e._$getByClassName(this.__body, 'container')[0]
    };
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };


  module._$regist(
    'layout-system',
    _p._$$ModuleLayoutSystem
  );
});
