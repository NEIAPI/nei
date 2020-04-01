/*
 * 参数编辑器--预览状态----------------------------------------------
 */
NEJ.define([
  'base/klass',
  'base/event',
  'base/element',
  'base/util',
  'util/event/event',
  'util/template/tpl',
  'ui/base',
  'pro/common/util',
  'pro/cache/interface_cache',
  'pro/notify/notify',
  'pro/params_preview/params_haxi',
  'pro/params_preview/params_enum',
  'pro/params_preview/params_array',
  'pro/params_preview/params_base',
  'pro/params_preview/params_map',
  'pro/params_preview/params_header',
  'pro/params_preview/params_cli',
  'pro/params_preview/params_jar',
  'pro/cache/config_caches',
  'text!./params_preview.html',
  'text!./params_preview.css'
], function (k, v, e, u, c, tpl, ui, _, cache, Notify, Haxi, Enum, Array2, Base2, Map2, Header2, Cli2, Jar2, cofcache, html, css, p, pro) {

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
  pro.__init = function (options) {
    this.__super(options);
  };

  pro.__reset = function (options) {
    this.__super(options);
    /**
     * params 参数对象
     * format 参数对象所属类型
     * shape 编辑器的形状,目前哈希和映射的时候有用到 ，哈希里header 标示是请求头，映射里standard标示的是规范,project是项目，projectgroup是项目组
     * level 编辑器的编辑权限 0代表是没有编辑权限
     * action [""| "mofify"]参数编辑器行为 modify为修改 默认是预览
     * parentId 参数归属资源标识
     * parentType 参数归属资源类型 0页面请求参数 1模板预填参数 2接口输入参数 3接口输出参数 4数据模型属性
     * resourceId 资源id
     * level level=0 说明只有查看权限
     * paramType 参数类型 接口详情的编辑器类型"reqHeaders","inputs"等
     * specType 变量映射type
     * listKey 列表的key 用于标识列表片段
     * isHideFullButton 是否显示全屏按钮
     * isRequire 是否要显示是否必须列
     * uuid 控件唯一标示
     */
    this.__lopt = {
      parentId: options.parentId,
      parentType: options.parentType,
      params: options.params || [],
      format: options.format || 0,
      pid: options.pid,
      shape: options.shape || '',
      level: options.level,
      resourceId: options.resourceId,
      paramType: options.paramType,
      specType: options.specType,
      action: '',
      listKey: options.listKey,
      isHideFullButton: false || options.isHideFullButton,
      isRequire: options.isRequire || 0,
      uuid: 'uuid' + new Date().getTime()
    };
    this.__initComponent(this.__lopt);
    this.__infcache = cofcache.interface._$allocate({
      onitemload: function () {
        var item = this.__infcache._$getItemInCache(this.__lopt.resourceId);
        var params = item.params[this.__lopt.paramType];
        this.__initComponent({
          format: this.__lopt.format,
          action: '',
          params: params
        });
      }.bind(this)
    });

    this.__doInitDomEvent([
      [this.__infcache.constructor, 'update', this.__changeEditorByFormat.bind(this)]
    ]);

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
    this.__editorBox = e._$getByClassName(this.__body, 'j-editor')[0];
  };

  /**
   *
   * @param options
   * @property format 0 哈希 1枚举 2 数组 3字符 4 数值 5 布尔 6 文件 7映射
   * @param _params 初始化的数据
   * @private
   */
  pro.__initComponent = function (options) {
    //Base2 集成了3字符 4 数值 5 布尔 6 文件
    var _klassArr = [Haxi, Enum, Array2, Base2, Base2, Base2, Base2, Map2, Cli2, Jar2];
    var Klass = _klassArr[options.format];

    //如果是请求头类型
    if (this.__lopt.format == 0 && this.__lopt.shape == 'header') {
      Klass = Header2;
    }
    if (this.__editorCom) {
      this.__editorCom.destroy();
    }
    var _data = u._$merge({}, this.__lopt, {
      params: options.params,
      format: options.format,
      action: options.action
    });

    this.__editorCom = new Klass({
      data: _data
    }).$inject(this.__editorBox);
  };
  /**
   * 监听编辑器的事件句柄
   * @param option {object}
   * @property format 0 哈希 1枚举 2 数组 3字符 4 数值 5 布尔 6 文件
   * @property action "modify"为修改类型
   */
  //修改编辑器的类型
  pro.__changeEditorByFormat = function (options) {
    if (!options.ext) return;
    if (this.__lopt.uuid !== options.ext.uuid) return;
    if (options.ext && options.ext.action == 'menuchange') {
      var _params = (function () {
        if (options.ext.resType == 2) { //请求参数
          return options.data.params.inputs;
        } else if (options.ext.resType == 3) { //返回数据
          return options.data.params.outputs;
        } else { //正常参数数据
          return options.data.params;
        }
      })();
      this.__lopt.format = options.ext.format;
      this.__initComponent({
        format: options.ext.format,
        action: 'modify',
        params: _params
      });
    }
  };


  pro.__destroy = function () {
    this.__super();
    if (this.__editorCom) this.__editorCom.destroy();
    delete this.__editorCom;
  };
  return p;
});
