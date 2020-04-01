NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/cache/client_cache',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/group_cache',
  'pro/select2/select2',
  'pro/activitylist/activitylist',
  'pro/tagme/tagme',
  'ui/datepick/datepick'
], function (_k, _e, _v, _u, _l, _j, _m, cache, _pgCache, _proCache, _groupCache, _s2, _aList, _tag, _dp, _p, _pro) {

  _p._$$ModuleResClientDetail = _k._$klass();
  _pro = _p._$$ModuleResClientDetail._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-client-detail')
    );
    _j._$add('m-res-client-detail');
    this.__cache = cache._$$CacheClient._$allocate({
      onitemload: function () {
        this.__client = this.__cache._$getItemInCache(this.__id);
        this.__client.__launchDate = _u._$format(this.__client.launchDate, 'yyyy-MM-dd');
        this.__client.__closeDate = _u._$format(this.__client.closeDate, 'yyyy-MM-dd');
        this.__pgid = this.__client.progroupId;
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            var role = this.__pgCache._$getRole(this.__client.progroupId);
            this._permit = true;
            if (role == 'observer') {
              this._permit = false;
            }
            this.__client.permit = this._permit;
            //业务分组cache
            this.__groupCache = _groupCache._$$CacheGroup._$allocate({
              onlistload: function () {
                this.__groups = this.__groupCache._$getGroupSelectSource(this.__client.projectId);
                this.__renderView();
              }._$bind(this)
            });
            this.__groupCache._$getList({
              key: this.__groupCache._$getListKey(this.__client.projectId),
              data: {
                pid: this.__client.projectId
              }
            });
          }._$bind(this)
        });
        this.__pgCache._$getItem({
          id: this.__pgid
        });
      }.bind(this),
      onitemupdate: function (event) {
        this.__client.__launchDate = _u._$format(event.data.launchDate, 'yyyy-MM-dd');
        this.__client.__closeDate = _u._$format(event.data.closeDate, 'yyyy-MM-dd');
        if (event.ext && event.ext.node) {
          event.ext.node.value = this.__client['__' + event.ext.type];
        }
      }.bind(this)
    });
    //项目cache
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__cache._$getItem({
          id: this.__id,
          key: cache._$cacheKey
        });
      }.bind(this)
    });
  };

  /**
   * 渲染页面
   * @return {[Void}
   */
  _pro.__renderView = function () {
    _j._$render(this.__body, 'm-res-client-detail', this.__client);
    //活动列表
    this._initActivityList();
    this._initSelectRespo();
    this._initSelectGroup();
    this._initTag();
    this._initDate();
  };

  _pro._initSelectGroup = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'group-select')[0];
    if (!!this._permit) {
      this.__groupSelect = new _s2({
        data: {
          source: this.__groups,
          selected: this.__client.group,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          this.__cache._$updateItem({
            id: this.__client.id,
            data: {
              groupId: result.selected.id
            }
          });
        }.bind(this));
    } else {
      selectDiv.innerHTML = this.__client.group.name;
    }
  };

  _pro._initSelectRespo = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'respo-select')[0];
    var respo = this.__client.respo;
    respo.name = respo.realname;
    if (!!this._permit) {
      this.__respoSelect = new _s2({
        data: {
          source: this.__pgCache._$getRespoSelectSource(this.__client.progroupId),
          selected: respo,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          this.__cache._$updateItem({
            id: this.__client.id,
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
   * 实例化tag组件
   */
  _pro._initTag = function () {
    var tagKey = cache._$cacheKey + '-' + this.__pid;
    this.__tag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'tag-select')[0],
      searchCache: cache._$$CacheClient,
      searchCacheKey: tagKey,
      searchResultFilter: function () {
        return this.__cache._$getTagList(tagKey);
      }.bind(this),
      preview: true,
      choseOnly: false,
      editable: !!this._permit,
      tags: (this.__client.tag || '').split(','),
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
      }.bind(this),
      queryData: {
        pid: this.__client.projectId
      }
    });
  };

  /**
   * 实例化活动列表
   */
  _pro._initActivityList = function () {
    var activitylist = _e._$getByClassName(this.__body, 'd-item-activity')[0];
    this.__aList = _aList._$$ModuleActivityList._$allocate({
      parent: _e._$getByClassName(activitylist, 'list')[0],
      key: 'activities-clients',
      id: this.__id,
      count: 1
    });
  };

  _pro._initDate = function () {
    var links = _e._$getByClassName(this.__body, 'dates')[0];
    this.__doInitDomEvent([
      [
        links, 'click',
        function (evt) {
          var node = evt.srcElement;
          if (!node || !this._permit) {
            return;
          }
          var attr = node.name === 'launch-date' ? 'launchDate' : 'closeDate';
          this.__datePick && (this.__datePick = this.__datePick._$recycle());
          this.__datePick = _dp._$$DatePick._$allocate({
            parent: node.parentNode,
            date: node.value,
            clazz: 'date-picker',
            onchange: function (date) {
              var data = {};
              data[attr] = date.getTime();
              this.__cache._$updateItem({
                id: this.__client.id,
                data: data,
                ext: {
                  node: node,
                  type: attr
                }
              });
            }.bind(this)
          });
          _v._$stopBubble(evt);
        }.bind(this)
      ], [
        document, 'click', function () {
          this.__datePick && (this.__datePick = this.__datePick._$recycle());
        }.bind(this)
      ]]);
  };

  _pro.__onShow = function (_options) {
    this.__id = _options.param.id.replace('/', '');
    this.__pid = parseInt(_options.param.id.replace('/', ''));
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__cache._$getItem({
      id: this.__id
    });
  };

  _pro.__onHide = function () {
    this.__super();
    this.__body.innerHTML = '';
  };

  _m._$regist(
    'res-client-detail',
    _p._$$ModuleResClientDetail
  );
});
