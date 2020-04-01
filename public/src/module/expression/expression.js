/*
 * 公式生成器
 */
NEJ.define([
  'base/klass',
  'base/element',
  'util/template/tpl',
  'util/template/jst',
  'util/cursor/cursor',
  'ui/base',
  './select.js',
  'text!./expression.html',
  'text!./expression.css'
], function (k, e, tpl, jst, Cursor, ui, Select, html, css, p, pro) {
  p._$$Expr = k._$klass();
  pro = p._$$Expr._$extend(ui._$$Abstract);

  pro.__init = function (options) {
    this.__super(options);
  };

  pro.__reset = function (options) {
    if (!options.parent) options.parent = document.body;

    this.__super(options);

    this.__doInitDomEvent([
      [this.__enter, 'click', this.__onEnter._$bind(this)],
      [this.__cancel, 'click', this.__onCancel._$bind(this)],
      [this.__close, 'click', this.__onCancel._$bind(this)]
    ]);
    this.__textarea.value = options.data.value || '';
    this.__sel = new Select({
      data: {
        pid: options.data.pid
      }
    })
      .$inject(this.__selBox)
      .$on('select', this.__onSelect._$bind(this));
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

    // 0 - 确定
    // 1 - 取消
    var list = e._$getByClassName(this.__body, 'j-btn');
    this.__enter = list[0];
    this.__cancel = list[1];
    this.__close = e._$getByClassName(this.__body, 'close')[0];
    // 0 - 文本区域
    // 1 - 表达式选择容器
    var list = e._$getByClassName(this.__body, 'j-flag');
    this.__textarea = list[0];
    this.__selBox = list[1];
    // 函数描述
    var list2 = e._$getByClassName(this.__body, 'j-desc');
    this.__desTitle = list2[0];
    this.__desCont = list2[1];
  };

  pro.__destroy = function () {
    if (this.__sel) this.__sel = this.__sel.destroy();
    this.__super();
  };

  /**
   * 重置
   */
  //pro._$reset = function() {
  //    this.__textarea.value = '';
  //   // this.__sel.$emit('reset');
  //};

  /**
   * 显示
   */
  pro._$show = function () {
    // this._$reset();
    e._$delClassName(this.__body, 'f-dn');
  };

  ///**
  // * 隐藏
  // */
  //pro._$hide = function() {
  //    e._$addClassName(this.__body, 'f-dn');
  //};

  /**
   * 点击确定
   */
  pro.__onEnter = function () {
    this._$dispatchEvent('onenter', this.__textarea.value);
    this.__destroy();
    // e._$removeByEC(this.__body);
  };

  /**
   * 点击取消
   */
  pro.__onCancel = function () {
    this._$dispatchEvent('oncancel');
    //this._$hide();
    this.__destroy();
    // e._$removeByEC(this.__body);
  };

  /**
   * 选择某个值
   */
  pro.__onSelect = function (data) {
    if (data.eventType == 'dblclick') {
      var value = data.value + (data.type == 'func' ? '()' : '');
      var start = this.__textarea.selectionStart;
      var end = this.__textarea.selectionEnd;

      var content = this.__textarea.value;
      content = content.substring(0, start) + value + content.substr(end);
      this.__textarea.value = content;
      Cursor._$cursor(this.__textarea, start + value.length);
    } else {
      this.__desTitle.innerHTML = data.value;
      this.__desCont.innerHTML = data.description || '';
    }

  };

  return p;
});
