/*
 * 参数编辑器-编辑状态------------------------------------------------
 */
NEJ.define([
  'base/klass',
  'base/event',
  'base/element',
  'base/util',
  'util/template/tpl',
  'ui/base',
  'pro/common/util',
  'pro/cache/datatype_cache',
  './radio2group/radio2group.js',
  './params_haxi.js',
  './params_enum.js',
  './params_array.js',
  './params_base.js',
  'pro/notify/notify',
  'pro/create_datatype/create_datatype',
  'text!./params_editor.html',
  'text!./params_editor.css'
], function (k, v, e, u, tpl, ui, _, cache, Radio2, Haxi, Enum, Array2, Base, Notify, DTModel, html, css, p, pro) {
  p._$$Editor = k._$klass();
  pro = p._$$Editor._$extend(ui._$$Abstract);

//编辑器使用的时候一些字段说明
//     1.parentId
//     参数所在的资源的id
//     2.datatypeId
//     用于标记当前参数是否为导入参数，0：自身参数；非0：导入参数，当前值即为导入的数据模型的id
//     3.originalDatatypeId
//     用于标记当前参数是否为多重导入的参数，当前值即为参数所在的最原始的数据模型id。
//      4.type
//     参数的类型，系统数据模型或自定义数据模型的id
//     5.originalType
//     用于标记当前参数的最原始类型，0：没有被覆写过；非0：被覆写，当前值即为参数原始的类型，（一般是可变类型
// ）
//      6、使用环境下还要区分
//     如果是新增导入类型 则导入属性的parentId为导入类型的id，如果是修改导入类型的属性，则datatypeId
//     为导入类型的id。

  pro.__reset = function (options) {
    this.__super(options);
    this.__pid = options.pid;
    this.__format = options.format || 0;
    this.__shape = options.shape || '';
    this.__params = options.params;
    this.__hasCreate = options.hasCreate;
    this.__noObject = options.noObject;
    this.__isHideFullButton = false || options.isHideFullButton;
    this.__singlePattern = options.singlePattern;
    this.__klassArr = [Haxi, Enum, Array2];
    this.__baseArr = [_.db.MDL_FMT_STRING, _.db.MDL_FMT_NUMBER, _.db.MDL_FMT_BOOLEAN, _.db.MDL_FMT_FILE];
    this.__initComponent();
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
    this.__radioBox = e._$getByClassName(this.__body, 'j-radio')[0];
    this.__editorBox = e._$getByClassName(this.__body, 'j-editor')[0];
  };
  pro.__destroy = function () {
    this.__super();
    if (this.__radioCom) this.__radioCom.destroy();
    if (this.__editorCom) this.__editorCom.destroy();
  };
  /**
   * 编辑器类型选择事件
   * @param format
   * @param params(预填数据)
   * @private
   */
  pro.__changeEditorByFormat = function (format, params) {
    var Klass = Base; //默认为基本类型（string,number,boolean,file）
    if (this.__baseArr.indexOf(format) == -1) {
      Klass = this.__klassArr[format];
    }
    this.__format = format;
    if (this.__editorCom) this.__editorCom.destroy();

    this.__editorCom = new Klass({
      data: {
        pid: this.__pid,
        format: format,
        shape: this.__shape,
        hasCreate: this.__hasCreate,
        noObject: this.__noObject,
        params: params
      }
    }).$inject(this.__editorBox);
    // .$on('showCreateDT', this.__showDTModel.bind(this));
  };
  pro.__initComponent = function () {
    var Klass = null;
    if (this.__format >= 3) {
      Klass = Base;
    } else {
      Klass = this.__klassArr[this.__format];
    }
    if (!this.__singlePattern) {
      this.__radioCom = new Radio2({
        data: {
          selectedIndex: this.__format,
          singlePattern: this.__singlePattern
        }
      }).$on('change', this.__changeEditorByFormat._$bind(this)).$inject(this.__radioBox);
    }
    this.__editorCom = new Klass({
      data: {
        pid: this.__pid,
        params: this.__params && this.__params.length ? this.__params : undefined,
        format: this.__format,
        shape: this.__shape,
        hasCreate: this.__hasCreate,
        isHideFullButton: this.__isHideFullButton,
        noObject: this.__noObject
      }
    }).$inject(this.__editorBox);
    // .$on('showCreateDT', this.__showDTModel.bind(this));
  };
  /**
   * return {object}
   * @param params {object}   //参数结果
   * @property format {Number}
   * @property imports {Array}
   * @property attributes {Array}
   * @param msg {String} 验证信息
   * @param pass {Boolean} 是否通过验证
   */
  pro._$getEditorParams = function () {
    return this.__editorCom.$getEditorParams();
  };

  /**
   * 编辑器重置
   * @private
   */
  pro._$reset = function () {
    this.__changeEditorByFormat(this.__format);
  };
  /***
   * 取编辑器数据，未做任何处理
   * @returns {*|{}|{value}}
   * @private
   */
  pro._$getEditorResult = function () {
    var _attributes = this.__editorCom.getParams();
    return _attributes;
  };
  // /**
  //  * 弹出创建匿名数据模型弹框
  //  * @param {Object} 数据模型下拉选择框
  //  * @param {Number} 项目id
  //  * @private
  //  */
  // pro.__showDTModel = function (data, index) {
  //     var model = new DTModel(u._$merge({
  //         data: {
  //             format: _.db.MDL_FMT_HASH,
  //             noObject: true,
  //             pid: this.__pid
  //         }
  //     }), data);
  //     model.$on('ok', function (result) {
  //         this.__editorCom.$emit('changeObjectType', index, result);
  //     }.bind(this));
  // };


  return p;
});
