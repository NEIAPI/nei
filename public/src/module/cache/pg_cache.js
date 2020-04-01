/*
 * 项目组缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './pro_cache.js',
  './user_cache.js',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, u, v, _c, baseCache, proCache, userCache, db, _p, pro) {
  _p._$$CacheProGroup = _k._$klass();
  _p._$cacheKey = 'progroups'; // 项目组列表
  _p._$searchCacheKey = 'pg-searchlist'; // 搜索项目组列表
  pro = _p._$$CacheProGroup._$extend(baseCache._$$Cache);

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__cacheKey = _p._$cacheKey;
    this.__super(options);
  };

  /**
   * 新建项目组
   * @param {Object} options - 参数对象
   * @property {String} options.data.name - 新的项目组名称
   * @property {String} [options.data.description=''] - 新的项目组描述信息
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    if (!u._$isString(options.data.name) || !options.data.name.trim()) {
      return;
    }
    var onload = options.onload;
    options.onload = function (progroup) {
      // 新创建项目组后, 要把默认自带的 公共资源库 加到项目的 cache 中去
      this._setProjectListToCache([progroup]);
      onload(progroup);
    }.bind(this);
    this.__super(options);
  };

  pro.__isGetSearchList = function (options) {
    return options.ext && options.ext.isSearch;
  };

  /**
   * 加载列表
   * @param {Object} [options] - 参数对象
   * @success dispatch event: onlistload
   */
  pro.__doLoadList = function (options) {
    if (this.__isGetSearchList(options)) {
      var url = this.__getUrl(options);
      this.__sendRequest(url, options);
      return;
    }
    var onload = options.onload;
    options.onload = function (progroups) {
      this._setProjectListToCache(progroups);
      onload(progroups);
    }.bind(this);
    this.__super(options);
  };

  pro.__doLoadItem = function (options) {
    var onload = options.onload;
    options.onload = function (progroup) {
      if (progroup.projectTopList !== undefined) {
        this._setProjectListToCache([progroup]);
      }
      onload(progroup);
    }.bind(this);
    this.__super(options);
  };

  pro._$getList = function (options) {
    if (options.ext && options.ext.needFlush) {
      this._$clearListInCache(options.key);
    }
    this.__super(options);
  };

  /**
   * 将项目数据数据设置到项目的 cache 中去
   * @param {Object} progroups - 项目组列表
   */
  pro._setProjectListToCache = function (progroups) {
    var _proCache = proCache._$$CachePro._$allocate();
    progroups.forEach(function (progroup) {
      // 设置项目的isTop 属性
      var projectTopList = (progroup.projectTopList || '').split(',');
      progroup.projects.forEach(function (project) {
        project.isTop = projectTopList.indexOf(project.id) != -1 ? 1 : 0;
      });
      // 存到缓存中
      _proCache._$setListInCache(_proCache._$getListKey(progroup.id), progroup.projects);
      // todo: delete progroup.projects;
    });
  };

  /**
   * 更新项目组
   * @param {Object} options - 参数对象
   * @property {Number} options.data.id - 资源 id
   * 支持更新的字段有(需要更新哪个字段就传哪个字段):
   * @property {String} [options.data.name] - 项目组名称
   * @property {String} [options.data.description] - 项目组描述
   * @property {String} [options.data.verification] - 项目组验证方式
   * @property {String} [options.data.verificationRole] - 项目组的自动通过角色
   * @property {String} [options.data.toolSpecWebId] - 项目组使用的WEB工程规范id
   * @property {String} [options.data.toolSpecAosId] - 项目组使用的AOS工程规范id
   * @property {String} [options.data.toolSpecIosId] - 项目组使用的IOS工程规范id
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
    switch (options.key) {
      // 列表
      case _p._$cacheKey:
        url = '/api/progroups/' + (options.id || '');
        if (options.action) {
          url += '?' + options.action;
        }
        break;

      case _p._$searchCacheKey:
        url = '/api/progroups?search';
        break;
      default:
        break;
    }
    return url;
  };

  /**
   * 更换项目组创建者
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 项目组 id
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
        u._$merge(existItem, evt.data, {
          role: 'normal'
        });

        this._$dispatchEvent('onchangecreator', evt);

        v._$dispatchEvent(this.constructor, 'listchange');
      }._$bind(this),
      id: options.id
    });
  };

  /**
   * 退出项目组
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 项目组 id
   * @success dispatch event: onquit, listchange
   */
  pro._$quit = function (options) {
    var existItem = this._$getItemInCache(options.id);
    if (!existItem) return;
    this.__doAction({
      data: {
        id: options.id
      },
      method: 'PUT',
      action: 'quit',
      onload: function (evt) {
        //从我的项目组缓存里面删除该项目组
        this.__doRemoveItemFromList(_p._$cacheKey, options.id);

        this._$dispatchEvent('onquit', evt);
        v._$dispatchEvent(this.constructor, 'listchange');
      }._$bind(this),
      id: options.id
    });
  };

  /**
   * 设置项目组成员, 前端需要将所有成员信息一起发给后端
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 项目组 id
   * @property {Array} options.admins - 操作的用户列表
   * @success dispatch event: onsetmembers
   */
  pro._$setMembers = function (options) {
    var existItem = this._$getItemInCache(options.id);
    if (!existItem) return;
    this.__doAction({
      data: {
        users: options.users
      },
      method: 'PUT',
      action: 'setmembers',
      onload: 'onsetmembers',
      updateItem: true,
      id: options.id,
      ext: options.ext
    });
  };

  /**
   * 项目组排序
   * @param {Object} options - 参数对象
   * @property {Array|Number} options.ids 项目组的 id 数组
   * @property {Number} options.type - 排序方式
   * @success dispatch event: onsort, onlistchange
   */
  pro._$sort = function (options) {
    this.__doAction({
      ext: options.ext,
      key: options.key,
      data: {
        ids: options.ids,
        type: options.type
      },
      method: 'PUT',
      action: 'sort',
      updateListOrder: true,
      triggerListchange: true,
      onload: function (evt) {
        // 更新user上的项目组排序方式
        var user = userCache._$$CacheUser._$allocate()._$getUserInCache();
        user.progroupOrder = options.type;
        this._$dispatchEvent('onsort', evt);
      }.bind(this)
    });
  };

  /**
   * 项目组置顶
   * @param {Object} options - 参数对象
   * @property {Array|Number} options.id -  项目组 id
   * @property {Boolean} options.v - true 时为置顶, false 时为取消置顶
   * @success dispatch event: onlistchange
   */
  pro._$stick = function (options) {
    this.__doAction({
      data: {
        v: options.v
      },
      ext: options.ext,
      key: options.key,
      method: 'PUT',
      action: 'stick',
      id: options.id,
      onload: function (evt) {
        // 更新 user 对象中的 progroupTopList
        var user = userCache._$$CacheUser._$allocate()._$getUserInCache();
        var progroupTopList = evt.data.filter(function (item) {
          return item.isTop;
        });
        user.progroupTopList = progroupTopList.map(function (item) {
          return item.id;
        }).join(',');
        // 调整缓存中的项目组顺序
        var list = this._$getListInCache(this.__cacheKey);
        var newList = [];
        // evt.data 的顺序后端保证是正确的, 即置顶的会在最前面
        evt.data.forEach(function (item) {
          newList.push(list.find(function (pg) {
            return pg.id === item.id;
          }));
        });
        this._$setListInCache(this.__cacheKey, newList);
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
   * 获取某个项目组下的成员, 用于 select2 组件的 source 数据源
   * @param {Number} pgId - 项目组id
   * @return {Array} - 成员列表
   */
  pro._$getRespoSelectSource = function (pgId) {
    var progroup = this._$getItemInCache(pgId);
    var members = [progroup.creator].concat(
      progroup.admins, progroup.developers, progroup.testers, progroup.auditors, progroup.observers, progroup.owner
    );
    //去重
    var membersUnique = {};
    var membersData = [];
    members.forEach(function (m) {
      // 外部帐号的 realname 字段可能为空
      if (!membersUnique[m.id]) {
        membersUnique[m.id] = true;
        membersData.push({
          id: m.id,
          name: m.realname || m.username,
          namePinyin: m.realnamePinyin,
          title: m.realname ? (m.realname + '(' + m.username + ')') : m.username
        });
      }
    });
    return membersData;
  };

  /**
   * 获取某个项目组下的成员, 用于 select2 组件的 source 数据源
   * @param {Number} pgId - 项目组id
   * @return {Array} - 成员列表
   */
  pro._$getLobSelectSource = function (pgId) {
    var progroup = this._$getItemInCache(pgId);
    var lobs = {};
    progroup.projects.forEach(function (project) {
      if (project.lob) {
        lobs[project.lob] = 1;
      }
    });
    lobs = Object.keys(lobs);
    return lobs.map(function (lob) {
      return {
        name: lob,
        id: lob
      };
    });
  };


  /**
   * 获取某个项目组下的成员,
   * @param {Number} pgId - 项目组id
   * @return {Array} - 成员列表
   */
  pro._$getMembers = function (pgId) {
    var progroup = this._$getItemInCache(pgId);
    var members = [progroup.creator].concat(
      progroup.admins, progroup.developers, progroup.testers, progroup.observers
    );
    return members.map(function (m) {
      // 外部帐号的 realname 字段可能为空
      return {
        id: m.id,
        name: m.realname || m.username,
        namePinyin: m.realnamePinyin,
        title: m.realname ? (m.realname + '(' + m.username + ')') : m.username
      };
    });
  };


  /**
   * 获取当前登录用户在某个项目组中的角色
   * @param  {String} pgId -  项目组id
   * @return {String} 角色名
   */
  pro._$getRole = function (pgId) {
    var progroup = this._$getItemInCache(pgId);
    if (!progroup) {
      return 'others';
    }
    // 后端创建成功后, 并没有返回 admins 字段
    var user = userCache._$$CacheUser._$allocate();
    var userId = user._$getUserInCache().id; //当前登录用户ID
    user._$recycle();
    if (userId == progroup.creator.id) {
      return 'creator';
    }
    // 查看自己不可见的项目组
    if (!progroup.hasOwnProperty('admins')) {
      return 'others';
    }
    var userType = null;
    var found = null;
    var handler = function (users, type) {
      if (!userType) {
        found = users.find(function (item) {
          return item.id === userId;
        });
        if (found) {
          userType = type;
        }
      }
    };
    handler(progroup.admins, 'administrator');
    handler(progroup.developers, 'developer');
    handler(progroup.testers, 'tester');
    handler(progroup.observers, 'observer');
    //判断是否是审核者
    handler(progroup.auditors, 'auditor');
    return userType;
  };

  /**
   * 获取当前项目组接口配置信息
   * @param  {String} pgId -  项目组id
   * @return {number}
   */
  pro._$getApiAuditStatus = function (pgId) {
    var progroup = this._$getItemInCache(pgId);
    if (!progroup) {
      return 0;
    }
    return progroup.apiAudit;
  };

  /**
   * 获取当前项目组HTTP接口规范信息
   * @param  {String} pgId -  项目组id
   * @return {Object}
   */
  pro._$getHttpSpec = function (pgId) {
    var progroup = this._$getItemInCache(pgId);
    if (!progroup) {
      return null;
    }
    return progroup.httpSpec;
  };

  /**
   * 获取当前登录用户在某个项目组中的权限
   * @param  {String} pgId -  项目组id
   * @return {Object} 权限
   */
  pro._$getPrivilege = function (pgId) {
    var userRole = this._$getRole(pgId);
    return {
      isOthers: userRole === 'others',
      isObserver: userRole === 'observer',
      isTester: userRole === 'tester',
      isDev: userRole === 'developer',
      isCreator: userRole === 'creator',
      isAdmin: userRole === 'administrator',
      isAuditor: userRole === 'auditor',
      isInGroup: userRole !== 'others',
      isAdminOrCreator: /^(creator|administrator)$/.test(userRole)
    };
  };
  /**
   * 获取当前用户的所有用户组及项目（不包括公共项目）
   * @return {Array} 项目组
   */
  pro._$getGroupsWithoutPublic = function () {
    var groups = this._$getListInCache(this.__cacheKey),
      result = [];
    groups.forEach(function (group) {
      var projects = [];
      group.projects.forEach(function (project) {
        if (project.type === db.PRO_TYP_NORMAL) {
          projects.push(project);
        }
      });
      if (projects.length) {
        group = u._$merge({}, group);
        group.projects = projects;
        result.push(group);
      }
    });
    return result;
  };
  /**
   * 项目组锁定/解锁
   * @param {Object} options - 参数对象
   * @property {Array|Number} options.id -  项目组 id
   * @property {Boolean} options.v - true 时为锁定, false 时为解锁
   * @success dispatch event: onlistchange
   */
  pro._$lock = function (options) {
    this.__doAction({
      data: {
        v: options.v
      },
      ext: options.ext,
      key: options.key,
      method: 'PUT',
      action: 'lock',
      id: options.id,
      onload: function (evt) {
        var item = this._$getItemInCache(options.id);
        item.isLock = evt.data.isLock;
        // 触发 listchange 事件
        v._$dispatchEvent(
          this.constructor, 'update', {
            data: item,
            action: evt.action,
            ext: options.ext
          }
        );
      }.bind(this)
    });
  };

  pro._$hasWordStockOpPermission = function (pgId) {
    var privilege = this._$getPrivilege(pgId);
    return privilege.isAdminOrCreator;
  };
});
