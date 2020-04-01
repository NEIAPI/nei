NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/form/form',
  'base/util',
  'pro/common/module',
  'pro/common/res_create',
  'pro/cache/rpc_cache',
  'pro/cache/group_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/notify/notify',
  'pro/select2/select2',
  'pro/modal/modal',
  'pro/tagme/tagme'
], function (_k, _e, _v, _t, _l, _f, _u, _m, create, cache, groupCache, proCache, pgCache, userCache, notify, Select2, _modal, _tag, _p, _pro) {

  _p._$$ModuleResRpcCreate = _k._$klass();
  _pro = _p._$$ModuleResRpcCreate._$extend(create._$$ModuleResCreate);

  _pro.__doBuild = function (config) {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-rpc-create')
    );
    this.localStorageKey = 'RPC_CREATE_TEMP';
    var options = {
      resType: 'rpc',
      localStorageKey: this.localStorageKey,
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__rpcCache',
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
      hasShare: true,
      hasFollowTag: true,
      config: config
    };
    this.apiAudit = 0;
    this.proCache = proCache._$$CachePro._$allocate({
      onitemload: function () {
        var currentProject = this.proCache._$getItemInCache(this.projectId);
        this.progroupId = currentProject.progroupId;
        this.pgCache._$getItem({
          id: this.progroupId
        });
      }._$bind(this)
    });
    this.pgCache = pgCache._$$CacheProGroup._$allocate({
      onitemload: function () {
        this.apiAudit = this.pgCache._$getApiAuditStatus(this.progroupId);
        this._initSelectClassName();
        this.__initFollowTag();
      }._$bind(this)
    });
    this.__super(options);
  };

  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.projectId = _options.param.pid;
    this.proCache._$getItem({
      id: this.projectId
    });
  };

  /**
   * 隐藏模块
   */
  _pro.__onHide = function () {
    this.__super();
    this.__followTag && (this.__followTag = this.__followTag._$recycle());
    this.__classNameSelect && (this.__classNameSelect = this.__classNameSelect.destroy());
  };
  /**
   * 实例化接口类名选择器组件
   * @return {[type]}
   */
  _pro._initSelectClassName = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'classname-select')[0];
    this.__classNameSelect = new Select2({
      data: {
        placeholder: '请输入 RPC 接口的类名',
        maxLen: 500,
        source: this.__rpcCache._$getClassNameList(this.__pid),
        selectFirst: false,
        choseOnly: false
      }
    }).$inject(selectDiv);
  };

  /**
   * 实例化关注人
   */
  _pro.__initFollowTag = function () {
    var list = this.pgCache._$getRespoSelectSource(this.progroupId);

    var tags = [];
    var self = this;
    if (this.__watchUserIds && this.__watchUserIds.length > 0) {
      tags = list.filter(function (user) {
        return self.__watchUserIds.includes(user.id);
      });
    }

    this.__followTag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'follow')[0],
      preview: false,
      choseOnly: true,
      placeholder: '请选择关注人',
      tags: tags,
      list: list,
      done: function (data) {
        if (!!data.change) {
          this.__watchUserIds = data.tags.map(function (user) {
            return user.id;
          });
        }
      }.bind(this)
    });
  };

  _pro.__refreshFollowTag = function () {
    if (this.__followTag) {
      var list = this.pgCache._$getRespoSelectSource(this.progroupId);
      var tags = [];
      var self = this;
      if (this.__watchUserIds && this.__watchUserIds.length > 0) {
        tags = list.filter(function (user) {
          return self.__watchUserIds.includes(user.id);
        });
      }
      this.__followTag._$add(tags);
    }
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
    //此处进行判断，如果项目组配置了接口审查功能，status初始为审核中，未开启的默认状态为未开始
    return {
      name: this.__formElem['name'].value,
      className: this.__classNameSelect ? this.__classNameSelect.data.inputValue : '',
      path: this.__formElem['path'].value,
      tag: tags && tags.length ? tags.join(',') : '',
      description: this.__formElem['description'].value || '',
      respoId: this.__respo.id,
      groupId: this.__group ? this.__group.id : 0,
      projectId: this.__pid,
      userIds: this.__watchUserIds || []
    };
  };

  /**
   * 内容存储
   */
  _pro.__setStorage = function () {
    var storOpt = this.__getSubmitOptions();
    storOpt.respo = this.__respo;
    storOpt.group = this.__group;
    storOpt.tags = this.__tags;
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(storOpt));
  };

  /**
   * 填入表单逻辑
   * @param  {Object} options 待填入表单数据
   */
  _pro.__doFillForm = function (options) {
    var items = ['name', 'path'];
    _u._$forEach(items, function (item) {
      _e._$attr(this.__formElem[item], 'value', options[item]);
    }.bind(this));
    this.__formElem['description'].innerHTML = options.description;
    this.__watchUserIds = options.userIds;
  };

  /**
   * 表单重置
   */
  _pro.__resetForm = function () {
    //父类定义的表单重置方法
    this.__formReset();
    this.__tag._$empty();
  };

  // notify dispatcher
  _m._$regist(
    'res-rpc-create',
    _p._$$ModuleResRpcCreate
  );
});
