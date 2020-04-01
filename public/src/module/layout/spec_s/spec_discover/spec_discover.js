NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module'
], function (_k, _e, _l, _j, _m, _p, _pro) {
  /**
   * 项目组树模块
   * @class   {wd.m._$$ModulespecDiscover}
   * @extends {nej.ut._$$AbstractModule}
   */
  _p._$$ModulespecDiscover = _k._$klass();
  _pro = _p._$$ModulespecDiscover._$extend(_m._$$Module);

  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-discover')
    );
  };

  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  // notify dispatcher
  _m._$regist(
    'spec-discover',
    _p._$$ModulespecDiscover
  );
});
