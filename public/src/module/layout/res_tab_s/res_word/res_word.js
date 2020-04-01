NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/stripedlist/stripedlist',
  'pro/word_import/word_import',
  'pro/cache/word_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/group_cache',
  'pro/cache/user_cache',
  'pro/notify/notify',
  'pro/modal/modal',
  'pro/res_bat/res_group/res_group',
  'text!pro/poplayer/share_layer.html',
  'pro/common/res_list'
], function (_k, _e, _v, _t, _l, _m, util, stripedList, WordImport, cache, _proCache, _pgCache, _groupCache, _usrCache, _notify, _modal, resGroup, _html, resList, _p, _pro) {

  _p._$$ModuleResWord = _k._$klass();
  _pro = _p._$$ModuleResWord._$extend(resList._$$ModuleResList);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-word')
    );
    this._btnWrap = _e._$getByClassName(this.__body, 'resource-feature-part')[0];
    this._importProgroup = _e._$getByClassName(this._btnWrap, 'progroup')[0];
    this._fileInput = _e._$getByClassName(this.__body, 'j-file')[0];
    var stripedListOption = {
      filter: function (xlist, xlistState) {
        // 处理 action 列
        xlist.forEach(function (item) {
          var itemState = xlistState[item.id];
          // 公共资源库中的资源，并且当前项目不是公共资源库，检查是否设置了隐藏
          if (!this.__progroup.showPublicList && item.__isShare && this.__project.type !== util.db.PRO_TYP_COMMON) {
            itemState.__invisible = true;
            return;
          }
          item.__fromPid = this.__project.id;
          //如果是系统内置类型
          if (item.type === 1) {
            itemState['__ui_name'] = util._$renderByJst(
              '<a href="/word/detail/?pid=${__fromPid}&id=${id}" class="stateful">${name}</a>',
              item
            );
            itemState['__ui_name_hit_template'] = util._$renderByJst(
              '<a href="/word/detail/?pid=${__fromPid}&id=${id}" class="stateful">{value}</a>',
              item
            );
            // 查看详情
            var str = util._$renderByJst(
              '<a href="/word/detail/?pid=${__fromPid}&id=${id}" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>',
              item
            );
            // TODO 修改文档连接
            // var str = util._$renderByJst(
            //     '<a href="https://github.com/x-orpheus/nei-toolkit/blob/master/doc/NEI%E5%B9%B3%E5%8F%B0%E7%B3%BB%E7%BB%9F%E9%A2%84%E7%BD%AE%E7%9A%84%E8%A7%84%E5%88%99%E5%87%BD%E6%95%B0%E9%9B%86.md"  target="blank" title="查看详情" ><em class="u-icon-detail-normal"></em></a>',
            //     item
            // );
          } else {
            itemState['__ui_name'] = util._$renderByJst(
              '<a href="/word/detail/?pid=${__fromPid}&id=${id}" class="stateful">${name}</a>',
              item
            );
            itemState['__ui_name_hit_template'] = util._$renderByJst(
              '<a href="/word/detail/?pid=${__fromPid}&id=${id}" class="stateful">{value}</a>',
              item
            );
            var str = '';
            //删除data-action的信息字段
            var obj = {
              type: 'del',
              cache: this.getCacheKey(),
              ids: [item.id],
              warn: true,
              key: this._listCacheKey
            };
            // 查看详情
            str += util._$renderByJst(
              '<a href="/word/detail/?pid=${__fromPid}&id=${id}" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>',
              item
            );
            if (this.__hasOpPermission()) {
              // 删除当前项
              str += '<a class="delete-icon" data-action=' + JSON.stringify(obj) + '  title="删除当前选择项"><em class="u-icon-delete-normal"></em></a>';
            }
            // TODO 移动与分享的功能好像是重复的，由于分享还未检查禁用逻辑，故先隐藏该功能
            //分享当前项
            // if (this.__project.type == 0 && !item.__isShare) {
            //     str += '<a class="share-icon" title="分享" data-action=\'{"event": "word-share","id":' + item.id + '}\'><em class="u-icon-share-normal"></em></a>';
            // }
          }

          itemState['__nei-actions'] = str;
        }._$bind(this));
        return xlist;
      }._$bind(this),
      headers: [
        {
          name: '',
          key: '__isShare',
          valueType: 'share',
          sortable: false
        },
        {
          name: '名称',
          key: 'name',
          keyPinyin: 'namePinyin'
        },
        {
          name: '描述',
          key: 'description'
        },
        {
          name: '联想词',
          key: 'associatedWord',
          valueType: 'associatedWord',
        },
        {
          name: '启用状态',
          key: 'forbidStatusDisplay.name',
          keyPinyin: 'forbidStatusDisplay.namePinyin',
          valueType: 'deepKey',
          //filter: 'forbidStatusDisplay'
        },
        {
          name: '标签',
          key: 'tag',
          valueType: 'tag',
          keyPinyin: 'tagPinyin',
          filter: 'tag'
        },
        {
          name: '分组',
          key: 'group.name',
          valueType: 'deepKey',
          filter: 'group'
        },
        {
          name: '创建者',
          key: 'creator.realname',
          keyPinyin: 'creator.realnamePinyin',
          valueType: 'deepKey'
        },
        {
          name: '创建时间',
          key: 'createTime',
          valueType: 'time',
          isDefaultSortUp: false, // 按时间降序，让自定义创建的显示在列表前
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions',
          sortable: false
        }
      ],
      // 参数词库存在长列表，分组模式尚未对长列表进行优化，故不进行分组展示
      listGroups: null,
      // listGroups: [
      //     {
      //         group: '业务分组',
      //         key: 'group'
      //     },
      //     {
      //         group: '创建者',
      //         key: 'creator'
      //     }
      // ],
      // 根据选中的行，判断是否需要隐藏对应的batch按钮
      batchNeedHidden: function (batchActionName, selectedItems) {
        batchActionName = batchActionName || '';
        selectedItems = selectedItems || [];
        const hiddenNames = ['复制', '移动', '设置标签', '设置分组', '删除'];
        if (hiddenNames.indexOf(batchActionName) === -1) {
          return false;
        }

        var hasSysType = selectedItems.some(function (item) {
          return item.type === util.db.MDL_TYP_SYSTEM;
        });
        return hasSysType;
      }._$bind(this),
      afterRender: function () {
        if (this.__hasAddPermission()) {
          _e._$delClassName(this._btnWrap, 'f-dn js-open');
          _e._$addClassName(this._importProgroup, 'f-dn');
          if (this.__project.type === util.db.PRO_TYP_COMMON) {
            _e._$delClassName(this._importProgroup, 'f-dn');
          }
        } else {
          _e._$addClassName(this._btnWrap, 'f-dn');
        }
      }._$bind(this)
    };
    var _options = {
      resType: 'word',
      listCache: this.getCacheKey(),
      //实例化cache实例名称
      cacheName: '__wordCache',
      //cache监听的回调事件
      callBackList: ['onshare', 'onclone', 'onmove', 'onsetgroup', 'ontag', 'onforbid'],
      //需注册的自定义事件
      eventList: ['res-copy', 'res-move', 'res-group', 'res-tag', 'res-forbid'],
      cacheOption: {},
      stripedListOption: stripedListOption,
      canShare: true
    };
    this.__super(_options);
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([[
      this._btnWrap, 'click',//监听click,处理创建菜单相关操作
      this.__menuClick.bind(this)
    ], [
      document, 'click', //监听全局click,隐藏创建下拉菜单
      function () {
        _e._$delClassName(this._btnWrap, 'js-open');
      }.bind(this)
    ], [
      this._fileInput, 'change',
      this.__importJSON.bind(this)
    ]]);
  };

  _pro.__menuClick = function (event) {
    event.stopPropagation();
    if (_e._$hasClassName(event.target, 'json-tip')) {
      return;
    }

    var node = _v._$getElement(event, 'd:click');
    if (!node) {
      return;
    }
    var type = _e._$dataset(node, 'click');
    switch (type) {
      case 'toggle': //显示或隐藏菜单
        if (_e._$hasClassName(this._btnWrap, 'js-open')) {
          _e._$delClassName(this._btnWrap, 'js-open');
        } else {
          _e._$addClassName(this._btnWrap, 'js-open');
        }
        break;
      case 'create': //跳转创建数据模型模块
        _e._$delClassName(this._btnWrap, 'js-open');
        dispatcher._$redirect('/word/create/?pid=' + this.__pid);
        break;
      case 'import-json':
        _e._$delClassName(this._btnWrap, 'js-open');
        this._fileInput.click();
        break;
      case 'import-project-word':
        _e._$delClassName(this._btnWrap, 'js-open');
        this.__import();
        break;
      case 'import-progroup-word':
        _e._$delClassName(this._btnWrap, 'js-open');
        this.__import(null, true);
        break;
      default:
        break;
    }
  };

  _pro.__import = function (list, importProgroup) {
    importProgroup = importProgroup || false;
    list = list || null;
    var modal = new WordImport({
      data: {
        pid: this.__pid,
        importProgroup: importProgroup,
        jsonList: list,
      }
    });
    modal.$on('ok', function () {
      this.stripedList._$refresh();
    }.bind(this));
  };

  _pro.__importJSON = function (event) {
    var files = event.target.files;
    util._$importWordJSONFiles(files, this.__import.bind(this));
    event.target.value = '';
  };

  _pro.__onRefresh = function (_options) {
    //添加参数是否重复获取striplist的 batchAction参数
    _options.batActionFlag = true;
    var pid = parseInt(_options.param.pid.replace('/', ''));
    cache._$clearDirtyList(pid);
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
  };

  // 是否有操作权限
  _pro.__hasOpPermission = function () {
    return this.__pgCache._$hasWordStockOpPermission(this.__pgid);
  };

  // 是否有增加权限
  _pro.__hasAddPermission = function () {
    return this.__hasOpPermission();
  };
  /**
   * 获取stripedlist的batchAction参数
   */
  _pro.__getBatchAction = function () {
    if (!this.__hasOpPermission()) {
      return '';
    }

    var actionData = [{
      name: '复制',
      action: {
        event: 'res-copy'
      }
    }, {
      name: '移动',
      action: {
        event: 'res-move'
      }
    }, {
      name: '设置禁用',
      action: {
        event: 'res-forbid',
      }
    }, {
      name: '设置标签',
      action: {
        event: 'res-tag'
      }
    }, {
      name: '设置分组',
      action: {
        event: 'res-group'
      }
    }, {
      name: '删除',
      action: {
        type: 'del',
        cache: this.getCacheKey(),
        warn: true,
        key: this._listCacheKey
      }
    }];
    if (this.__project.type !== util.db.PRO_TYP_NORMAL) {//只有普通项目，可以设置分组
      const disableActionName = ['设置分组'];
      actionData = actionData.filter(function (action) {
        return disableActionName.indexOf(action.name) === -1;
      });
    }
    var batch = '';
    actionData.forEach(function (item) {
      batch += '<a class="batch-action-item" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>';
    });
    return batch;
  };

  _pro.getCacheKey = function () {
    return cache._$cacheKey;
  };

  // notify dispatcher
  _m._$regist(
    'res-word',
    _p._$$ModuleResWord
  );
});
