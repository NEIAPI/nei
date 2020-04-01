/*
 * HTTP 接口缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './page_cache.js',
  './datatype_cache.js',
  './pg_cache.js',
  './pro_cache.js',
  './group_cache.js',
  './client_cache.js',
  'pro/notify/notify',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _u, _v, _c, _d, pageCache, dataTypeCache, pgCache, proCache, groupCache, _clientCache, notify, dbConst, _p, pro) {
  _p._$$CacheInterface = _k._$klass();
  pro = _p._$$CacheInterface._$extend(_d._$$Cache);
  _p._$cacheKey = 'interface';
  _p._$cacheRefKey = 'interface-ref-';
  _p._$cacheBatKey = 'interface-bat';

  _p._$systemStatusList = [{
    id: dbConst.STATUS_SYS_UNDERDEVELOPMENT,
    name: '未开始',
    namePinyin: 'wei\'kai\'shi',
    bgColor: '#6d6dc1'
  }, {
    id: dbConst.STATUS_SYS_AUDITING,
    name: '审核中',
    namePinyin: 'shen\'he\'zhong',
    value: '审核中',
    bgColor: '#ddbbdd'
  }, {
    id: dbConst.STATUS_SYS_AUDIT_FAILED,
    name: '审核失败',
    namePinyin: 'shen\'he\'shi\'bai',
    value: '审核失败',
    bgColor: '#dc3545'
  }, {
    id: dbConst.STATUS_SYS_DEVELOPING,
    name: '开发中',
    namePinyin: 'kai\'fa\'zhong',
    bgColor: '#dbb64c'
  }, {
    id: dbConst.STATUS_SYS_TESTING,
    name: '测试中',
    namePinyin: 'ce\'shi\'zhong',
    bgColor: '#9bdaf3'
  }, {
    id: dbConst.STATUS_SYS_PUBLISHED,
    name: '已发布',
    namePinyin: 'yi\'fa\'bu',
    bgColor: '#28a745'
  }, {
    id: dbConst.STATUS_SYS_ABANDONED,
    name: '已废弃',
    namePinyin: 'yi\'fei\'qi',
    bgColor: '#f04c62'
  }];

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 加载列表
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.offset] - 列表缓存列表起始位置
   * @property {Number} [options.limit] - 列表缓存列表当前查询条数
   * @property {Number} [options.total] - 是否有总数信息
   * @success dispatch event: onlistload
   */
  pro.__doLoadList = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      this.__setShareTagOnItems(result);
      onload(result);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 新建
   * @param {Object} options - 参数对象
   * @property {Number} options.projectId - 所在项目的id
   * @property {String} options.name - 名称
   * @property {String} options.path - HTTP 接口请求地址
   * @property {String} options.method - HTTP 接口请求方式
   * @property {String} [options.className=''] - 代码映射(接口类名)
   * @property {String} [options.tag=''] - 标签
   * @property {String} [options.description=''] - 描述信息
   * @property {String} [options.respoId=''] - 负责人id
   * @property {String} [options.groupId=''] - 所在业务分组id
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    options.data.name = options.data.name.trim();
    options.data.path = options.data.path.trim();
    if (!_u._$isString(options.data.name)) {
      return;
    }
    if (!_u._$isString(options.data.path)) {
      return;
    }
    var onload = options.onload;
    options.onload = function (item) {
      // 如果是在公共资源库添加了数据模型, 则需要更新所有项目组中的所有项目的数据模型列表
      var _proCache = proCache._$$CachePro._$allocate();
      if (_proCache._$isPublic(item.projectId)) {
        // 是公共资源库
        item.__isShare = true; // 设置共享标记
        var allProjects = _proCache.__getHash();
        Object.keys(allProjects).forEach(function (projectId) {
          var project = allProjects[projectId];
          if (project.progroupId === item.progroupId && project.id !== item.projectId) {
            // 在当前公共资源库所属项目组的项目列表中, 并且不是当前项目
            this.__doUnshiftToList(this._$getListKey(project.id), item);
          }
        }, this);
      }
      _proCache._$recycle();
      onload(item);
    }.bind(this);
    var _dtCache = dataTypeCache._$$CacheDatatype._$allocate();
    _dtCache._$clearListInCache(options.data.pid);
    _dtCache._$recycle();
    this.__super(options);
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 资源 id
   * 支持更新的字段有:
   * @property {String} [options.name] - 名称
   * @property {String} [options.tag] - 标签
   * @property {String} [options.path] - 路径
   * @property {String} [options.description] - 描述
   * @property {Array} [options.parameters] - 参数列表
   * @property {Array} [options.respoId] - 负责人id
   * @property {Array} [options.groupId] - 业务分组id
   * @property {Array} [options.imports] - 导入的参数列表
   * @property {Number} [options.reqFormat] - 请求参数类别
   * @property {Array} [options.resFormat] - 响应参数类别
   * @success dispatch event: onitemupdate
   */
  pro.__doUpdateItem = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      if (result.params) {
        // 在修改 reqFormat 和 resFormat 的时候, 后端只返回 params 相应的参数(inputs 或者 outputs), 不能直接交给 nej 处理, 不然其他参数会丢失
        var interfaceData = this._$getItemInCache(result.id);
        Object.keys(interfaceData.params).forEach(function (item) {
          if (!result.params.hasOwnProperty(item)) {
            result.params[item] = interfaceData.params[item];
          }
        });
      }
      // 如果更新分组id，则需要将数据中的group更新
      if (options.data.hasOwnProperty('groupId')) {
        var _groupCache = groupCache._$$CacheGroup._$allocate();
        result.group = _groupCache._$getItemInCache(result.groupId);
        _groupCache._$recycle();
      }
      if (options.data.hasOwnProperty('statusId')) {
        result.status = _p._$systemStatusList.find(function (sStatus) {
          return sStatus.id === options.data.statusId;
        });
        ;
      }
      onload(result);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  pro.__getUrl = function (options) {
    var url;
    if (options.key === _p._$cacheRefKey) {
      url = '/api/interfaces' + options.id + '?ref';
    } else if (options.key === _p._$cacheBatKey) {
      url = '/api/interfaces?bat';
    } else if (options.key.indexOf(_p._$cacheKey) > -1) {
      url = '/api/interfaces/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

  /**
   * 设置 __isShare 属性
   * @param  {Array} items - 列表项
   */
  pro.__setShareTagOnItems = function (items) {
    // 接口列表的请求, 设置 __isShare 字段
    var _proCache = proCache._$$CachePro._$allocate();
    items.forEach(function (item) {
      // 资源共享与否, 就看它所属的项目是否为公共资源库
      // 设置 __isShare 字段
      item.__isShare = item.id > 10003 && _proCache._$isPublic(item.projectId);
    });
    _proCache._$recycle();
  };

  /**
   * 验证项缓存中的项是否有效，子类可重写
   *
   * @protected
   * @method module:util/cache/list._$$CacheList#__doCheckItemValidity
   * @param  {Object}  _item - 数据项
   * @param  {String}  _lkey - 列表标识
   * @return {Boolean}        是否有效
   */
  pro.__doCheckItemValidity = function (_item, _lkey) {
    // 如果没有 params 属性, 则在调用 $getItem 方法时需要重新获取数据
    return _item.hasOwnProperty('params');
  };

  /**
   * 批量删除
   * @param {Object} options - 参数对象
   * @property {Number} options.ids- 要删除的 id 列表
   * @success dispatch event: onitemsdelete, listchange
   */
  pro._$deleteItems = function (options) {
    options.onload = function (event) {
      // 如果删除的是公共资源库中的HTTP 接口, 则其他项目(同个项目组)中对应的HTTP 接口也删除
      var _proCache = proCache._$$CachePro._$allocate();
      var deletedList = event.data;
      deletedList.forEach(function (item) {
        if (_proCache._$isPublic(item.projectId)) {
          // 是公共资源库
          var allProjects = _proCache.__getHash();
          Object.keys(allProjects).forEach(function (projectId) {
            var project = allProjects[projectId];
            if (project.progroupId === item.progroupId && project.id !== item.projectId) {
              // 在当前公共资源库所属项目组的项目列表中, 并且不是当前项目
              this.__doRemoveItemFromList(this._$getListKey(project.id), item);
            }
          }, this);
        }
        delete this.__getHash()[item.id];
        var allInterfaces = this.__getHash();
        Object.keys(allInterfaces).forEach(function (interId) {
          var interface = allInterfaces[interId];
          if (interface.versions && interface.versions.length) {
            interface.versions = interface.versions.filter(function (it) {
              return it.id !== item.id;
            });
          }
        });
      }, this);
      _proCache._$recycle();
    }.bind(this);
    this.__super(options);
  };

  /**
   * 共享
   * @param {Object} options - 参数对象
   * @property {id} options.id 接口id
   * @success dispatch event: onshare
   */
  pro._$share = function (options) {
    this.__doAction({
      data: {
        isShare: 1
      },
      id: options.id,
      method: 'PUT',
      action: 'share',
      onload: function (evt) {
        var list = this._$getListInCache(options.ext.cacheKey);
        // 更新HTTP 接口单条数据
        var sharedItem = list.find(function (item) {
          return item.id === evt.data.interface.id;
        });
        // 分享后, 它的 projectId 有变化了, 需要更新
        Object.assign(sharedItem, evt.data.interface);
        // 设置分享字段
        sharedItem.__isShare = true;
        var _proCache = proCache._$$CachePro._$allocate();
        var publicProject = _proCache._$getPublicById(sharedItem.projectId);
        // 分享的资源, 需要加到公共资源库去中
        var listKey = this._$getListKey(publicProject.id);
        var projectList = this._$getListInCache(listKey);
        var found = projectList.find(function (it) {
          return it.id == sharedItem.id;
        });
        if (!found) {
          // __doUnshiftToList 方法并没有判断是否已经存在
          this.__doUnshiftToList(this._$getListKey(publicProject.id), sharedItem);
        }
        // 更新被共享的数据模型列表
        var dc = dataTypeCache._$$CacheDatatype._$allocate();
        dc._$setSharedItems(evt.data.datatypes, dc._$getListKey(options.ext.pid));
        this._$dispatchEvent('onshare', evt);
      }.bind(this)
    });
  };

  /**
   * 从服务器获取引用某个HTTP 接口的页面列表
   * @param {Object} options - 参数
   * @property {Number} options.id - HTTP 接口的id
   * @success dispatch event: onreflistload
   */
  pro._$getRefList = function (options) {
    var refKey = _p._$cacheKeyRef + options.id;
    this.__getRefList(
      refKey, {
        pc: pageCache._$$CachePage._$allocate(),
        clic: _clientCache._$$CacheClient._$allocate()
      },
      options
    );
  };

  /**
   * 批量获取接口详情
   * @param {Object} options - 参数
   * @property {String} options.ids - HTTP 接口的 id 列表, 以逗号分隔
   * @success dispatch event: oncustomlistload
   */
  pro._$getCustomList = function (options) {
    var key = _p._$cacheBatKey;
    var callback = this._$dispatchEvent._$bind(
      this, 'oncustomlistload', {
        key: key,
        ext: options.ext
      }
    );
    var url = this.__getUrl({
      key: key
    });
    // 过滤掉已经存在在缓存中的数据
    var sendIds = [];
    var ids = options.ids.split(',');
    ids.forEach(function (id) {
      var item = this._$getItemInCache(id);
      if (!item || !item.hasOwnProperty('params')) {
        // 接口不存在或者还没有详情数据
        sendIds.push(id);
      }
    }, this);
    if (sendIds.length === 0) {
      // 缓存中已经有所有的数据
      return callback();
    }
    this.__sendRequest(url, {
      data: {
        ids: sendIds.join(',')
      },
      onload: function (result) {
        // 缓存数据
        result.forEach(function (item) {
          this.__doSaveItemToCache(item);
        }, this);
        callback();
      }.bind(this)
    });
  };
  /**
   * 批量增删标签
   * @param options 配置参数
   * @property {Array} options.data.ids 批量资源id
   * @property {Array} options.data.tags 标签
   */
  pro._$tag = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'tag',
      actionMsg: options.actionMsg,
      onload: function (result) {
        options.data.ids.forEach(function (id) {
          var originalRes;
          if (options.ext && options.ext.id) {
            originalRes = this._$getItemInCache(options.ext.id);
          }
          var res = this._$getItemInCache(id);
          if (!res && options.ext.id) {
            res = originalRes.versions.find(function (ver) {
              return ver.id === id;
            });
          }
          var target = result.data.filter(function (res) {
            return res.id === id;
          })[0];
          if (res) {
            res.tag = target.tag;
            res.tagPinyin = target.tagPinyin;
          }
          if (originalRes) {
            var version = originalRes.versions.find(function (ver) {
              return ver.id === id;
            });
            if (version) {
              version.tag = target.tag;
              version.tagPinyin = target.tagPinyin;
            }
          }
        }, this);
        this._$dispatchEvent('ontag');
      }.bind(this)
    });
  };
  /**
   * 复制HTTP 接口
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.copys 复制的HTTP 接口数据
   * @property {String} options.data.tags 标签
   */
  pro._$clone = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'clone',
      actionMsg: options.actionMsg,
      onload: function () {
        //清空复制到的项目的interface cache
        this._$clearListInCache(options.key);
        //复制接口的时候，有可能会产生新的匿名类型，这时候清空缓存，不维护数据模型缓存，后面会重新加载数据模型列表
        var dtCache = dataTypeCache._$$CacheDatatype._$allocate();
        dtCache._$clearListInCache(dtCache._$getListKey(options.data.pid));
        dtCache._$recycle();
        this._$dispatchEvent('onclone', {
          pid: options.data.pid,
          ext: options.ext
        });
      }.bind(this)
    });
  };
  /**
   * 移动HTTP 接口
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.moves 移动的HTTP 接口数据
   * @property {String} options.data.tags 标签
   */
  pro._$move = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'move',
      actionMsg: options.actionMsg,
      onload: function () {
        // 接口被移动后，它的参数可能会发生变化，这里将它们的参数删除
        options.data.moves.forEach(function (itf) {
          delete this._$getItemInCache(itf).params;
        }, this);
        // 接口被移动后，在目标项目可能会生成新的数据模型，这里清除目标项目的数据模型列表
        var _dtCache = dataTypeCache._$$CacheDatatype._$allocate();
        _dtCache._$clearListInCache(options.data.pid);

        var _proCache = proCache._$$CachePro._$allocate();
        if (options.ext.isPublic) { //对于移动到公共资源库，需要将该项目下的所有项目的cache清空
          var group = _proCache._$getProgroupByProId(options.ext.originPid);
          group.projects.forEach(function (item) {
            this._$clearListInCache(this._$getListKey(item.id));
          }.bind(this));
        } else {
          //从当前项目cache中删除移动项，并清空目标项目cache数据
          this.__doRemoveItemFromList(this._$getListKey(options.ext.originPid), options.data.moves);
          this._$clearListInCache(options.key);
        }
        this._$dispatchEvent('onmove', {
          pid: options.data.pid,
          ext: options.ext
        });
      }.bind(this)
    });
  };
  /**
   * 批量创建CRUD接口
   * @param options 配置参数
   * @property {Number} options.data.pid 项目id
   * @property {Array} options.data.items 创建接口的配置数据
   * @property {String} options.data.items.tag 接口标签
   * @property {Number} options.data.items.gid 接口分组id
   * @property {Array} options.data.items.interfaces 接口数据
   * @property {String} options.data.items.interfaces.name 接口名称
   * @property {String} options.data.items.interfaces.method 接口请求方法
   * @property {String} options.data.items.interface.path 接口路径
   * @private
   */
  pro._$crud = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'crud',
      onload: function () {
        this._$clearListInCache(options.key);
        this._$dispatchEvent('oncrud');
      }.bind(this)
    });
  };
  /**
   * 批量设置分组
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Array} options.data.ids 批量资源id
   * @property {Number} options.data.groupId 分组id
   */
  pro._$setGroup = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'bisgroup',
      actionMsg: options.actionMsg,
      onload: function () {
        //修改所选数据模型的分组
        var _groupCache = groupCache._$$CacheGroup._$allocate();
        var groupId = options.data.groupId,
          group = _groupCache._$getItemInCache(groupId);
        var interHash = this.__getHash();
        options.data.ids.forEach(function (id) {
          Object.keys(interHash).forEach(function (iid) {
            var inter = interHash[iid];
            if (inter.id === id) {
              inter.groupId = groupId;
              inter.group = group;
            }
            (inter.versions || []).forEach(function (subversion) {
              if (subversion.id === id) {
                subversion.groupId = groupId;
                subversion.group = group;
              }
            });
          });
        }.bind(this));
        this._$dispatchEvent('onsetgroup');
        _groupCache._$recycle();
      }.bind(this)
    });
  };

  pro._$createVersion = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'newversion',
      actionMsg: options.actionMsg,
      onload: function (result) {
        var inter = result.data;
        var hash = this.__getHash();
        Object.keys(hash).forEach(function (iid) {
          var interface = hash[iid];

          if ((interface.version &&
            interface.version.origin &&
            interface.version.origin === inter.version.origin) ||
            interface.id === inter.version.origin) {
            interface.versions = interface.versions || [];
            interface.versions.unshift(inter);
          }
          if (interface.id === inter.version.origin && !interface.version) {
            interface.version = {
              parent: parseInt(iid),
              origin: parseInt(iid),
              name: '初始版本'
            };
          }
        });
        // add the item to list
        this.__doUnshiftToList(this._$getListKey(inter.projectId), inter);

        this._$dispatchEvent('onversioncreated', {
          inter: inter
        });
        _v._$dispatchEvent(
          this.constructor, 'versioncreated', {
            inter: inter
          }
        );
      }.bind(this)
    });
  };
  /**
   * 批量设置状态
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Array} options.data.ids 批量资源id
   * @property {Number} options.data.state 状态名称
   */
  pro._$setPatchState = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'status',
      actionMsg: options.actionMsg,
      onload: function () {
        //同步缓存中接口状态，列表页会用到
        options.data.ids.forEach(function (id) {
          var interHash = this.__getHash();
          Object.keys(interHash).forEach(function (iid) {
            var inter = interHash[iid];
            var sid = options.data.statusId;
            var matchedStatus = _p._$systemStatusList.find(function (sStatus) {
              return sStatus.id === sid;
            });
            if (inter.id === id) {
              inter.status = matchedStatus;
              inter.statusId = matchedStatus.id;
            }
            (inter.versions || []).forEach(function (subversion) {
              if (subversion.id === id) {
                subversion.status = matchedStatus;
                subversion.statusId = matchedStatus.id;
              }
            });
          }.bind(this));
        }.bind(this));
        this._$dispatchEvent('onsetstate');
      }.bind(this)
    });
  };

  /**
   * 根据 key 值获取相应列表中的状态(status)列表,根据业务需要排查审核中和审核失败的按钮
   * 系统内置状态实体 - 后续应支持自定义
   * @param {String} listKey - 列表的key
   * @param {Boolean} isAll - 是否提供所有可选择的状态实体，供修改用
   * @return {Array} - status 列表
   */
  pro._$getStatusList = function (listKey, isAll) {
    var list = this._$getListInCache(listKey);
    var statusList = [];
    var systemStatusListCopy = [];
    _p._$systemStatusList.forEach(function (status) {
      if (!(status.id === dbConst.STATUS_SYS_AUDITING || status.id === dbConst.STATUS_SYS_AUDIT_FAILED)) {
        systemStatusListCopy.push(status);
      }
    });
    if (isAll) {
      systemStatusListCopy.sort(function (a, b) {
        return a.name.localeCompare(b.name, 'zh-CN');
      });
      return systemStatusListCopy;
    }
    (list || []).forEach(function (item) {
      if (item.status &&
        item.status.id &&
        statusList.every(function (status) {
          return status.id !== item.status.id;
        })) {
        statusList.push(item.status);
      }
    });
    statusList.sort(function (a, b) {
      return a.name.localeCompare(b.name, 'zh-CN');
    });
    return statusList;
  };


  /**
   * 将接口中的客户端列表存到相应的缓存中去, 分加载和更新两种情况:
   * 1. 加载接口详情时, 直接将数据存到相应的缓存中
   * 2. 并不是所有的更新操作后端都会返回 clients, 这里只在后端返回 clients 信息的时候更新相应的缓存
   * @param {Object} page - 页面对象
   */
  pro._updateListCache = function (inter) {
    if (inter.hasOwnProperty('clients')) {
      var _clientCache = _clientCache._$$CacheClient._$allocate();
      _clientCache._$setListInCache(_clientCache._$getListKey(inter.projectId, inter.id), inter.clients);
      _clientCache._$recycle();
    }
  };

  /**
   * 审核接口
   * @param {Object} options - 资源
   * @property {number} [options.id] - 资源id
   * @property {string} [options.state] - 审核状态位
   * @property {string} [options.reason] - 审核通过或不通过原因
   */
  pro._$audit = function (options) {
    var data = {
      state: options.state,
      reason: options.reason,
    };
    this.__doAction({
      id: options.id,
      data: data,
      actionMsg: options.actionMsg || '',
      onload: function (data) {
        options.onload(data);
        var interfaceData = this._$getItemInCache(data.data.id);
        interfaceData.status = data.data.status;
        interfaceData.statusId = data.data.statusId;
      }._$bind(this),
      method: 'PUT',
      action: 'audit'
    });
  };

  /**
   * 重新提交审核
   * @param {Object} options - 资源
   * @property {number} [options.id] - 资源id
   */
  pro._$reaudit = function (options) {
    this.__doAction({
      id: options.id,
      data: {},
      actionMsg: options.actionMsg || '',
      method: 'PUT',
      action: 'reaudit',
      onload: function (data) {
        options.onload(data);
        var interfaceData = this._$getItemInCache(data.data.id);
        interfaceData.status = data.data.status;
        interfaceData.statusId = data.data.statusId;
      }._$bind(this),
    });
  };

  /**
   * 发送api变更消息
   * @success dispatch event: onwatch
   */
  pro._$sendApiChangeMessage = function (options) {
    this.__doAction({
      data: {
        content: options.content
      },
      actionMsg: '发送成功',
      onload: options.onload,
      method: 'POST',
      id: options.id,
      action: 'sendApiChangeMsgToWatch'
    });
  };
  /**
   * 批量新建HTTP 接口
   * @param {Object} options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.projectId 项目id
   * @property {Number} options.data.groupId 分组id
   * @property {Array} options.data.items 导入的HTTP 接口
   * @success dispatch event: onbatch
   */
  pro._$batch = function (options) {
    notify.show('正在导入接口数据，请稍候...', 'info', 30000);
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'bat',
      actionMsg: '导入成功',
      onload: function (evt) {
        notify.closeAll();
        // 更新数据模型列表
        var dc = dataTypeCache._$$CacheDatatype._$allocate();
        var interfaceListKey = dc._$getListKey(options.data.projectId);
        evt.data.datatypes.forEach(function (item) {
          var obj = dc._$getItemInCache(item.id);
          if (obj) {
            dc.__doRemoveItemFromList(interfaceListKey, item.id);
          }
        }.bind(this));
        // 标记匿名类型
        evt.data.datatypes.forEach(dc._setAnon, dc);
        dc.__doUnshiftToList(interfaceListKey, evt.data.datatypes);
        var datatypeListKey = options.key;
        // 更新HTTP 接口列表
        evt.data.interfaces.forEach(function (item) {
          var obj = this._$getItemInCache(item.id);
          if (obj) {
            this.__doRemoveItemFromList(datatypeListKey, item.id);
          }
        }.bind(this));
        this.__doUnshiftToList(datatypeListKey, evt.data.interfaces);
        this._$dispatchEvent('onbatch', evt);
      }.bind(this)
    });
  };
});
