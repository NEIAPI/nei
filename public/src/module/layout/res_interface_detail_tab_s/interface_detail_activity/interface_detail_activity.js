NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'util/event/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/cache/interface_cache',
  'pro/activitylist/activitylist'
], function (_k, u, _e, c, _t, _l, _j, _m, cache, _aList, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleInterfaceDetailActivity}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleInterfaceDetailActivity = _k._$klass();
  _pro = _p._$$ModuleInterfaceDetailActivity._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-interface-detail-activity')
    );
    this.__cache = cache._$$CacheInterface._$allocate({
      onitemload: function () {
        this.__interface = this.__cache._$getItemInCache(this.__id);
        this.__aList = _aList._$$ModuleActivityList._$allocate({
          parent: this.__body,
          key: 'activities-interfaces',
          id: this.__id,
          count: 1
        });
      }._$bind(this)
    });
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__id = _options.param.id.replace('/', '');
    this.__super(_options);
    this.__cache._$getItem({
      id: this.__id
    });
  };

  _pro.__onHide = function () {
    this.__aList && (this.__aList = this.__aList._$recycle());
    this.__super();
  };

  // notify dispatcher
  _m._$regist(
    'interface-detail-activity',
    _p._$$ModuleInterfaceDetailActivity
  );
});
