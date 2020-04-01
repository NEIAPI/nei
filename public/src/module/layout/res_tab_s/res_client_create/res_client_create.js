NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/res_create',
  'pro/cache/client_cache',
  'ui/datepick/datepick'
], function (_k, _e, _v, _u, _l, _m, create, cache, _dp, _p, _pro) {

  _p._$$ModuleResClientCreate = _k._$klass();
  _pro = _p._$$ModuleResClientCreate._$extend(create._$$ModuleResCreate);

  _pro.__doBuild = function (config) {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-client-create')
    );
    this.localStorageKey = 'CLIENT_CREATE_TEMP';
    var options = {
      resType: 'client',
      localStorageKey: this.localStorageKey,
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__clientCache',
      //是否有私有模块（模块自身有新建的私有模块弹窗）
      hasPrivateFlag: true,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {},
      //模块中用到的私有模块（新建的私有模块弹窗）
      inlineCreateList: ['group'],
      hasTag: true,
      hasGroup: true,
      hasRespo: true,
      config: config,
    };
    this.__super(options);
  };

  _pro.__onShow = function (_options) {
    var links = _e._$getByClassName(this.__body, 'dates')[0];
    this.__doInitDomEvent([
      [
        links, 'click',
        function (evt) {
          this.__datePick && (this.__datePick = this.__datePick._$recycle());
          var node = evt.srcElement;
          if (!node || node.tagName !== 'INPUT') {
            return;
          }
          this.__datePick = _dp._$$DatePick._$allocate({
            parent: node.parentNode,
            date: node.value,
            clazz: 'date-picker',
            onchange: function (date) {
              node.value = _u._$format(date, 'yyyy-MM-dd');
            }.bind(this)
          });
          _v._$stopBubble(evt);
        }.bind(this)
      ], [
        document, 'click', function () {
          this.__datePick && this.__datePick._$recycle();
          this.__datePick = null;
        }.bind(this)
      ]]);
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__clear();
    this.__super();
  };

  /**
   * 获取表单提交数据
   * @return {Object} 表单数据
   */
  _pro.__getSubmitOptions = function () {
    if (this.__tags && this.__tags.length) {
      var tags = this.__tags.map(function (item) {
        return item.name;
      });
    }
    var obj = {
      name: this.__formElem['name'].value,
      tag: tags && tags.length ? tags.join(',') : '',
      description: this.__formElem['description'].value || '',
      groupId: this.__group ? this.__group.id : 0,
      respoId: this.__respo.id,
      downloadLink: this.__formElem['download-link'].value || '',
      projectId: parseInt(this.__pid),
      version: this.__formElem['version'].value || ''
    };
    var launchDate = this.__formElem['launch-date'] && this.__formElem['launch-date'].value;
    var closeDate = this.__formElem['close-date'] && this.__formElem['close-date'].value;

    return Object.assign(obj,
      launchDate ? {launchDate: new Date(launchDate).getTime()} : {},
      closeDate ? {closeDate: new Date(closeDate).getTime()} : {}
    );
  };

  /**
   * 内容存储
   * @return {Void}
   */
  _pro.__setStorage = function () {
    var _options = this.__getSubmitOptions();
    _options.group = this.__group;
    _options.respo = this.__respo;
    _options.tags = this.__tags || [];
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(_options));
  };

  /**
   * 填入表单逻辑
   * @param  {Object} options 待填入表单数据
   * @return {Void}
   */
  _pro.__doFillForm = function (options) {
    var items = ['name', 'version', 'launch-date', 'close-date'];
    _u._$forEach(items, function (item) {
      _e._$attr(this.__formElem[item], 'value', options[item]);
    }.bind(this));
    this.__formElem['download-link'].value = options.downloadLink;
    this.__formElem['description'].innerHTML = options.description;
    this.__formElem['launch-date'].value = _u._$format(options.launchDate, 'yyyy-MM-dd');
    this.__formElem['close-date'].value = _u._$format(options.closeDate, 'yyyy-MM-dd');
  };

  /**
   * 回收datepick组件
   * @return {Void}
   */
  _pro.__clear = function () {
    this.__datePick && this.__datePick._$recycle();
    this.__datePick = null;
  };

  /**
   * 表单重置
   * @return {Void}
   */
  _pro.__resetForm = function () {
    //父类定义的表单重置方法
    this.__formReset();
  };

  // notify dispatcher
  _m._$regist(
    'res-client-create',
    _p._$$ModuleResClientCreate
  );
});
