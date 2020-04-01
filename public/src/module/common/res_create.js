/*
 * @资源创建基类
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'pro/common/res_base',
  'pro/cache/group_cache',
  'util/form/form',
  'pro/cache/user_cache',
  'pro/cache/config_caches',
  'pro/tagme/tagme',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/select2/select2',
  'pro/modal/modal',
  'pro/cache/template_cache',
  'pro/cache/interface_cache',
], function (_k, _e, _v, _u, resBase, groupCache, _f, userCache, caches, tagme, proCache, pgCache, select2, _modal, _tlCache, _inCache, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleResCreate}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResCreate = _k._$klass();
  _pro = _p._$$ModuleResCreate._$extend(resBase._$$ModuleResBase);

  /**
   * 模块构建
   * @param  {Object} _options 子类传给父类的配置信息
   * 下面为_options的属性信息
   * resType {String} 子类资源类型
   * listCache {String}  子类cacheKey
   * cacheName {String} 子类cache名称
   * callBackList {Array} cache监听的回调事件
   * eventList {Array} 需注册的自定义事件
   */
  _pro.__doBuild = function (_options) {
    var defaultOptions = {
      resType: '',
      listCache: null,
      //实例化cache实例名称
      cacheName: '',
      //是否有私有模块（新建的私有模块弹窗）
      hasPrivateFlag: true,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {},
      //模块中用到的私有模块
      inlineCreateList: [],
      //传进doinitDomEvent 的需初始化事件的数组，传子类特有的方法，或者重写父类已定义的方法
      // 两种方式可定义子类的方法或重写父类的方法
      // 1. customEventFunc 传入 eg： customEventFunc[[
      //window, 'res-crud', this.__showResCrud.bind(this)
      //]]
      // 2. 子类的doinitDomEvent中自己定义
      customEventFunc: [],
      //模块中是否有业务分组
      hasGroup: true,
      //模块中是否有负责人
      hasRespo: true,
      //模块中是否有标签
      hasTag: true,
      //模块是否能共享到公共资源库
      hasShare: true,
      //子模块可创建为私有模块时，dobuild时所传参数
      config: null,
      //实例化其他所需组件（参数编辑器等等）
      allocateComponent: null,

    };
    this._subOpt = _u._$merge(defaultOptions, _options);
    if (this._subOpt.hasPrivateFlag) {
      this.__private = !!this._subOpt.config ? this._subOpt.config.private : false;
    }
    this.__form = _e._$getByClassName(this.__body, 'm-form')[0];
    this.__formGroup = _e._$getByClassName(this.__form, 'form-group');
    this.__submit = false;
    //子类cache实例参数
    this.__initCacheOption();

    //项目cache实例参数
    this.__initProCacheOption();

    // 用户cache
    this.__userCache = userCache._$$CacheUser._$allocate();
    this.__user = this.__userCache._$getUserInCache();
  };

  _pro.__onShow = function (_options) {
    //实例化子类 cache
    this[this._subOpt.cacheName] = caches[this._subOpt.listCache]._$allocate(this[this._subOpt.cacheName + 'Options']);
    this.__proCache = proCache._$$CachePro._$allocate(this.__proCacheOptions);
    if (this._subOpt.hasGroup) {
      //分组cache
      this.__groupCache = groupCache._$$CacheGroup._$allocate({
        onlistload: this.__renderGroupSelect.bind(this)
      });

    }

    this.__super(_options);
    // 返回按钮
    var btngoback = _e._$getByClassName(this.__body, 'goback')[0];
    if (this._subOpt.hasPrivateFlag) {
      //若是私有模块调用创建接口
      if (this.__private) {
        this.__done = _options.input.done;
        this._listCacheKeyPrivate = _options.input.listKey;
        //返回按钮
        _e._$addClassName(btngoback, 'f-dn');
      } else {
        _e._$delClassName(btngoback, 'f-dn');
        _e._$attr(btngoback, 'href', this.__referer || '/' + this._subOpt.resType + '/?pid=' + this.__pid);
      }
    }
    //设置返回按钮url
    var url = _options.referer ? new URL(_options.referer) : '';
    this.__referer = url ? url.pathname + url.search : '';
    _e._$attr(_e._$getByClassName(this.__body, 'goback')[0], 'href', this.__referer || '/' + this._subOpt.resType + '/?pid=' + this.__pid);


    this.__disableBtn(this.__formElem['save'], '保存', false);
    //事件绑定
    this.__addEvent();
  };


  _pro.__onRefresh = function (_options) {
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__super(_options);
    this.__formElem = this.__form.elements;
    this._listCacheKey = this[this._subOpt.cacheName]._$getListKey(this.__pid);
    //获取保存数据并填入
    this.__dataStorge = window.localStorage.getItem(this._subOpt.localStorageKey) || null;
    if (this.__dataStorge) {
      this.__leaveLayer =
        _modal.confirm({
          'content': '您有已保存的数据，需要导入吗？',
          'title': '导入数据确认',
          'closeButton': false,
          'okButton': '导入',
          'cancelButton': true,
        })
          .$on('ok', function () {
            this.__leaveLayer = this.__leaveLayer.destroy();
            this.__leaveLayer = null;
            this.__initForm(true);
          }.bind(this))
          .$on('cancel', function () {
            this.__leaveLayer = this.__leaveLayer.destroy();
            this.__leaveLayer = null;
            this.__initForm(false);
          }.bind(this));
    } else {
      this.__initForm(false);
    }
  };

  _pro.__oncheck = function (event) {
  };

  _pro.__oninvalid = function (event) {
  };

  _pro.__initForm = function (useStorage) {
    if (useStorage) {
      this.__initDataFromStorge();
    }
    // 表单组件
    this.__formObj = _f._$$WebForm._$allocate({
      form: this.__form,
      oncheck: this.__oncheck,
      oninvalid: this.__oninvalid,
    });

    if (this._subOpt.hasFollowTag) {
      this.__refreshFollowTag();
    }

    if (this._subOpt.hasTag) {
      //标签列表组件
      this.__tag = tagme._$$ModuleTagme._$allocate({
        parent: _e._$getByClassName(this.__form, 'tag')[0],
        searchCache: caches[this._subOpt.listCache],
        searchCacheKey: this._subOpt.listCache,
        searchResultFilter: function () {
          return this[this._subOpt.cacheName]._$getTagList(this._subOpt.listCache);
        }.bind(this),
        preview: false,
        choseOnly: false,
        tags: this.__dataStorge && this.__dataStorge.tags ? this.__dataStorge.tags : [],
        done: function (result) {
          if (!!result.change) {
            this.__tags = result.tags;
            if (this._subOpt.resType === 'interface') {
              this.__checkValue();
            }
          }
        }.bind(this),
        queryData: {
          pid: this.__pid
        }
      });
    }

    //实例化子类自定义组件
    if (this._subOpt.allocateComponent) {
      this._subOpt.allocateComponent();
    }
    this.__proCache._$getItem({
      id: this.__pid
    });

    // 等待数据稳定检查变更
    var self = this;
    this.__paramChangeTimeoutId = setTimeout(function () {
      self.__checkParamChange();
    }, 2000);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__resetForm();
    this.__doClearDomEvent();
    this.__formObj._$reset();
    this.__formObj = this.__formObj._$recycle();
    if (this.__tag) {
      this.__tags = [];
      setTimeout(function () {
        this.__tag._$recycle();
        delete this.__tag;
      }.bind(this), 0);
    }
    if (this._subOpt.hasGroup) {
      this.__group = null;
      //公共资源库里面是没有分组的
      this.__groupSelect = this.__groupSelect && this.__groupSelect.destroy();
    }
    if (this._subOpt.hasRespo) {
      this.__respo = null;
      this.__respoSelect = this.__respoSelect.destroy();
    }
    this.__referer = null;
    this.__submit = false;
    clearTimeout(this.__paramChangeTimeoutId);
    clearInterval(this.__checkParamChangeIntervalId);
    this.__storeInterval = clearInterval(this.__storeInterval);
    // window.localStorage.removeItem(this._subOpt.resType);
  };

  /**
   *  根据storage 初始化数据
   */
  _pro.__initDataFromStorge = function () {
    if (!!this.__dataStorge) {
      this.__dataStorge = JSON.parse(this.__dataStorge);
      if (this._subOpt.hasTag) {
        this.__tags = this.__dataStorge.tags;
      }
      this.__doFillForm(this.__dataStorge);
    }
  };

  _pro.__checkParamChange = function () {
    this.__initData = JSON.stringify(this.__getSubmitOptions());
    clearInterval(this.__checkParamChangeIntervalId);
    var self = this;
    self.__checkParamChangeIntervalId = setInterval(
      function startAutoSaving() {
        if (JSON.stringify(self.__getSubmitOptions()) !== self.__initData) {
          // 检查到变更，开启存储
          // 开启自动存储
          self.__storeInterval = setInterval(self.__setStorage.bind(self), 1000);
          clearInterval(self.__checkParamChangeIntervalId);
        }
        return startAutoSaving;
      }(),
      1000
    );
  };

  /**
   *  子类cache实例参数
   */
  _pro.__initCacheOption = function () {
    this[this._subOpt.cacheName + 'Options'] = {};
    _u._$forEach(this._subOpt.callBackList, function (item) {
      switch (item) {
        case 'onitemadd':
          this[this._subOpt.cacheName + 'Options'].onitemadd = function (result) {
            var list = this[this._subOpt.cacheName]._$getListInCache(this._listCacheKey);
            if (this._subOpt.hasPrivateFlag) {
              if (!this.__private) {
                // window.localStorage.removeItem(this._subOpt.resType);
                dispatcher._$redirect('/' + this._subOpt.resType + '/detail/?pid=' + this.__pid + '&id=' + result.data.id);
                this.__submit = false;
              } else {
                this.__done();
              }
            } else {
              // window.localStorage.removeItem(this._subOpt.resType);
              dispatcher._$redirect('/' + this._subOpt.resType + '/detail/?pid=' + this.__pid + '&id=' + result.data.id);
              this.__submit = false;
            }
          }.bind(this);
          break;
        case 'onerror':
          this[this._subOpt.cacheName + 'Options'].onerror = function () {
            this.__submit = false;
            this.__disableBtn(this.__formElem['save'], '保存', false);
          }.bind(this);
          break;
        default:
          if (typeof (item) == 'object') {
            this[this._subOpt.cacheName + 'Options'][item.name] = item.func;
          }
          break;
      }
    }.bind(this));
    //子类cache实例
    this[this._subOpt.cacheName + 'Options'] =
      _u._$merge(this[this._subOpt.cacheName + 'Options'], this._subOpt.cacheOption);
  };

  /**
   *  项目cache实例参数
   * @return {Void}
   */
  _pro.__initProCacheOption = function () {
    this.__proCacheOptions = {
      onitemload: function (result) {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__groupCache._$getList({
          key: this.__groupCache._$getListKey(this.__pid),
          data: {
            pid: this.__pid
          }
        });
        var group = _e._$getByClassName(this.__form, 'form-group-group')[0];
        if (this.__project.type === 1) {
          _e._$addClassName(group, 'f-dn');
        } else {
          _e._$delClassName(group, 'f-dn');
        }

        //模块有负责人
        if (this._subOpt.hasRespo) {
          //项目组cache
          this.__pgCache = pgCache._$$CacheProGroup._$allocate({
            onitemload: this.__renderRespoSelect.bind(this)
          });
          //请求项目组信息
          this.__pgCache._$getItem({
            id: this.__project.progroupId
          });
        }
      }.bind(this)
    };
  };

  _pro.__addEvent = function () {
    var domEventList = [];
    //事件绑定
    domEventList.push([
      this.__formElem['save'], 'click',
      function () {
        // 延迟0秒是为了先拿到tag
        setTimeout(this.__handleSubmit._$bind(this), 0);
      }._$bind(this)
    ]);
    _u._$forEach(this._subOpt.inlineCreateList, function (item) {
      switch (item) {
        case 'group':
          var group = _e._$getByClassName(this.__form, 'form-group-group')[0];
          var gcBtn = _e._$getByClassName(group, 'create')[0];
          domEventList.push([
            groupCache._$$CacheGroup, 'add',
            function (result) {
              this.__groupSelect.$select(result.data);
            }.bind(this)
          ]);
          if (this.__private) {
            _e._$addClassName(gcBtn, 'f-dn');
          } else {
            domEventList.push([gcBtn, 'click', this.__inlineCreate.bind(this, 'group')]);
          }
          break;
        case 'template':
          var template = _e._$getByClassName(this.__form, 'form-template')[0];
          var tcBtn = _e._$getByClassName(template, 'create')[0]; //新建模版按钮
          domEventList.push([tcBtn, 'click', this.__inlineCreate.bind(this, 'template')], [
            _tlCache._$$CacheTemplate, 'add',
            function (result) {
              this.__updateTag('template', result.data);
            }.bind(this)
          ]);
          break;
        case 'interface':
          var interface = _e._$getByClassName(this.__form, 'form-interface')[0];
          var icBtn = _e._$getByClassName(interface, 'create')[0]; //新建接口按钮
          domEventList.push([icBtn, 'click', this.__inlineCreate.bind(this, 'interface')], [
            _inCache._$$CacheInterface, 'add',
            function (result) {
              this.__updateTag('interface', result.data);
            }.bind(this)
          ]);
          break;
        default:
          break;
      }
    }.bind(this));
    if (!this.__private) {
      domEventList.push([window, 'beforeunload', this.__doBeforeUnload.bind(this)]);
    }
    //子类自定义事件
    if (this._subOpt.customEventFunc.length) {
      _u._$forEach(this._subOpt.customEventFunc, function (item2) {
        domEventList.push(item2);
      }.bind(this));
    }
    if (!domEventList.length) {
      return;
    }
    ;
    this.__doInitDomEvent(domEventList);

  };
  /**
   * 嵌套创建分组
   * @param {String} type 创建模块类型（不传的时候默认为分组）
   * @return {Void}
   */
  _pro.__inlineCreate = function (type, evt) {
    evt.stopPropagation();
    evt.preventDefault();
    var listKey;
    if (!type) {
      type = 'group';
    }
    switch (type) {
      case 'group':
        listKey = this.__groupCache._$getListKey(this.__pid);
        break;
      case 'template':
        listKey = this.__tlCache._$getListKey(this.__pid);
        break;
      case 'interface':
        listKey = this.__inCache._$getListKey(this.__pid);
        break;
      default:
        break;
    }
    var modal = new _modal({
      data: {
        'content': '',
        'title': ' ',
        'noTitle': true,
        'class': 'inline-create',
        'okButton': false,
        'cancelButton': false,
        'closeButton': true
      }
    }).$on('close', function () {
      dispatcher._$hide('/?/progroup/p/res/' + type + '/create/');
    });
    dispatcher._$redirect('/?/progroup/p/res/' + type + '/create/?pid=' + this.__pid, {
      input: {
        listKey: listKey,
        parent: modal.$refs.modalbd,

        done: function () {
          dispatcher._$hide('/?/progroup/p/res/' + type + '/create/');
          modal.destroy();
        }.bind(this)
      }
    });
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
      this.__disableBtn(this.__formElem['save'], '提交中...', true);
      this.__submit = true;
      this[this._subOpt.cacheName]._$addItem({
        //如果是私有模块，则使用私有模块传进的listkey
        key: this.__private ? this._listCacheKeyPrivate : this._listCacheKey,
        data: this.__getSubmitOptions(),
        ext: {
          type: this.__private ? 'private' : 'public'
        }
      });
      _v._$clearEvent(window, 'beforeunload');
      clearInterval(this.__storeInterval);
      window.localStorage.removeItem(this._subOpt.localStorageKey);
    }
  };

  /**
   * 配置负责人选择
   * @return {Void}
   */
  _pro.__renderRespoSelect = function () {
    this.__respoSelect = new select2({
      data: {
        source: this.__pgCache._$getRespoSelectSource(this.__project.progroupId)
      }
    });
    // 设置默认选中项
    if (!!this.__dataStorge && this.__dataStorge.respo) {
      this.__respoSelect.$select(this.__dataStorge.respo);
      this.__respo = this.__dataStorge.respo;
    } else {
      this.__respoSelect.$select(this.__user);
      this.__respo = this.__user;
    }
    // 获取当前选中项
    this.__respoSelect.$inject(_e._$getByClassName(this.__form, 'respo')[0])
      .$on('change', function (result) {
        this.__respo = result.selected;
      }.bind(this));
    // 此时页面加载结束,保存当前表单数据,用来和离开前的数据比较以控制弹框提示。
    this.__initialData = JSON.stringify(this.__getSubmitOptions());
  };

  /**
   * 添加beforeunload执行逻辑
   * @return {Void}
   */
  _pro.__doBeforeUnload = function (evt) {
    evt.preventDefault();
    clearTimeout(this.__paramChangeTimeoutId);
    clearInterval(this.__checkParamChangeIntervalId);
    clearInterval(this.__storeInterval);
    if (!this.__submit && JSON.stringify(this.__getSubmitOptions()) !== this.__initialData) {
      evt.returnValue = '确认离开吗？';
      // window.localStorage.removeItem(this._subOpt.resType);
      // setTimeout(function () {
      //   this.__storeInterval = setInterval(this.__setStorage.bind(this), 1000);
      // }.bind(this), 0);
    }
  };

  /**
   * 配置业务分组选择
   * @return {Void}
   */
  _pro.__renderGroupSelect = function () {
    var groups = this.__groupCache._$getGroupSelectSource(this.__pid);
    this.__groupSelect = new select2({
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
  };

  _pro.__formReset = function () {
    this.__formObj && this.__formObj._$reset();
    var ipts = this.__form.getElementsByTagName('input');
    var textareas = this.__form.getElementsByTagName('textarea');
    if (ipts && ipts.length) {
      _u._$forEach(ipts, function (item) {
        item.value = '';
        item.defaultValue = '';
      });
    }
    if (textareas && textareas.length) {
      _u._$forEach(textareas, function (item) {
        item.value = '';
        item.innerHTML = '';
        item.defaultValue = '';
      });
    }
  };
});
