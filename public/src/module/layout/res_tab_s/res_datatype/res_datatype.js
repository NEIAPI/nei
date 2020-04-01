NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/event/event',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/stripedlist/stripedlist',
  'pro/cache/datatype_cache',
  'pro/cache/interface_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/cache/group_cache',
  'pro/notify/notify',
  'pro/modal/modal',
  'pro/params_import/javabean_import2',
  'pro/res_bat/res_copy_move/res_copy_move',
  'pro/res_bat/res_group/res_group',
  'pro/res_bat/res_crud/res_crud',
  '{3rd}/jsonbean/src/jsonbean.js',
  'text!pro/poplayer/share_layer.html',
  'pro/common/res_list'
], function (_k, _e, _v, _u, _c, _t, _l, _m, util, stripedList, cache, _inCache, _proCache, _pgCache, _usrCache, _groupCache, _notify, _modal, JBImport2, resCopyMove, resGroup, resCrud, jsonbean, _html, resList, _p, _pro) {
  _p._$$ModuleResDatatype = _k._$klass();
  _pro = _p._$$ModuleResDatatype._$extend(resList._$$ModuleResList);

  _pro.__doBuild = function () {
    this.isChrome = navigator.userAgent.indexOf('Chrome') !== -1;
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-datatype')
    );
    this._listContainer = _e._$getByClassName(this.__body, 'list-content')[0];
    this._btnWrap = _e._$getByClassName(this.__body, 'resource-feature-part')[0];
    this._fileInput = _e._$getByClassName(this.__body, 'j-file')[0];
    this._dirInput = _e._$getByClassName(this.__body, 'j-dir')[0];
    this._dirImportBtn = _e._$getByClassName(this.__body, 'dir')[0];
    if (!this.isChrome) {
      _e._$addClassName(this._dirImportBtn, 'f-dn');
    }
    var stripedListOption = {
      headers: [
        {
          name: '',
          key: '__isShare',
          valueType: 'share',
          sortable: false
        },
        {
          name: '',
          key: 'isConfirmed',
          valueType: 'isConfirmed',
          sortable: false,
          // 会放到 data-action 上面，事件交给 action manager 处理
          action: function (item) {
            return JSON.stringify({
              event: 'res-change-confirmed-logs',
              id: item.id,
              resType: util.db.RES_TYP_DATATYPE
            });
          }
        },
        {
          name: '名称',
          key: 'name',
          keyPinyin: 'namePinyin'
        },
        {
          name: '类型',
          key: 'format',
          valueType: 'datatypeFormat'
        },
        {
          name: '描述',
          key: 'description',
          valueType: 'description'
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
          keyPinyin: 'group.namePinyin',
          filter: 'group'
        },
        {
          name: '版本',
          key: 'version.name',
          valueType: 'deepKey'
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
      listGroups: [
        {
          group: '业务分组',
          key: 'group'
        },
        {
          group: '创建者',
          key: 'creator'
        }
      ],
      filter: function (list, listStates) {
        // 处理 action 列
        var filterList = util._$filterVersion(list);
        var _find = function (id) {
          return filterList.find(function (item) {
            return item.id == id;
          });
        };
        list.forEach(function (item) {
          var itemState = listStates[item.id];
          if (item.__isAnon || !_find(item.id)) {
            itemState.__invisible = true;
            return;
          }
          // 公共资源库中的资源，并且当前项目不是公共资源库，检查是否设置了隐藏
          if (!this.__progroup.showPublicList && item.__isShare && this.__project.type !== util.db.PRO_TYP_COMMON) {
            itemState.__invisible = true;
            return;
          }
          // 系统类型的数据模型没有操作权限
          if (item.id <= 10003) {
            itemState.__disabled = true;
            return itemState['__nei-actions'] = '';
          }

          var linkSuffix = '/?pid=' + item.projectId + '&id=' + item.id;
          itemState['__ui_name'] = '<a href="/datatype/detail' + linkSuffix + '" class="stateful">' + item.name + '</a>';
          itemState['__ui_name_hit_template'] = '<a href="/datatype/detail' + linkSuffix + '" class="stateful">{value}</a>';
          var str = '';

          // 查看详情
          str += '<a href="/datatype/detail' + linkSuffix + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';

          // 引用列表
          str += '<a href="/datatype/ref' + linkSuffix + '" title="查看引用列表" class="stateful"><em class="u-icon-link-normal"></em></a>';

          // 删除当前项
          str += '<a class="delete-icon" data-action=\'{"type": "del","warn":true, "cache": "datatype", "ids":[' + item.id + '], "key":"' + this._listCacheKey + '"}\'  title="删除当前项"><em class="u-icon-delete-normal"></em></a>';

          //分享当前项
          if (this.__project.type == 0 && !item.__isShare) {
            str += '<a class="share-icon" title="分享" data-action=\'{"event": "datatype-share","id":' + item.id + '}\'><em class="u-icon-share-normal"></em></a>';
          }
          itemState['__nei-actions'] = str;
        }._$bind(this));
        return list;
      }._$bind(this),
      afterRender: function () {
        _e._$delClassName(this._btnWrap, 'f-dn js-open');
      }._$bind(this)
    };
    var _options = {
      resType: 'datatype',
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__dtCache',
      //cache监听的回调事件
      callBackList: ['onshare', 'onclone', 'onmove', 'onsetgroup', 'onversioncreated', 'ontag'],
      //需注册的自定义事件
      eventList: ['res-copy', 'res-move', 'res-group', 'res-crud', 'res-version', 'res-datatype-doc-patch', 'res-change-confirmed-logs', 'res-tag'],
      //传进doinitDomEvent 的需初始化事件的数组，传子类特有的方法，或者重写父类已定义的方法
      customEventFunc: [[
        window, 'res-crud', this.__showResCrud.bind(this)
      ]],
      cacheOption: {
        onbatch: function (result) {
          var list = this.__dtCache._$getListInCache(this._listCacheKey);
          list = util._$filterVersion(list);
          this.stripedList._$updateList(list);
        }.bind(this)
      },
      stripedListOption: stripedListOption,
      canShare: true
    };
    this.__super(_options);
  };

  _pro.__onShow = function (_options) {
    this.stripedList = null;
    this.__inCache = _inCache._$$CacheInterface._$allocate({});
    this.__super(_options);
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
  };

  _pro.__onRefresh = function (_options) {
    //添加参数是否重复获取stripedlist的 batchAction参数
    //此处修复全屏后用户直接回退导致的页面错乱
    var fullScreenNode = _e._$getByClassName('g-bd', 'editor-full-screen');
    fullScreenNode.forEach(function (item) {
      _e._$delClassName(item, 'editor-full-screen');
      item.style = null;
    });
    _options.batActionFlag = true;
    this.__super(_options);
    this.__inListKey = this.__inCache._$getListKey(this.__pid);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__jbImport && this.__jbImport.destroy();
    this.__jbImport = null;
    this.__confirm && this.__confirm.destroy();
    this.__confirm = null;
  };

  /**
   * 处理菜单操作
   * @param {Event} 事件对象
   */
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
        dispatcher._$redirect('/datatype/create/?pid=' + this.__pid);
        break;
      case 'import-json':
        _e._$delClassName(this._btnWrap, 'js-open');
        this.importingFileType = 'json';
        this._fileInput.click();
        break;
      case 'import-javabean-file':
        _e._$delClassName(this._btnWrap, 'js-open');
        this.importingFileType = 'javabean';
        this._fileInput.click();
        break;
      case 'import-javabean-dir':
        _e._$delClassName(this._btnWrap, 'js-open');
        this.importingFileType = 'javabean';
        this._dirInput.click();
        break;
      default:
        break;
    }
  };
  /**
   * javabean导入数据模型
   * @param {Event} 事件对象
   */
  _pro.__import = function (event) {
    var files = event.target.files;
    util._$importDatatypeFiles(this.importingFileType, files, this.__showImportConfirm.bind(this));
    event.target.value = '';
  };
  /**
   * 显示导入确认框
   * @param {Array} importDT 文件解析出的数据模型
   */
  _pro.__showImportConfirm = function (importDT) {
    importDT = importDT.filter(function (item) {
      return item;
    });
    if (importDT.length) {
      this.__jbImport = new JBImport2({
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
        var batch = function () {
          this.__dtCache._$batch({
            key: this._listCacheKey,
            data: data,
            actionMsg: '导入成功'
          });
        }.bind(this);
        data.projectId = this.__pid;
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
              if (data.names.indexOf(param.typeName) === -1 && !this.__isCreated(param.typeName) && noCreated.indexOf(param.typeName) === -1) {
                // 对于没有出现过的数据模型，创建一个同名的空数据模型
                noCreated.push(param.typeName);
                newItems.push({
                  name: param.typeName,
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
    } else {
      _modal.alert({
        title: '导入数据模型失败',
        content: '没有要导入的数据模型！请检查格式是否正确！',
        clazz: 'modal-exp-error'
      });
    }
  };
  /**
   * 判断数据类型是否已经创建
   * @param {String}  数据类型名称
   * @return {obj}  数据类型
   */
  _pro.__isCreated = function (typeName) {
    var list = this.__dtCache._$getListInCache(this._listCacheKey);
    var dt = list.find(function (item) {
      return item.name === typeName;
    }.bind(this));
    return dt;
  };

  /**
   * 显示CRUD生成器弹框
   * @return {Void}
   */
  _pro.__showResCrud = function (event) {
    if (event.ids.length > 5) {
      _notify.warning('最多选择5个资源');
    } else {
      var xlist = this.__dtCache._$getResListByIds(event.ids).map(function (item) {
        return {
          name: item.name,
          datatypeId: item.id
        };
      });
      this.__expr = resCrud._$$ResCrud._$allocate({
        data: {
          pid: this.__pid,
          cache: this.__inCache,
          dtList: this.__dtCache._$getListInCache(this._listCacheKey),
          searchCache: _inCache._$$CacheInterface,
          listCacheKey: this.__inListKey,
          xlist: xlist,
          groups: this.__groupCache._$getGroupSelectSource(this.__pid)
        }
      })._$show();
    }
  };
  /**
   * 获取stripedlist的batchAction参数
   */
  _pro.__getBatchAction = function () {
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
      name: '查看文档',
      action: {
        event: 'res-datatype-doc-patch'
      }
    }, {
      name: '新建版本',
      class: 'batch-action-item-version',
      action: {
        event: 'res-version'
      }
    }, {
      name: 'CRUD',
      action: {
        event: 'res-crud'
      }
    }, {
      name: '删除',
      action: {
        type: 'del',
        cache: cache._$cacheKey,
        warn: true,
        key: this._listCacheKey
      }
    }];
    if (this.__project.type !== util.db.PRO_TYP_NORMAL) {//只有普通项目，可以移动、设置分组、CRUD
      actionData.splice(2, 2);
    }
    var batch = '';
    actionData.forEach(function (item) {
      batch += '<a class="' + ['batch-action-item', item.class ? item.class : ''].join(' ') + '" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>';
    });
    return batch;
  };
  // notify dispatcher
  _m._$regist(
    'res-datatype',
    _p._$$ModuleResDatatype
  );
});
