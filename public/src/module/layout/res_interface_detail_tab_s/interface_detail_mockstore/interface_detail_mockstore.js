NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/interface_cache',
  'pro/cache/datatype_cache',
  'pro/modal/modal',
  'pro/select2/select2',
  'pro/generate_rule/generate_rule',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _e, _l, jst, _m, util, _inCache, datatypeCache, modal, _s2, GenerateRule, db, _p, _pro) {

  /**
   * HTTP 接口详情 Mockstore 模块
   */
  _p._$$ModuleInterfaceDetailMockstore = _k._$klass();
  _pro = _p._$$ModuleInterfaceDetailMockstore._$extend(_m._$$Module);

  var typeName = {
    'CONNECT_TYPE_GET': '按 id 加载单个',
    'CONNECT_TYPE_GET_ALL': '加载所有',
    'CONNECT_TYPE_GET_LIST': '按 id 列表加载多个',
    'CONNECT_TYPE_CREATE': '创建单个',
    'CONNECT_TYPE_CREATE_LIST': '按数组数据创建多个',
    'CONNECT_TYPE_UPDATE': '按 id 更新单个',
    'CONNECT_TYPE_UPDATE_ALL': '更新所有',
    'CONNECT_TYPE_UPDATE_LIST': '按数组数据更新多个',
    'CONNECT_TYPE_DELETE': '按 id 删除单个',
    'CONNECT_TYPE_DELETE_ALL': '删除所有',
    'CONNECT_TYPE_DELETE_LIST': '按 id 列表删除多个',
  };

  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-interface-detail-mockstore')
    );
    this.__selectModel = _e._$getByClassName(this.__body, 'select-model')[0];
    this.__selectType = _e._$getByClassName(this.__body, 'select-type')[0];
    this.__blbScriptIpt = _e._$getByClassName(this.__body, 'blb-script')[0];
    this.__blaScriptIpt = _e._$getByClassName(this.__body, 'bla-script')[0];
    this.__modelErrorTip = _e._$getByClassName(this.__body, 'error-tip')[0];
    this.__clearModel = _e._$getByClassName(this.__body, 'clear-model')[0];
    this.__clearType = _e._$getByClassName(this.__body, 'clear-type')[0];
    this.__datatypeDetail = _e._$getByClassName(this.__body, 'show-detail')[0];

    this.__connectType = ['GET', 'GET_ALL', 'GET_LIST', 'CREATE', 'CREATE_LIST', 'UPDATE', 'UPDATE_ALL', 'UPDATE_LIST', 'DELETE', 'DELETE_ALL', 'DELETE_LIST']
      .map(function (type) {
        return {
          id: db['CONNECT_TYPE_' + type],
          name: typeName['CONNECT_TYPE_' + type]
        };
      });
    this.__xheaders = [
      {name: '名称', key: 'name'},
      {name: '类型', key: 'typeName'},
      {name: '描述', key: 'description'}
    ];

    this.__inCache = _inCache._$$CacheInterface._$allocate({
      onitemload: function () {
        this.__interface = this.__inCache._$getItemInCache(this.__id);
        this.__blbScriptCode = this.__interface.blbScript;
        this.__blaScriptCode = this.__interface.blaScript;
        this.__blbScriptIpt.value = this.__blbScriptCode;
        this.__blaScriptIpt.value = this.__blaScriptCode;
        if (this.__interface.connectId === 0) {
          _e._$addClassName(this.__clearModel, 'f-dn');
        } else {
          _e._$delClassName(this.__clearModel, 'f-dn');
        }
        if (this.__interface.connectType === 0) {
          _e._$addClassName(this.__clearType, 'f-dn');
        } else {
          _e._$delClassName(this.__clearType, 'f-dn');
        }
        this.__dtCache = datatypeCache._$$CacheDatatype._$allocate({
          onlistload: function () {
            this.__datatypes = this.__dtCache._$getListInCache(this.__dataTypeListCacheKey);
            this.__renderSelectors();
          }.bind(this)
        });
        this.__dataTypeListCacheKey = this.__dtCache._$getListKey(this.__pid);
        this.__dtCache._$getList({
          key: this.__dataTypeListCacheKey,
          data: {
            pid: this.__pid
          }
        });
      }.bind(this),
      onitemupdate: function () {
        if (this.__interface.connectId === 0) {
          _e._$addClassName(this.__clearModel, 'f-dn');
        } else {
          _e._$delClassName(this.__clearModel, 'f-dn');
        }
        if (this.__interface.connectType === 0) {
          _e._$addClassName(this.__clearType, 'f-dn');
        } else {
          _e._$delClassName(this.__clearType, 'f-dn');
        }
      }.bind(this)
    });
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__id = _options.param.id.replace('/', '');
    this.__pid = _options.param.pid.replace('/', '');
    this.__super(_options);
    this.__inCache._$getItem({
      id: this.__id
    });
  };

  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([
      [
        this.__blbScriptIpt, 'click',
        function () {
          var blbGrModal = new GenerateRule({
            data: {
              pid: this.__pid,
              value: this.__interface.blbScript,
              title: '前置业务逻辑规则',
              tip: '请输入调用规则函数的 JavaScript 代码, 例如: businessLogicBeforeScript()'
            }
          }).$on('ok', function (data) {
            this.__blbScriptIpt.value = data;
            if (this.__blbScriptCode !== data) {
              this.__blbScriptCode = data;
              this.__inCache._$updateItem({
                id: this.__id,
                data: {
                  blbScript: data
                }
              });
            }
          }.bind(this));
        }.bind(this)
      ], [
        this.__blaScriptIpt, 'click',
        function () {
          var blaGrModal = new GenerateRule({
            data: {
              pid: this.__pid,
              value: this.__interface.blaScript,
              title: '后置业务逻辑规则',
              tip: '请输入调用规则函数的 JavaScript 代码, 例如: businessLogicAfterScript()'
            }
          }).$on('ok', function (data) {
            this.__blaScriptIpt.value = data;
            if (this.__blaScriptCode !== data) {
              this.__blaScriptCode = data;
              this.__inCache._$updateItem({
                id: this.__id,
                data: {
                  blaScript: data
                }
              });
            }
          }.bind(this));
        }.bind(this)
      ], [
        this.__clearModel, 'click', function () {
          this.__modelSelector.$clearSelect();
        }.bind(this)
      ], [
        this.__clearType, 'click', function () {
          this.__typeSelector.$clearSelect();
        }.bind(this)
      ], [
        this.__datatypeDetail, 'mouseenter', this.__showDatatypeDetail.bind(this, true)
      ], [
        this.__datatypeDetail, 'mouseleave', this.__showDatatypeDetail.bind(this, false)
      ]
    ]);
  };

  _pro.__showDatatypeDetail = function (show, evt) {
    if (!this.__selectedModel || this.__modelSelector.data.isOpen) {
      _e._$addClassName(this.__datatypeDetail, 'f-dn');
      return;
    }
    clearTimeout(this.leaveTimeout);
    var handler = function () {
      if (show) {
        if (this.isShowDetail) {
          return;
        }
        this.isShowDetail = true;
        _e._$delClassName(this.__datatypeDetail, 'f-dn');
        var link = util._$getDatatypeDetailLink(false, this.__pid, this.__selectedModel.id);
        var datatype = this.__datatypes.find(function (item) {
          return item.id === this.__selectedModel.id;
        }, this);
        var versionName = datatype && datatype.version && datatype.version.name ? datatype.version.name : '';
        var params = [];
        datatype.params.forEach(function (param) {
          params.push({
            name: param.name,
            description: param.description,
            typeName: param.typeName,
            link: util._$getDatatypeDetailLink(false, this.__pid, param.type),
            type: param.type
          });
        }, this);
        jst._$render(this.__datatypeDetail, 'datatype-detail', {
          link: link,
          selected: this.__selectedModel,
          versionName: versionName,
          params: params,
          xheaders: this.__xheaders
        });
      } else {
        this.isShowDetail = false;
        _e._$addClassName(this.__datatypeDetail, 'f-dn');
      }
    }.bind(this);
    if (evt.type === 'mouseleave') {
      this.leaveTimeout = setTimeout(handler, 100);
    } else {
      handler();
    }
  };

  _pro.__renderSelectors = function () {
    var renderDatatypes = this.__filterValidDatatypes(this.__datatypes);
    this.__selectedModel = this.__datatypes.find(function (item) {
      return item.id === this.__interface.connectId;
    }, this);
    this.__selectedType = this.__connectType.find(function (item) {
      return item.id === this.__interface.connectType;
    }, this);
    var modelOption = {
      emptyTip: '还未关联数据模型',
      placeholder: '请选择一个数据模型',
      preview: true,
      selectFirst: false,
      selected: this.__selectedModel,
      hasCreate: true,
      source: renderDatatypes
    };
    var typeOption = {
      emptyTip: '还未设置关联类型',
      placeholder: '请选择一个关联类型',
      preview: true,
      selectFirst: false,
      selected: this.__selectedType,
      sortList: false,
      source: this.__connectType
    };
    this.__modelSelector = new _s2({
      data: modelOption
    }).$on('create', this.__createDatatype.bind(this))
      .$on('change', function (opts) {
        this.__selectedModel = opts.selected ? opts.selected : undefined;
        this.__inCache._$updateItem({
          id: this.__id,
          data: {
            connectId: opts.selected ? opts.selected.id : 0
          }
        });
      }.bind(this))
      .$on('toggle', function () {
        _e._$addClassName(this.__datatypeDetail, 'f-dn');
      }.bind(this)).$inject(this.__selectModel);
    this.__typeSelector = new _s2({
      data: typeOption
    }).$on('change', function (opts) {
      this.__selectedType = opts.selected ? opts.selected : undefined;
      this.__inCache._$updateItem({
        id: this.__id,
        data: {
          connectType: opts.selected ? opts.selected.id : 0
        }
      });
    }.bind(this)).$on('toggle', function () {
    }.bind(this)).$inject(this.__selectType);
    this.__doInitDomEvent([
      [
        this.__modelSelector.$refs.element, 'mouseenter', this.__showDatatypeDetail.bind(this, true)
      ], [
        this.__modelSelector.$refs.element, 'mouseleave', this.__showDatatypeDetail.bind(this, false)
      ]
    ]);
  };

  _pro.__filterValidDatatypes = function (datatypes) {
    return datatypes.filter(function (dt) {
      return this.__checkValidity(dt.id, this.__datatypes);
      ;
    }, this).sort(function (a, b) {
      return a.name - b.name;
    });
  };

  _pro.__checkValidity = function (datatypeId, datatypes) {
    var datatype = datatypes.find(function (dt) {
      return dt.id === datatypeId;
    });
    if (!datatype) {
      return true;
    }
    if (datatype.type !== 0) {
      return false;
    }
    return datatype.params.some(function (param) {
      if (param.name !== 'id') {
        return false;
      } else {
        if (param.isArray) {
          return false;
        }
        var dt = datatypes.find(function (dtype) {
          return dtype.id === param.type;
        });
        if (dt && (dt.format === db.MDL_FMT_NUMBER || dt.format === db.MDL_FMT_STRING)) {
          return true;
        } else {
          return false;
        }
      }
    });
  };

  _pro.__createDatatype = function () {
    var _modal = new modal({
      data: {
        'content': '',
        'title': ' ',
        'noTitle': true,
        'class': 'inline-create',
        'okButton': false,
        'cancelButton': false,
        'closeButton': true
      }
    }).$on('close', function () {
      dispatcher._$hide('/?/progroup/p/res/datatype/create/');
      _modal.destroy();
    });
    this.__dtCache.__doInitDomEvent([
      [datatypeCache._$$CacheDatatype, 'add', function (result) {
        var newSource = this.__filterValidDatatypes(this.__datatypes);
        var selected = newSource.find(function (item) {
          return item.id === result.data.id;
        });
        this.__modelSelector.$updateSource(newSource);
        if (selected) {
          this.__modelSelector.$select(selected);
        }
        //及时清除事件
        this.__dtCache.__doClearDomEvent();
      }._$bind(this)]
    ]);
    dispatcher._$redirect('/?/progroup/p/res/datatype/create/?pid=' + this.__pid, {
      input: {
        parent: _modal.$refs.modalbd,
        done: function () {
          dispatcher._$hide('/?/progroup/p/res/datatype/create/');
          _modal.destroy();
        }.bind(this)
      }
    });
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    if (this.__modelSelector) {
      this.__selectedModel = null;
      this.__modelSelector = this.__modelSelector && this.__modelSelector.destroy();
    }
    if (this.__typeSelector) {
      this.__selectedType = null;
      this.__typeSelector = this.__typeSelector && this.__typeSelector.destroy();
    }
  };

  _m._$regist(
    'interface-detail-mockstore',
    _p._$$ModuleInterfaceDetailMockstore
  );
});
