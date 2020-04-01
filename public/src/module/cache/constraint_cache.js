/*
 * 规则函数缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './pg_cache.js',
  './pro_cache.js',
  './group_cache.js'
], function (_k, _u, _v, _c, _d, pgCache, proCache, groupCache, _p, pro) {
  _p._$$CacheConstraint = _k._$klass();
  pro = _p._$$CacheConstraint._$extend(_d._$$Cache);
  _p._$cacheKey = 'constraint';

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
   * @property {String} options.apply - 适用类型
   * @property {String} options.type - 函数类型
   * @property {String} [options.tag=''] - 标签
   * @property {String} [options.description=''] - 描述信息
   * @property {String} [options.groupId=''] - 所在业务分组id
   * @property {String} [options.function=''] - 函数执行体
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    options.data.name = options.data.name.trim();
    if (!_u._$isString(options.data.name)) {
      // console.error('请输入有效的名称');
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
    this.__super(options);
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 资源 id
   * 支持更新的字段有:
   * @property {String} options.name - 名称
   * @property {String} options.apply - 适用类型
   * @property {String} options.type - 函数类型
   * @property {String} [options.tag=''] - 标签
   * @property {String} [options.description=''] - 描述信息
   * @property {String} [options.groupId=''] - 所在业务分组id
   * @property {String} [options.function=''] - 函数执行体
   * @success dispatch event: onitemupdate
   */
  pro.__doUpdateItem = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      // 如果更新分组id，则需要将数据中的group更新
      if (options.data.hasOwnProperty('groupId')) {
        var _groupCache = groupCache._$$CacheGroup._$allocate();
        result.group = _groupCache._$getItemInCache(result.groupId);
        _groupCache._$recycle();
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
    if (options.key.indexOf(_p._$cacheKey) > -1) {
      url = '/api/constraints/' + (options.id || '');
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
    // 设置 __isShare 字段
    var _proCache = proCache._$$CachePro._$allocate();
    items.forEach(function (item) {
      // 资源共享与否, 就看它所属的项目是否为公共资源库
      // 设置 __isShare 字段
      item.__isShare = item.id > 10003 && _proCache._$isPublic(item.projectId);
    });
    _proCache._$recycle();
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
      }, this);
      _proCache._$recycle();
    }.bind(this);
    this.__super(options);
  };

  /**
   * 共享
   * @param {Object} options - 参数对象
   * @property {id} options.id - 规则函数id
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
        // 更新单条数据
        var sharedItem = list.find(function (item) {
          return item.id === evt.data.id;
        });
        // 分享后, 它的 projectId 有变化了, 需要更新
        Object.assign(sharedItem, evt.data);
        // 分享的资源, 需要加到公共资源库去中
        var _proCache = proCache._$$CachePro._$allocate();
        var publicProject = _proCache._$getPublicById(sharedItem.projectId);
        var listKey = this._$getListKey(publicProject.id);
        var projectList = this._$getListInCache(listKey);
        var found = projectList.find(function (it) {
          return it.id == sharedItem.id;
        });
        if (!found) {
          // __doUnshiftToList 方法并没有判断是否已经存在
          this.__doUnshiftToList(this._$getListKey(publicProject.id), sharedItem);
        }
        // 设置分享字段
        sharedItem.__isShare = true;
        this._$dispatchEvent('onshare', evt);
      }.bind(this)
    });
  };
  /**
   * 复制规则函数
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.copys 复制的规则函数
   * @property {String} options.data.tags 标签
   */
  pro._$clone = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'clone',
      actionMsg: options.actionMsg,
      onload: function () {
        //清空复制到的项目的constraint cache
        this._$clearListInCache(options.key);
        this._$dispatchEvent('onclone', {pid: options.data.pid, ext: options.ext});
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
          var res = this._$getItemInCache(id);
          var target = result.data.filter(function (res) {
            return res.id === id;
          })[0];
          res.tag = target.tag;
          res.tagPinyin = target.tagPinyin;
        }, this);
        this._$dispatchEvent('ontag');
      }.bind(this)
    });
  };
  /**
   * 移动规则函数
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.moves 移动的规则函数
   * @property {String} options.data.tags 标签
   */
  pro._$move = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'move',
      actionMsg: options.actionMsg,
      onload: function () {
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
        this._$dispatchEvent('onmove', {pid: options.data.pid, ext: options.ext});
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
        var groupId = options.data.groupId, group = _groupCache._$getItemInCache(groupId);
        options.data.ids.forEach(function (id) {
          var constraint = this._$getItemInCache(id);
          constraint.groupId = groupId;
          constraint.group = group;
        }.bind(this));
        this._$dispatchEvent('onsetgroup');
        _groupCache._$recycle();
      }.bind(this)
    });
  };
  /**
   * 规则函数生成响应的js函数字符串
   * @param constraints 规则函数列表
   * @returns {Array} - 规则函数字符串数据
   */
  pro._$getConstraintsFunction = function (constraints) {
    var functions = [];
    constraints.forEach(function (item) {
      var func = 'var ' + item.name + '=function(){' + item.function.replace(/'/g, /\\'/) + '};';
      functions.push(func);
    });
    return functions;
  };

});
