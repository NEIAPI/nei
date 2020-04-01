/*
 * @资源版本基类
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/event/event',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/group_cache',
  'pro/stripedlist/stripedlist',
  'pro/cache/config_caches',
  'pro/notify/notify',
  'pro/res_bat/res_tag/res_tag',
  'pro/res_bat/res_group/res_group',
  'pro/res_bat/res_state/res_state',
  'pro/res_version/res_version',
  'pro/modal/modal',
  'text!pro/poplayer/share_layer.html',
], function (_k, _e, _u, _c, _m, _pgCache, _proCache, _groupCache, stripedList, caches, _notify, resTag, resGroup, resState, resVersion, _modal, _html, _p, _pro) {

  /**
   * 资源模块
   * @class   {wd.m._$$ModuleResVersion}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResVersion = _k._$klass();
  _pro = _p._$$ModuleResVersion._$extend(_m._$$Module);

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
    var _defaultOptions = {
      //子类资源类型
      resType: '',
      //子类cacheKey
      cacheKey: '',
      //实例化cache实例名称
      cacheName: '',
      //资源实例名称
      resInstanceName: '',
      callBackList: ['onshare', 'onsetgroup', 'onsetstate', 'onversioncreated', 'ontag'],
      //需注册的自定义事件
      eventList: ['res-group', 'res-state', 'res-version', 'res-tag'],
      customEventFunc: [],
      //子类cache 参数
      cacheOption: {},
      //striplist
      stripedListOption: {},
      canShare: false
    };
    this._subOpt = _u._$merge(_defaultOptions, _options);
    this.__super();
    this.__cacheOptions = {
      onitemload: function () {
        var resInstance = this[this._subOpt.resInstanceName] = this[this._subOpt.cacheName]._$getItemInCache(this.__id);
        this.__pgid = resInstance.progroupId;
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            //获取用户权限，并根据权限修改striplist参数
            var role = this.__pgCache._$getRole(resInstance.progroupId);
            if (role === 'others') {
              return;
            }
            this.__groupCache._$getList({
              key: this.__groupCache._$getListKey(this.__pid),
              data: {
                pid: this.__pid
              }
            });
            if (this._options.batActionFlag) {
              this.stripedListOptions.batchAction = this.__getBatchAction();
            }
            //如果是观察者没有批量操作权限
            if (role === 'observer') {
              this.stripedListOptions.batchAction = '';
            }
            //如果是接口，刷新的时候 回收一下 striplist组件（避免多次点击资源管理和接口按钮实例化多个）
            if (this._subOpt.resType == 'interface' && this.stripedList) {
              this.stripedList._$recycle();
            }
            var versions = resInstance.versions || [];

            this.stripedList = stripedList._$$ModuleStripedList._$allocate(Object.assign(
              this.stripedListOptions, {
                xlist: versions,
                _$getTagList: function () {
                  var resource = this[this._subOpt.cacheName]._$getItemInCache(this.__id);
                  var result = [];
                  (resource.versions || []).forEach(function (it) {
                    var tags = it.tag.split(',');
                    (tags || []).forEach(function (tag) {
                      tag = tag.trim();
                      if (!result.includes(tag) && tag !== '') {
                        result.push(tag);
                      }
                    });
                  });
                  return result;
                }.bind(this),
                _$getGroupList: function () {
                  var resource = this[this._subOpt.cacheName]._$getItemInCache(this.__id);
                  var result = [];
                  (resource.versions || []).forEach(function (it) {
                    var group = it.group;
                    if (!result.some(function (item) {
                        return item.id === group.id;
                      })) {
                      result.push(group);
                    }
                  });
                  return result;
                }.bind(this),
                _$getStatusList: function () {
                  var resource = this[this._subOpt.cacheName]._$getItemInCache(this.__id);
                  var result = [];
                  (resource.versions || []).forEach(function (it) {
                    var status = it.status;
                    if (!result.some(function (item) {
                        return item.id === status.id;
                      })) {
                      result.push(status);
                    }
                  });
                  return result;
                }.bind(this)
              })
            );
          }.bind(this)
        });
        //发送请求
        this.__pgCache._$getItem({
          id: resInstance.progroupId
        });
      }.bind(this)
    };
    //子类cache实例参数
    this.__initCacheOption();
    //注册自定义事件
    this.__registEvent();
    //striplist参数
    this.__initStripListOptions();
  };

  /**
   *  子类cache实例参数
   * @return {Void}
   */
  _pro.__initCacheOption = function () {
    this[this._subOpt.cacheName + 'Options'] = {};
    _u._$forEach(this._subOpt.callBackList, function (item) {
      switch (item) {
        case 'onshare':
          this[this._subOpt.cacheName + 'Options'].onshare = function () {
            //分享完成后回调
            var list = this[this._subOpt.cacheName]._$getListInCache(this._listCacheKey);
            this.stripedList._$updateList(list);
            _notify.show('分享成功', 'success', 2000);
          }._$bind(this);
          break;
        case 'onsetgroup':
          this[this._subOpt.cacheName + 'Options'].onsetgroup = function () {
            this.stripedList._$refresh();
          }.bind(this);
          break;
        case 'onsetstate':
          this[this._subOpt.cacheName + 'Options'].onsetstate = function () { //设置批量状态成功后，刷新列表
            this.stripedList._$refresh();
          }.bind(this);
          break;
        case 'onversioncreated':
          this[this._subOpt.cacheName + 'Options'].onversioncreated = function () {
            var res = this[this._subOpt.cacheName]._$getItemInCache(this.__id);
            this.stripedList._$updateList(res.versions);
            this[this._subOpt.cacheName]._$clearListInCache(this._listCacheKey);
          }.bind(this);
          break;
        case 'ontag':
          this[this._subOpt.cacheName + 'Options'].ontag = function () {
            this.stripedList._$refresh();
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
    this[this._subOpt.cacheName + 'Options'] = _u._$merge(this[this._subOpt.cacheName + 'Options'], this._subOpt.cacheOption, this.__cacheOptions);
  };
  /**
   *  注册自定义事件
   * @return {Void}
   */
  _pro.__registEvent = function () {
    //注册自定义事件
    _c._$$CustomEvent._$allocate({
      element: window,
      event: this._subOpt.eventList
    });
  };

  /**
   * 初始化striplist
   * @return {Void}
   */
  _pro.__initStripListOptions = function () {
    var defaultOptions = {
      parent: _e._$getByClassName(this.__body, 'list-content')[0],
      listCache: this._subOpt.listCache,
      lsListKey: 'nei-' + this._subOpt.resType + 's-version-list',
      hasTagFilter: true,
      headers: [],
      defaultSortKey: 'createTime',
      sortable: true,
      hasSearchBox: true,
      hasHeaderFilter: true,
      afterRender: function () {
        var addBtn = _e._$getByClassName(this.__body, 'resource-version-add')[0];
        _e._$delClassName(addBtn.parentNode, 'f-dn');
      }.bind(this)
    };
    this.stripedListOptions = _u._$merge(defaultOptions, this._subOpt.stripedListOption);
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.stripedList = null;
    if (this._subOpt.resType !== 'group') {
      this.__groupCache = _groupCache._$$CacheGroup._$allocate();
    }
    //子类cache实例化
    this[this._subOpt.cacheName] = caches[this._subOpt.cacheKey]._$allocate(this[this._subOpt.cacheName + 'Options']);
    this.__proCache = _proCache._$$CachePro._$allocate(this.__proCacheOptions);
    this.__super(_options);
    this.__addEvent();
  };

  _pro.__onRefresh = function (_options) {
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__id = parseInt(_options.param.id.replace('/', ''));
    this._listCacheKey = this[this._subOpt.cacheName]._$getListKey(this.__pid);
    this._options = _options;
    this.__super(_options);
    //发送请求
    this[this._subOpt.cacheName]._$getItem({
      id: this.__id,
    });
  };

  /**
   * 隐藏模块
   * @return {Void}
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
    this.__shareLayer && this.__shareLayer.destroy();
    this.__shareLayer = null;
  };

  _pro.__addEvent = function () {
    var domEventList = [];
    domEventList.push([
      caches[this._subOpt.resType], 'itemsdeleted', function (event) {
        var resource = this[this._subOpt.cacheName]._$getItemInCache(this.__id);
        var deletedIdList = (event.data || []).map(function (it) {
          return it.id;
        });
        resource.versions = (resource.versions || []).filter(function (vs) {
          return !deletedIdList.includes(vs.id);
        });
        this.stripedList._$updateList(resource.versions);
        this[this._subOpt.cacheName]._$clearListInCache(this._listCacheKey);
      }.bind(this)
    ]);
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
        case 'res-tag':
          domEventList.push([
            window, 'res-tag', this.__showResTag.bind(this)
          ]);
          break;
        case 'res-version':
          var btn = _e._$getByClassName(this.__body, 'resource-version-add')[0];
          domEventList.push([
            btn, 'click', this.__showResVersion.bind(this)
          ]);
          break;
        default:
          break;
      }
    }.bind(this));
    if (this._subOpt.customEventFunc.length) {
      _u._$forEach(this._subOpt.customEventFunc, function (item2) {
        domEventList.push(item2);
      }.bind(this));
    }
    this.__doInitDomEvent(domEventList);

  };

  /**
   * 分享资源逻辑
   * @param  {Number} tid 模版id
   * @return {Void}
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

  _pro.__showResTag = function (event) {
    var currentCache = this[this._subOpt.cacheName];
    var inf = currentCache._$getItemInCache(this.__id);
    var list = inf.versions;
    this.__resTag = new resTag({
      data: {
        list: list,
        cache: currentCache,
        searchCache: caches[this._subOpt.resType],
        pid: this.__pid
      }
    }).$on('ok', function (data) {
      currentCache._$tag({
        data: {
          ids: event.ids,
          tags: data.tags.map(function (item) {
            return item.name;
          })
        },
        ext: {
          id: this.__id
        },
        actionMsg: '修改成功',
        key: currentCache._$getListKey(this.__pid)
      });
    }.bind(this));
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
   * 显示版本创建弹框
   * @param {Event} 事件对象
   */
  _pro.__showResVersion = function () {
    var resInstance = this[this._subOpt.resInstanceName];

    this.__resVersion = new resVersion({
      data: {
        cache: this[this._subOpt.cacheName],
        searchCache: caches[this._subOpt.resType],
        versionList: resInstance.versions || [],
        pid: resInstance.projectId,
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

  /**
   * 显示批量设置状态弹窗
   */
  _pro.__showResState = function (event) {
    this.__resState = new resState({
      data: {
        ids: event.ids,
        cache: this.__inCache,
        states: this.__inCache._$getStatusList(this.__inCache._$getListKey(this.__pid), true),
        pid: this.__pid
      }
    }).$on('ok', function (data) {
      this.__inCache._$setPatchState({
        actionMsg: '设置成功',
        data: data
      });
    }.bind(this));
  };
});
