NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'util/event/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/activitylist/activitylist',
  'pro/cache/word_cache',
  'pro/cache/group_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/cache/pro_cache',
  'pro/stripedlist/stripedlist',
  'pro/tagme/tagme',
  'pro/select2/select2',
  'pro/common/constants',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _u, _e, _v, c, _t, _l, _j, _m, _cu, jstExt, _aList, cache, _groupCache, _pgCache, _usrCache, _proCache, stripedList, _tag, _s2, consts, _db, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleResWordDetail}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResWordDetail = _k._$klass();
  _pro = _p._$$ModuleResWordDetail._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-word-detail')
    );
    // 注意： 由于该详情页可展示系统预置类型的词条，所以当用户进入参数词库的详情页时，url的查询参数中所带的pid为当前项目id，而非资源的projectId(否则权限会出问题)。
    // 该详情页中用到的 pid pgid等都是以 url 中的 pid 为准，仅业务分组使用了资源的projectId。
    this.__cache = cache._$$CacheWord._$allocate({
      onitemload: function () {
        this.__word = this.__cache._$getItemInCache(this.__id);
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this._permit = true;
            var hasOpPermission = this.__pgCache._$hasWordStockOpPermission(this.__pgid);
            // 是否为系统类型
            this._isSystem = this.__word.type === _db.WORD_TYP_SYSTEM;
            // 系统类型的详情页不能做修改，只能在列表页调整禁用关系
            if (!hasOpPermission || this._isSystem) {
              this._permit = false;
            }
            this.__word.permit = this._permit;
            this.__word.nameRegex = '^.{1,100}$';  // 1~100个中英文字符

            // 如果是系统类型，则不加载分组，因为没有权限。
            if (this._isSystem) {
              this.__renderView();
              return;
            }

            //业务分组cache
            this.__groupCache = _groupCache._$$CacheGroup._$allocate({
              onlistload: function (result) {
                this.__groups = this.__groupCache._$getGroupSelectSource(this.__word.projectId);
                this.__renderView();
              }._$bind(this)
            });
            this.__groupCache._$getList({
              key: this.__groupCache._$getListKey(this.__word.projectId),
              data: {
                pid: this.__word.projectId
              }
            });

          }._$bind(this)
        });
        this.__pgCache._$getItem({
          id: this.__pgid
        });
      }._$bind(this)
    });
    //项目cache
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function (result) {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__pgid = this.__project.progroupId;
        this.__cache._$getItem({
          id: this.__id,
          key: cache._$cacheKey
        });
      }.bind(this)
    });
  };

  _pro.__initWatch = function () {
    this.__watchBtn = _e._$getByClassName(this.__body, 'watch')[0];
    this.__cancleWatchBtn = _e._$getByClassName(this.__body, 'cancle-watch')[0];
    _v._$addEvent(this.__watchBtn, 'click', this.__watch._$bind(this));
    _v._$addEvent(this.__cancleWatchBtn, 'click', this.__cancleWatch._$bind(this));
    if (this.__word.isWatched == undefined) {
      //新建时后端返回数据isWatched，默认当成还没关注处理
      _e._$delClassName(this.__watchBtn, 'fn');
      _e._$addClassName(this.__cancleWatchBtn, 'fn');
    }
    if (this._isSystem) {
      // 系统类型则隐藏关注入口，因为没有权限
      _e._$addClassName(this.__watchBtn, 'fn');
      _e._$addClassName(this.__cancleWatchBtn, 'fn');
    }
    this._renderWatchers(this.__word.watchList);
  };

  _pro.__watch = function () {
    this.__cache._$watchOrCancleWatch({
      rtype: 'words',
      id: this.__id,
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
      rtype: 'words',
      id: this.__id,
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
    var _members = this.__pgCache._$getRespoSelectSource(this.__pgid);
    var _watchList = watchList;
    if (_watchList && _watchList.length > 0) {
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
   * @return {Void}
   */
  _pro.__renderView = function () {
    _j._$render(this.__body, 'm-res-w-detail', _u._$merge({backPid: this.__pid}, this.__word));
    this.__initWatch();
    // 标签组件
    this._initTag();
    // 联想词，复用标签组件
    this._initAssociate();
    // 在公共资源库中, 或系统类型中不显示分组选项
    var group = _e._$getByClassName(this.__body, 'group')[0];
    if (this.__project.type === 1 || this._isSystem) {
      _e._$addClassName(group, 'f-dn');
    } else {
      _e._$delClassName(group, 'f-dn');
      // 选择器
      this._initSelect();
    }
    this._initActivityList();
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__pid = _options.param.pid.replace('/', '');
    this.__super(_options);
    var that = this;
    this.__proCache._$getItem({
      id: this.__pid
    });
  };

  /**
   * 显示模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__id = _options.param.id.replace('/', '');
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__body.innerHTML = '';
    this.__doClearDomEvent();
    if (this.__groupSelect) {
      this.__groupSelect = this.__groupSelect.destroy();
    }
    if (this.__associate) {
      this.__associate = this.__associate._$recycle();
    }
    this.__aList && (this.__aList = this.__aList._$recycle());
  };
  /**
   * 实例化标签组件
   * @return {Void}
   */
  _pro._initTag = function () {
    var tagKey = cache._$cacheKey + '-' + this.__pid;
    this.__tag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'tag-select')[0],
      searchCache: cache._$$CacheWord,
      searchCacheKey: tagKey,
      searchResultFilter: function () {
        return this.__cache._$getTagList(tagKey);
      }._$bind(this),
      preview: true,
      choseOnly: false,
      editable: !!this._permit,
      tags: this.__word.tag.split(','),
      resourceId: this.__id,
      done: function (data) {
        if (!!data.change) {
          var tags = data.tags.map(function (item) {
            return item.name;
          });
          var tag = tags.join(',');
          this.__cache._$updateItem({
            id: this.__id,
            data: {
              tag: tag
            }
          });
        }
      }._$bind(this),
      queryData: {
        pid: this.__pid
      }
    });
  };
  _pro._initAssociate = function () {
    this.__associate = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'associate-select')[0],
      preview: true,
      choseOnly: false,
      editable: !!this._permit,
      noTagTip: '暂无联想词',
      tagName: '联想词',
      foreceHideDropdown: true,
      itemStyle: {
        backgroundColor: '#dbb64c'
      },
      tags: this.__word.associatedWord.split(','),
      done: function (data) {
        if (!!data.change) {
          var associatedWords = data.tags.map(function (item) {
            return item.name;
          });
          var associatedWord = associatedWords.join(',');
          this.__cache._$updateItem({
            id: this.__id,
            data: {
              associatedWord: associatedWord
            }
          });
        }
      }._$bind(this),
    });
  };
  /**
   * 实例化分组选择器组件
   * @return {[type]}      [description]
   */
  _pro._initSelect = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'group-select')[0];
    if (!!this._permit) {
      this.__groupSelect = new _s2({
        data: {
          source: this.__groups,
          selected: this.__word.group,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          this.__cache._$updateItem({
            id: this.__word.id,
            data: {
              groupId: result.selected.id
            }
          });
        }._$bind(this));
    } else {
      selectDiv.innerHTML = this.__word.group.name;
    }
  };

  /**
   * 实例化活动列表
   * @return {Void}
   */
  _pro._initActivityList = function () {
    var activitylist = _e._$getByClassName(this.__body, 'd-item-activity')[0];
    this.__aList = _aList._$$ModuleActivityList._$allocate({
      parent: _e._$getByClassName(activitylist, 'list')[0],
      key: 'activities-words',
      id: this.__id,
      pid: this.__pid,
      count: 1
    });
  };
  // notify dispatcher
  _m._$regist(
    'res-word-detail',
    _p._$$ModuleResWordDetail
  );
});
