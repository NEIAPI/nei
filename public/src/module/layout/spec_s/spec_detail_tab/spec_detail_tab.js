NEJ.define([
  'base/klass',
  'base/element',
  'pro/tab/tab',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module'
], function (_k, _e, tab, _tpl, _jst, _m, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModulespecDetailTab}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModulespecDetailTab = _k._$klass();
  _pro = _p._$$ModulespecDetailTab._$extend(_m._$$Module);
  // 标签列表数据
  var xlist = [
    {type: 'doc', name: '规范文档'},
    {type: 'template', name: '工程结构'},
    {type: 'setting', name: '规范设置'},
    {type: 'history', name: '操作历史'}
  ];
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _tpl._$getTextTemplate('module-spec-detail-tab')
    );
    this.__tabWrap = _e._$getByClassName(this.__body, 'tab-wrap')[0];
  };
  /**
   * 显示模块
   * @param {Object} 配置参数
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.specId = _options.param.id;
    this.__createTab();
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    if (_options.param.id != this.specId) {
      this.specId = _options.param.id;
      this.__createTab();
    }
    this.__super(_options);
    this.__tbview._$match(
      this.__getPathFromUMI(_options)
    );
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__tbview && this.__tbview._$recycle();
    this.__tbview = null;
    this.__super();
  };
  /**
   * 验证选中项
   * @param  {Object} 事件信息
   * @return {Void}
   */
  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };
  /**
   * 创建tab
   * @retrun {Void}
   */
  _pro.__createTab = function () {
    _jst._$render(this.__tabWrap, 'module-spec-detail-tabs', {
      id: this.specId, // 规范id
      xlist: xlist
    });
    this.__tbview && this.__tbview._$recycle();
    this.__tbview = tab._$$ModuleTab._$allocate({
      tab: this.__tabWrap,
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
  };
  // notify dispatcher
  _m._$regist(
    'spec-detail-tab',
    _p._$$ModulespecDetailTab
  );
});
