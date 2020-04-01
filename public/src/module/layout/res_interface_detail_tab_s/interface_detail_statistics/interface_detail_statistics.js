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
  'pro/cache/pg_cache',
  'pro/cache/interface_cache',
  'pro/cache/client_cache',
  'pro/stripedlist/stripedlist',
  'pro/tagme/tagme',
  'pro/select2/select2',
  'pro/modal/modal',
  'pro/notify/notify'
], function (_k, u, _e, _u, _v, c, _t, _l, _j, _m, _pgCache, _cache, _clientCache, stripedList, _tag, _s2, _modal, Notify, _p, _pro) {

  _p._$$ModuleInterfaceDetailStatistics = _k._$klass();
  _pro = _p._$$ModuleInterfaceDetailStatistics._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-interface-detail-statistics')
    );
    this.__cacheOptions = {
      onitemload: function () {
        this.__interface = this.__cache._$getItemInCache(this.__iid);
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this.__renderView();
          }.bind(this)
        });
        this.__pgCache._$getItem({
          id: this.__interface.progroupId
        });
      }.bind(this),
      onitemupdate: function (evt) {
        this.__interface = this.__cache._$getItemInCache(this.__iid);
        //如果更新了客户端列表，就重新渲染striplist
        if (evt.ext) {
          this.__initResourceList();
          this.__refreshList({
            list: evt.data.clients
          });
        }
      }._$bind(this)
    };

    this.__clientListOptions = {
      filter: function (list, listStates) {
        (list || []).forEach(function (item) {
          var itemState = listStates[item.id];
          itemState['__nei-actions'] = '';
          // 查看详情
          itemState['__nei-actions'] += '<a href="/client/detail/?pid=' +
            this.__pid + '&id=' + item.id +
            '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';
          if (this._permit) {
            // 删除当前项
            itemState['__nei-actions'] += '<a data-action=\'{"ids":[' + item.id +
              '],"event":"interface-detail-delete-client"}\' title="删除当前项"><em class="u-icon-delete-normal"></em></a>';
          }
        }._$bind(this));
        return list;
      }.bind(this),
      headers: [
        {
          name: '名称',
          key: 'name'
        },
        {
          name: '版本',
          key: 'version'
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
        return '<a class="batch-action-item" data-action=\'{"event":"interface-detail-delete-client","type":"update","cache":"interface"}\'>删除</a>';
      })(),
      addRow: this.__addRow._$bind(this),
      hasNoItemTipIcon: false,
    };
    //客户端cache实例化
    this.__clientCache = _clientCache._$$CacheClient._$allocate();

    //注册自定义事件
    c._$$CustomEvent._$allocate({
      element: window,
      event: [
        'interface-detail-delete-client'
      ]
    });
  };

  /**
   * 获取客户端列表数据
   * @param {Void}
   */
  _pro.__initResourceList = function () {
    this.__cltList = (this.__interface.clients || []).map(function (item) {
      return item.id;
    });
  };

  /**
   * 客户端列表添加
   */
  _pro.__addRow = function () {
    var parent = _e._$getByClassName(this.__body, 'clients-list')[0];
    var editingParent = _e._$getByClassName(parent, 'list-wrap')[0];
    //只能有一个当前操作的行
    if (_e._$getByClassName(parent, 'row-add-item')[0]) {
      return;
    }
    //插入正在操作的行
    var node = _e._$create('div', 'list-row row-item row-add-item', editingParent);
    node.innerHTML = '<div class=" tag"></div><i class="u-icon-yes-normal confirm"></i><i class="u-icon-no-normal cancel"></i><a class="stateful create-btn ">新建客户端</a>';
    //初始化tagme组件
    var tagParent = _e._$getByClassName(editingParent, 'tag')[0];
    this.__initTag(tagParent);
    //缓存需要操作的节点
    var addBtn = _e._$getByClassName(editingParent, 'create-btn')[0];
    var editingItem = _e._$getByClassName(editingParent, 'row-add-item')[0];
    var addConfirmBtn = _e._$getByClassName(editingItem, 'confirm')[0];
    var cancelBtn = _e._$getByClassName(editingItem, 'cancel')[0];
    if (this.__cltList.length == 0) {
      _e._$addClassName(editingItem, 'z-margin');
    }
    this.__doInitDomEvent([[
      addBtn, 'click', this.__inlineCreate._$bind(this, editingItem)
    ], [
      addConfirmBtn, 'click', this.__addRowConfirm._$bind(this)
    ], [
      cancelBtn, 'click', this.__addRowCancel._$bind(this, editingItem, editingParent)
    ]]);
  };

  /**
   * 客户端列表添加请求
   */
  _pro.__addRowConfirm = function () {
    var tags = this['__clientTag']._$getTags();
    var resourceIds = this['__cltList'];
    _u._$forEach(tags, function (item) {
      resourceIds.push(item.id);
    });
    //如果没添加客户端，就不发送请求
    if (tags.length) {
      //发送请求
      this.__update({
        clientIds: resourceIds
      });
    } else {
      Notify.error('添加的客户端不能为空');
    }
  };

  /**
   * 客户端列表添加取消
   * @param {Object} editingItem 正在操作的列节点
   * @param {Object} editingParent 资源（模板||接口）列表父节点
   */
  _pro.__addRowCancel = function (editingItem, editingParent) {
    editingParent.removeChild(editingItem);
  };

  /**
   * 内嵌创建客户端弹窗
   * @return {Void}
   */
  _pro.__inlineCreate = function () {
    var listKey = this.__clientCache._$getListKey(this.__pid);
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
      dispatcher._$hide('/?/progroup/p/res/client/create/');
      modal.destroy();
    });
    dispatcher._$redirect('/?/progroup/p/res/client/create/?pid=' + this.__pid, {
      input: {
        listKey: listKey,
        parent: modal.$refs.modalbd,
        done: function () {
          dispatcher._$hide('/?/progroup/p/res/client/create/');
          modal.destroy();
        }.bind(this)
      }
    });
  };

  /**
   * 初始化tagme组件
   * @param {Object} tagParent 添加tagme组件的父节点
   * @return {Void}
   */

  _pro.__initTag = function (tagParent) {
    var searchCache = _clientCache._$$CacheClient,
      searchCacheKey = this.__clientCache._$getListKey(this.__pid);

    this['__clientTag'] = _tag._$$ModuleTagme._$allocate({
      parent: tagParent,
      searchCache: searchCache,
      searchCacheKey: searchCacheKey,
      searchResultFilter: function (list) {
        //不删除cache原有的数据，copy一份再操作
        var newList = list.slice();
        _u._$reverseEach(newList, function (item, index) {
          _u._$forEach(this['__cltList'], function (item2) {
            if (item.id === item2) {
              newList.splice(index, 1);
            }
          }, this);
        }._$bind(this));
        return newList.map(function (item) {
          return {
            id: item.id,
            name: item.name,
            namePinyin: item.namePinyin,
            title: item.name + '(' + item.version + '-' + item.description + ')'
          };
        });
      }._$bind(this),
      preview: false,
      choseOnly: true,
      tags: [],
      queryData: {
        pid: this.__pid
      },
      placeholder: '请选择客户端'
    });
  };

  _pro.__renderView = function () {
    //获取用户身份及权限
    var role = this.__pgCache._$getRole(this.__interface.progroupId);
    this._permit = !(role === 'observer');
    this.__interface.permit = this._permit;
    // 隐藏加载中提示
    _e._$delClassName(this.__body, 'f-dn');
    _e._$addClassName(this.__loading, 'f-dn');
    this.__initResourceList();
    this.__body.innerHTML = _j._$get('m-inter-d-stat',
      u._$merge(
        {},
        this.__interface,
        {
          __actions: this.actions
        }
      )
    );

    if (!this._permit) {
      this.__clientListOptions.addRow = null;
      this.__clientListOptions.batchAction = '';
    }
    this.__clientListOptions.parent = _e._$getByClassName(this.__body, 'clients-list')[0];
    this.__clientListOptions.xlist = this.__interface.clients || [];
    this.__clientList = stripedList._$$ModuleStripedList._$allocate(this.__clientListOptions);
  };

  _pro.__onShow = function (_options) {
    this.__cache = _cache._$$CacheInterface._$allocate(this.__cacheOptions);
    this.__doInitDomEvent([
      [
        _cache._$$CacheInterface, 'listchange',
        function (evt) {
          this.__refreshList(evt);
        }.bind(this)
      ], [
        _clientCache._$$CacheClient, 'add',
        function (result) {
          if (result.ext.type == 'private') {
            this._addResourceHandler(result.data);
          }
        }.bind(this)
      ], [
        window, 'interface-detail-delete-client',
        function (actionData) {
          // stripedlist 中的批量删除
          this._deleteResourceHandler(actionData);
        }.bind(this)
      ]
    ]);
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    // 显示加载中提示
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    _e._$delClassName(this.__loading, 'f-dn');
    _e._$addClassName(this.__body, 'f-dn');

    this.__iid = _options.param.id.replace('/', '');
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__super(_options);
    this.__cache._$getItem({
      id: this.__iid,
      key: _cache._$cacheKey
    });
  };

  /**
   * 添加客户端回调处理
   * @param {Object} data 新增的一个资源（模板或接口）
   * @return {Void}
   */
  _pro._addResourceHandler = function (data) {
    //发送请求
    this.__update({
      clientIds: this['__cltList'].concat(data.id)
    });
  };

  /**
   * 删除客户端回调处理
   * @param {Object} data 新增的一个资源（模板或接口）
   * @return {Void}
   */
  _pro._deleteResourceHandler = function (data) {
    var handler = function () {
      _u._$reverseEach(this['__cltList'], function (item, index) {
        _u._$forEach(data.ids, function (item2) {
          if (item === item2) {
            this['__cltList'].splice(index, 1);
          }
        }._$bind(this));
      }._$bind(this));
      //发送请求更新数据
      this.__update({
        clientIds: this['__cltList']
      });
    };
    // 初始化确认删除的弹窗
    if (this['__modalClientDel']) {
      this['__modalClientDel'] = this['__modalClientDel'].destroy();
    }
    this['__modalClientDel'] = _modal.confirm({
      content: '确定要删除吗?'
    });
    this['__modalClientDel'].$on('ok', handler._$bind(this));
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
  };

  /**
   * 操作列表请求返回数据更新列表
   * @param  {Object} result 返回数据结果
   * @return {Void}
   */
  _pro.__refreshList = function (result) {
    this.__clientList._$updateList(result.list);
  };

  /**
   * 发送请求更新数据
   * @param  {Object} data 修改的数据
   */
  _pro.__update = function (data) {
    this.__cache._$updateItem({
      id: this.__iid,
      data: data,
      ext: {
        type: 'client'
      }
    });
  };

  // notify dispatcher
  _m._$regist(
    'interface-detail-statistics',
    _p._$$ModuleInterfaceDetailStatistics
  );
});
