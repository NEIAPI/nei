NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/cache/pro_cache',
  'util/tab/view',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _e, _tpl, _jst, _m, _proCache, Tab, db, _p, _pro) {

  _p._$$ModuleResTab = _k._$klass();
  _pro = _p._$$ModuleResTab._$extend(_m._$$Module);
  // 标签列表数据
  var tabList = [
    {type: 'interface', name: 'HTTP 接口'},
    {type: 'rpc', name: 'RPC 接口'},
    {type: 'datatype', name: '数据模型'},
    {type: 'constraint', name: '规则函数'},
    {type: 'word', name: '参数字典'},
    {type: 'template', name: '页面模板'},
    {type: 'client', name: '客户端'},
    {type: 'group', name: '业务分组'},
  ];
  var tabListInCommonProject = [
    {type: 'interface', name: 'HTTP 接口'},
    {type: 'datatype', name: '数据模型'},
    {type: 'constraint', name: '规则函数'},
    {type: 'word', name: '参数字典'}
  ];

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _tpl._$getTextTemplate('module-res-tab')
    );
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        var xlist = this.__project.type == db.PRO_TYP_COMMON ?
          tabListInCommonProject : tabList;
        _jst._$render(this.__tabWrap, 'module-res-tabs', {
          id: this.__pid,
          xlist: xlist
        });
        this.__tabList = _e._$getByClassName(this.__tabWrap, 'tab');
        this.__initTab();
      }.bind(this)
    });
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__pid = _options.param.pid.replace('/', '');
    this.__tabWrap = _e._$getByClassName(this.__body, 'm-tab-sub')[0];

    this._options = _options;
    this.__super(_options);
    this.__proCache._$getItem({
      id: this.__pid
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    if (this.__tbview) {
      this.__tbview = this.__tbview._$recycle();
    }
  };

  _pro.__initTab = function () {
    this.__tbview = Tab._$$TabView._$allocate({
      list: this.__tabList,
      oncheck: this.__doCheckMatchEQ.bind(this)
    });
    this.__tbview._$match(
      this.__getPathFromUMI(this._options)
    );
  };

  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) === 0;
  };

  _m._$regist(
    'res-tab',
    _p._$$ModuleResTab
  );
});
