NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/util',
  'base/event',
  'util/event/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/cache/constraint_cache',
  'pro/cache/page_cache',
  'pro/cache/group_cache',
  'pro/cache/pg_cache',
  'pro/cache/parameter_cache',
  'pro/cache/template_cache',
  'pro/cache/interface_cache',
  'pro/cache/datatype_cache',
  'pro/stripedlist/stripedlist',
  'pro/activitylist/activitylist',
  'pro/param_editor/param_editor',
  'pro/tagme/tagme',
  'pro/select2/select2',
  'pro/modal/modal',
  'pro/notify/notify'
], function (_k, u, _e, _u, _v, c, _t, _l, _j, _m, util, jstExt, _csCache, cache, _groupCache, _pgCache, paramCache, _tlCache, _inCache, dataTypeCache, stripedList, _aList, paramEditor, _tag, _s2, _modal, Notify, _p, _pro) {

  _p._$$ModuleProGroupPPDetail = _k._$klass();
  _pro = _p._$$ModuleProGroupPPDetail._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-p-p-detail')
    );
    this.__cacheOptions = {
      onitemload: function () {
        this.page = this.__cache._$getItemInCache(this.__pageId);
        this.__initResourceList();
        //业务分组cache
        this.__groupCache = _groupCache._$$CacheGroup._$allocate({
          onlistload: function (result) {
            //项目组cache，用于获取用户
            this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
              onitemload: function () {
                this.__renderView();
              }.bind(this)
            });
            this.__pgCache._$getItem({
              id: this.page.progroupId
            });
          }.bind(this)
        });
        this.__groupCache._$getList({
          key: this.__groupCache._$getListKey(this.__pid),
          data: {
            pid: this.__pid
          }
        });
      }.bind(this),
      onitemupdate: function (evt) {
        this.page = this.__cache._$getItemInCache(this.__pageId);
        //如果更新了接口或模板列表，就重新渲染striplist
        if (!!evt.ext && (evt.ext.type == 'template' || evt.ext.type == 'interface')) {
          this.__initResourceList();
          var option = {
            type: evt.ext.type,
            list: evt.data[evt.ext.type + 's']
          };
          this.__refreshList(option);
        }
        this._initActivityList();
      }._$bind(this)
    };
    this.__templateListOptions = {
      filter: function (list, listStates) {
        return this.__filter(list, listStates, 'template');
      }.bind(this),
      headers: [
        {
          name: '名称',
          key: 'name'
        },
        {
          name: '路径',
          key: 'path'
        },
        {
          name: '负责人',
          key: 'respo.realname',
          valueType: 'deepKey'
        },
        {
          name: '创建者',
          key: 'creator.realname',
          valueType: 'deepKey'
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions'
        }
      ],
      batchAction: (function () {
        return '<a class="batch-action-item" data-action=\'{"event":"page-detail-delete-template","type":"update","cache":"page" }\'>删除</a>';
      })(),
      addRow: this.__addRow._$bind(this, 'template'),
      hasNoItemTipIcon: false,
    };

    this.__interfaceListOptions = {
      filter: function (list, listStates) {
        return this.__filter(list, listStates, 'interface');
      }.bind(this),
      headers: [
        {
          name: '名称',
          key: 'name'
        },
        {
          name: '请求方式',
          key: 'method'
        },
        {
          name: '请求地址',
          key: 'path',
          valueType: 'deepKey'
        },
        {
          name: '负责人',
          key: 'respo.realname',
          valueType: 'deepKey'
        },
        {
          name: '创建者',
          key: 'creator.realname',
          valueType: 'deepKey'
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions'
        }
      ],
      batchAction: (function () {
        return '<a class="batch-action-item" data-action=\'{"event":"page-detail-delete-interface","type":"update","cache":"page"}\'>删除</a>';
      })(),
      addRow: this.__addRow._$bind(this, 'interface'),
      hasNoItemTipIcon: false,
    };
    //模板cache和接口cache实例化
    this.__inCache = _inCache._$$CacheInterface._$allocate({});
    this.__tlCache = _tlCache._$$CacheTemplate._$allocate({});
    //规则函数cache
    this.__csCache = _csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this.__renderView();
      }.bind(this)
    });
    //注册自定义事件
    c._$$CustomEvent._$allocate({
      element: window,
      event: [
        'page-detail-delete-interface',
        'page-detail-delete-template'
      ]
    });
  };

  /**
   * 获取模板/接口列表数据
   * @param {Void}
   */
  _pro.__initResourceList = function () {
    this.__inList = [];
    this.__tlList = [];
    _u._$forEach(this.page.interfaces, function (item) {
      this.__inList.push(item.id);
    }._$bind(this));
    _u._$forEach(this.page.templates, function (item) {
      this.__tlList.push(item.id);
    }._$bind(this));
  };

  /**
   * 模板/接口列表添加
   * @param {String} 添加的列表类型
   */
  _pro.__addRow = function (type) {
    var parent = _e._$getByClassName(this.__body, type + 's-list')[0];
    var editingParent = _e._$getByClassName(parent, 'list-wrap')[0];
    //只能有一个当前操作的行
    if (!!_e._$getByClassName(parent, 'row-add-item')[0]) {
      return;
    }
    //插入正在操作的行
    var typeName = type == 'template' ? '模板' : '接口';
    var _hintHTML = '<div class=" tag"></div><i class="u-icon-yes-normal confirm"></i><i class="u-icon-no-normal cancel"></i><a class="stateful create-btn ">新建' + typeName + '</a>';
    var node = _e._$create('div', 'list-row row-item row-add-item', editingParent);
    node.innerHTML = _hintHTML;
    //初始化tagme组件
    var tagParent = _e._$getByClassName(editingParent, 'tag')[0];
    this.__initTag(type, tagParent, typeName);
    //缓存需要操作的节点
    var addBtn = _e._$getByClassName(editingParent, 'create-btn')[0];
    var editingItem = _e._$getByClassName(editingParent, 'row-add-item')[0];
    var addConfirmBtn = _e._$getByClassName(editingItem, 'confirm')[0];
    var cancelBtn = _e._$getByClassName(editingItem, 'cancel')[0];
    if (type == 'interface') {
      if (this.__inList.length == 0) {
        _e._$addClassName(editingItem, 'z-margin');
      }
    }
    this.__doInitDomEvent([[
      addBtn, 'click', this.__inlineCreate._$bind(this, type, editingItem)
    ], [
      addConfirmBtn, 'click', this.__addRowConfirm._$bind(this, type, typeName)
    ], [
      cancelBtn, 'click', this.__addRowCancel._$bind(this, editingItem, editingParent)
    ]]);
  };

  /**
   * 模板/接口列表添加请求
   * @param {String} type 添加的列表类型(模板或者资源)
   *  @param {String} typeName 添加的列表类型名称(模板或者资源)
   */

  _pro.__addRowConfirm = function (type, typeName) {
    var cacheType = type == 'template' ? 'tl' : 'in';
    var resourceIds = [];
    var resourceIdsName = type + 'Ids';
    var obj = {};
    //获取用tagme组件上选中的模板的id
    var tags = this['__' + cacheType + 'Tag']._$getTags();
    //获取页面上已存在的模板的id
    resourceIds = this['__' + cacheType + 'List'];
    _u._$forEach(tags, function (item) {
      resourceIds.push(item.id);
    });
    obj[resourceIdsName] = resourceIds;
    //如果没添加模板，就不发送请求
    if (tags.length) {
      var ext = {type: type};
      //发送请求
      this.__update(obj, ext);
    } else {
      Notify.error('添加的' + typeName + '不能为空');
    }
  };
  /**
   * 模板/接口列表添加取消
   * @param {Object} editingItem 正在操作的列节点
   * @param {Object} editingParent 资源（模板||接口）列表父节点
   */
  _pro.__addRowCancel = function (editingItem, editingParent) {
    editingParent.removeChild(editingItem);
  };

  /**
   * 初始化tagme组件
   * @param {String} type 添加的列表类型
   * @param {Object} tagParent 添加tagme组件的父节点
   * @param {String} typeName 添加的列表类型名称
   * @return {Void}
   */

  _pro.__initTag = function (type, tagParent, typeName) {
    var searchCache, searchCacheKey, resourceList;
    var tagType = type == 'template' ? 'tl' : 'in';
    if (type == 'template') {
      searchCache = _tlCache._$$CacheTemplate;
      searchCacheKey = this.__tlCache._$getListKey(this.__pid);
    } else {
      searchCache = _inCache._$$CacheInterface;
      searchCacheKey = this.__inCache._$getListKey(this.__pid);
    }

    //初始化模板和接口的 tagme组件
    this['__' + tagType + 'Tag'] = _tag._$$ModuleTagme._$allocate({
      parent: tagParent,
      searchCache: searchCache,
      searchCacheKey: searchCacheKey,
      searchResultFilter: function (list) {
        //不删除cache原有的数据，copy一份再操作
        var newList = util._$filterVersion(list);
        _u._$reverseEach(newList, function (item, index) {
          _u._$forEach(this['__' + tagType + 'List'], function (item2) {
            if (item.id == item2) {
              newList.splice(index, 1);
            }
          }._$bind(this));
        }._$bind(this));
        return newList.map(function (item) {
          return {
            id: item.id,
            name: item.name,
            namePinyin: item.namePinyin,
            title: item.name + '(' + item.path + ')'
          };
        });
      }._$bind(this),
      preview: false,
      choseOnly: true,
      tags: [],
      done: function (data) {
      }.bind(this),
      queryData: {
        pid: this.__pid
      },
      placeholder: '请选择' + typeName
    });
  };

  /**
   * 内嵌创建资源弹窗
   * @param  {String} type 资源类型
   * @param  {Object} evt  事件
   * @return {Void}
   */
  _pro.__inlineCreate = function (type, evt) {
    var listKey;
    if (type == 'template') {
      listKey = this.__tlCache._$getListKey(this.__pid);
    } else {
      listKey = this.__inCache._$getListKey(this.__pid);
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
      modal.destroy();
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

  _pro.__initWatch = function () {
    this.__watchBtn = _e._$getByClassName(this.__body, 'watch')[0];
    this.__cancleWatchBtn = _e._$getByClassName(this.__body, 'cancle-watch')[0];
    _v._$addEvent(this.__watchBtn, 'click', this.__watch._$bind(this));
    _v._$addEvent(this.__cancleWatchBtn, 'click', this.__cancleWatch._$bind(this));
    this._renderWatchers(this.page.watchList);
  };

  _pro.__watch = function () {
    this.__cache._$watchOrCancleWatch({
      rtype: 'pages',
      id: this.__pageId,
      watch: 1,
      onload: function (event) {
        _e._$addClassName(this.__watchBtn, 'fn');
        _e._$delClassName(this.__cancleWatchBtn, 'fn');
        this._renderWatchers(event.data.watchList);
        //项目成员中对缓存进行更新
      }._$bind(this)
    });
  };
  _pro.__cancleWatch = function () {
    this.__cache._$watchOrCancleWatch({
      rtype: 'pages',
      id: this.__pageId,
      watch: 0,
      onload: function (event) {
        _e._$addClassName(this.__cancleWatchBtn, 'fn');
        _e._$delClassName(this.__watchBtn, 'fn');
        this._renderWatchers(event.data.watchList);
      }._$bind(this)
    });
  };
  /**
   * 渲染关注人区域
   * @param {Array} 项目关注人
   */
  _pro._renderWatchers = function (watchList) {
    var _watchArea = _e._$getByClassName(this.__body, 'watch-list-container')[0];
    var _watchers = '';
    var _members = this.__pgCache._$getRespoSelectSource(this.page.progroupId);
    var _watchList = watchList;
    if (_watchList.length > 0) {
      for (var i = 0; i < _watchList.length; i++) {
        _members.map(function (member) {
          if (member['id'] == _watchList[i]) {
            _watchers += jstExt.escape2(member['name']) + '，';
          }
        });
      }
      _watchers = _watchers.substring(0, _watchers.length - 1);
    }
    _watchArea.innerHTML = _watchers;
  };

  /**
   * 渲染视图
   * @return {[type]} [description]
   */
  _pro.__renderView = function () {
    //获取用户身份及权限
    var role = this.__pgCache._$getRole(this.page.progroupId);
    this._permit = true;
    if (role == 'observer') {
      this._permit = false;
    }
    this.page.permit = this._permit;
    // 隐藏加载中提示
    _e._$delClassName(this.__body, 'f-dn');
    _e._$addClassName(this.__loading, 'f-dn');
    this.__addActionData();
    this.__body.innerHTML = _j._$get('m-pg-p-p-detail',
      u._$merge(
        {},
        this.page,
        {
          __actions: this.actions
        }
      )
    );
    this.__nameInput = _e._$getByClassName(this.__body, 'title')[0];
    this.__descTextarea = _e._$getByClassName(this.__body, 'u-m-txt')[0];
    this.__initWatch();
    this._initActivityList();
    //实例化选择器
    this._initSelectGroup();
    this._initSelectRespo();

    //参数编辑器
    this.__editorPart = _e._$getByClassName(this.__body, 'd-item')[1];
    var editorOption = {
      parent: _e._$getByClassName(this.__editorPart, 'list')[0],
      parentId: this.__pageId,
      parentType: 0,
      pid: this.__pid,
      formatChangeable: false,
      preview: true,
      onChange: this._renderMockData.bind(this)
    };
    this.__paramEditor = paramEditor._$$ParamEditor._$allocate(editorOption);

    //标签组件
    this.__tag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'tag-select')[0],
      searchCache: cache._$$CachePage,
      searchCacheKey: cache._$cacheKey,
      searchResultFilter: function () {
        return this.__cache._$getTagList();
      }.bind(this),
      preview: true,
      choseOnly: false,
      tags: this.page.tag.split(','),
      resourceId: this.__pageId,
      editable: this._permit,
      done: function (data) {
        if (!!data.change) {
          var tag = data.tags.map(function (tag) {
            return tag.name;
          }).join(',');
          var data = {tag: tag};
          this.__update(data);
        }
      }.bind(this),
      queryData: {
        pid: this.__pid
      }
    });
    //列表实例化
    if (!this._permit) {
      this.__templateListOptions.addRow = null;
      this.__interfaceListOptions.addRow = null;
      this.__templateListOptions.batchAction = '';
      this.__interfaceListOptions.batchAction = '';
    }
    this.__templateListOptions.parent = _e._$getByClassName(this.__body, 'templates-list')[0];
    this.__templateListOptions.xlist = this.page.templates;
    this.__templateList = stripedList._$$ModuleStripedList._$allocate(this.__templateListOptions);
    this.__interfaceListOptions.parent = _e._$getByClassName(this.__body, 'interfaces-list')[0];
    this.__interfaceListOptions.xlist = this.page.interfaces;
    this.__interfaceList = stripedList._$$ModuleStripedList._$allocate(this.__interfaceListOptions);
    // 高亮范例代码
    this._initSampleCode();

  };


  /**
   * 实例化activity 组件
   */
  _pro._initActivityList = function () {
    if (!!this.__activityList) {
      this.__activityList._$recycle();
    }
    //活动列表
    this.__activityList = _aList._$$ModuleActivityList._$allocate({
      parent: _e._$getByClassName(this.__body, 'activity-list')[0],
      key: 'activities-pages',
      id: this.__pageId,
      count: 1
    });
  };

  /**
   * 实例化分组选择器组件
   */
  _pro._initSelectGroup = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'group-select')[0];
    if (!!this._permit) {
      this.__groupSelect = new _s2({
        data: {
          source: this.__groupCache._$getGroupSelectSource(this.__pid),
          selected: this.page.group,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          var data = {groupId: result.selected.id};
          this.__update(data);
        }.bind(this));
    } else {
      selectDiv.innerHTML = this.page.group.name;
    }

  };
  /**
   * 实例化负责人选择器组件
   */
  _pro._initSelectRespo = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'respo-select')[0];
    this.page.respo.name = this.page.respo.realname;
    if (!!this._permit) {
      this.__respoSelect = new _s2({
        data: {
          source: this.__pgCache._$getRespoSelectSource(this.page.progroupId),
          selected: this.page.respo,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          var data = {respoId: result.selected.id};
          this.__update(data);
        }.bind(this));
    } else {
      selectDiv.innerHTML = this.page.respo.name;
    }

  };
  // 添加 action manager 需要的信息
  _pro.__addActionData = function () {
    this.actions = {};
    Object.keys(this.page).forEach(function (key) {
      switch (key) {
        case 'description':
          this.actions[key] = {
            type: 'modify',
            cache: 'page',
            name: key,
            id: this.__pageId
          };
          break;
        case 'respo':
        case 'group':
        case 'path':
          this.actions[key] = {
            type: 'modify',
            required: true,
            cache: 'page',
            name: key,
            id: this.__pageId
          };
          break;
      }
    }, this);
  };
  /**
   * 显示模块
   * @param  {Object}_options - 配置信息
   */
  _pro.__onShow = function (_options) {
    this.__cache = cache._$$CachePage._$allocate(this.__cacheOptions);
    this._paramCache = paramCache._$$CacheParameter._$allocate();
    this.__doInitDomEvent([
      [
        cache._$$CachePage, 'listchange',
        function (evt) {
          this.__refreshList(evt);
        }.bind(this)
      ], [
        _tlCache._$$CacheTemplate, 'add',
        function (result) {
          if (result.ext.type == 'private') {
            this._addResourceHandler('template', 'tl', result.data);
          }
        }.bind(this)
      ], [
        _inCache._$$CacheInterface, 'add',
        function (result) {
          if (result.ext.type == 'private') {
            this._addResourceHandler('interface', 'in', result.data);
          }
        }.bind(this)
      ], [
        window, 'page-detail-delete-interface',
        function (actionData) {
          // stripedlist 中的批量删除
          this._deleteResourceHandler('interface', 'in', actionData);
        }.bind(this)
      ], [
        window, 'page-detail-delete-template',
        function (actionData) {
          // 批量删除模板
          this._deleteResourceHandler('template', 'tl', actionData);
        }.bind(this)
      ]
    ]);
    this.__super(_options);
  };


  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    // 显示加载中提示
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    _e._$delClassName(this.__loading, 'f-dn');
    _j._$add('m-pg-p-p-detail');
    _e._$addClassName(this.__body, 'f-dn');

    this.__pageId = _options.param.id.replace('/', '');
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__super(_options);
    this.__cache._$getItem({
      id: this.__pageId,
      key: cache._$cacheKey
    });
  };

  /**
   * 添加资源（模板或者接口）回调处理
   * @param {String} type 资源类型
   * @param {String} cacheType 资源cache类型
   * @param {Object} data 新增的一个资源（模板或接口）
   * @return {Void}
   */

  _pro._addResourceHandler = function (type, cacheType, data) {
    var resourceIds = [];
    var resourceIdsName = type + 'Ids';
    var obj = {};
    var listPrivateKey = this['__' + cacheType + 'Cache']._$getListKey(this.__pid, this.__pageId);
    //cache里没有新增的数据，所以从cache拿到之后，再把新增的数据加进去
    var list = this['__' + cacheType + 'Cache']._$getListInCache(listPrivateKey);
    list.push(data);
    _u._$forEach(list, function (item) {
      resourceIds.push(item.id);
    });
    obj[resourceIdsName] = resourceIds;
    var ext = {type: type};
    //发送请求
    this.__update(obj, ext);
  };

  /**
   * 删除资源（模板或者接口）回调处理
   * @param {String} type 资源类型
   * @param {String} cacheType 资源cache类型
   * @param {Object} data 新增的一个资源（模板或接口）
   * @return {Void}
   */
  _pro._deleteResourceHandler = function (type, cacheType, data) {
    var handler = function () {
      var resourceIds = [];
      var resourceIdsName = type + 'Ids';
      var obj = {};
      if (type == 'template') {
        if (this.__tlList.length == 1 || this.__tlList.toString() == data.ids.toString()) {
          Notify.error('至少需要一个模板');
          return;
        }
      }
      //删除选中的资源（模板或接口) this['__' + cacheType + 'List'] 为模板或接口列表
      _u._$reverseEach(this['__' + cacheType + 'List'], function (item, index) {
        _u._$forEach(data.ids, function (item2) {
          if (item == item2) {
            this['__' + cacheType + 'List'].splice(index, 1);
          }
        }._$bind(this));
      }._$bind(this));
      resourceIds = this['__' + cacheType + 'List'];
      obj[resourceIdsName] = resourceIds;

      //发送请求更新数据
      var ext = {type: type};
      this.__update(obj, ext);
    };
    // 初始化确认删除的弹窗
    if (!!this['__modal' + type + 'Del']) {
      this['__modal' + type + 'Del'] = this['__modal' + type + 'Del'].destroy();
      this['__modal' + type + 'Del'] = null;
    }
    this['__modal' + type + 'Del'] = _modal.confirm({
      content: '确定要删除吗?'
    });
    this['__modal' + type + 'Del'].$on('ok', handler._$bind(this));

  };
  /**
   * 模块隐藏
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    !!this.__paramEditor && this.__paramEditor._$recycle();
    !!this.__activityList && this.__activityList._$recycle();
    !!this.__templateList && this.__templateList._$recycle();
    !!this.__interfaceList && this.__interfaceList._$recycle();
    !!this.__tlCache && this.__tlCache._$recycle();
    !!this.__inCache && this.__inCache._$recycle();
    !!this.__csCache && this.__csCache._$recycle();
    !!this._paramCache && this._paramCache._$recycle();
    if (!!this.__nameInput) {
      this.__nameInput.value = '';
    }
    if (!!this.__descTextarea) {
      this.__descTextarea.value = '';
    }
    this.__doClearDomEvent();
  };
  /**
   * 列表过滤方法
   * @param  {Array} list  待处理列表
   * @param  {Object} listStates  列表状态
   * @param  {String} tag  判断是哪一个列表
   * @return {Array} list  处理后的列表
   */
  _pro.__filter = function (list, listStates, tag) {
    // 处理 action 列
    list.forEach(function (item) {
      var itemState = listStates[item.id];
      // 这些可以放到模板中去处理
      itemState['__nei-actions'] = '';
      // 查看详情
      itemState['__nei-actions'] += '<a href="/' + tag + '/detail/?pid=' + this.__pid + '&id=' + item.id + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';
      //观察者没有删除权限
      if (!!this._permit) {
        // 删除当前项
        itemState['__nei-actions'] += '<a data-action=\'{"ids":[' + item.id + '],"event":"page-detail-delete-' + tag + '"}\'  title="删除当前项"><em class="u-icon-delete-normal"></em></a>';
      }
    }._$bind(this));
    return list;
  };

  /**
   * 操作列表请求返回数据更新列表
   * @param  {Object} result 返回数据结果
   * @return {Void}
   */
  _pro.__refreshList = function (result) {
    var tag = result.type;
    switch (tag) {
      case 'template':
        this.__templateList._$updateList(result.list);
        break;
      case 'interface':
        this.__interfaceList._$updateList(result.list);
        break;
    }
  };

  /**
   * 发送请求更新数据
   * @param  {Object} data 修改的数据
   * @return {Object} ext 额外数据
   */
  _pro.__update = function (data, ext) {
    var options = {
      id: this.__pageId,
      data: data
    };
    if (!!ext) {
      options.ext = ext;
    }
    this.__cache._$updateItem(options);
  };
  /**
   * mock数据范例
   */
  _pro._initSampleCode = function () {
    this._sampleCodeContainer = _e._$getByClassName(this.__body, 'sample-code')[0];
    this._noSampleCodeContainer = _e._$getByClassName(this.__body, 'no-sample-code')[0];
    this.__dataTypeCache = dataTypeCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        this._renderMockData();
      }.bind(this)
    });
    this.__dataTypeListCacheKey = this.__dataTypeCache._$getListKey(this.__pid);
    this.__dataTypeCache._$getList({
      key: this.__dataTypeListCacheKey,
      data: {
        pid: this.__pid
      }
    });
  };
  /**
   * 渲染mock数据范例
   */
  _pro._renderMockData = function () {
    var dataTypes = this.__dataTypeCache._$getListInCache(this.__dataTypeListCacheKey);
    var params = this.page.params;
    var constraints = this.__csCache._$getListInCache(this.__csListCacheKey);
    util._$initParamsSampleCode(util.db.MDL_TYP_NORMAL, params, constraints, dataTypes, this._sampleCodeContainer, this._noSampleCodeContainer);
  };

  // notify dispatcher
  _m._$regist(
    'progroup-p-page-detail',
    _p._$$ModuleProGroupPPDetail
  );

});
