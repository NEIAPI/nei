/*
 * 项目缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './pg_cache.js',
  './user_cache.js',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _u, v, _c, baseCache, pgCache, userCache, dbConst, _p, pro) {
  _p._$$CachePro = _k._$klass();
  pro = _p._$$CachePro._$extend(baseCache._$$Cache);
  _p._$cacheKey = 'projects'; // 项目列表
  _p._$searchCacheKey = 'projects-searchlist'; // 搜索项目列表
  _p._$recentCacheKey = 'projects-recent'; // 最近使用的项目列表
  _p._$cloneCacheKey = 'project-clone';//复制项目的key
  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  pro.__isGetSearchList = function (options) {
    return options.key === _p._$searchCacheKey || options.key === _p._$recentCacheKey;
  };

  pro._$getList = function (options) {
    if (options.ext && options.ext.needFlush) {
      this._$clearListInCache(options.key);
    }
    this.__super(options);
  };

  /**
   * 加载列表
   * @param {Object} [options] - 参数对象
   * @success dispatch event: onlistload
   */
  pro.__doLoadList = function (options) {
    // 如果是搜索列表或者最近使用列表, 就去请求数据
    if (this.__isGetSearchList(options)) {
      var url = this.__getUrl(options);
      return this.__sendRequest(url, options);
    }
    // 项目列表, 目前都是附着在项目组列表上的, 所以这里直接去请求项目组列表
    // 进到这个函数中, 说明此时项目组列表并未加载完成
    // 项目组列表是肯定会加载的, 需要显示左边的树
    var _pgCache = pgCache._$$CacheProGroup._$allocate({
      onlistload: function (evt) {
        var event = {
          key: options.key,
          data: evt.data,
          action: options.action,
          ext: options.ext
        };
        this._$dispatchEvent('onlistload', event);
      }.bind(this)
    });
    _pgCache._$getList({
      key: pgCache._$cacheKey
    });
  };

  /**
   * 新建项目
   * @param {Object} options - 参数对象
   * @property {String} options.data.name - 新的项目组名称
   * @property {String} [options.data.description=''] - 新的项目组描述信息
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    if (!_u._$isString(options.data.name) || !options.data.name.trim()) {
      // console.error('请输入有效的项目名称');
      return;
    }
    this.__super(options);
  };

  /**
   * 更新项目
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 资源 id
   * 支持更新的字段有:
   * @property {String} [options.name] - 项目名称
   * @property {String} [options.description] - 项目描述
   * @property {String} [options.toolSpecWebId] - 使用的Web规范标识
   * @property {String} [options.toolSpecAosId] - 使用的Aos规范标识
   * @property {String} [options.toolSpecIosId] - 使用的Ios规范标识
   * @success dispatch event: onitemupdate
   */
  pro.__doUpdateItem = function (options) {
    this.__super(options);
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  pro.__getUrl = function (options) {
    var url;
    //项目复制的时候key值用来标识项目组缓存ext.xkey来代替
    if (options.ext && options.ext.xkey == _p._$cloneCacheKey) {
      url = '/api/projects/?clone';
      return url;
    }
    if (options.key === _p._$searchCacheKey) {
      url = '/api/projects/?search';
    } else if (options.key === _p._$recentCacheKey) {
      url = '/api/projects/?recent';
    } else if (options.key.indexOf(_p._$cacheKey) > -1) {
      url = '/api/projects/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

  /**
   * 项目组内的项目排序
   * @param {Object} options - 参数对象
   * @property {Number} options.pgId - 项目组 id
   * @property {Array|Number} options.ids - 项目 id 列表
   * @property {Number} options.type - 排序方式
   * @success dispatch event: onsort, onlistchange
   */
  pro._$sort = function (options) {
    this.__doAction({
      data: {
        ids: options.ids,
        type: options.type,
        pgId: options.pgId
      },
      ext: options.ext,
      key: options.key,
      method: 'PUT',
      action: 'sort',
      updateListOrder: true,
      triggerListchange: true,
      onload: function (evt) {
        // 更新项目组上的项目排序方式
        var _pgCache = pgCache._$$CacheProGroup._$allocate();
        var pg = _pgCache._$getItemInCache(options.pgId);
        pg.projectOrder = options.type;
        this._$dispatchEvent('onsort', evt);
      }.bind(this),
      id: options.id
    });
  };

  /**
   * 重新生成工具标识key
   * @param {Object} options - 参数对象
   * @success dispatch event: onrefreshkey
   */
  pro._$refreshKey = function (options) {
    this.__doAction({
      key: options.key,
      method: 'PUT',
      data: {
        reqHolder: 1
      },
      action: 'rtk',
      onload: function (evt) {
        this.__setDataInCache(evt.key, evt.data);
        this._$dispatchEvent('onrefreshkey', evt);
      }.bind(this),
      id: options.id
    });
  };

  /**
   * 项目置顶
   * @param {Object} options - 参数对象
   * @property {Array|Number} options.id -  资源 id
   * @property {Number} options.pgId -  项目所在的项目组 id
   * @property {Boolean} options.v - true 时为置顶, false 时为取消置顶
   * @success dispatch event: onlistchange
   */
  pro._$stick = function (options) {
    this.__doAction({
      data: {
        v: options.v,
        pgId: options.pgId
      },
      ext: options.ext,
      key: options.key,
      method: 'PUT',
      action: 'stick',
      id: options.id,
      onload: function (evt) {
        // 更新项目组对象上的 projectTopList
        var _pgCache = pgCache._$$CacheProGroup._$allocate();
        var progroup = _pgCache._$getItemInCache(options.pgId);
        var projectTopList = evt.data.filter(function (item) {
          return item.isTop;
        });
        progroup.projectTopList = projectTopList.map(function (item) {
          return item.id;
        }).join(',');
        // 调整缓存中的项目列表顺序
        var list = this._$getListInCache(this._$getListKey(progroup.id));
        var newList = [];
        // evt.data 的顺序后端保证是正确的, 即置顶的会在最前面
        evt.data.forEach(function (item) {
          newList.push(list.find(function (pro) {
            //设置当前项目的置顶状态
            if (pro.id == item.id && pro.id == options.id) {
              pro.isTop = item.isTop;
            }
            return pro.id === item.id;
          }));
        });
        this._$setListInCache(this._$getListKey(progroup.id), newList);
        // 触发 listchange 事件
        v._$dispatchEvent(
          this.constructor, 'listchange', {
            data: newList,
            action: evt.action,
            ext: options.ext
          }
        );
      }.bind(this)
    });
  };

  /**
   * 根据项目 id 查项目组, 同步方法
   * @param {String} pid - 项目id
   */
  pro._$getProgroupByProId = function (pid) {
    var project = this._$getItemInCache(pid);
    var pgId = project.progroupId;
    var _pgCache = pgCache._$$CacheProGroup._$allocate();
    var progroup = _pgCache._$getItemInCache(pgId);
    _pgCache._$recycle();
    return progroup;
  };
  /**
   * 根据项目 id 查项目组 同步方法(可配置是否包含当前项目，公共资源库)
   * @param {String} pid - 项目id
   * @param {Boolean} hasCurrent - 是否包含当前项目
   * @param {Boolean} hasPublic - 是否包含公共资源库
   */
  pro._$getProgroupByProId2 = function (pid, hasCurrent, hasPublic) {
    if (hasCurrent === undefined) { //默认包含当前项目，hasCurrent为true
      hasCurrent = true;
    }
    if (hasPublic === undefined) {//默认包含当前项目，hasCurrent为true
      hasPublic = true;
    }
    var progroup = this._$getProgroupByProId(pid);
    var result = _u._$merge({}, progroup);
    result.projects = [];
    progroup.projects.forEach(function (item) {
      if ((item.type === dbConst.PRO_TYP_COMMON && hasPublic) || item.type === dbConst.PRO_TYP_NORMAL && (hasCurrent || item.id !== pid)) {
        result.projects.push(item);
      }
    });
    return result;
  };


  /**
   * 根据项目 id, 判断是否为项目的创建者
   * @param {String} pid - 项目id
   * @return {Boolean} 是否为创建者
   */
  pro._$isCreator = function (pid) {
    var project = this._$getItemInCache(pid);
    if (!project) {
      return false;
    }
    var userId = userCache._$$CacheUser._$allocate()._$getUserInCache().id;
    return project.creatorId === userId;
  };
  /**
   * 判断项目是否为公共资源库
   * @param {Number} id - 项目id
   * @return {Boolean} 是否为公共资源库
   */
  pro._$isPublic = function (id) {
    var project = this._$getItemInCache(id);
    return project && project.type === dbConst.PRO_TYP_COMMON;
  };
  /**
   * 根据项目id, 获取它所属的项目组中的公共项目
   * @param {Number} id - 项目id
   * @return {Object} 公共资源库
   */
  pro._$getPublicById = function (id) {
    var project = this._$getItemInCache(id);
    if (project.type === dbConst.PRO_TYP_COMMON) {
      return project;
    } else {
      var list = this._$getListInCache(this._$getListKey(project.progroupId));
      return list.find(function (item) {
        return item.type === dbConst.PRO_TYP_COMMON;
      });
    }
  };
  /**
   * 更换项目创建者
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 项目 id
   * @property {Number} options.toId - 要移交的用户id
   * @success dispatch event: onchangecreator
   */
  pro._$changeCreator = function (options) {
    var existItem = this._$getItemInCache(options.id);
    if (!existItem) return;
    this.__doAction({
      data: {
        toId: options.data.toId
      },
      method: 'PUT',
      action: 'changecreator',
      onload: function (evt) {

        //修改项目组里成员信息
        //项目移交之后，角色变成了普通开发者
        _u._$merge(existItem, evt.data);

        this._$dispatchEvent('onchangecreator', evt);

        v._$dispatchEvent(this.constructor, 'listchange', options);
      }._$bind(this),
      id: options.id
    });
  };
});

