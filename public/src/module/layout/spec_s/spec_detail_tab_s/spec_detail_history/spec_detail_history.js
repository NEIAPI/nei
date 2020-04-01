NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/activitylist/activitylist'
], function (_k, _e, _t, _l, _m, _al, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModulespecDetailHistory}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModulespecDetailHistory = _k._$klass();
  _pro = _p._$$ModulespecDetailHistory._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-detail-history')
    );
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var id = _options.param.id;
    this.__actList = _al._$$ModuleActivityList._$allocate({
      id: id,
      parent: this.__body,
      key: 'activities-specs'
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__actList && this.__actList._$recycle();
    this.__actList = null;
    this.__super();
  };
  // notify dispatcher
  _m._$regist(
    'spec-detail-history',
    _p._$$ModulespecDetailHistory
  );
});
