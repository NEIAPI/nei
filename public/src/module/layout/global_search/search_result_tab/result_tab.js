NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'pro/common/module',
  'pro/tab/tab'
], function (_k, _e, _l, _m, tab, _p, _pro) {

  _p._$$ModuleGlobalSearchTab = _k._$klass();
  _pro = _p._$$ModuleGlobalSearchTab._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();

    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-globalsearch-result-tab')
    );

    this.__tbview = tab._$$ModuleTab._$allocate({
      tab: _e._$getByClassName(this.__body, 'm-tab')[0],
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });

    this.__searchForm = _e._$getByClassName(this.__body, 'search-inp-wrap')[0];
    this._searchInput = _e._$getByClassName(this.__body, 'search-input')[0];
    this._searchBtn = _e._$getByClassName(this.__body, 'search-btn')[0];
  };

  _pro.__onShow = function (options) {
    this._tabs = _e._$getByClassName(this.__body, 'tab');
    this.__super(options);

    this.__doInitDomEvent([
      [
        this._searchInput, 'focus', function () {
        _e._$addClassName(this.__searchForm, 'z-border');
      }._$bind(this)
      ],
      [
        this._searchInput, 'blur', function () {
        _e._$delClassName(this.__searchForm, 'z-border');
      }._$bind(this)
      ],
      [
        this._searchInput, 'keydown',
        this.__search._$bind(this)
      ],
      [
        this._searchBtn, 'click',
        this.__search._$bind(this)
      ]
    ]);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);

    // 搜索关键字
    this.__searchKey = _options.param.s;

    // 当前 umi
    this.__target = _options.input.location.target;

    // 设置 tab 的链接
    this._tabs.forEach(function (tab) {
      var href = _e._$attr(tab, 'data-id');
      _e._$attr(tab, 'href', href + '?s=' + this.__searchKey);
    }._$bind(this));

    // 设置搜索框默认值
    _e._$attr(this._searchInput, 'value', this.__searchKey);

    this.__tbview._$match(
      this.__getPathFromUMI(_options)
    );
  };

  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };

  _pro.__search = function (evt) {
    var searchKey = this._searchInput.value.trim();
    if (!searchKey) return;
    if (evt.type == 'keydown') {
      if (evt.keyCode !== 13) {
        return;
      }
    }

    dispatcher._$redirect(this.__target.substr(2) + '?s=' + searchKey);

    this._searchInput.value = '';
  };

  _m._$regist(
    'layout-globalsearch-tab',
    _p._$$ModuleGlobalSearchTab
  );
});
