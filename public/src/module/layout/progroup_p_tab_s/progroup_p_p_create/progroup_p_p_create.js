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
  'pro/cache/page_cache',
  'pro/cache/group_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/template_cache',
  'pro/cache/interface_cache',
  'pro/cache/user_cache',
  'pro/notify/notify',
  'pro/select2/select2',
  'pro/tagme/tagme',
  'pro/modal/modal',
  'pro/common/util',
], function (_k, _e, _v, _u, _t, _l, _form, _m, create, paramEditor, cache, _groupCache, _proCache, _pgCache, _tlCache, _inCache, _usrCache, _notify, _s2, _tag, _modal, _util, _p, _pro) {
  _p._$$ModuleProGroupPPCreate = _k._$klass();
  _pro = _p._$$ModuleProGroupPPCreate._$extend(create._$$ModuleResCreate);

  _pro.__doBuild = function () {
    this.__body = _l._$getNodeTemplate('module-pg-p-p-create');
    this.__form = _e._$getByClassName(this.__body, 'm-form')[0];
    this.__formGroup = _e._$getByClassName(this.__form, 'form-group');
    var options = {
      resType: 'page',
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__pageCache',
      //是否有私有模块（模块自身有新建的私有模块弹窗）
      hasPrivateFlag: false,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {},
      //模块中用到的私有模块（新建的私有模块弹窗）
      inlineCreateList: ['group', 'template', 'interface'],
      inlineCreateNode: [{type: 'group', node: _e._$getByClassName(this.__formGroup[5], 'create')[0]}],
      hasGroup: true,
      hasRespo: true,
      hasTag: true,
      hasShare: false,
      allocateComponent: this.__allocateComponent.bind(this)
    };
    this.__super(options);
    this.__formElem = this.__form.elements;
    //模板cache和接口cache实例化
    this.__inCache = _inCache._$$CacheInterface._$allocate({});
    this.__tlCache = _tlCache._$$CacheTemplate._$allocate({
      onitemload: function () {
        this.__template = this.__tlCache._$getItemInCache(this.__tplChoosedId);
        if (this.__template.name.indexOf('/') == 0) {
          this.__template.name = this.__template.name.substring(1);
        }
        //模版导入功能,新增一个来源，以免影响老代码
        this.__doFillForm({
          name: this.__template.name,
          path: this.__template.path,
          description: this.__template.description,
          from: 'template'
        });
      }.bind(this)
    });


  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  /**
   *  根据storage 初始化数据
   * @return {Void}
   */
  _pro.__initDataFromStorge = function () {
    if (!!this.__dataStorge) {
      this.__dataStorge = JSON.parse(this.__dataStorge);
      this.__tags = this.__dataStorge.tags;
      this.__templates = this.__dataStorge.templates;
      this.__interfaces = this.__dataStorge.interfaces;
      this.__doFillForm(this.__dataStorge);
    }
  };
  /**
   * 实例化所需组件
   * @return {Void}
   */
  _pro.__allocateComponent = function () {
    // 参数编辑器
    this.__editor = paramEditor._$$ParamEditor._$allocate({
      parent: _e._$getByClassName(this.__body, 'p-c-parameters-editor')[0],
      pid: this.__pid,
      formatChangeable: false,
      params: this.__dataStorge ? this.__dataStorge.params : []
    });

    // 接口列表
    this.__inTag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__formGroup[9], 'interfaces')[0],
      searchCache: _inCache._$$CacheInterface,
      searchCacheKey: this.__inCache._$getListKey(this.__pid),
      searchResultFilter: function (list) {
        var newList = _util._$filterVersion(list);
        return newList.map(function (item) {
          return {
            id: item.id,
            name: item.name,
            namePinyin: item.namePinyin,
            title: item.name + '(' + item.path + ')'
          };
        });
      },
      preview: false,
      choseOnly: true,
      tags: this.__interfaces || [],
      done: function (data) {
        if (!!data.change) {
          this.__interfaces = data.tags;
        }
      }.bind(this),
      queryData: {
        pid: this.__pid
      },
      placeholder: '请选择接口'
    });
    // 模板列表
    this.__tlTag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__formGroup[8], 'templates')[0],
      searchCache: _tlCache._$$CacheTemplate,
      searchCacheKey: this.__tlCache._$getListKey(this.__pid),
      searchResultFilter: function (list) {
        return list.map(function (item) {
          return {
            id: item.id,
            name: item.name,
            namePinyin: item.namePinyin,
            title: item.name + '(' + item.path + ')'
          };
        });
      },
      preview: false,
      choseOnly: true,
      tags: this.__templates || [],
      done: function (data) {
        if (!!data.change) {
          //只选第一个的模版id
          this.__tplChoosedId = data.tags[0]['id'];
          //获取模版id的数据
          this.__tlCache._$getItem({
            id: this.__tplChoosedId
          });
          this.__templates = data.tags;
        }
      }.bind(this),
      queryData: {
        pid: this.__pid
      },
      placeholder: '请选择模板'
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__editor = this.__editor._$recycle();
    this.__tlTag = this.__tlTag._$recycle();
    this.__inTag = this.__inTag._$recycle();
    this.__tags = this.__templates = this.__interfaces = [];
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
    _options.templates = this.__templates || [];
    _options.interfaces = this.__interfaces || [];
    _options.params = this.__editor._$getEditorResult().params || [];
    window.localStorage.setItem('page', JSON.stringify(_options));
  };

  /**
   * 更新tag组件标签项
   * @param  {String} name 哪种类型资源标签
   * @param  {Object} item 新增的资源
   * @return {Void}      [description]
   */
  _pro.__updateTag = function (name, item) {
    switch (name) {
      case 'template':
        this.__tlTag._$add(item);
        if (!!this.__templates) {
          this.__templates.push(item);
        } else {
          this.__templates = [item];
        }
        break;
      case 'interface':
        this.__inTag._$add(item);
        if (!!this.__interfaces) {
          this.__interfaces.push(item);
        } else {
          this.__interfaces = [item];
        }
        break;
    }
  };
  /**
   * 处理表单提交事件
   * @return {Void}
   */
  _pro.__handleSubmit = function () {
    if (this.__submit) {
      return;
    }
    if (this.__formObj._$checkValidity()) {
      var options = this.__getSubmitOptions();
      if (!options.templateIds || !options.templateIds.length) {
        _notify.show('至少需要一个模板', 'error', 2000);
        return;
      }
      if (!this.__parametersCheckResult) {
        _notify.show(this.__parametersCheckMsg, 'error', 2000);
        return;
      }
      this.__disableBtn(this.__formElem['save'], '提交中...', true);
      this.__submit = true;
      this.__pageCache._$addItem({
        key: this._listCacheKey,
        data: options
      });
    }
  };
  /**
   * 获取表单提交数据
   * @return {Object} 表单数据
   */
  _pro.__getSubmitOptions = function () {
    var data = this.__editor._$getData() || {};
    this.__parametersCheckResult = data.pass;
    this.__parametersCheckMsg = data.msg;
    var tags = this.__tag._$getTags().map(function (item) {
      return item.name;
    });
    var templateIds = this.__tlTag._$getTags().map(function (item) {
      return item.id;
    });
    var interfaceIds = this.__inTag._$getTags().map(function (item) {
      return item.id;
    });
    return {
      name: this.__formElem['name'].value,
      projectId: this.__pid,
      path: this.__formElem['path'].value,
      description: this.__formElem['description'].value,
      className: this.__formElem['classname'].value || '',
      tag: tags && tags.length ? tags.join(',') : '',
      params: data.params || [],
      templateIds: templateIds,
      interfaceIds: interfaceIds || [],
      respoId: this.__respo.id,
      groupId: this.__group.id,
      imports: data.imports || []
    };
  };

  /**
   * 填入表单逻辑
   * @param  {Object} _options 待填入表单数据
   * @return {Void}
   */
  _pro.__doFillForm = function (_options) {
    var _eName = this.__form.getElementsByTagName('input')[0];
    var _ePath = this.__form.getElementsByTagName('input')[1];
    var _eClassName = this.__form.getElementsByTagName('input')[2];
    var _eDesc = this.__form.getElementsByTagName('textarea')[0];
    if (_options.from == 'template') {
      if (_eName.value.length == 0) {
        _e._$attr(_eName, 'value', _options.name);
      }
      if (_ePath.value.length == 0 || _ePath.value == '/') {
        _e._$attr(_ePath, 'value', _options.path);
      }
      if (_eDesc.value.length == 0) {
        _e._$attr(_eDesc, 'value', _options.description);
      }
    } else {
      _e._$attr(_eName, 'value', _options.name);
      _e._$attr(_ePath, 'value', _options.path);
      _e._$attr(_eClassName, 'value', _options.className);
      _eDesc.innerHTML = _options.description;
    }

    //  this.__editor._$setEditorResult(_options.params);
  };
  /**
   * 表单重置
   * @return {Void}
   */
  _pro.__resetForm = function () {
    //父类定义的表单重置方法
    this.__formReset();

    this.__editor._$reset();
    this.__tag._$empty();
    this.__tlTag._$empty();
    this.__inTag._$empty();
  };

  _m._$regist(
    'progroup-p-page-create',
    _p._$$ModuleProGroupPPCreate
  );
});
