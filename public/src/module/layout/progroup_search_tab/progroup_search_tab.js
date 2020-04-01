NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'pro/common/module',
  'pro/tab/tab'
], function (_k, _e, _l, _m, tab, _p, _pro) {

  _p._$$ModuleProGroupSearchTab = _k._$klass();
  _pro = _p._$$ModuleProGroupSearchTab._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-search-tab')
    );
    this._mTab = _e._$getByClassName(this.__body, 'm-tab')[0];
    this.__tbview = tab._$$ModuleTab._$allocate({
      tab: this._mTab,
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
    this.__searchForm = _e._$getByClassName(this.__body, 'search-inp-wrap')[0];
    this._searchInput = _e._$getByClassName(this.__body, 'search-input')[0];
    this._searchBtn = _e._$getByClassName(this.__body, 'search-btn')[0];
  };

  _pro.__onRefresh = function (_options) {
    this.__searchKey = _options.param.s;
    this.__target = _options.input.location.target;
    this.__tbview._$match(
      this.__getPathFromUMI(_options)
    );
    _e._$attr(this._tabs[0], 'href', '/search/group/?s=' + this.__searchKey);
    _e._$attr(this._tabs[1], 'href', '/search/project/?s=' + this.__searchKey);
    this.__super(_options);
  };

  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) > -1;
  };

  _pro.__onShow = function (options) {

    this._tabs = _e._$getByClassName(this.__body, 'tab');
    this.__super(options);
    this.__doInitDomEvent([[
      this._searchInput, 'focus', function () {
        _e._$addClassName(this.__searchForm, 'z-border');
      }._$bind(this)
    ], [
      this._searchInput, 'blur', function () {
        _e._$delClassName(this.__searchForm, 'z-border');
      }._$bind(this)
    ], [
      this._searchInput, 'keydown',
      this.__search._$bind(this)
    ],
      [
        this._searchBtn, 'click',
        this.__search._$bind(this)
      ]
    ]);
  };

  _pro.__onHide = function () {
    // if (this.__tbview) {
    //     this.__tbview = this.__tbview._$recycle();
    // }
    this._searchInput.value = '';
    this.__super();
  };

  _pro.__search = function (evt) {
    var searchKey = this._searchInput.value.trim();
    if (!searchKey) return;
    if (evt.type == 'keydown') {
      if (evt.keyCode !== 13) {
        return;
      }
    }
    if (this.__target == '/m/progroup/search/project/') {
      dispatcher._$redirect('/search/project/?s=' + searchKey);
    } else {
      dispatcher._$redirect('/search/group/?s=' + searchKey);
    }
  };
  _m._$regist(
    'progroup-search-tab',
    _p._$$ModuleProGroupSearchTab
  );
});
