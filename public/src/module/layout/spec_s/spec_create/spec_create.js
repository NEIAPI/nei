NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'util/form/form',
  'pro/common/module',
  'pro/leselect/leselect',
  'pro/cache/spec_cache',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _e, _v, _u, _l, _f, _m, LESelect, _specCache, _db, _p, _pro) {
  /**
   * 项目组树模块
   * @class   {wd.m._$$ModuleSpecCreate}
   * @extends {nej.ut._$$AbstractModule}
   */
  _p._$$ModuleSpecCreate = _k._$klass();
  _pro = _p._$$ModuleSpecCreate._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-create')
    );
    this.__specTypeNode = _e._$getByClassName(this.__body, 'u-type')[0];
    this.__backBtn = _e._$getByClassName(this.__body, 'u-back')[0];
    this.__specTypeData = { //规范类型与名称映射数据
      web: {name: 'WEB', value: _db.CMN_TYP_WEB},
      ios: {name: 'IOS', value: _db.CMN_TYP_IOS},
      aos: {name: 'Android', value: _db.CMN_TYP_AOS},
      test: {name: '测试', value: _db.CMN_TYP_TEST}
    };
    this.__specCache = _specCache._$$CacheSpec._$allocate({
      onitemadd: function (_r) {
        dispatcher._$redirect('detail/doc/?id=' + _r.data.id);
      }.bind(this)
    });
    this.__form = _f._$$WebForm._$allocate({
      form: _e._$getByClassName(this.__body, 'm-form')[0]
    });
    _v._$addEvent(this.__body, 'click', function (evt) {
      var node = _v._$getElement(evt, 'd:click');
      if (!node) return;
      var action = _e._$dataset(node, 'click');
      switch (action) {
        case 'submit':
          this.__createSpec();
          break;
        default :
          break;
      }
    }._$bind(this), false);
  };
  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__data = {};
    if (_options.input) {
      this.__data = _u._$merge(this.__data, _options.input);
      this.__form._$setValue('name', this.__data.name);
      this.__form._$setValue('description', this.__data.description);
    }
    this.__specType = _options.param.s ? _options.param.s : 'web';
    this.__specTypeNode.innerText = this.__specTypeData[this.__specType].name;
    if (!_options.referer) {
      _e._$addClassName(this.__backBtn, 'f-dn');
    } else {
      _e._$delClassName(this.__backBtn, 'f-dn');
      var defaultBack = {
        specType: 'web',
        listType: 'all'
      };
      var showBack = !!window.sessionStorage.specBack ? JSON.parse(window.sessionStorage.specBack) : defaultBack;
      var showBackHref = '/spec/list?s=' + showBack.specType + '&l=all';
      _e._$attr(this.__backBtn, 'href', showBackHref);
    }
    this.__data.type = this.__specTypeData[this.__specType].value;
    if (this.__le) {
      this.__le.destroy();
      this.__form._$reset();
    }
    this.__le = new LESelect({
      data: {
        specType: this.__specType,
        preview: false,
        editable: true,
        type: 'create',
        lid: this.__data.language == undefined ? undefined : this.__data.language,
        eid: this.__data.engine == undefined ? undefined : this.__data.engine,
        viewExtension: this.__data.viewExtension
      }
    }).$inject(_e._$getByClassName(this.__body, 'm-form')[0]);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__le && this.__le.destroy();
    this.__le = null;
    this.__form && this.__form._$reset();
    this.__super();
  };
  /**
   * 创建规范
   * @return {Void}
   */
  _pro.__createSpec = function () {
    var form = _e._$getByClassName(this.__body, 'm-form')[0];
    if (this.__form._$checkValidity()) {
      this.__data.name = form[0].value;
      this.__data.description = form[1].value;
      this.__data.language = this.__le.data.lselected.id;
      if (this.__specType == 'web') {
        this.__data = _u._$merge(this.__data, {
          engine: this.__le.data.eselected.id,
          viewExtension: this.__le.data.viewExtension
        });
      }
      this.__specCache._$addItem({
        key: _specCache._$cacheKey,
        action: this.__specType,
        data: this.__data
      });
    }
  };
  // notify dispatcher
  _m._$regist(
    'spec-create',
    _p._$$ModuleSpecCreate
  );
});
