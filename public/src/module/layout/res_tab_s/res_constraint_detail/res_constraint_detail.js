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
  'pro/cache/constraint_cache',
  'pro/cache/group_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/cache/pro_cache',
  'pro/stripedlist/stripedlist',
  'pro/tagme/tagme',
  'pro/select2/select2',
  'pro/common/constants'
], function (_k, u, _e, _v, c, _t, _l, _j, _m, _cu, jstExt, _aList, cache, _groupCache, _pgCache, _usrCache, _proCache, stripedList, _tag, _s2, consts, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleResConstraintDetail}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResConstraintDetail = _k._$klass();
  _pro = _p._$$ModuleResConstraintDetail._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-constraint-detail')
    );
    this.__cache = cache._$$CacheConstraint._$allocate({
      onitemload: function () {
        this.__constraint = this.__cache._$getItemInCache(this.__id);
        this.__pgid = this.__constraint.progroupId;
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            var role = this.__pgCache._$getRole(this.__constraint.progroupId);
            this._permit = true;
            if (role == 'observer') {
              this._permit = false;
            }
            this.__constraint.permit = this._permit;
            //业务分组cache
            this.__groupCache = _groupCache._$$CacheGroup._$allocate({
              onlistload: function (result) {
                this.__groups = this.__groupCache._$getGroupSelectSource(this.__constraint.projectId);
                this.__renderView();
              }._$bind(this)
            });
            this.__groupCache._$getList({
              key: this.__groupCache._$getListKey(this.__constraint.projectId),
              data: {
                pid: this.__constraint.projectId
              }
            });
            this.__constraint.nameRegex = consts.CONSTRAINT_NAME_REGEX;
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
    if (this.__constraint.isWatched == undefined) {
      //新建时后端返回数据isWatched，默认当成还没关注处理
      _e._$delClassName(this.__watchBtn, 'fn');
      _e._$addClassName(this.__cancleWatchBtn, 'fn');
    }
    this._renderWatchers(this.__constraint.watchList);
  };

  _pro.__watch = function () {
    this.__cache._$watchOrCancleWatch({
      rtype: 'constraints',
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
      rtype: 'constraints',
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
    var _members = this.__pgCache._$getRespoSelectSource(this.__constraint.progroupId);
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
    _j._$render(this.__body, 'm-res-c-detail', this.__constraint);
    this.__initWatch();
    // 标签组件
    this._initTag();
    // 在公共资源库中不显示分组选项
    var group = _e._$getByClassName(this.__body, 'group')[0];
    if (this.__project.type === 1) {
      _e._$addClassName(group, 'f-dn');
    } else {
      _e._$delClassName(group, 'f-dn');
      // 选择器
      this._initSelect();
    }
    // 规则函数体
    this.__function = this.__initEditor(this.__constraint.function, _e._$getByClassName(this.__body, 'func')[0]);
    this._initActivityList();
    this.__doInitDomEvent([[
      this.__function, 'blur',
      function () {
        var newfunc = this.__function.getValue();
        if (newfunc === this.__constraint.function) return;
        this.__cache._$updateItem({
          id: this.__id,
          data: {
            function: newfunc
          },
          name: 'function'
        });
      }._$bind(this)
    ]]);
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
    this.__functionCollect = [{'meta': 'object', 'caption': 'NEI', 'value': 'NEI', 'score': 1}, {
      'meta': 'object',
      'caption': 'Mock',
      'value': 'Mock',
      'score': 0.5
    }];
    ['mock', 'Random'].forEach(function (fun) {
      that.__functionCollect.push({
        meta: 'function',
        caption: fun,
        value: 'Mock.' + fun,
        score: fun == 'mock' ? 0.8 : 0.5
      });
    });
    ['Basic', 'Date', 'Image', 'Color',
      'Text', 'Name', 'Web', 'Address', 'Helper',
      'guid', 'id', 'increment'].forEach(function (fun) {
      that.__functionCollect.push({
        meta: 'function',
        caption: fun,
        value: 'Mock.Random.' + fun,
        score: 0.2
      });
    });
    this.__conCache = cache._$$CacheConstraint._$allocate({
      onlistload: function () {
        var list = this.__conCache._$getListInCache(cache._$cacheKey);
        list.forEach(function (item) {
          this.__functionCollect.push({
            'meta': 'function',
            'caption': item.name,
            'value': item.type == 1 ? 'NEI.' + item.name : item.name,
            'score': 1
          });
        }, this);
      }._$bind(this)
    });
    this.__conCache._$getList({
      key: cache._$cacheKey,
      data: {
        pid: this.__pid
      }
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
    // 函数名随名称变化
    this.__doInitDomEvent([[
      cache._$$CacheConstraint, 'update',
      function () {
        this.__renderView();
      }._$bind(this)
    ]]);
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
      searchCache: cache._$$CacheConstraint,
      searchCacheKey: tagKey,
      searchResultFilter: function () {
        return this.__cache._$getTagList(tagKey);
      }._$bind(this),
      preview: true,
      choseOnly: false,
      editable: !!this._permit,
      tags: this.__constraint.tag.split(','),
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
          selected: this.__constraint.group,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          this.__cache._$updateItem({
            id: this.__constraint.id,
            data: {
              groupId: result.selected.id
            }
          });
        }._$bind(this));
    } else {
      selectDiv.innerHTML = this.__constraint.group.name;
    }
  };

  /**
   * 初始化编辑器
   * @param {Object} data 待展示数据
   * @param {Node} content 编辑器容器
   * @return {Object} editor 编辑器对象
   */
  _pro.__initEditor = function (data, content) {
    var editor = ace.edit(content);
    var that = this;
    editor.setValue(data || '', -1);
    editor.setTheme('ace/theme/eclipse');
    editor.setOption('maxLines', 20);
    editor.setOption('tabSize', 2);
    editor.setReadOnly(false);
    editor.getSession().setMode('ace/mode/javascript');
    editor.setOption('showPrintMargin', false);
    editor.$blockScrolling = Infinity;
    var langTools = ace.require('ace/ext/language_tools');
    var tangideCompleter = {
      getCompletions: function (editor, session, pos, prefix, callback) {
        if (prefix.length === 0) {
          return callback(null, []);
        } else {
          return callback(null, that.__functionCollect);
        }
      }
    };
    editor.setOptions({
      enableLiveAutocompletion: true
    });
    langTools.addCompleter(tangideCompleter);
    return editor;
  };
  /**
   * 实例化活动列表
   * @return {Void}
   */
  _pro._initActivityList = function () {
    var activitylist = _e._$getByClassName(this.__body, 'd-item-activity')[0];
    this.__aList = _aList._$$ModuleActivityList._$allocate({
      parent: _e._$getByClassName(activitylist, 'list')[0],
      key: 'activities-constraints',
      id: this.__id,
      count: 1
    });
  };
  // notify dispatcher
  _m._$regist(
    'res-constraint-detail',
    _p._$$ModuleResConstraintDetail
  );
});
