NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'util/form/form',
  'pro/common/module',
  'pro/common/res_create',
  'pro/param_editor/param_editor',
  'pro/cache/template_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/group_cache',
  'pro/cache/user_cache',
  'pro/select2/select2',
  'pro/notify/notify',
  'pro/tagme/tagme',
  'pro/modal/modal'
], function (_k, _e, _v, _u, _t, _l, _f, _m, create, paramEditor, cache, _proCache, _pgCache, _groupCache, _usrCache, _s2, _notify, _tag, _modal, _p, _pro) {
  /**
   * 页面模板创建模块
   * @class   {wd.m._$$ModuleResTemplateCreate}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResTemplateCreate = _k._$klass();
  _pro = _p._$$ModuleResTemplateCreate._$extend(create._$$ModuleResCreate);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function (config) {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-template-create')
    );
    this.localStorageKey = 'TEMPLATE_CREATE_TEMP';
    var options = {
      resType: 'template',
      localStorageKey: this.localStorageKey,
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__tplCache',
      //是否有私有模块（模块自身有新建的私有模块弹窗）
      hasPrivateFlag: true,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {},
      //模块中用到的私有模块（新建的私有模块弹窗）
      inlineCreateList: ['group'],
      hasGroup: true,
      hasRespo: true,
      hasTag: true,
      hasShare: false,
      config: config,
      allocateComponent: this.__allocateComponent.bind(this)
    };
    this.__super(options);
  };

  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
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
    // _options.params = this.__editor._$getEditorResult().params || [];
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(_options));
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__editor && (this.__editor = this.__editor._$recycle());
  };

  /**
   * 实例化所需组件
   * @return {Void}
   */
  _pro.__allocateComponent = function () {
    // 参数编辑器
    this.__editor = paramEditor._$$ParamEditor._$allocate({
      parent: _e._$getByClassName(this.__formGroup[3], 't-c-parameters-editor')[0],
      pid: this.__pid,
      formatChangeable: false,
      params: this.__dataStorge ? this.__dataStorge.params : []
    });
  };

  /**
   * 填入数据
   * @param  {Object} _options 浏览器暂存数据
   * @return {Void}
   */
  _pro.__doFillForm = function (_options) {
    var _eName = this.__form.getElementsByTagName('input')[0];
    var _ePath = this.__form.getElementsByTagName('input')[1];
    var _eDesc = this.__form.getElementsByTagName('textarea')[0];
    _e._$attr(_eName, 'value', _options.name);
    _e._$attr(_ePath, 'value', _options.path);
    _eDesc.innerHTML = _options.description;
    //    this.__editor._$setEditorResult(_options.params);
  };
  /**
   * 处理提交逻辑
   * @return {Void}
   */
  _pro.__handleSubmit = function () {
    if (this.__submit) {
      return;
    }
    if (this.__formObj._$checkValidity()) {
      this.__disableBtn(this.__formElem['save'], '提交中...', true);
      if (!this.__parametersCheckResult) {
        _notify.show(this.__parametersCheckMsg, 'error', 2000);
        return;
      }
      this.__submit = true;
      this.__tplCache._$addItem({
        //如果是私有模块，则使用私有模块传进的listkey
        key: this.__private ? this._listCacheKeyPrivate : this._listCacheKey,
        data: this.__getSubmitOptions(),
        ext: {type: this.__private ? 'private' : 'public'}
      });
      clearInterval(this.__storeInterval);
      window.localStorage.removeItem(this.localStorageKey);
    }
  };
  /**
   * 获取表单信息
   * @return {Object} 表单数据对象
   */
  _pro.__getSubmitOptions = function () {
    var data = this.__editor._$getData() || {};
    this.__parametersCheckResult = data.pass;
    this.__parametersCheckMsg = data.msg;
    if (this.__tags && this.__tags.length) {
      var tags = this.__tags.map(function (item) {
        return item.name;
      });
    }
    return {
      name: this.__formElem['name'].value,
      path: this.__formElem['path'].value,
      projectId: this.__pid,
      tag: tags && tags.length ? tags.join(',') : '',
      params: data.params || [],
      groupId: this.__group.id || 0,
      respoId: this.__respo.id,
      description: this.__formElem['description'].value || '',
      imports: data.imports || []
    };
  };
  /**
   * 清空表单数据
   * @return {Void}
   */
  _pro.__resetForm = function () {
    //父类定义的表单重置方法
    this.__formReset();

    this.__tag._$empty();
    this.__editor._$reset();
  };
  // notify dispatcher
  _m._$regist(
    'res-template-create',
    _p._$$ModuleResTemplateCreate
  );
});
