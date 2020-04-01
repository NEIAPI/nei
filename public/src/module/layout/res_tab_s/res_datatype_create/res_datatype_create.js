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
  'pro/cache/datatype_cache',
  'pro/cache/pro_cache',
  'pro/notify/notify',
  'pro/select2/select2',
], function (_k, _e, _v, _u, _t, _l, _f, _m, create, Editor, cache, proCache, _notify, _s2, _p, _pro) {
  /**
   * 数据模型创建模块
   * @class   {wd.m._$$ModuleResDatatypeCreate}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResDatatypeCreate = _k._$klass();
  _pro = _p._$$ModuleResDatatypeCreate._$extend(create._$$ModuleResCreate);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function (config) {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-datatype-create')
    );
    this.localStorageKey = 'DATATYPE_CREATE_TEMP';
    var options = {
      resType: 'datatype',
      localStorageKey: this.localStorageKey,
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__dtCache',
      //是否有私有模块（模块自身有新建的私有模块弹窗）
      hasPrivateFlag: true,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {},
      //模块中用到的私有模块（新建的私有模块弹窗）
      inlineCreateList: ['group'],
      hasGroup: true,
      hasRespo: false,
      hasTag: true,
      hasShare: true,
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
    if (this.__private) {
      this.__done = _options.input.done;
      this.__params = _options.input.params || [];
      this.__formReset();
    }
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    if (this.__private) {
      this.__tag && this.__tag._$empty();
    }
  };
  /**
   * 隐藏模块
   */
  _pro.__onHide = function () {
    this.__super();
    this.__editor && (this.__editor = this.__editor._$recycle());
  };

  /**
   * 实例化所需组件
   */
  _pro.__allocateComponent = function () {
    // 参数编辑器,如果是做为私有模块
    var container = _e._$getByClassName(this.__body, 'd-c-parameters-editor')[0];
    var options = {
      parent: container,
      pid: this.__pid,
      params: this.__params,
      // 表示正在创建数据模型，此时参数编辑器中不用显示“保存为数据模型”的按钮
      isCreatingDatatype: true
    };
    if (!this.__private && this.__dataStorge) {
      Object.assign(options, this.__dataStorge.params);
    }
    this.__editor = Editor._$$ParamEditor._$allocate(options);

  };

  /**
   * 内容存储
   */
  _pro.__setStorage = function () {
    var _options = this.__getSubmitOptions();
    _options.group = this.__group;
    _options.tags = this.__tags || [];
    _options.params = this.__editor._$getData();
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(_options));
  };

  /**
   * 配置业务分组选择
   */
  _pro.__renderGroupSelect = function () {
    var groups = this.__groupCache._$getGroupSelectSource(this.__pid);
    this.__groupSelect = new _s2({
      data: {
        source: groups
      }
    });
    this.__group = groups[0];
    if (!!this.__dataStorge && this.__dataStorge.group) {
      this.__groupSelect.$select(this.__dataStorge.group);
      this.__group = this.__dataStorge.group;
    }
    this.__groupSelect.$inject(_e._$getByClassName(this.__form, 'groups')[0])
      .$on('change', function (result) {
        this.__group = result.selected;
      }.bind(this));

    // 此时页面加载结束,保存当前表单数据,用来和离开前的数据比较以控制弹框提示。
    this.__initialData = JSON.stringify(this.__getSubmitOptions());
  };

  /**
   * 处理表单提交逻辑
   */
  _pro.__handleSubmit = function () {
    // 正在提交当中, 不用再次提交
    if (this.__submit) {
      return;
    }
    if (this.__formObj._$checkValidity()) {
      this.__disableBtn(this.__formElem['save'], '提交中...', true);
      var options = this.__getSubmitOptions();
      if (!this.__parametersCheckResult) {
        this.__disableBtn(this.__formElem['save'], '保存', false);
        _notify.show(this.__parametersCheckMsg, 'error', 2000);
        this.__submit = false;
        return;
      }
      this.__submit = true;
      this.__dtCache._$addItem({
        key: this._listCacheKey,
        data: options
      });
      clearInterval(this.__storeInterval);
      window.localStorage.removeItem(this.localStorageKey);
    }
  };
  /**
   * 获取表单信息
   * @return {Object}  获取到的表单信息
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
      projectId: this.__pid,
      format: data.format,
      description: this.__formElem['description'].value || '',
      tag: tags && tags.length ? tags.join(',') : '',
      params: data.params || [],
      imports: data.imports || [],
      groupId: this.__group ? this.__group.id : 0
    };
  };

  /**
   * 填入数据
   * @param  {Object} _options 浏览器暂存数据
   * @return {Void}
   */
  _pro.__doFillForm = function (_options) {
    var _eName = this.__form.getElementsByTagName('input')[0];
    var _eDesc = this.__form.getElementsByTagName('textarea')[0];
    _e._$attr(_eName, 'value', _options.name);
    _eDesc.innerHTML = _options.description;
    //   this.__editor._$setEditorResult(_options.params);
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
    'res-datatype-create',
    _p._$$ModuleResDatatypeCreate
  );
});
