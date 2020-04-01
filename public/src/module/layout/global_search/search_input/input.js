NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/template/tpl',
  'pro/common/module',
  'pro/select2/select2',
], function (_k, _e, _v, _l, _m, Select2, _p, _pro) {

  _p._$$ModuleLayoutDashboardSearch = _k._$klass();
  _pro = _p._$$ModuleLayoutDashboardSearch._$extend(_m._$$Module);

  _pro.__doBuild = function (options) {
    this.__super(options);

    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-dashboard-search')
    );
  };

  _pro.__onShow = function (options) {
    this.__super(options);

    this.$selectWrapper = _e._$getByClassName(this.__body, 'globalsearch-select')[0];
    this.$searchInput = _e._$getByClassName(this.__body, 'j-pg-search')[0];
    this.$searchBtn = _e._$getByClassName(this.__body, 'globalsearch-icon')[0];

    this.__select = new Select2({
      data: {
        source: [
          {name: '搜索全部', id: '/globalsearch/all/'},
          {name: 'HTTP 接口', id: '/globalsearch/interfaces/'},
          {name: 'RPC 接口', id: '/globalsearch/rpcs/'},
          {name: '数据模型', id: '/globalsearch/datatypes/'},
          {name: '规则函数', id: '/globalsearch/constraints/'},
          {name: '页面', id: '/globalsearch/pages/'},
          {name: '页面模板', id: '/globalsearch/templates/'},
          {name: '业务分组', id: '/globalsearch/groups/'},
          {name: '项目', id: '/globalsearch/projects/'},
          {name: '项目组', id: '/globalsearch/progroups/'}
        ],
        preview: true,
        sortList: false,
        choseOnly: true,
        maxLen: 20
      }
    }).$inject(this.$selectWrapper);

    // 注册事件
    this.__doInitDomEvent([
      [
        this.$searchInput, 'focus', function () {
        _e._$addClassName(this.__body, 'z-border');
      }._$bind(this)
      ],
      [
        this.$searchInput, 'blur', function () {
        _e._$delClassName(this.__body, 'z-border');
      }._$bind(this)
      ],
      [
        this.$searchInput, 'keydown',
        this.__search._$bind(this)
      ],
      [
        this.$searchBtn, 'click',
        this.__search._$bind(this)
      ]
    ]);
  };

  _pro.__onRefresh = function (options) {
    this.__super(options);
  };

  _pro.__onHide = function () {
    this.__super();

    this.__select && this.__select.destroy();
  };

  _pro.__search = function (event) {
    if (event.type === 'keydown') {
      var currKey = event.keyCode || event.which || event.charCode;
      if (currKey !== 13) {
        return;
      }
    }
    var searchKey = this.$searchInput.value.trim();
    var path = this.__select.data.selected.id;

    if (!searchKey) {
      return;
    }

    // 搜索全部默认跳到接口
    if (path === '/globalsearch/all/') {
      path = '/globalsearch/interfaces/';
    }

    dispatcher._$redirect(path + '?s=' + searchKey);
  };

  _m._$regist(
    'layout-globalsearch-input',
    _p._$$ModuleLayoutDashboardSearch
  );
});
