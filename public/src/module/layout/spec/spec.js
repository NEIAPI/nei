NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'pro/common/module'
], function (_k, _e, _l, _m, _p, _pro) {
  /**
   * 项目模块基类对象
   * @class   {wd.m._$$ModuleLayoutSpec}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleLayoutSpec = _k._$klass();
  _pro = _p._$$ModuleLayoutSpec._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-spec')
    );
    this.__export = {
      //tree: _e._$getByClassName(this.__body, 'tree-wrap')[0],
      tab: _e._$getByClassName(this.__body, 'tab-wrap')[0],
      parent: _e._$getByClassName(this.__body, 'con-wrap')[0]
    };
  };
  /**
   * 显示模块
   * @param {Object} 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_option) {
    this.__super(_option);
  };


  // notify dispatcher
  _m._$regist(
    'layout-spec',
    _p._$$ModuleLayoutSpec
  );
});
