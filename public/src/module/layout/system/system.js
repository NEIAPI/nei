NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'pro/common/module',
  'pro/action_manager/action_manager',
  'pro/cache/user_cache'
], function (_k, _e, _l, _m, am, userCache, _p, _pro) {

  _p._$$ModuleLayoutSystem = _k._$klass();
  _pro = _p._$$ModuleLayoutSystem._$extend(_m._$$Module);
  /**
   * 解析模块所在容器节点
   * @param  {Object} 配置信息
   * @return {Node}   模块所在容器节点
   */
  _pro.__doParseParent = function (_options) {
    return _e._$get('g-bd');
  };

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-system')
    );
    this.__export = {
      tab: _e._$getByClassName(this.__body, 'm-l')[0],
      parent: _e._$getByClassName(this.__body, 'm-r')[0]
    };
    // 初始化 userCache
    userCache._$$CacheUser._$allocate();
  };

  _m._$regist(
    'layout-system',
    _p._$$ModuleLayoutSystem
  );
});
