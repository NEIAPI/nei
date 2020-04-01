NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/group_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/stripedlist/stripedlist',
  'pro/select2/select2',
  'pro/activitylist/activitylist',
], function (_k, _u, _e, _v, _t, _l, _j, _m, util, cache, _pgCache, _usrCache, _sl, _s2, _aList, _p, _pro) {

  _p._$$ModuleResGroupDetail = _k._$klass();
  _pro = _p._$$ModuleResGroupDetail._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-group-detail')
    );
    _j._$add('m-res-g-detail');
    //分组cache
    this.__cache = cache._$$CacheGroup._$allocate({
      onitemload: function () {
        this.__group = this.__cache._$getItemInCache(this.__id);
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            var role = this.__pgCache._$getRole(this.__group.progroupId);
            this._permit = true;
            if (role == 'observer') {
              this._permit = false;
            }
            this.__group.permit = this._permit;
            _j._$render(this.__body, 'm-res-g-detail', this.__group);
            this._initEditor();
            this._initSelectRespo();
            this._initActivityList();
          }._$bind(this)
        });
        this.__pgCache._$getItem({
          id: this.__group.progroupId
        });
      }.bind(this)
    });
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__id = _options.param.id.replace('/', '');
    this.__pid = parseInt(_options.param.id.replace('/', ''));
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__cache._$getItem({
      id: this.__id
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__body.innerHTML = '';
  };
  _pro._initEditor = function () {
    var rpcPomEditorContainer = _e._$getByClassName(this.__body, 'rpc-pom-editor')[0];
    var rpcKeyEditorContainer = _e._$getByClassName(this.__body, 'rpc-key-editor')[0];
    this.rpcPomEditor = util._$initNormalEditor('xml', this.__group.rpcPom, rpcPomEditorContainer, false);
    this.rpcKeyEditor = util._$initNormalEditor('properties', this.__group.rpcKey, rpcKeyEditorContainer, false);

    this.rpcPomEditor.on('blur', function (options) {
      var newContent = this.rpcPomEditor.getValue();
      if (newContent !== this.__group.rpcPom) {
        this.__cache._$updateItem({
          id: this.__group.id,
          data: {
            rpcPom: newContent
          }
        });
      }
    }.bind(this));

    this.rpcKeyEditor.on('blur', function (options) {
      var newContent = this.rpcKeyEditor.getValue();
      if (newContent !== this.__group.rpcKey) {
        this.__cache._$updateItem({
          id: this.__group.id,
          data: {
            rpcKey: newContent
          }
        });
      }
    }.bind(this));
  };
  /**
   * 实例化负责人选择器组件
   * @return {Void}
   */
  _pro._initSelectRespo = function () {
    var selectDiv = _e._$getByClassName(this.__body, 'respo-select')[0];
    var respo = this.__group.respo;
    respo.name = respo.realname;
    if (!!this._permit) {
      this.__respoSelect = new _s2({
        data: {
          source: this.__pgCache._$getRespoSelectSource(this.__group.progroupId),
          selected: respo,
          preview: true
        }
      }).$inject(selectDiv)
        .$on('change', function (result) {
          this.__cache._$updateItem({
            id: this.__group.id,
            data: {
              respoId: result.selected.id
            }
          });
        }.bind(this));
    } else {
      selectDiv.innerHTML = respo.name;
    }
  };

  _pro._initActivityList = function () {
    var activityList = _e._$getByClassName(this.__body, 'd-item-activity')[0];
    this.__aList = _aList._$$ModuleActivityList._$allocate({
      parent: _e._$getByClassName(activityList, 'list')[0],
      key: 'activities-group',
      id: this.__id,
      count: 1
    });
  };

  _m._$regist(
    'res-group-detail',
    _p._$$ModuleResGroupDetail
  );
});
