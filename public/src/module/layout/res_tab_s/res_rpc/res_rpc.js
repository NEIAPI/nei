NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/event/event',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/stripedlist/stripedlist',
  'pro/cache/rpc_cache',
  'pro/cache/datatype_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/cache/group_cache',
  'pro/notify/notify',
  'pro/modal/modal',
  'pro/modal/import_rpc/import_rpc',
  'pro/res_bat/res_copy_move/res_copy_move',
  'pro/res_bat/res_group/res_group',
  'text!pro/poplayer/share_layer.html',
  'pro/common/res_list'
], function (_k, _e, _v, _t, _l, _c, _m, util, jstExt, stripedList, cache, datatypeCache, _proCache, _pgCache, _usrCache, _groupCache, _notify, _modal, RpcImport, resCopyMove, resGroup, _html, resList, _p, _pro) {

  _p._$$ModuleResRpc = _k._$klass();
  _pro = _p._$$ModuleResRpc._$extend(resList._$$ModuleResList);

  _pro.__doBuild = function () {
    this.isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-rpc')
    );
    this._btnWrap = _e._$getByClassName(this.__body, 'resource-feature-part')[0];
    this._fileInput = _e._$getByClassName(this.__body, 'j-file')[0];
    this._dirInput = _e._$getByClassName(this.__body, 'j-dir')[0];
    this._dirImportBtn = _e._$getByClassName(this.__body, 'dir')[0];
    if (!this.isChrome) {
      _e._$addClassName(this._dirImportBtn, 'f-dn');
    }
    //项目cache
    this.proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.project = this.proCache._$getItemInCache(this.pid);
        this.progroupId = this.project.progroupId;
        this.pgCache._$getItem({
          id: this.progroupId
        });
      }.bind(this)
    });
    //项目组cache
    this.pgCache = _pgCache._$$CacheProGroup._$allocate({
      onitemload: function () {
        //获取项目组中的权限信息
        this.privilege = this.pgCache._$getPrivilege(this.progroupId);
      }._$bind(this)
    });
    var user = _usrCache._$$CacheUser._$allocate();
    var currentUserId = user._$getUserInCache().id; //当前登录用户ID
    var stripedListOption = {
      headers: [
        {
          name: '',
          key: '__isShare',
          valueType: 'share',
          sortable: false
        },
        {
          name: '',
          key: 'isConfirmed',
          valueType: 'isConfirmed',
          sortable: false,
          // 会放到 data-action 上面，事件交给 action manager 处理
          action: function (item) {
            return JSON.stringify({
              event: 'res-change-confirmed-logs',
              id: item.id,
              resType: util.db.RES_TYP_RPC
            });
          }
        },
        {
          name: '名称',
          key: 'name',
          keyPinyin: 'namePinyin'
        },
        {
          name: '类名',
          key: 'className'
        },
        {
          name: '方法名',
          key: 'path'
        },
        {
          name: '标签',
          key: 'tag',
          valueType: 'tag',
          keyPinyin: 'tagPinyin',
          filter: 'tag'
        },
        {
          name: '分组',
          key: 'group.name',
          keyPinyin: 'group.namePinyin',
          valueType: 'deepKey',
          filter: 'group'
        },
        {
          name: '状态',
          key: 'status.name',
          keyPinyin: 'status.namePinyin',
          valueType: 'deepKey',
          filter: 'status'
        },
        {
          name: '版本',
          key: 'version.name',
          valueType: 'deepKey'
        },
        {
          name: '负责人',
          key: 'respo.realname',
          keyPinyin: 'respo.realnamePinyin',
          valueType: 'deepKey',
          filter: 'respo'
        },
        {
          name: '创建者',
          key: 'creator.realname',
          keyPinyin: 'creator.realnamePinyin',
          valueType: 'deepKey'
        },
        {
          name: '创建时间',
          key: 'createTime',
          valueType: 'time',
          defaultSortUp: false
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions',
          sortable: false
        }
      ],
      listGroups: [
        {
          group: '接口类名',
          key: 'className'
        },
        {
          group: '业务分组',
          key: 'group'
        },
        {
          group: '负责人',
          key: 'respo'
        },
        {
          group: '创建者',
          key: 'creator'
        }
      ],
      filter: function (list, xlistState) {
        // 处理 action 列
        var filterList = util._$filterVersion(list);

        var _find = function (id) {
          return filterList.find(function (item) {
            return item.id == id;
          });
        };
        list.sort(function (itemA, itemB) {
          return itemA.id - itemB.id;
        });
        list.forEach(function (item) {
          var itemState = xlistState[item.id];

          if (!_find(item.id)) {
            itemState.__invisible = true;
            return;
          }

          //权限处理，未审核api，只有API所有者以及审核者可以看到，API管理员可见所有API
          if (itemState.status.id == util.db.STATUS_SYS_AUDITING || itemState.status.id == util.db.STATUS_SYS_AUDIT_FAILED) {
            if (this.privilege.isObserver || this.privilege.isOthers || this.privilege.isTester) {
              itemState.__invisible = true;
              return;
            }
            //开发者必须针对人来过滤
            if (this.privilege.isDev && item['creator']['id'] != currentUserId) {
              itemState.__invisible = true;
              return;
            }
          }

          var linkSuffix = '/?pid=' + item.projectId + '&id=' + item.id;
          var escapeName = jstExt.escape2(item.name);

          itemState['__ui_name'] = '<a href="/rpc/detail' + linkSuffix + '" class="stateful">' + escapeName + '</a>';
          itemState['__ui_name_hit_template'] = '<a href="/rpc/detail' + linkSuffix + '" class="stateful">{value}</a>';
          var str = '';
          //删除data-action字段
          var obj = {
            type: 'del',
            warn: true,
            cache: 'rpc',
            key: this._listCacheKey,
            ids: [item.id]
          };
          // 查看详情
          str += '<a href="/rpc/detail' + linkSuffix + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';

          // 删除当前项
          str += '<a class="delete-icon" data-action=' + JSON.stringify(obj) + ' title="删除当前项"><em class="u-icon-delete-normal"></em></a>';

          itemState['__nei-actions'] = str;
        }._$bind(this));
        return list;
      }._$bind(this),
      afterRender: function () {
        _e._$delClassName(this._btnWrap, 'f-dn js-open');
      }._$bind(this),
    };
    var _options = {
      resType: 'rpc',
      listCache: cache._$cacheKey,
      // 实例化cache实例名称
      cacheName: '__rpcCache',
      //cache监听的回调事件
      callBackList: ['onshare', 'onclone', 'onmove', 'onsetgroup', 'onsetstate', 'onversioncreated', 'ontag'],
      //需注册的自定义事件
      eventList: ['res-copy', 'res-move', 'res-group', 'res-state', 'res-version', 'res-rpc-doc-patch', 'res-change-confirmed-logs', 'res-follow-patch', 'res-tag'],
      cacheOption: {
        onbatch: function (result) {
          var list = this.__rpcCache._$getListInCache(this._listCacheKey);
          list = util._$filterVersion(list);
          this.stripedList._$updateList(list);
        }.bind(this)
      },
      stripedListOption: stripedListOption,
      canShare: true
    };
    this.__super(_options);
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([[
      this._btnWrap, 'click', //监听click,处理创建菜单相关操作
      this.__menuClick.bind(this)
    ], [
      document, 'click', //监听全局click,隐藏创建下拉菜单
      function () {
        _e._$delClassName(this._btnWrap, 'js-open');
      }.bind(this)
    ], [
      this._fileInput, 'change',
      this.__import.bind(this)
    ], [
      this._dirInput, 'change',
      this.__import.bind(this)
    ]]);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    //添加参数是否重复获取stripedlist的 batchAction参数
    _options.batActionFlag = true;
    this.pid = _options.param.pid;
    this.proCache._$getItem({
      id: this.pid
    });
    this.__super(_options);
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__jbImport && this.__jbImport.destroy();
    this.__jbImport = null;
    this.__confirm && this.__confirm.destroy();
    this.__confirm = null;
  };

  /**
   * 处理菜单操作
   * @param {Event} 事件对象
   */
  _pro.__menuClick = function (event) {
    event.stopPropagation();
    if (_e._$hasClassName(event.target, 'json-tip')) {
      return;
    }
    var node = _v._$getElement(event, 'd:click');
    if (!node) {
      return;
    }
    var type = _e._$dataset(node, 'click');
    switch (type) {
      case 'toggle': //显示或隐藏菜单
        if (_e._$hasClassName(this._btnWrap, 'js-open')) {
          _e._$delClassName(this._btnWrap, 'js-open');
        } else {
          _e._$addClassName(this._btnWrap, 'js-open');
        }
        break;
      case 'create': //跳转创建HTTP 接口模块
        _e._$delClassName(this._btnWrap, 'js-open');
        dispatcher._$redirect('/rpc/create/?pid=' + this.__pid);
        break;
      case 'import-json':
        _e._$delClassName(this._btnWrap, 'js-open');
        this.importingFileType = 'json';
        this._fileInput.click();
        break;
      case 'import-rpc':
        _e._$delClassName(this._btnWrap, 'js-open');
        this.importingFileType = 'rpc';
        this._fileInput.click();
        break;
      case 'import-rpc-dir':
        _e._$delClassName(this._btnWrap, 'js-open');
        this.importingFileType = 'rpc';
        this._dirInput.click();
        break;
      default:
        break;
    }
  };
  /**
   * swagger导入HTTP 接口
   * @param {Event} evt - 事件对象
   */
  _pro.__import = function (evt) {
    util._$importRPCFiles(this.importingFileType, evt.target.files, this.__showImportConfirm.bind(this));
    evt.target.value = '';
  };
  /**
   * 显示导入确认框
   * @param {Object} parsedJsonData - 文件解析出的数据，包含接口列表和数据模型列表
   * @property {Array} parsedJsonData.rpcs - 文件解析出的接口列表
   * @property {Array} parsedJsonData.datatypes - 文件解析出的数据模型列表
   */
  _pro.__showImportConfirm = function (parsedJsonData) {
    parsedJsonData = parsedJsonData.data;
    var datatypeListKey = datatypeCache._$cacheKey + '-' + this.__pid;
    var dtCache = datatypeCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        importCallback();
      }
    });
    var importData = {};
    var importCallback = function () {
      var datatypes = importData.datatypes;
      var batchCreate = function () {
        this.__rpcCache._$batch({
          key: this._listCacheKey,
          data: importData,
          actionMsg: '导入成功'
        });
      }.bind(this);
      var createdItems = [], notCreatedItems = [];
      var datatypesInImportingRPCs = {};
      importData.projectId = this.__pid;
      // 计算需要创建的和已经存在的数据模型列表
      var datatypesInProject = dtCache._$getListInCache(datatypeListKey);
      var createdDatatypes = [], notCreatedDatatypes = [];
      // 只需要判断要导入的数据模型是否已经在项目中定义了

      datatypes.forEach(function (d) {
        if (d.name !== '') {
          if (datatypesInImportingRPCs[d.name]) {
            return;
          }
          datatypesInImportingRPCs[d.name] = true;
        }
        var found;
        if (d.name === '') {
          found = false;
        } else {
          found = datatypesInProject.find(function (dt) {
            return dt.name === d.name;
          });
        }
        if (found) {
          createdDatatypes.push(d);
        } else {
          notCreatedDatatypes.push(d);
        }
      });
      importData.rpcs.forEach(function (item) {
        var itf = this.__getRPCByName(item.name);
        if (itf) {
          // 已经存在同名接口
          createdItems.push(item.name);
        } else {
          // 接口需要新创建
          notCreatedItems.push(item);
        }
      }, this);
      // 需要创建的RPC接口
      importData.rpcs = notCreatedItems;
      // 需要创建的数据模型
      importData.datatypes = notCreatedDatatypes;
      // 没有需要导入的接口，用户未选择
      if (notCreatedItems.length === 0 && createdItems.length === 0) {
        this.__confirm = _modal.confirm({
          content: '没有需要导入的接口',
          title: '提示',
          okButton: false,
          cancelButton: false
        });
        return;
      }
      if (createdItems.length || createdDatatypes.length) {
        var createdRPCNames = createdItems.join('， ');
        var createdDatatypeNames = createdDatatypes.map(function (dt) {
          return dt.name;
        }).join('，');
        this.__confirm = _modal.confirm({
          content: (createdRPCNames ? '接口： ' + createdRPCNames + ' 在当前项目中已存在，此次导入不会创建<br/>' : '')
          + (createdDatatypeNames ? '数据模型： ' + createdDatatypeNames + ' 在当前项目中已存在，此次导入不会创建<br/>' : ''),
          title: '导入确认',
          clazz: 'm-modal-import-rpc-confirm'
        }).$on('ok', function () {
          if (notCreatedItems.length) {
            batchCreate();
          }
        });
      } else {
        batchCreate();
      }
    }.bind(this);
    new RpcImport({
      data: {
        cache: this.__rpcCache,
        searchCache: cache._$$CacheRpc,
        listCacheKey: this._listCacheKey,
        pid: this.__pid,
        rpcs: parsedJsonData.rpcs,
        datatypes: parsedJsonData.datatypes,
        groups: this.__groupCache._$getGroupSelectSource(this.__pid),
        isChrome: this.isChrome,
        title: '导入 RPC 接口'
      }
    }).$on('ok', function (data) {
      importData = data;
      // 去加载数据模型列表
      dtCache._$getList({
        key: datatypeListKey,
        data: {
          pid: this.__pid
        }
      });
    }.bind(this));
  };
  /**
   * 根据名称获取接口
   * @param {String} name -  HTTP 接口名称
   * @return {obj}  HTTP 接口
   */
  _pro.__getRPCByName = function (name) {
    var list = this.__rpcCache._$getListInCache(this._listCacheKey);
    return list.find(function (item) {
      return item.name === name;
    });
  };
  /**
   * 获取stripedlist的batchAction参数
   */
  _pro.__getBatchAction = function () {
    var actionData = [{
      name: '复制',
      action: {
        event: 'res-copy'
      }
    }, { //对于普通项目，可以移动、设置分组
      name: '移动',
      action: {
        event: 'res-move'
      }
    }, {
      name: '关注',
      action: {
        event: 'res-follow-patch'
      }
    }, {
      name: '设置标签',
      action: {
        event: 'res-tag'
      }
    }, {
      name: '设置分组',
      action: {
        event: 'res-group'
      }
    }, {
      name: '设置状态',
      action: {
        event: 'res-state'
      }
    }, {
      name: '查看文档',
      action: {
        event: 'res-rpc-doc-patch'
      }
    }, {
      name: '新建版本',
      class: 'batch-action-item-version',
      action: {
        event: 'res-version'
      }
    }, {
      name: '删除',
      action: {
        type: 'del',
        cache: cache._$cacheKey,
        warn: true,
        key: this._listCacheKey
      }
    }];
    if (this.__project.type !== util.db.PRO_TYP_NORMAL) { //只有普通项目可以移动接口资源
      actionData.splice(2, 1);
    }
    var batch = '';
    actionData.forEach(function (item) {
      batch += ('<a class="' + ['batch-action-item', item.class ? item.class : '', item.action.type === 'link' ? 'stateful' : ''].join(' ') +
      '" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>');
    });
    return batch;
  };

  // notify dispatcher
  _m._$regist(
    'res-rpc',
    _p._$$ModuleResRpc
  );
});
