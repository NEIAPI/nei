NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/common/regular/regular_project',
  'pro/cardlist/cardlist'
], function (_k, _e, _t, _l, _m, _pgCache, _proCache, _r, cardlist, _p, _pro) {
  /**
   * 项目组详情项目(非管理员)模块
   * @class   {wd.m._$$ModuleProGroupDetailP}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupDetailP = _k._$klass();
  _pro = _p._$$ModuleProGroupDetailP._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-d-p')
    );
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];

  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
      onitemload: function (result) {
        var progroup = this.__pgCache._$getItemInCache(this.__pgid);
        var pros = progroup.projects;
        if (this.__projectsList) {
          this.__projectsList.destroy();
        }
        this.__projectsList = new ProjectsList({
          data: {
            projects: pros,
            progroup: progroup,
            privilege: this.__pgCache._$getPrivilege(this.__pgid)
          }
        }).$inject(this.__body);

        //删除加载中提示，显示内容
        _e._$addClassName(this.__loading, 'f-dn');
        _e._$delClassName(this.__body, 'f-dn');
      }._$bind(this)

    });
    var ProjectsList = this._initList();

    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__pgid = _options.param.pgid;
    this.__pgCache._$getItem({id: this.__pgid});
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__pgCache && this.__pgCache._$recycle();
    this.__projectsList && this.__projectsList.destroy();
    this.__super();
  };
  /**
   * 初始化项目列表组件
   * @return {Object} 组件对象
   */
  _pro._initList = function () {
    var projectsList = _r.extend({
      template: _l._$getTextTemplate('projects-list'),
      config: function (data) {
        var _this = this;
        this.supr(data);
        data.cardListOptions = {
          isAllocateByTag: true,
          resType: 1,
          addable: false,
          sortable: false,
          hasStickList: true,
          hasQuickEntrence: true,
          entranceList: [{name: '页面', type: 'page'}, {name: '接口', type: 'interface'}, {
            name: '模型',
            type: 'datatype'
          },
            {name: '模板', type: 'template'}, {name: '规则', type: 'constraint'}, {name: '分组', type: 'group'}],
          entranceHiddenlist: []
        };
        this.data.data = data;
      },
      init: function () {
        this.supr();
      },
    });
    return projectsList;
  };
  // notify dispatcher
  _m._$regist(
    'progroup-detail-p',
    _p._$$ModuleProGroupDetailP
  );
});
