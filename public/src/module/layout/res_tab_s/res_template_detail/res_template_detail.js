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
  'pro/cache/constraint_cache',
  'pro/cache/template_cache',
  'pro/cache/datatype_cache',
  'pro/cache/parameter_cache',
  'pro/cache/group_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/stripedlist/stripedlist',
  'pro/activitylist/activitylist',
  'pro/select2/select2',
  'pro/tagme/tagme',
  'pro/param_editor/param_editor'
], function (_k, _u, _e, _v, c, _t, _l, _j, _m, util, jstExt, _csCache, tplCache, dataTypeCache, paramCache, _groupCache, _pgCache, _usrCache, stripedList, _aList, _s2, _tag, paramEditor, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleResTemplateDetail}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResTemplateDetail = _k._$klass();
  _pro = _p._$$ModuleResTemplateDetail._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-template-detail')
    );
    this._tplCacheOptions = {
      onitemload: function () {
        this.__template = this.__tplCache._$getItemInCache(this.__id);
        //发送项目组请求
        this.__pgCache._$getItem({
          id: this.__template.progroupId
        });
      }.bind(this)
    };
    this.__groupCacheOptions = {
      onlistload: function (result) {
        this.__csListCacheKey = this.__csCache._$getListKey(this.__pid);
        this.__csCache._$getList({
          key: this.__csListCacheKey,
          data: {
            pid: this.__pid
          }
        });
      }.bind(this)
    };
    this._pgCacheOptions = {
      onitemload: function () {
        var role = this.__pgCache._$getRole(this.__template.progroupId);
        this._permit = true;
        if (role == 'observer') {
          this._permit = false;
        }
        this.__template.permit = this._permit;
        //业务分组cache
        this.__groupCache = _groupCache._$$CacheGroup._$allocate(this.__groupCacheOptions);
        //发送分组请求
        this.__groupCache._$getList({
          key: this.__groupCache._$getListKey(this.__pid),
          data: {
            pid: this.__template.projectId
          }
        });
      }.bind(this)
    };
    //规则函数cache
    this.__csCache = _csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this.__renderView();
      }.bind(this)
    });
  };

  _pro.__onShow = function (_options) {
    this._paramCache = paramCache._$$CacheParameter._$allocate();
    this.__tplCache = tplCache._$$CacheTemplate._$allocate(this._tplCacheOptions);
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate(this._pgCacheOptions);
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    // 显示加载中提示
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    _e._$delClassName(this.__loading, 'f-dn');
    this.__id = parseInt(_options.param.id.replace('/', ''));
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this._listCacheKey = this.__tplCache._$getListKey(this.__pid);
    this.__tplCache._$getItem({
      id: this.__id
    });
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    this.__body.innerHTML = '';
    if (this.__aList) {
      this.__aList = this.__aList._$recycle();
    }
    if (this.__groupSelect) {
      this.__groupSelect = this.__groupSelect.destroy();
    }
    if (this.__respoSelect) {
      this.__respoSelect = this.__respoSelect.destroy();
    }
    if (this.__tag) {
      this.__tag = this.__tag._$recycle();
    }
    if (this.__dataTypeCache) {
      this.__dataTypeCache = this.__dataTypeCache._$recycle();
    }
    if (this.__tplCache) {
      this.__tplCache = this.__tplCache._$recycle();
    }
    if (this.__pgCache) {
      this.__pgCache = this.__pgCache._$recycle();
    }
    if (this._paramCache) {
      this._paramCache = this._paramCache._$recycle();
    }
    if (this.__groupCache) {
      this.__groupCache = this.__groupCache._$recycle();
    }
  };

  _pro.__initWatch = function () {
    this.__watchBtn = _e._$getByClassName(this.__body, 'watch')[0];
    this.__cancleWatchBtn = _e._$getByClassName(this.__body, 'cancle-watch')[0];
    _v._$addEvent(this.__watchBtn, 'click', this.__watch._$bind(this));
    _v._$addEvent(this.__cancleWatchBtn, 'click', this.__cancleWatch._$bind(this));
    if (this.__template.isWatched == undefined) {
      //新建时后端返回数据isWatched，默认当成还没关注处理
      _e._$delClassName(this.__watchBtn, 'fn');
      _e._$addClassName(this.__cancleWatchBtn, 'fn');
    }
    this._renderWatchers(this.__template.watchList);
  };

  _pro.__watch = function () {
    this.__tplCache._$watchOrCancleWatch({
      rtype: 'templates',
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
    this.__tplCache._$watchOrCancleWatch({
      rtype: 'templates',
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
    var _members = this.__pgCache._$getRespoSelectSource(this.__template.progroupId);
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
   */
  _pro.__renderView = function () {
    // 隐藏加载中提示
    _e._$addClassName(this.__loading, 'f-dn');
    _j._$render(this.__body, 'm-res-t-detail', this.__template);
    //活动列表
    this.__aList = _aList._$$ModuleActivityList._$allocate({
      parent: _e._$getByClassName(this.__body, 'activity-list')[0],
      key: 'activities-templates',
      id: this.__id,
      count: 1
    });
    this.__initWatch();
    //实例化选择器
    this._initSelectGroup();
    this._initSelectRespo();
    //标签组件
    this._initTag();
    //参数编辑器
    this._initEditor();
    // 高亮范例代码
    this._initSampleCode();
  };

  /**
   * 实例化参数编辑器
   */
  _pro._initEditor = function () {
    this.__editorPart = _e._$getByClassName(this.__body, 'd-item')[1];
    var editorOption = {
      parent: _e._$getByClassName(this.__editorPart, 'list')[0],
      parentId: this.__id,
      parentType: 1,
      formatChangeable: false,
      pid: this.__template.projectId,
      preview: true,
      onChange: this._renderMockData.bind(this)
    };
    this.__paramEditor = paramEditor._$$ParamEditor._$allocate(editorOption);
  };
  /**
   * 实例化标签组件
   */
  _pro._initTag = function () {
    this.__tag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'tag-select')[0],
      searchCache: tplCache._$$CacheTemplate,
      searchCacheKey: tplCache._$cacheKey,
      searchResultFilter: function () {
        return this.__tplCache._$getTagList(this._listCacheKey);
      }.bind(this),
      choseOnly: false,
      preview: true,
      editable: this._permit,
      tags: this.__template.tag.split(','),
      resourceId: this.__id,
      done: function (data) {
        if (!!data.change) {
          var tags = data.tags.map(function (item) {
            return item.name;
          });
          var tag = tags.join(',');
          this.__tplCache._$updateItem({
            id: this.__id,
            data: {
              tag: tag
            }
          });
        }
      }.bind(this),
      queryData: {
        pid: this.__template.projectId
      }
    });
  };
  /**
   * 实例化分组选择器组件
   * @return {[type]}
   */
  _pro._initSelectGroup = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'group-select')[0];
    if (!!this._permit) {
      this.__groupSelect = new _s2({
        data: {
          source: this.__groupCache._$getGroupSelectSource(this.__pid),
          selected: this.__template.group,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          this.__tplCache._$updateItem({
            id: this.__template.id,
            data: {
              groupId: result.selected.id
            }
          });
        }.bind(this));
    } else {
      selectDiv.innerHTML = this.__template.group.name;
    }
  };
  /**
   * 实例化负责人选择器组件
   * @return {[type]}
   */
  _pro._initSelectRespo = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'respo-select')[0];
    var respo = this.__template.respo;
    respo.name = respo.realname;
    if (!!this._permit) {
      this.__respoSelect = new _s2({
        data: {
          source: this.__pgCache._$getRespoSelectSource(this.__template.progroupId),
          selected: respo,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          this.__tplCache._$updateItem({
            id: this.__template.id,
            data: {
              respoId: result.selected.id
            }
          });
        }.bind(this));
    } else {
      selectDiv.innerHTML = respo.name;
    }
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
    var params = this.__template.params;
    var constraints = this.__csCache._$getListInCache(this.__csListCacheKey);
    util._$initParamsSampleCode(util.db.MDL_TYP_NORMAL, params, constraints, dataTypes, this._sampleCodeContainer, this._noSampleCodeContainer);
  };
  // notify dispatcher
  _m._$regist(
    'res-template-detail',
    _p._$$ModuleResTemplateDetail
  );
});
