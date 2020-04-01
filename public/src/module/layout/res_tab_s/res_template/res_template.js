NEJ.define([
  'base/klass',
  'base/event',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'util/event/event',
  'pro/common/module',
  'pro/common/util',
  'pro/stripedlist/stripedlist',
  'pro/cache/template_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/group_cache',
  'pro/cache/user_cache',
  'pro/notify/notify',
  'pro/res_bat/res_copy_move/res_copy_move',
  'pro/res_bat/res_group/res_group',
  'pro/common/res_list',
  'pro/params_import/ftl_import',
  'json!3rd/fb-modules/config/db.json',
], function (_k, _v, _e, _t, _l, _c, _m, util, stripedList, cache, _proCache, _pgCache, _groupCache, _usrCache, _notify, resCopyMove, resGroup, resList, FtlImport, db, _p, _pro) {

  _p._$$ModuleResTemplate = _k._$klass();
  _pro = _p._$$ModuleResTemplate._$extend(resList._$$ModuleResList);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-template')
    );
    this._btnWrap = _e._$getByClassName(this.__body, 'resource-feature-part')[0];
    this._fileInput = _e._$getByClassName(this.__body, 'j-file')[0];
    this._dirInput = _e._$getByClassName(this.__body, 'j-dir')[0];

    var stripedListOption = {
      headers: [
        {
          name: '名称',
          key: 'name',
          keyPinyin: 'namePinyin'
        },
        {
          name: '路径',
          key: 'path'
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
          name: '负责人',
          key: 'respo.realname',
          keyPinyin: 'respo.realnamePinyin',
          valueType: 'deepKey',
          filter: 'respo'
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
          defaultSortUp: false
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions',
          sortable: false
        }
      ],
      filter: function (list, listStates) {
        // 处理 action 列
        list.forEach(function (item) {
          var itemState = listStates[item.id];
          itemState['__ui_name'] = util._$renderByJst(
            '<a href="/template/detail/?pid=${projectId}&id=${id}" class="stateful">${name|escape2}</a>',
            item
          );
          itemState['__ui_name_hit_template'] = util._$renderByJst(
            '<a href="/template/detail/?pid=${projectId}&id=${id}" class="stateful">{value}</a>',
            item
          );
          var str = '';
          // 删除data-cation字段
          var obj = {
            type: 'del',
            cache: 'template',
            ids: [item.id],
            key: this._listCacheKey,
            warn: true
          };
          // 查看详情
          str += util._$renderByJst(
            '<a href="/template/detail/?pid=${projectId}&id=${id}" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>',
            item
          );
          // 引用列表
          str += util._$renderByJst(
            '<a href="/template/ref/?pid=${projectId}&id=${id}" title="查看引用列表" class="stateful"><em class="u-icon-link-normal"></em></a>',
            item
          );
          // 删除当前项
          str += '<a class="delete-icon" data-action=' + JSON.stringify(obj) + ' title="删除当前项"><em class="u-icon-delete-normal"></em></a>';
          itemState['__nei-actions'] = str;
        }._$bind(this));
        return list;
      }._$bind(this),
      batchAction: (function () {
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
            cache: 'template',
            warn: true,
            key: this._listCacheKey
          }
        }];
        var batch = '';
        actionData.forEach(function (item) {
          batch += '<a class="batch-action-item" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>';
        });
        return batch;
      })(),
    };
    var _options = {
      resType: 'template',
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__tplCache',
      //cache监听的回调事件
      callBackList: ['onclone', 'onmove', 'onsetgroup', 'ontag'],
      //需注册的自定义事件
      eventList: ['res-copy', 'res-move', 'res-group', 'res-tag'],
      cacheOption: {
        onbatch: function (result) {
          var list = this.__tplCache._$getListInCache(this._listCacheKey);
          this.stripedList._$updateList(list);
        }.bind(this)
      },
      stripedListOption: stripedListOption,
      canShare: true
    };
    this.__super(_options);
  };

  _pro.__onShow = function (_options) {
    this.__doInitDomEvent([[
      this._btnWrap, 'click', //监听click,处理创建菜单相关操作
      this.__menuClick.bind(this)
    ], [
      document, 'click', //监听全局click,隐藏创建下拉菜单
      function () {
        _e._$delClassName(this._btnWrap, 'js-open');
      }.bind(this)
    ], [
      this._fileInput, 'change',
      this.__import.bind(this)
    ], [
      this._dirInput, 'change',
      this.__import.bind(this)
    ]]);
    this.__super(_options);
  };

  /**
   * 导入ftl模版
   * @param {Event} 事件对象
   */
  _pro.__import = function (event) {
    var files = event.target.files;
    util._$importFtlTemplate(files, this.__showImportConfirm.bind(this));
    event.target.value = '';
  };

  /**
   * 显示ftl导入确认框
   * @param {Array} javabean文件解析出的数据模型
   */
  _pro.__showImportConfirm = function (importDT) {
    var systemModel = {
      'String': db.MDL_SYS_STRING,
      'Number': db.MDL_SYS_NUMBER,
      'Boolean': db.MDL_SYS_BOOLEAN,
      'Unknown': db.MDL_SYS_UNKNOWN,
      'File': db.MDL_SYS_FILE,
      'Variable': db.MDL_SYS_VARIABLE,
    };

    this.__ftlimport = new FtlImport({
      data: {
        cache: this.__dtCache,
        searchCache: cache._$$CacheDatatype,
        listCacheKey: this._listCacheKey,
        pid: this.__pid,
        dts: importDT,
        groups: this.__groupCache._$getGroupSelectSource(this.__pid),
        isChrome: this.isChrome
      }
    }).$on('ok', function (data) {

      data.items.forEach(function (item) {
        item.params.forEach(function (param) {
          param.type = systemModel[param['type']];
        });
      });
      var batch = function () {
        this.__tplCache._$batch({
          key: this._listCacheKey,
          data: data,
          actionMsg: '导入成功'
        });
      }.bind(this);
      data.projectId = this.__pid;
      batch();
      return;
      var hasCreated = [], noCreated = [], newItems = [], shared = [];
      data.items.forEach(function (item) {
        var dt = this.__isCreated(item.name); //根据数据模型名称获取数据模型
        if (dt && dt.__isShare) {
          shared.push(item.name);
        } else {
          newItems.push(item);
          if (dt) {
            hasCreated.push(item.name);
            item.id = dt.id;
          }
          item.params.forEach(function (param) {
            // 判断参数中的类型是否在创建列表或者已经被创建
            if (data.names.indexOf(param.type) === -1 && !this.__isCreated(param.type) && noCreated.indexOf(param.typeName) === -1) {
              //对于没有出现过的数据模型，创建一个同名的空数据模型
              noCreated.push(param.type);
              newItems.push({
                name: param.type,
                params: []
              });
            }
          }.bind(this));
        }
      }.bind(this));
      delete data.names;
      data.items = newItems;
      if (hasCreated.length || noCreated.length || shared.length) {
        this.__confirm = _modal.confirm({
          content: (noCreated.length ? noCreated.join() + '还未被创建，确定导入将会创建空的数据模型<br/>' : '')
          + (hasCreated.length ? hasCreated.join() + '已被创建，确定导入将覆盖原有数据模型<br/>' : '')
          + (shared.length ? shared.join() + '已被分享，无法覆盖原有数据模型' : ''),
          title: '导入确认'
        }).$on('ok', function () {
          if (hasCreated.length || noCreated.length) {
            batch();
          }
        });
      } else {
        batch();
      }
    }.bind(this));
  };


  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
  };

  /**
   * 处理菜单操作
   * @param {Event} 事件对象
   */
  _pro.__menuClick = function (event) {
    event.stopPropagation();
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
        dispatcher._$redirect('/template/create/?pid=' + this.__pid);
        break;
      case 'import-file':
        _e._$delClassName(this._btnWrap, 'js-open');
        this._fileInput.click();
        break;
      case 'import-dir':
        _e._$delClassName(this._btnWrap, 'js-open');
        this._dirInput.click();
        break;
      default:
        break;
    }
  };

  _m._$regist(
    'res-template',
    _p._$$ModuleResTemplate
  );
});
