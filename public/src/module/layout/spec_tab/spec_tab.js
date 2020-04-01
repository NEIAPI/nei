NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/cache/spec_cache',
  //'util/tab/view',
  'pro/tab/tab',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _e, _tpl, _jst, _m, _specCache, Tab, _db, _p, _pro) {

  _p._$$ModuleSpecTab = _k._$klass();
  _pro = _p._$$ModuleSpecTab._$extend(_m._$$Module);
  // 标签列表数据
  var xlist = [
    {type: 'web', name: 'WEB', v: _db.CMN_TYP_WEB},
    {type: 'ios', name: 'iOS', v: _db.CMN_TYP_IOS},
    {type: 'aos', name: 'Android', v: _db.CMN_TYP_AOS},
    {type: 'test', name: '测试', v: _db.CMN_TYP_TEST}
  ];

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _tpl._$getTextTemplate('module-spec-tab')
    );
    this.__tabWrap = _e._$getByClassName(this.__body, 'm-tab-spec-wrap')[0];
    _jst._$render(this.__tabWrap, 'm-spec-tab', {
      xlist: xlist
    });
    this.__tbview = Tab._$$ModuleTab._$allocate({
      tab: this.__tabWrap,
      oncheck: this.__doCheckMatchEQ.bind(this)
    });
    this.__tabList = _e._$getByClassName(this.__tabWrap, 'tab');
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__matchTab(_options);
  };

  _pro.__onHide = function (_options) {
    this.__super(_options);
    if (this.__scache) {
      this.__scache._$recycle();
      delete this.__scache;
    }
  };

  /**
   * 找出当前所在的工程了类型
   * @return {Void}
   */
  _pro.__matchTab = function (_options) {
    var specType;
    if (_options.param.hasOwnProperty('s')) {
      specType = _options.param.s;
    } else if (_options.param.id) {
      if (!this.__scache) {
        this.__scache = _specCache._$$CacheSpec._$allocate({
          onitemload: function (evt) {
            var specData = this.__scache._$getItemInCache(evt.id);
            var tabItem = xlist.filter(function (x) {
              return x.v === specData.type;
            });
            this.__tbview._$match(tabItem[0].type);
          }.bind(this)
        });
      }
      this.__scache._$getItem({
        key: _specCache._$cacheKey,
        id: _options.param.id
      });
    } else if (window.sessionStorage.specBack) {
      specType = JSON.parse(window.sessionStorage.specBack).specType;
    } else {
      specType = 'web';
    }
    if (specType) {
      this.__tbview._$match(specType);
    }
  };

  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };

  _m._$regist(
    'spec-tab',
    _p._$$ModuleSpecTab
  );
});
