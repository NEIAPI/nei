NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/user_cache',
  'pro/common/util',
  'lib/base/util',
  'pro/tab/tab'
], function (_k, _e, _tpl, _jst, _m, _pgCache, _proCache, usrCache, _cu, _u, Tab, _p, _pro) {
  /**
   * 项目tab模块
   * @class   {wd.m._$$ModuleProGroupPTab}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupPTab = _k._$klass();
  _pro = _p._$$ModuleProGroupPTab._$extend(_m._$$Module);
  // 标签列表数据
  var xlist0 = [];
  //公共资源库，非观察者
  var xlist1 = [
    {type: 'res', name: '资源'},
    {type: 'tool', name: '设置'},
    {type: 'activity', name: '动态'}
  ];
  //非公共资源库，非观察者
  var xlist2 = [
    {type: 'res', name: '资源'},
    {type: 'page', name: '页面'},
    {type: 'tool', name: '设置'},
    {type: 'activity', name: '动态'}
  ];
  var xlist3 = [
    {type: 'res', name: '资源'},
    {type: 'page', name: '页面'},
    {type: 'tool', name: '工具'},
    {type: 'activity', name: '动态'}
  ];
  var xlist4 = [
    {type: 'res', name: '资源'},
    {type: 'activity', name: '动态'}
  ];
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _tpl._$getTextTemplate('module-progroup-p-tab')
    );
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            var xlist;
            var user = this.__pgCache._$getRole(this.__project.progroupId);
            var privilege = this.__pgCache._$getPrivilege(this.__project.progroupId);
            if (privilege.isOthers) {
              xlist = xlist0;
            } else if (privilege.isObserver) {
              if (this.__project.type == 1) {
                xlist = xlist4;
              } else {
                xlist = xlist3;
              }
            } else if (privilege.isAdminOrCreator) {
              if (this.__project.type == 1) {
                xlist = xlist1;
              } else {
                xlist = xlist2;
              }
            } else {
              if (this.__project.type == 1) {
                xlist = xlist1;
              } else {
                xlist = xlist3;
              }
            }
            _jst._$render(this.__tabWrap, 'module-progroup-p-tabs', {
              id: this.__pid, // 项目组的id
              xlist: xlist // 根据用户类型, 显示不同的tab
            });
            this.__initTab();
          }._$bind(this)
        });
        this.__pgCache._$getItem({
          id: this.__project.progroupId
        });
      }._$bind(this)
    });
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} _options - 配置信息
   */
  _pro.__onRefresh = function (_options) {
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__super(_options);
    this._options = _options;
    this.__tabWrap = _e._$getByClassName(this.__body, 'm-tab')[0];
    //发送请求
    this.__proCache._$getItem({
      id: this.__pid
    });
  };
  /**
   * 初始化tag
   */
  _pro.__initTab = function () {
    this.__tbview = Tab._$$ModuleTab._$allocate({
      tab: this.__tabWrap,
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
    this.__tbview._$match(
      this.__getPathFromUMI(this._options)
    );
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__tbview = this.__tbview._$recycle();
  };
  /**
   * 验证选中项
   * @param  {Object} 事件信息
   * @return {Void}
   */
  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };
  // notify dispatcher
  _m._$regist(
    'progroup-p-tab',
    _p._$$ModuleProGroupPTab
  );
});
