NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/user_cache',
  'pro/common/regular/regular_project',
  'pro/common/list_drag',
  'pro/select2/select2',
  'json!3rd/fb-modules/config/db.json',
  'pro/cardlist/cardlist'
], function (_k, _e, _u, _t, _l, _m, _cu, _pgCache, _proCache, _userCache, _r, _drag, select2, _dbConst, cardlist, _p, _pro) {
  /**
   * 项目组详情项目管理模块
   * @class   {wd.m._$$ModuleProGroupDetailPM}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupDetailPM = _k._$klass();
  _pro = _p._$$ModuleProGroupDetailPM._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-d-pm')
    );
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    this.__proCacheOptions = {
      onlistload: function (evt) {
        var projects = this.__proCache._$getListInCache(this.__proListKey);
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this.__progroup = this.__pgCache._$getItemInCache(this.__pgid);
            this.__userRole = this.__pgCache._$getRole(this.__pgid);
            var ProjectsList = this._getProjectList();

            if (!!this.__projectsList) {
              this.__projectsList.destroy();
            }
            //实例化 regular_project组件
            this.__projectsList = new ProjectsList({
              data: {
                projects: projects,
                progroup: this.__progroup,
                privilege: this.__pgCache._$getPrivilege(this.__pgid)
              }
            }).$inject(this.__body);

            //拖拽控件实例化
            this.__dragWidget = _drag._$$DraggerSort._$allocate({
              parent: _e._$getByClassName(this.__body, 'res-ul')[0],
              list: _e._$getByClassName(this.__body, 'res-list')[0],
              type: 'projects',
              dragEnd: function (pids) {
                this.__proCache._$sort({
                  ids: pids,
                  type: _dbConst.CMN_ORD_CUSTOM,
                  pgId: this.__pgid,
                  key: this.__proCache._$getListKey(this.__pgid),
                  ext: {progroupId: this.__pgid}
                });
                this.__projectsList.$emit('drag-sorted');
              }.bind(this)
            });

            //删除加载中提示，显示内容
            _e._$addClassName(this.__loading, 'f-dn-important');
            _e._$delClassName(this.__body, 'f-dn-important');
          }.bind(this)
        });
        this.__pgCache._$getItem({id: this.__pgid});
      }.bind(this)
    };
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__proCache = _proCache._$$CachePro._$allocate(this.__proCacheOptions);
    this.__super(_options);
    //区分regular_project中的resetTop函数，监听两次有效，可修改。
    this.__doInitDomEvent([[
      _proCache._$$CachePro, 'listchange',
      function (_result) {
        if (this.__projectsList) {
          var progroup = this.__pgCache._$getItemInCache(this.__pgid);
          var list = this.__proCache._$getListInCache(this.__proCache._$getListKey(_result.ext.progroupId));
          this.__projectsList.$emit('list-change', list, progroup, _result.action);
        }
      }._$bind(this)
    ], [
      _proCache._$$CachePro, 'update',
      function (_result) {
        var progroup = this.__pgCache._$getItemInCache(this.__pgid);
        var list = this.__proCache._$getListInCache(this.__proCache._$getListKey(_result.ext.progroupId));
        this.__projectsList.$emit('update', _result.data);
      }._$bind(this)
    ]]);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    _e._$addClassName(this.__body, 'f-dn-important');
    _e._$delClassName(this.__loading, 'f-dn-important');
    this.__pgid = _options.param.pgid.replace('/', '');
    this.__super(_options);
    this.__proListKey = this.__proCache._$getListKey(this.__pgid);
    this.__proCache._$getList({
      key: this.__proListKey
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    if (this.__projectsList) {
      this.__projectsList = this.__projectsList.destroy();
    }
    if (this.__dragWidget) {
      this.__dragWidget = this.__dragWidget._$recycle();
    }
    this.__doClearDomEvent();
    this.__proCache._$recycle();
    this.__pgCache._$recycle();
  };

  /**
   * 初始化项目列表组件
   * @return {Object} 组件对象
   */
  _pro._getProjectList = function () {
    var _this = this;
    var projectsList = _r.extend({
      template: _l._$getTextTemplate('projects-list'),
      config: function (data) {
        var projectOrder = _this.__pgCache._$getItemInCache(_this.__pgid).projectOrder;
        this.supr(data);
        data.sortType = '';
        //初始化卡片列表所需的参数
        data.cardListOptions = {
          isAllocateByTag: true,
          resType: 0,
          addable: true,
          sortable: true,
          hasStickList: true,
          cache: _this.__proCache,
          pgid: _this.__pgid,
          orderType: projectOrder,
          sortlist: [{name: '名称', type: 'name'}, {name: '创建时间', type: 'time'}],
          title: '',
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
        this.$on('drag-sorted', this.clearSortStyle.bind(this));
      },
      clearSortStyle: function () {
        this.data.sortType = '';
        this.$update();
      }
    });
    return projectsList;
  };

  // notify dispatcher
  _m._$regist(
    'progroup-detail-pm',
    _p._$$ModuleProGroupDetailPM
  );
});
