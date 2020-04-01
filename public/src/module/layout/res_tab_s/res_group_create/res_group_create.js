NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/form/form',
  'pro/common/module',
  'pro/common/util',
  'pro/common/res_create',
  'pro/cache/group_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/notify/notify',
  'pro/select2/select2',
  'pro/modal/modal'
], function (_k, _e, _u, _v, _t, _l, _f, _m, util, create, cache, proCache, pgCache, userCache, notify, select2, modal, _p, _pro) {

  _p._$$ModuleResGroupCreate = _k._$klass();
  _pro = _p._$$ModuleResGroupCreate._$extend(create._$$ModuleResCreate);

  _pro.__doBuild = function (config) {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-group-create')
    );
    this.localStorageKey = 'GROUP_CREATE_TEMP';
    var options = {
      resType: 'group',
      localStorageKey: this.localStorageKey,
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__groupCache',
      //是否有私有模块（模块自身有新建的私有模块弹窗）
      hasPrivateFlag: true,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {},
      //模块中用到的私有模块（新建的私有模块弹窗）
      inlineCreateList: [],
      hasGroup: false,
      hasRespo: true,
      hasTag: false,
      hasShare: true,
      config: config,
    };
    this.__super(options);
    var rpcPomEditorContainer = _e._$getByClassName(this.__body, 'rpc-pom-editor')[0];
    var rpcKeyEditorContainer = _e._$getByClassName(this.__body, 'rpc-key-editor')[0];
    this.rpcPomEditor = util._$initNormalEditor('xml', '', rpcPomEditorContainer, false);
    this.rpcKeyEditor = util._$initNormalEditor('properties', '', rpcKeyEditorContainer, false);
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
  };

  /**
   * 获取表单提交数据
   * @return {Object} 表单数据
   */
  _pro.__getSubmitOptions = function () {
    return {
      projectId: this.__pid,
      name: this.__formElem['name'].value,
      description: this.__formElem['description'].value || '',
      respoId: this.__respo.id,
      rpcPom: this.rpcPomEditor.getValue(),
      rpcKey: this.rpcKeyEditor.getValue()
    };
  };

  /**
   * 内容存储
   */
  _pro.__setStorage = function () {
    var storOpt = this.__getSubmitOptions();
    storOpt.respo = this.__respo;
    window.localStorage.removeItem('group');
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(storOpt));
  };

  /**
   * 填入表单逻辑
   * @param  {Object} _options 待填入表单数据
   */
  _pro.__doFillForm = function (options) {
    _e._$attr(this.__formElem['name'], 'value', options.name);
    this.__formElem['description'].innerHTML = options.description;
    this.rpcPomEditor.setValue(options.rpcPom);
    this.rpcKeyEditor.setValue(options.rpcKey);
  };

  /**
   * 表单重置
   */
  _pro.__resetForm = function () {
    //父类定义的表单重置方法
    this.__formReset();
  };

  // notify dispatcher
  _m._$regist(
    'res-group-create',
    _p._$$ModuleResGroupCreate
  );
});
