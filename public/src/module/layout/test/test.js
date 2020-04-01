/**
 * 测试顶层模块
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/template/tpl',
  'util/cache/share',
  'pro/cache/progroup_interface_cache',
  'pro/common/module',
  'pro/common/util'
], function (_k, _e, _v, _l, _sc, _infCache, _m, _cu, _p, _pro) {
  _p._$$ModuleLayoutTest = _k._$klass();
  _pro = _p._$$ModuleLayoutTest._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-layout-test')
    );
    this.__export = {
      parent: _e._$getByClassName(this.__body, 'panel-tab-con')[0],
      tab: _e._$getByClassName(this.__body, 'panel-tab-wrap')[0],
      mainTab: _e._$getByClassName(this.__body, 'main-tab-wrap')[0]
    };
    this._searchIpt = _e._$getByClassName(this.__body, 'sch-ipt')[0];
  };

  _pro.__onShow = function (_options) {
    var me = this;
    this.__super(_options);

    _v._$addEvent(this._searchIpt, 'input', function (evt) {
      me._doSearchInf();
    });
  };

  _pro.__onMessage = function (evt) {
    if (evt.data.type === 'close-search') {
      _sc.localCache._$remove('m-test-inf-search');
      this._hideSearch();
    }
  };

  /**
   * 清空搜索框
   *
   * @return {void}
   */
  _pro._hideSearch = function () {
    delete this._inputStash;
    delete this._lastResType;
    this._searchIpt.value = '';
  };

  /**
   * 搜索接口
   *
   * @return {void}
   */
  _pro._doSearchInf = function () {
    _sc.localCache._$set('m-test-inf-search', this._searchIpt.value.trim());
    if (this._resourceType !== _infCache._$resourceRecord) {
      this.__doSendMessage('/m/test/group', {
        type: 'search-inf'
      });
    }
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this._resourceType = _infCache._$getResourceType(this.__getPathFromUMI());
    if (this._resourceType !== _infCache._$resourceRecord) {
      this._resourceType = _infCache._$resourceInf;
    }
    if (this._lastResType) { // 保存之前的输入值
      this._inputStash = this._inputStash || {};
      this._inputStash[this._lastResType] = this._searchIpt.value;
      this._searchIpt.value = this._inputStash[this._resourceType];
      _sc.localCache._$set('m-test-inf-search', this._searchIpt.value.trim());
    }
    this._lastResType = this._resourceType;
  };

  _pro.__onHide = function (_options) {
    this.__super(_options);
    _v._$clearEvent(this._searchIpt, 'input');
    this._hideSearch();
  };

  _m._$regist(
    'layout-test',
    _p._$$ModuleLayoutTest
  );
});
