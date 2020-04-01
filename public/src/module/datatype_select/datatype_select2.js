/*
 * 数据模型选择控件-------------------------------------------------
 */
NEJ.define([
  'base/klass',
  'base/event',
  'base/element',
  'base/util',
  'util/event/event',
  'ui/base',
  'util/template/tpl',
  'pro/common/util',
  'pro/datatype_select/datatype_select',
  'text!./datatype_select2.html'
], function (k, v, e, u, c, ui, tpl, _, DatatypeSelect, html, p, pro) {

  p._$$DataTypeSelect = k._$klass();
  pro = p._$$DataTypeSelect._$extend(ui._$$Abstract);

  pro.__init = function (options) {
    this.__super(options);
    this.__pid = options.pid;
  };

  pro.__reset = function (options) {
    this.__super(options);
    //backOpen为true则默认打开后面数据类型下拉框
    this.__datatypeSelect = new DatatypeSelect({
      data: {
        pid: this.__pid,
        isArray: options.isArray,
        noArray: options.noArray,
        noObject: options.noObject,
        noCreate: options.noCreate,
        selected: options.selected,
        choseOnly: options.choseOnly,
        format: options.format,
        backOpen: options.backOpen,
        isOpen: options.backOpen ? false : true
      }
    }).$inject(this.__box).$on('change', function (options) {
      that._$dispatchEvent('ondatatypechange', options);
    });
    var that = this;
    var _handle = function () {
      v._$delEvent(document, 'click', _handle);
      that._$dispatchEvent('onclickout');
      // that.__destroy();
    };

    v._$addEvent(document, 'click', _handle);
    v._$addEvent(this.__box, 'click', function (event) {
      v._$stop(event);
    });
  };

  pro.__initXGui = (function () {
    var seed = tpl._$parseUITemplate(html);
    return function () {
      this.__seed_html = seed.cnt;
    };
  })();

  pro.__initNode = function () {
    this.__super();
    this.__box = e._$getByClassName(this.__body, 'j-dataselect')[0];
  };

  pro.__destroy = function () {
    this.__super();
    if (this.__datatypeSelect) this.__datatypeSelect.destroy();
  };
  return p;
});
