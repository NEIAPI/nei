NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/activitylist/activitylist'
], function (_k, _e, _t, _l, _m, _a, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModuleProGroupActivities}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupActivities = _k._$klass();
  _pro = _p._$$ModuleProGroupActivities._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-activity')
    );
    this.__sbody = document.getElementsByClassName('con-wrap')[1];
  };
  /**
   * 显示模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__activityList && this.__activityList._$recycle();
    this.__activityList = _a._$$ModuleActivityList._$allocate({
      parent: this.__body,
      key: 'activities-progroups-all',
      sbody: this.__sbody
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__activityList && this.__activityList._$recycle();
    this.__activityList = null;
    this.__super();
  };
  // notify dispatcher
  _m._$regist(
    'progroup-activity',
    _p._$$ModuleProGroupActivities
  );
});
