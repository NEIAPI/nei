NEJ.define([
  'base/klass',
  'base/util',
  'pro/common/util',
  'base/element',
  'base/event',
  'util/event/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/cache/datatype_cache',
  'pro/cache/interface_cache',
  'pro/cache/parameter_cache',
  'pro/cache/user_cache',
  'pro/cache/group_cache',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/modal/modal_message',
  'text!./change_message.html',
  'pro/tagme/tagme',
  'pro/select2/select2',
  'json!3rd/fb-modules/config/db.json'
], function (_k, u, _cu, _e, _v, c, _t, _l, _j, _m, util, jstExt, dtCache, interfaceCache, paramCache, userCache, groupCache, pgCache, proCache, MessageModal, messageTpl, _tag, _s2, dbConst, _p, _pro) {

  _p._$$ModuleResDatatypeDetail = _k._$klass();
  _pro = _p._$$ModuleResDatatypeDetail._$extend(_m._$$Module);

  // 缓存datatype类型
  var format;
  var params;

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-datatype-detail')
    );
    this.__tabhead = _e._$getByClassName(this.__body, 'tab-head')[0];
    this.__tabbody = _e._$getByClassName(this.__body, 'tab-body')[0];
    this.__export = {
      tab: _e._$getByClassName(this.__body, 'tab-wrap')[0],
      parent: _e._$getByClassName(this.__body, 'tab-con-s')[0]
    };
  };

  _pro.__onShow = function (_options) {
    this.__proCache = proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this._dtCache._$getList({
          key: this.__listCacheKey,
          data: {
            pid: this.__pid
          }
        });
      }.bind(this)
    });

    this._intCache = interfaceCache._$$CacheInterface._$allocate();

    this._userCache = userCache._$$CacheUser._$allocate();

    this._dtCache = dtCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        this.__datatype = this._dtCache._$getItemInCache(this.__id);
        this._format = this.__datatype.format;

        format = this.__datatype.format;
        params = this.__getAllParams(this.__datatype.params);

        this.__pgCache = pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            this.__progroup = this.__pgCache._$getItemInCache(this.__datatype.progroupId);
            var role = this.__pgCache._$getRole(this.__datatype.progroupId);
            this._permit = true;
            if (role == 'observer') {
              this._permit = false;
            }
            this.__datatype.permit = this._permit;
            //业务分组cache
            this.__groupCache = groupCache._$$CacheGroup._$allocate({
              onlistload: function () {
                this.__groups = this.__groupCache._$getGroupSelectSource(this.__pid);
                this.__renderView();
                delete this.__groupCache;
              }.bind(this)
            });
            this.__groupCache._$getList({
              key: this.__groupCache._$getListKey(this.__pid),
              data: {
                pid: this.__datatype.projectId
              }
            });
            // 该请求比较耗时，只有当开启项目组的变更通知才请求
            if (this.__project.creatorId && this.__progroup.apiUpdateControl) {
              this._dtCache._$getRefList({
                id: this.__id,
                action: 'ref'
              });
            }

          }.bind(this)
        });
        this.__pgCache._$getItem({
          id: this.__datatype.progroupId
        });
      }.bind(this),

      onreflistload: function () {
        var refListCacheKey = dtCache._$cacheKeyRef + this.__id;
        this.refInterfaceList = this._intCache._$getListInCache(refListCacheKey);

      }.bind(this)
    });

    this._paramCache = paramCache._$$CacheParameter._$allocate();

    this.__doInitDomEvent([
      [dtCache._$$CacheDatatype, 'update', this.__datatypeUpdate.bind(this)],
      [paramCache._$$CacheParameter, 'update', this.__paramUpdate.bind(this)],
      [paramCache._$$CacheParameter, 'itemsadded', this.__paramUpdate.bind(this)],
      [paramCache._$$CacheParameter, 'itemsdeleted', this.__paramUpdate.bind(this)],
      [
        dtCache._$$CacheDatatype, 'itemsdeleted',
        function () {
          if (!this.__datatype.versions || this.__datatype.versions.length === 0) {
            var versionDiv = _e._$getByClassName(this.__body, 'item-version')[0];
            _e._$addClassName(versionDiv, 'f-dn');
          }
        }.bind(this),
      ], [
        dtCache._$$CacheDatatype, 'versioncreated',
        function () {
          if (this.__datatype.versions && this.__datatype.versions.length > 0) {
            var versionDiv = _e._$getByClassName(this.__body, 'item-version')[0];
            var versionInput = _e._$getByClassName(versionDiv, 'version-name')[0];
            versionInput.value = this.__datatype.version.name;
            _e._$delClassName(versionDiv, 'f-dn');
          }
        }.bind(this)
      ]
    ]);
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    if (this.__groupSelect) {
      this.__groupSelect = this.__groupSelect.destroy();
    }
    if (this.__tag) {
      this.__tag = this.__tag._$recycle();
    }
    if (this.__pgCache) {
      this.__pgCache._$recycle();
      delete this.__pgCache;
    }
    this.__tabhead.innerHTML = '';
    this.__proCache = this.__proCache._$recycle();
    this._dtCache = this._dtCache._$recycle();
    this._userCache = this._userCache._$recycle();
  };

  _pro.__onRefresh = function (_options) {
    // 显示加载中提示
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    _e._$delClassName(this.__loading, 'f-dn');
    this.__id = parseInt(_options.param.id.replace('/', ''));
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__listCacheKey = this._dtCache._$getListKey(this.__pid);
    this.__super(_options);
    //发送请求
    this.__proCache._$getItem({
      id: this.__pid
    });
  };

  _pro.__initWatch = function () {
    this.__watchBtn = _e._$getByClassName(this.__body, 'watch')[0];
    this.__cancleWatchBtn = _e._$getByClassName(this.__body, 'cancle-watch')[0];
    _v._$addEvent(this.__watchBtn, 'click', this.__watch._$bind(this));
    _v._$addEvent(this.__cancleWatchBtn, 'click', this.__cancleWatch._$bind(this));
    if (this.__datatype.isWatched == undefined) {
      //新建时后端返回数据isWatched，默认当成还没关注处理
      _e._$delClassName(this.__watchBtn, 'fn');
      _e._$addClassName(this.__cancleWatchBtn, 'fn');
    }
    this._renderWatchers(this.__datatype.watchList);
  };

  _pro.__watch = function () {
    this._dtCache._$watchOrCancleWatch({
      rtype: 'datatypes',
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
    this._dtCache._$watchOrCancleWatch({
      rtype: 'datatypes',
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
    var _members = this.__pgCache._$getRespoSelectSource(this.__datatype.progroupId);
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
   * 渲染页面
   * @return {[Void}
   */
  _pro.__renderView = function () {
    // 隐藏加载中提示
    _e._$addClassName(this.__loading, 'f-dn');
    _j._$render(this.__tabhead, 'm-res-d-detail', this.__datatype);
    _e._$delClassName(this.__tabbody, 'f-dn');
    // mock 数据
    this.__initWatch();
    //标签组件
    this._initTag();
    // 在公共资源库中不显示分组选项
    var group = _e._$getByClassName(this.__body, 'group')[0];
    if (this.__project.type === 1) {
      _e._$addClassName(group, 'f-vh');
    } else {
      _e._$delClassName(group, 'f-vh');
      //选择器
      this._initSelect();
    }
    if (!this.__datatype.version || this.__datatype.version.name == null) {
      var node = _e._$getByClassName(this.__body, 'item-version')[0];
      _e._$addClassName(node, 'f-dn');
    }
    this.__textarea = _e._$getByClassName(this.__body, 'u-m-txt')[0];
  };

  /**
   * 实例化tag组件
   */
  _pro._initTag = function () {
    var tagKey = dtCache._$cacheKey + '-' + this.__pid;
    this.__tag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'tag-select')[0],
      searchCache: dtCache._$$CacheDatatype,
      searchCacheKey: tagKey,
      searchResultFilter: function () {
        return this._dtCache._$getTagList(tagKey);
      }.bind(this),
      preview: true,
      choseOnly: false,
      editable: !!this._permit,
      tags: this.__datatype.tag.split(','),
      resourceId: this.__id,
      done: function (data) {
        if (!!data.change) {
          var tags = data.tags.map(function (item) {
            return item.name;
          });
          var tag = tags.join(',');
          this._dtCache._$updateItem({
            id: this.__id,
            data: {
              tag: tag
            }
          });
        }
      }.bind(this),
      queryData: {
        pid: this.__datatype.projectId
      }
    });
  };
  /**
   * 实例化分组选择器组件
   * @return {Void}
   */
  _pro._initSelect = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'group-select')[0];
    if (!!this._permit) {
      this.__groupSelect = new _s2({
        data: {
          source: this.__groups,
          selected: this.__datatype.group,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          this._dtCache._$updateItem({
            id: this.__datatype.id,
            data: {
              groupId: result.selected.id
            }
          });
        }.bind(this));
    } else {
      selectDiv.innerHTML = this.__datatype.group.name;
    }
  };

  /**
   * 判断是否需要发送变更通知
   */
  _pro.__needSendChangeMsg = function () {
    // 开关关闭，不提示
    if (this.__progroup.apiUpdateControl !== 1) {
      return false;
    }

    // 没有引用接口，不提示
    if (this.refInterfaceList.length === 0) {
      return false;
    }

    // 接口只有“开发中”，“测试中”，“已发布”的提醒
    var allowedStatus = [
      dbConst.STATUS_SYS_TESTING,
      dbConst.STATUS_SYS_DEVELOPING,
      dbConst.STATUS_SYS_PUBLISHED
    ];
    var noAllowedInt = this.refInterfaceList.every(function (int) {
      if (!allowedStatus.includes(int.statusId)) {
        return true;
      }

      return false;
    });

    if (noAllowedInt) {
      return false;
    }

    // 引用的接口没有关注者，或者只有自己，不提示
    var user = this._userCache._$getUserInCache();
    var noUsers = this.refInterfaceList.every(function (int) {
      if (!int.watchList || int.watchList.length === 0) {
        return true;
      }

      if (int.watchList.length === 1 && int.watchList[0] === user.id) {
        return true;
      }

      return false;
    });

    if (noUsers) {
      return false;
    }

    return true;
  };

  _pro.__datatypeUpdate = function () {
    if (!this.__needSendChangeMsg()) {
      return;
    }

    var formatName = ['哈希', '枚举', '数组', '字符', '数值', '布尔', '文件'];
    var currentFormat = this.__datatype.format;
    var currentParams = this.__datatype.params;

    var content = '类型由“' + formatName[format] + '”变为“' + formatName[currentFormat] + '”';

    this.__showChangeDialog(content);

    format = currentFormat;
    params = this.__getAllParams(currentParams);
  };

  _pro.__paramUpdate = function () {
    if (!this.__needSendChangeMsg()) {
      return;
    }

    var currentParams = this.__getAllParams(this.__datatype.params);
    var content = this.__paramDiff(params, currentParams);

    this.__showChangeDialog(content);

    params = currentParams;
  };

  // 获取全部param，包括匿名的子节点
  _pro.__getAllParams = function (params) {
    var self = this;
    var paramObjs = {};
    var paramArr = [];
    var dataTypelist = JSON.parse(
      JSON.stringify(self._dtCache._$getListInCache(self.__listCacheKey))
    );
    var paramPaths = [];

    // 从DataType中获取匿名的param
    function getAttributeParams(parentId) {
      if (paramPaths.find(function (paramPath) {
          return paramPath === parentId;
        })) {
        return;
      }
      paramPaths.push(parentId);
      var result = [];
      var datatype = dataTypelist.find(function (item) {
        return item.id === parentId;
      });

      if (datatype) {
        result = result.concat(result, datatype.params);
      }

      result.forEach(function (item) {
        if (!item.typeName) {
          var len = paramPaths.length;
          Array.prototype.push.apply(result, getAttributeParams(item.type));
          paramPaths.length = len;
        }
      });

      return result;
    }

    // 获取入参和出参
    paramArr = [].concat(params);

    // 获取object类型的匿名子params
    paramArr.forEach(function (param) {
      if (param.typeName === '') {
        Array.prototype.push.apply(paramArr, getAttributeParams(param.type));
      }
    });

    // 格式化
    paramArr.forEach(function (param) {
      paramObjs[param.id] = param;
    });

    return _cu._$clone(paramObjs);
  };

  // 对比params差异，因为是立即保存的，仅可能存在一个差异
  _pro.__paramDiff = function (params, currentParams) {
    var fields = ['name', 'typeName', 'defaultValue', 'required', 'description', 'genExpression'];
    var paramIds = Object.keys(params);
    var currentParamIds = Object.keys(currentParams);
    var changeIds, changeItems, changeItemsField;

    // 获取父级参数
    function getParentParam(param) {
      // 自己就是顶级
      if (param.parentType === 2 || param.parentType === 3) {
        return null;
      }

      // 从多的中找
      var source = currentParamIds.length > paramIds.length ?
        currentParams :
        params;

      var id = Object.keys(source).find(function (id) {
        return source[id].type === param.parentId;
      });

      return source[id];
    }

    // 获取完整的参数名
    function getFullFieldName(param) {
      var name = param.name;
      var parentParam;

      while (parentParam = getParentParam(param)) {
        name = parentParam.name + '.' + name;
        param = parentParam;
      }

      return name;
    }

    // required不需要知道FieldName，文案直接是改为必填 & 非必填
    function getParamFieldName(field) {
      var result;

      switch (field) {
        case 'name':
          result = '名称';
          break;
        case 'typeName':
          result = '类型';
          break;
        case 'defaultValue':
          result = '默认值';
          break;
        case 'description':
          result = '描述';
          break;
        case 'genExpression':
          result = '生成规则';
          break;
        default:
          result = field;
          break;
      }

      return result;
    }

    function findChangeField(param, currentParam) {
      var result;

      fields.forEach(function (field) {
        var value = param[field];
        var currentValue = currentParam[field];

        if (value !== currentValue) {
          result = field;
          return;
        }
      });

      return result;
    }

    // 父子节点同时存在时，移除子节点
    // 删除时不需提醒子节点
    function removeChindNodeInArray(params) {
      if (!Array.isArray(params) || params.length === 0) {
        return params;
      }

      var result = [];
      var paramTypes = params.map(function (param) {
        return param.type;
      });

      params.forEach(function (param) {
        if (paramTypes.includes(param.parentId)) {
          return;
        }

        result.push(param);
      });

      return result;
    }

    // 新增和删除
    if (paramIds.length > currentParamIds.length) {
      changeIds = _cu._$arrayDiff(paramIds, currentParamIds);
      changeItems = changeIds.map(function (id) {
        return params[id];
      });
      changeItems = removeChindNodeInArray(changeItems);

      changeItemsField = changeItems.map(function (item) {
        return getFullFieldName(item);
      }).join(', ');

      return '删除了数据模型 ' + this.__datatype.name + ' 的 ' + changeItemsField + ' 参数';
    } else if (paramIds.length < currentParamIds.length) {
      changeIds = _cu._$arrayDiff(currentParamIds, paramIds);
      changeItems = changeIds.map(function (id) {
        return currentParams[id];
      });
      changeItems = removeChindNodeInArray(changeItems);

      changeItemsField = changeItems.map(function (item) {
        return getFullFieldName(item);
      }).join(', ');

      return '数据模型 ' + this.__datatype.name + ' 新增了参数 ' + changeItemsField;
    }

    var result = '';

    // 修改
    paramIds.forEach(function (id) {
      var param = params[id];
      var currentParam = currentParams[id];
      var field = findChangeField(param, currentParam);
      var defaultValue = field === 'typeName' ? 'Object' : '空';
      var value = param[field] || defaultValue;
      var currentValue = currentParam[field] || defaultValue;
      var _fullFieldName = getFullFieldName(param);
      var prefix = '数据模型 ' + this.__datatype.name + ' 的参数 ';
      var fieldName = _fullFieldName
        ? _fullFieldName + ' 的'
        : '';

      if (field) {
        result = '将' + prefix + fieldName + getParamFieldName(field) + '由 ' + value + ' 修改为 ' + currentValue + ' ';
        return;
      }
    }, this);

    return result;
  };

  _pro.__showChangeDialog = function (content) {
    var _messageModal = new MessageModal({
      data: {
        title: '变更提醒',
        contentTemplate: messageTpl,
        message: content
      }
    });

    _messageModal.$on('ok', function (data) {
      this._dtCache._$sendChangeMessage({
        id: this.__datatype.id,
        content: data.message,
        onload: function () {
          _messageModal.destroy();
        }
      });
    }._$bind(this));
  };

  _m._$regist(
    'res-datatype-detail',
    _p._$$ModuleResDatatypeDetail
  );
});
