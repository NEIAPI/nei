/**
 * 资源CRUD生成器
 */
NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'util/template/jst',
  'util/cursor/cursor',
  'ui/base',
  'pro/select2/select2',
  'json!3rd/fb-modules/config/db.json',
  './crud_list.js',
  'text!./res_crud.html',
  'text!./res_crud.css'
], function (k, e, tpl, jst, Cursor, ui, Select2, dbConst, CrudList, html, css, p, pro) {
  p._$$ResCrud = k._$klass();
  pro = p._$$ResCrud._$extend(ui._$$Abstract);

  pro.__init = function (options) {
    this.__super(options);
  };

  pro.__reset = function (options) {
    if (!options.parent) options.parent = document.body;
    this.__cache = options.data.cache;
    this.__listCacheKey = options.data.listCacheKey;
    this.__super(options);

    this.__doInitDomEvent([
      [this.__enter, 'click', this.__onEnter._$bind(this)],
      [this.__cancel, 'click', this.__onCancel._$bind(this)],
      [this.__close, 'click', this.__onCancel._$bind(this)]
    ]);
    this.__crudList = new CrudList({
      data: {
        cache: this.__cache,
        searchCache: options.data.searchCache,
        listCacheKey: this.__listCacheKey,
        pid: options.data.pid,
        groups: options.data.groups,
        xlist: options.data.xlist
      }
    }).$inject(this.__listBox);

    var dtList = options.data.dtList.filter(function (dt) {
      if (dt.type === dbConst.MDL_TYP_NORMAL && dt.format === dbConst.MDL_FMT_HASH) {
        var params = dt.params.filter(function (p) {
          return p.type === dbConst.MDL_SYS_VARIABLE;
        }, this);
        return params.length === 1;
      }
      return false;
    }, this);

    var emptyModel = {
      name: '请选择',
      id: 0
    };
    var selectData = {
      source: dtList,
      sortList: false
    };
    dtList.unshift(emptyModel);
    this.__resDtSelect = new Select2({
      data: selectData
    }).$inject(this.__resDtCtn);
  };

  pro.__initXGui = (function () {
    var seed_css = e._$pushCSSText(css);
    var seed = tpl._$parseUITemplate(html);
    return function () {
      this.__seed_css = seed_css;
      this.__seed_html = seed.cnt;
    };
  })();

  pro.__initNode = function () {
    this.__super();
    // 0 - 取消 1 - 确定
    var list = e._$getByClassName(this.__body, 'j-btn');
    this.__cancel = list[0];
    this.__enter = list[1];
    this.__close = e._$getByClassName(this.__body, 'close')[0];
    // 数据模型crud列表
    this.__listBox = e._$getByClassName(this.__body, 'j-flag')[0];
    this.__resDtCtn = e._$getByClassName(this.__body, 'resp-dt-select')[0];
  };

  pro.__destroy = function () {
    if (this.__crudList) this.__crudList = this.__crudList.destroy();
    if (this.__resDtSelect) this.__resDtSelect = this.__resDtSelect.destroy();
    this.__super();
  };

  /**
   * 显示
   */
  pro._$show = function () {
    e._$delClassName(this.__body, 'f-dn');
  };

  /**
   * 点击确定
   */
  pro.__onEnter = function () {
    var data = this.__crudList.getValues();
    if (data) {
      if (data.items.length) {
        data.mid = this.__resDtSelect.data.selected.id;
        this.__cache._$crud({
          key: this.__listCacheKey,
          data: data
        });
      }
      this.__destroy();
    }
  };

  /**
   * 点击取消
   */
  pro.__onCancel = function () {
    this.__destroy();
  };

  return p;
});


