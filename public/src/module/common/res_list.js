/*
 * @资源列表基类
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/event/event',
  'pro/common/module',
  'pro/cache/user_cache',
  'pro/cache/interface_cache',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/group_cache',
  'pro/stripedlist/stripedlist',
  'pro/cache/config_caches',
  'pro/notify/notify',
  'pro/res_bat/res_copy_move/res_copy_move',
  'pro/res_bat/res_tag/res_tag',
  'pro/res_bat/res_group/res_group',
  'pro/res_bat/res_state/res_state',
  'pro/modal/modal',
  'text!pro/poplayer/share_layer.html',
  'pro/res_version/res_version',
  'pro/modal/change_confirm_log/change_confirm_log',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _e, _u, _c, _m, _usrCache, _interfaceCache, _pgCache, _proCache, _groupCache, stripedList, caches, _notify, resCopyMove, resTag, resGroup, resState, _modal, _html, _resVersion, ChangeConfirmLog, _db, _p, _pro) {

  /**
   * 资源模块
   * @class   {wd.m._$$ModuleResList}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResList = _k._$klass();
  _pro = _p._$$ModuleResList._$extend(_m._$$Module);

  /**
   * 模块构建
   * @param  {Object} _options 子类传给父类的配置信息
   * 下面为ext的属性信息
   * resType {String} 子类资源类型
   * listCache {String}  子类cacheKey
   * cacheName {String} 子类cache名称
   * callBackList {Array} cache监听的回调事件
   * eventList {Array} 需注册的自定义事件
   */
  _pro.__doBuild = function (_options) {
    this.interfaceCache = _interfaceCache._$$CacheInterface._$allocate({});
    var _defaultOptions = {
      //子类资源类型
      resType: '',
      //子类cacheKey
      listCache: null,
      //实例化cache实例名称
      cacheName: '',
      //cache监听的回调事件，有两种方式定义子类的自定义回调（或者重写父类已定义的方法）：
      // 1.传对象进来 {name:'onxxx', func: fucntion(result){ xxxx}.bind(this)} eg:   callBackList: ['onsetgroup', {name: 'onbatch', func: function (result) {
      //	var list = this.__dtCache._$getListInCache(this._listCacheKey);
      //	this.stripedList._$updateList(list);
      //	}.bind(this)}],
      // 2. 在 cacheOption 对象定义自定义回调，如：
      // cacheOption :{
      //	onbatch: function (result) {
      //	var list = this.__dtCache._$getListInCache(this._listCacheKey);
      //	this.stripedList._$updateList(list);
      //	}.bind(this)
      // }

      callBackList: [],
      //需注册的自定义事件
      eventList: [],
      //传进doinitDomEvent 的需初始化事件的数组，传子类特有的方法，或者重写父类已定义的方法
      // 两种方式可定义子类的方法或重写父类的方法
      // 1. customEventFunc 传入 eg： customEventFunc[[
      //window, 'res-crud', this.__showResCrud.bind(this)
      //]]
      // 2. 子类的doinitDomEvent中自己定义
      customEventFunc: [],
      //子类cache 参数
      cacheOption: {},
      //stripedlist
      stripedListOption: {},
      canShare: false
    };
    this._subOpt = _u._$merge(_defaultOptions, _options);
    this.__super();
    this.__proCacheOptions = {
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__pgid = this.__project.progroupId;
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            //获取用户权限，并根据权限修改stripedlist参数
            this.__progroup = this.__pgCache._$getItemInCache(this.__project.progroupId);
            var role = this.__pgCache._$getRole(this.__project.progroupId);
            if (role !== 'others') {
              if (this._subOpt.resType !== 'group') {
                this.__groupCache._$getList({
                  key: this.__groupCache._$getListKey(this.__pid),
                  data: {
                    pid: this.__pid
                  }
                });
              }
              if (this._options.batActionFlag) {
                this.stripedListOptions.batchAction = this.__getBatchAction();
              }
              //如果是观察者没有批量操作权限
              if (role == 'observer') {
                this.stripedListOptions.batchAction = '';
              }
              //如果是接口，刷新的时候 回收一下 stripedlist组件（避免多次点击资源管理和接口按钮实例化多个）
              if (this._subOpt.resType == 'interface' && this.stripedList) {
                this.stripedList._$recycle();
              }
              this.stripedList = stripedList._$$ModuleStripedList._$allocate(this.stripedListOptions);
            }
          }.bind(this)
        });
        //发送请求
        this.__pgCache._$getItem({
          id: this.__project.progroupId
        });

      }.bind(this)
    };
    //子类cache实例参数
    this.__initCacheOption();
    //注册自定义事件
    this.__registEvent();
    //stripedlist参数
    this.__initStripListOptions();
  };

  /**
   *  子类cache实例参数
   */
  _pro.__initCacheOption = function () {
    var cacheOptions = this[this._subOpt.cacheName + 'Options'] = {};
    _u._$forEach(this._subOpt.callBackList, function (item) {
      switch (item) {
        case 'onshare':
          cacheOptions.onshare = function (result) {
            //分享完成后回调
            var list = this[this._subOpt.cacheName]._$getListInCache(this._listCacheKey);
            this.stripedList._$updateList(list);
            _notify.show('分享成功', 'success', 2000);
          }._$bind(this);
          break;
        case 'onclone':
          cacheOptions.onclone = function (result) {
            if (result.pid == this.__pid || result.ext.isPublic) {
              this.stripedList._$refresh();
            }
          }.bind(this);
          break;
        case 'onmove':
          cacheOptions.onmove = function () {
            // 移动的时候，情况较复杂，移动后直接刷新列表
            this.stripedList._$refresh();
          }.bind(this);
          break;
        case 'onsetgroup':
          cacheOptions.onsetgroup = function () { //设置分组成功后，刷新列表
            this.stripedList._$refresh();
          }.bind(this);
          break;
        case 'onsetstate':
          cacheOptions.onsetstate = function () { //设置批量状态成功后，刷新列表
            this.stripedList._$refresh();
          }.bind(this);
          break;
        case 'onversioncreated':
          cacheOptions.onversioncreated = function () {
            this.stripedList._$refresh();
          }.bind(this);
          cacheOptions.onitemsdelete = function () {
            this.stripedList._$refresh();
          }.bind(this);
          break;
        case 'ontag':
          cacheOptions.ontag = function () { //设置标签成功后，刷新列表
            this.stripedList._$refresh();
          }.bind(this);
          break;
        case 'onforbid':
          cacheOptions.onforbid = function () { //设置批量禁用状态后，刷新列表
            this.stripedList._$refresh();
          }.bind(this);
        default:
          if (typeof (item) == 'object') {
            cacheOptions[item.name] = item.func;
          }
          break;
      }
    }.bind(this));
    //子类cache实例
    this[this._subOpt.cacheName + 'Options'] = _u._$merge(cacheOptions, this._subOpt.cacheOption);

  };
  /**
   *  注册自定义事件
   */
  _pro.__registEvent = function () {
    //注册自定义事件
    _c._$$CustomEvent._$allocate({
      element: window,
      event: this._subOpt.eventList
    });
  };

  /**
   * 初始化stripedlist
   */
  _pro.__initStripListOptions = function () {
    var defaultOptions = {
      parent: _e._$getByClassName(this.__body, 'list-content')[0],
      listCache: this._subOpt.listCache,
      lsListKey: 'nei-' + this._subOpt.resType + 's-list',
      hasTagFilter: true,
      headers: [],
      defaultSortKey: 'createTime',
      sortable: true,
      hasSearchBox: true,
      hasHeaderFilter: true,
      vlist: true, // 开启虚拟列表渲染长列表
      vlistHeight: '100%', // m-progroup-p 内已重写了list-bd的高度，这里让v-list保持与list-bd高度一致。
      listGroups: [
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
      afterRender: function () {
        var addBtn = _e._$getByClassName(this.__body, 'resource-add')[0];
        _e._$delClassName(addBtn.parentNode, 'f-dn');
        _e._$attr(addBtn, 'href', '/' + this._subOpt.resType + '/create/?pid=' + this.__pid);
      }.bind(this),
      noItemTip: '暂无数据<br/>有数据但无法显示？试试 <a href="/setting/cache" class="stateful">清除缓存</a>'
    };
    this.stripedListOptions = _u._$merge(defaultOptions, this._subOpt.stripedListOption);
  };

  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   */
  _pro.__onShow = function (_options) {
    this.stripedList = null;
    if (this._subOpt.resType !== 'group') {
      this.__groupCache = _groupCache._$$CacheGroup._$allocate();
    }
    //子类cache实例化
    this[this._subOpt.cacheName] = caches[this._subOpt.listCache]._$allocate(this[this._subOpt.cacheName + 'Options']);
    this.__proCache = _proCache._$$CachePro._$allocate(this.__proCacheOptions);
    this.__super(_options);
    this.__addEvent();
  };

  _pro.__onRefresh = function (_options) {
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this._options = _options;
    this.__super(_options);
    this._listCacheKey = this[this._subOpt.cacheName]._$getListKey(this.__pid);
    this.stripedListOptions.queryData = {
      pid: this.__pid
    };
    this.stripedListOptions.listCacheKey = this._listCacheKey;
    //发送请求
    this.__proCache._$getItem({
      id: this.__pid
    });
  };

  /**
   * 隐藏模块
   */
  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    if (this.stripedList) {
      this.stripedList = this.stripedList._$recycle();
    }
    this[this._subOpt.cacheName] = this[this._subOpt.cacheName]._$recycle();
    if (this._subOpt.resType !== 'group') {
      this.__groupCache._$recycle();
    }
    this.__resCopyMove && this.__resCopyMove.destroy();
    this.__resCopyMove = null;
    this.__shareLayer && this.__shareLayer.destroy();
    this.__shareLayer = null;
  };

  _pro.__addEvent = function () {
    var domEventList = [];
    if (this._subOpt.canShare) {
      domEventList.push([
        window, this._subOpt.resType + '-share',
        function (evt) {
          this.__share(evt.id);
        }._$bind(this)
      ]);
    }
    _u._$forEach(this._subOpt.eventList, function (item) {
      switch (item) {
        case 'res-copy':
          domEventList.push([
            window, 'res-copy', this.__showResCopyMove.bind(this)
          ]);
          break;
        case 'res-move':
          domEventList.push([
            window, 'res-move', this.__showResCopyMove.bind(this)
          ]);
          break;
        case 'res-tag':
          domEventList.push([
            window, 'res-tag', this.__showResTag.bind(this)
          ]);
          break;
        case 'res-group':
          domEventList.push([
            window, 'res-group', this.__showResGroup.bind(this)
          ]);
          break;
        case 'res-state':
          domEventList.push([
            window, 'res-state', this.__showResState.bind(this)
          ]);
          break;
        case 'res-version':
          domEventList.push([
            window, 'res-version', this.__showResVersion.bind(this)
          ]);
          break;
        case 'res-interface-doc-patch':
          domEventList.push([
            window, 'res-interface-doc-patch', this.__showInterfacePatchDoc.bind(this)
          ]);
          break;
        case 'res-rpc-doc-patch':
          domEventList.push([
            window, 'res-rpc-doc-patch', this.__showRpcPatchDoc.bind(this)
          ]);
          break;
        case 'res-datatype-doc-patch':
          domEventList.push([
            window, 'res-datatype-doc-patch', this.__showDatatypePatchDoc.bind(this)
          ]);
          break;
        case 'res-change-confirmed-logs':
          domEventList.push([
            window, 'res-change-confirmed-logs', this.__showResChangeConfirmedLogs.bind(this)
          ]);
          break;
        case 'res-follow-patch':
          domEventList.push([
            window, 'res-follow-patch', this.__followPatch.bind(this)
          ]);
          break;
        case 'res-forbid':
          domEventList.push([
            window, 'res-forbid', this.__showResForbid.bind(this)
          ]);
        default:
          break;
      }
    }.bind(this));
    if (this._subOpt.customEventFunc.length) {
      _u._$forEach(this._subOpt.customEventFunc, function (item2) {
        domEventList.push(item2);
      }.bind(this));
    }
    if (!domEventList.length) {
      return;
    }
    this.__doInitDomEvent(domEventList);
  };

  /**
   * 分享资源逻辑
   * @param  {Number} tid 模版id
   */
  _pro.__share = function (tid) {
    if (!!this.__shareLayer) {
      this.__shareLayer.destroy();
    }
    this.__shareLayer = new _modal({
      data: {
        'contentTemplate': _html,
        'okButton': '分享',
        'title': '分享确认',
        'class': 'm-resource-share'
      }
    }).$on('ok', function () {
      this[this._subOpt.cacheName]._$share({
        id: tid,
        ext: {
          cacheKey: this._listCacheKey,
          pid: this.__pid
        }
      });
    }._$bind(this));
  };

  /**
   * 显示资源复制或移动弹框
   * @param {Event} event 事件对象
   */
  _pro.__showResCopyMove = function (event) {
    var type = event.type === 'res-move' ? 'move' : 'copy';
    if (event.ids.length > 10) {
      _notify.warning('最多选择10个资源复制');
    } else {
      var xlist = [],
        progroups = [],
        progroup, project,
        list = this[this._subOpt.cacheName]._$getResListByIds(event.ids);
      if (type === 'move') {
        var selectedPid = this[this._subOpt.cacheName]._$getItemInCache(event.ids[0]).projectId;
        progroup = this.__proCache._$getProgroupByProId2(selectedPid, false, true);
        if (!progroup) {
          _notify.warning('没有可移动的目标项目');
          return;
        }
        progroups = [progroup];
      } else {
        var _groupId = this[this._subOpt.cacheName]._$getItemInCache(event.ids[0]).groupId;
        progroups = this.__pgCache._$getListInCache(_pgCache._$cacheKey);
        progroup = this.__proCache._$getProgroupByProId(this.__pid);
        project = progroup.projects.find(function (item) {
          return item.id === this.__pid;
        }.bind(this));
      }
      list.forEach(function (item) {
        xlist.push({
          id: item.id,
          name: item.name,
          selected: true
        });
      });
      this.__resCopyMove = new resCopyMove({
        data: {
          cache: this[this._subOpt.cacheName],
          searchCache: caches[this._subOpt.resType],
          type: type,
          xlist: xlist,
          groupId: _groupId,
          progroups: progroups,
          progroup: progroup,
          project: project
        }
      }).$on('ok', function (event) {
        switch (event.type) {
          case 'copy':
            var pid = event.data.pid;
            if (this.__proCache._$isPublic(pid)) {
              this.__confirm = _modal.confirm({
                content: '复制到【公共资源库】将导致资源共享，项目中的项目都可以查看到这些资源',
                title: '复制确认'
              }).$on('ok', function () {
                this.__clone(event, true);
              }.bind(this));
            } else {
              this.__clone(event, false);
            }
            break;
          case 'move':
            if (selectedPid !== event.data.pid) {
              if (this.__proCache._$isPublic(event.data.pid)) {
                this.__confirm = _modal.confirm({
                  content: '移动到【公共资源库】将导致资源共享，项目中的项目都可以查看到这些资源',
                  title: '移动确认'
                }).$on('ok', function () {
                  this.__move(event, true);
                }.bind(this));
              } else {
                this.__move(event, false);
              }
            } else {
              _notify.show('不能移动到当前项目', 'error', 2000);
            }
            break;
          default:
            break;
        }
      }.bind(this));
    }
  };
  /**
   * 移动资源
   * @param {Object} options - 配置参数
   * @param {Boolean} isPublic - 目标项目是否是公共资源库
   */
  _pro.__move = function (options, isPublic) {
    this[this._subOpt.cacheName]._$move({
      data: options.data,
      actionMsg: '移动成功',
      key: this[this._subOpt.cacheName]._$getListKey(options.data.pid),
      ext: {
        originPid: this.__pid,
        isPublic: isPublic
      }
    });
  };
  /**
   * 复制资源
   * @param {Object} options - 配置参数
   * @param {Boolean} isPublic - 目标项目是否是公共资源库
   */
  _pro.__clone = function (options, isPublic) {
    this[this._subOpt.cacheName]._$clone({
      data: options.data,
      actionMsg: '复制成功',
      key: this[this._subOpt.cacheName]._$getListKey(options.data.pid),
      ext: {
        isPublic: isPublic
      }
    });
  };

  _pro.__showResTag = function (event) {
    var currentCache = this[this._subOpt.cacheName];
    var list = this[this._subOpt.cacheName]._$getResListByIds(event.ids);
    this.__resTag = new resTag({
      data: {
        list: list,
        cache: currentCache,
        searchCache: caches[this._subOpt.resType],
        pid: this.__pid
      },
      ext: {
        id: this.__id
      }
    }).$on('ok', function (data) {
      var tags = data.tags.map(function (item) {
        return typeof item === 'string' ? item : item.name;
      });
      if (this._subOpt.resType === 'interface') {
        var tagSpec = this.__progroup.httpSpec.tag;
        var tagSpecDescription = this.__progroup.httpSpec.tagDescription;
        var tagValid = tags.some(function (tag) {
          return this.__checkValidity(tag, tagSpec);
        }, this);
        var showWarn = false;
        var infValid = list.every(function (inf) {
          if (!tagValid) {
            var tgs = inf.tag.split(',');
            var valid = tgs.some(function (tag) {
              return this.__checkValidity(tag, tagSpec);
            }, this);
            if (!valid) {
              showWarn = true;
              if (this.__checkCreateTime(inf)) {
                return false;
              }
            }
          }
          return true;
        }, this);
        if (tagSpec) {
          if (showWarn) {
            _notify.show('标签不符合HTTP接口规范【' + (tagSpecDescription ? tagSpecDescription : _u._$escape(tagSpec)) + '】', 'error', 3000);
          }
          if (!infValid) {
            return;
          }
        }
      }
      currentCache._$tag({
        data: {
          ids: event.ids,
          tags: tags
        },
        actionMsg: '修改成功',
        key: currentCache._$getListKey(this.__pid)
      });
    }.bind(this));
  };

  /**
   * 检查接口创建时间是否晚于规范创建时间
   * @return {Boolean} true 表示接口创建时间晚于规范创建时间，限制修改 false则反之
   */
  _pro.__checkCreateTime = function (interface) {
    return !this.__progroup.httpSpec.createTime || interface.createTime >= this.__progroup.httpSpec.createTime;
  };

  /**
   * 检查某项输入是否符合
   * @return {Boolean}
   */
  _pro.__checkValidity = function (value, regexStr) {
    if (regexStr == null || regexStr === '') {
      return true;
    } else {
      try {
        var regex = new RegExp(regexStr);
        return regex.test(value);
      } catch (e) {
      }
    }
  };

  /**
   * 显示批量设置分组弹框
   */
  _pro.__showResGroup = function (event) {
    var list = this[this._subOpt.cacheName]._$getResListByIds(event.ids);
    if (!!this[this._subOpt.cacheName].__hasSharedRes(list)) {
      _notify.warning('共享资源不能修改分组');
    } else {
      this.__resGroup = new resGroup({
        data: {
          ids: event.ids,
          cache: this.__groupCache,
          groups: this.__groupCache._$getGroupSelectSource(this.__pid),
          pid: this.__pid
        }
      }).$on('ok', function (data) {
        this[this._subOpt.cacheName]._$setGroup({
          actionMsg: '设置成功',
          data: data
        });
      }.bind(this));
    }
  };

  /**
   * 显示批量设置状态弹窗
   */
  _pro.__showResState = function (event) {
    var currentCache = this[this._subOpt.cacheName];
    new resState({
      data: {
        ids: event.ids,
        cache: currentCache,
        states: currentCache._$getStatusList(currentCache._$getListKey(this.__pid), true),
        pid: this.__pid
      }
    }).$on('ok', function (data) {
      currentCache._$setPatchState({
        actionMsg: '设置成功',
        data: data
      });
    }.bind(this));
  };

  _pro.__showResForbid = function (event) {
    var currentCache = this[this._subOpt.cacheName];
    new resState({
      data: {
        ids: event.ids,
        cache: currentCache,
        states: currentCache._$getForbidStatusList(),
        pid: this.__pid
      }
    }).$on('ok', function (data) {
      currentCache._$setPatchForbid({
        actionMsg: '设置成功',
        data: {
          ids: data.ids,
          forbidStatus: data.statusId,
          pid: this.__pid
        }
      });
    }.bind(this));
  };

  _pro.__filterList = function (list) {
    return (list || []).filter(function (it) {
      if (this._subOpt.resType === 'datatype') {
        return it.type !== _db.MDL_TYP_SYSTEM;
      }
      return it;
    }.bind(this));
  };

  /**
   * 显示创建版本弹窗
   */
  _pro.__showResVersion = function (event) {
    var iid = event.ids[0];
    var list = this[this._subOpt.cacheName]._$getListInCache(this._listCacheKey);
    var resInstance = list.find(function (item) {
      return item.id === iid;
    });

    var versions = list.filter(function (item) {
        return item.version &&
          resInstance.version &&
          item.version.origin === resInstance.version.origin &&
          item.id !== iid;
      }) || [];

    this.__resVersion = new _resVersion({
      data: {
        cache: this[this._subOpt.cacheName],
        searchCache: caches[this._subOpt.resType],
        versionList: versions || [],
        pid: this.__pid,
        currentItem: resInstance,
        name: resInstance.name
      }
    }).$on('ok', function (data) {
      this[this._subOpt.cacheName]._$createVersion({
        actionMsg: '创建版本成功',
        data: Object.assign(data, {
          projectId: this.__pid
        })
      });
    }.bind(this));
  };

  _pro.__followPatch = function (event) {
    this[this._subOpt.cacheName]._$patchWatch({
      watch: 1,
      ids: event.ids,
      onload: function (data) {
        var cacheKey = this[this._subOpt.cacheName]._$getListKey(this.__pid);
        var list = this[this._subOpt.cacheName]._$getListInCache(cacheKey);
        var user = _usrCache._$$CacheUser._$allocate();
        //当前登录用户ID
        var currentUserId = user._$getUserInCache().id;
        list.forEach(function (item) {
          event.ids.forEach(function (id) {
            if (id === item['id']) {
              //更新下缓存
              item.watchList.push(currentUserId);
              item.isWatched = 1;
            }
          });
        });
      }.bind(this)
    });
    //处理下缓存问题
  };

  _pro.__showInterfacePatchDoc = function (event) {
    window.open('/doc/interfaces/?id=' + this.__pid + '&resid=' + encodeURIComponent(event.ids) + '&from=outside');
  };

  _pro.__showRpcPatchDoc = function (event) {
    window.open('/doc/rpcs/?id=' + this.__pid + '&resid=' + encodeURIComponent(event.ids) + '&from=outside');
  };

  _pro.__showDatatypePatchDoc = function (event) {
    window.open('/doc/datatypes/?id=' + this.__pid + '&resid=' + encodeURIComponent(event.ids) + '&from=outside');
  };

  _pro.__showResChangeConfirmedLogs = function (event) {
    new ChangeConfirmLog({
      data: {
        id: event.id,
        type: event.resType
      }
    });
  };

});
