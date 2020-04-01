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
  'pro/cache/constraint_cache',
  'pro/cache/datatype_cache',
  'pro/cache/parameter_cache',
  'pro/cache/group_cache',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/param_editor/param_editor',
  'pro/tagme/tagme',
  'pro/select2/select2'
], function (_k, u, _e, _v, c, _t, _l, _j, _m, util, csCache, dtCache, paramCache, groupCache, pgCache, proCache, paramEditor, _tag, _s2, _p, _pro) {

  _p._$$ModuleResDatatypeDetailAttribute = _k._$klass();
  _pro = _p._$$ModuleResDatatypeDetailAttribute._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-datatype-detail-attribute')
    );
  };

  _pro.__onShow = function (_options) {
    //项目cache
    this.__proCache = proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        if (this.__project.creatorId) {
          this._dtCache._$getList({
            key: this.__listCacheKey,
            data: {
              pid: this.__pid
            }
          });
        }
      }.bind(this)
    });
    this.__csCache = csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this.__renderView();
      }.bind(this)
    });

    this._dtCache = dtCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        this.__datatype = this._dtCache._$getItemInCache(this.__id);
        this._format = this.__datatype.format;
        //项目组cache
        this.__pgCache = pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            var role = this.__pgCache._$getRole(this.__datatype.progroupId);
            this._permit = true;
            if (role == 'observer') {
              this._permit = false;
            }
            this.__datatype.permit = this._permit;
            this.__csCache._$getList({
              key: this.__csListCacheKey,
              data: {
                pid: this.__pid
              }
            });
          }.bind(this)
        });
        this.__csListCacheKey = this.__csCache._$getListKey(this.__pid);
        this.__pgCache._$getItem({
          id: this.__datatype.progroupId
        });
      }.bind(this)
    });
    this._paramCache = paramCache._$$CacheParameter._$allocate();
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__body.innerHTML = '';
    if (this.__paramEditor) {
      this.__paramEditor = this.__paramEditor._$recycle();
    }
    this.__csCache = this.__csCache._$recycle();
    if (this.__pgCache) {
      this.__pgCache._$recycle();
      delete this.__pgCache;
    }
    this.__proCache = this.__proCache._$recycle();
    this._dtCache = this._dtCache._$recycle();
    if (this._sampleCodeContainer) {
      this._sampleCodeContainer.innerHTML = '';
    }
    this._paramCache = this._paramCache._$recycle();
  };

  _pro.__onRefresh = function (_options) {
    // 显示加载中提示
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    _e._$delClassName(this.__loading, 'f-dn');
    this.__id = parseInt(_options.param.id.replace('/', ''));
    this.__pid = parseInt(_options.param.pid.replace('/', ''));
    this.__listCacheKey = this._dtCache._$getListKey(this.__pid);
    this.__super(_options);
    this.__proCache._$getItem({
      id: this.__pid
    });
  };

  _pro.__renderView = function () {
    // 隐藏加载中提示
    _e._$addClassName(this.__loading, 'f-dn');
    _j._$render(this.__body, 'datatype-detail-attribute-content', this.__datatype);
    this._sampleCodeContainer = _e._$getByClassName(this.__body, 'sample-code')[0];
    this._noSampleCodeContainer = _e._$getByClassName(this.__body, 'no-sample-code')[0];
    this._renderMockData();
    this._initEditor();
  };

  _pro._renderMockData = function () {
    var dataTypes = this._dtCache._$getListInCache(this.__listCacheKey, true);
    var constraints = this.__csCache._$getListInCache(this.__csListCacheKey);
    util._$initDataTypeSampleCode(
      this.__datatype.id,
      dataTypes,
      constraints,
      this._sampleCodeContainer,
      this._noSampleCodeContainer
    );
  };

  _pro._initEditor = function () {
    this.__editorPart = _e._$getByClassName(this.__body, 'd-item')[0];
    var editorOption = {
      parent: _e._$getByClassName(this.__editorPart, 'list')[0],
      parentId: this.__id,
      parentType: 4,
      pid: this.__datatype.projectId,
      preview: true,
      onChange: this._renderMockData.bind(this)
    };
    this.__paramEditor = paramEditor._$$ParamEditor._$allocate(editorOption);
  };

  _m._$regist(
    'datatype-detail-attribute',
    _p._$$ModuleResDatatypeDetailAttribute
  );
});
