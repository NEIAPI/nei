NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/template/tpl',
  'pro/common/module',
  'util/template/jst',
  'ui/datepick/datepick',
  'pro/cache/user_cache',
  'pro/poplayer/profile_bind_layer',
  'pro/select2/select2',
  'json!{3rd}/fb-modules/config/db.json',
  'pro/uploadfile/upload_file',
  'pro/common/util',
  'pro/modal/modal'
], function (_k, _e, _v, _l, _m, _j, datePick, userCache, PBindLayer, Select2, _db, _upload, _cu, _modal, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleSettingSetting}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleSettingProfile = _k._$klass();
  _pro = _p._$$ModuleSettingProfile._$extend(_m._$$Module);

  _l._$parseTemplate('setting-base');

  //基本资料测试数据
  var _data = {
    label: {
      portrait: '头像',
      username: '帐号',
      realname: '姓名',
      company: '企业',
      role: '角色',
      phone: '手机',
      email: '邮箱',
      jobTime: '工作时间',
      blog: '个人博客',
      github: 'github',
      weixin: '微信',
      yixin: '易信',
      paopao: '泡泡',
      qq: 'QQ',
    },
    action: {
      realname: {
        required: true
      },
      company: {
        required: true
      },
      role: {
        required: true
      },
      phone: {
        required: true
      },
      email: {
        required: true
      },
      jobTime: {
        required: true
      },
      blog: {},
      github: {},
      weixin: {},
      yixin: {},
      paopao: {},
      qq: {},
      portrait: ''
    }
  };

  Object.keys(_data.action).forEach(function (key) {
    var action = _data.action[key];
    action.type = 'modify';
    action.name = key;
    action.cache = 'user';
  });

  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-setting-profile')
    );
    this.__roleConf = [
      {id: _db.USR_ROL_NONE, name: '未设置'},
      {id: _db.USR_ROL_OTHER, name: '其他角色'},
      {id: _db.USR_ROL_PM, name: '项目经理'},
      {id: _db.USR_ROL_FRONT, name: '前端工程师'},
      {id: _db.USR_ROL_BACK, name: '后端工程师'},
      {id: _db.USR_ROL_IOS, name: 'iOS工程师'},
      {id: _db.USR_ROL_AOS, name: 'Android工程师'},
      {id: _db.USR_ROL_TEST, name: '测试工程师'},
      {id: _db.USR_ROL_OM, name: '运维工程师'}
    ];
  };

  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__doInitDomEvent([
      [
        userCache._$$CacheUser, 'update',
        this.__doUpdate._$bind(this)
      ], [
        this.__body, 'click',
        function (evt) {
          var node = _v._$getElement(evt, 'd:click');
          if (!node) {
            return;
          }
          var obj = JSON.parse(_e._$dataset(node, 'click'));
          switch (obj.type) {
            case 'bind':
            case 'unbind':
              this.__doBind(evt, obj);
              break;
            case 'datepick':
              this.__datePick = datePick._$$DatePick._$allocate({
                parent: _e._$getByClassName(this.__body, 'u-ps-time')[0],
                date: node.value,
                onchange: function (date) {
                  this.__update('jobTime', date.getTime());
                }.bind(this)
              });
              break;
            case 'portrait':
              var target = _v._$getElement(evt, 'c:clear');
              if (!!target) {
                this.__clearLayer = _modal.confirm({
                  'content': '您确定要清除头像吗？',
                  'title': '清除头像',
                  'closeButton': true,
                  'okButton': '清除',
                }).$on('ok', function () {
                  this.__clearLayer = this.__clearLayer.destroy();
                  this.__clearLayer = null;
                  this.__update('portrait', '');
                }.bind(this));
              }
              break;
            default:
              break;
          }
          _v._$stopBubble(evt);
        }.bind(this)
      ], [
        document, 'click', function () {
          this.__datePick && this.__datePick._$recycle();
          this.__datePick = null;
        }.bind(this)
      ]]);
    this.userCache = userCache._$$CacheUser._$allocate({
      onverify: function () {
        this.__layer.$emit('close');
        this.__doUpdate();
      }.bind(this),
      onerror: function (_r) {
        if (_r.options.action == 'verify' || (_r.options.action == 'bind')) {
          _r.options.ext.onerror(_r.data.result && _r.data.result.type);
        }
      }
    });
    this.__doUpdate();
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @param {Object} 配置参数
   * @return {Void}
   */
  _pro.__onHide = function (_options) {
    this.__clear();
    this.__doClearDomEvent();
    this.userCache && this.userCache._$recycle();
    this.userCache = null;
    this.__layer && this.__layer.destroy();
    this.__layer = null;
    this.__upload && this.__upload.destroy();
    this.__upload = null;
    this.__super(_options);
  };
  /**
   * 更新视图数据
   * @return {Void}
   */
  _pro.__doUpdate = function () {
    this.__clear();
    _data.data = this.userCache.__getDataInCache(userCache._$cacheKey);
    _data.pbind = _data.data.phoneState;
    _data.ebind = _data.data.emailState;
    _data.isFromSite = _data.data.from == _db.USR_FRM_SITE;
    //暂时所有用户开放邮箱解绑
    _data.isFromSite = true;

    //如果没有头像，设置默认头像
    if (!_data.data.portrait) {
      _cu._$resetLogo([_data.data], 'realname', 'realnamePinyin');
    }

    _j._$render(this.__body, 'setting-base', _data);
    this.__roleSelect = new Select2({
      data: {
        preview: true,
        sortList: false,
        initSilent: true,
        source: this.__roleConf,
        selected: this.__getRole(_data.data.role)
      }
    }).$inject(_e._$getByClassName(this.__body, 'u-ps-role')[0])
      .$on('change', function (event) {
        this.__update('role', event.selected.id);
      }.bind(this));

    //上传头像
    var _avater = _e._$getByClassName(this.__body, 'u-ps-portrait')[0];
    this.__upload = new _upload({}).$inject(_avater);
    this.__upload.$on('change', function (event) {
      this.__update('portrait', event.file);
    }.bind(this));
  };
  /**
   * 回收select组件和datepick组件
   * @return {Void}
   */
  _pro.__clear = function () {
    this.__roleSelect && this.__roleSelect.destroy();
    this.__roleSelect = null;
    this.__datePick && this.__datePick._$recycle();
    this.__datePick = null;
  };
  /**
   * 获取用户角色
   * @param {Number} 角色标识
   * @return {Object} 角色信息
   */
  _pro.__getRole = function (id) {
    var role = this.__roleConf.find(function (item) {
      return item.id === id;
    });
    return role;
  };
  /**
   * 修改角色和时间
   * @param {String} 修改字段名
   * @pram {String} 修改的值
   * @return {Void}
   */
  _pro.__update = function (key, value) {
    var data = {};
    data[key] = value;
    this.userCache._$updateItem({
      data: data
    });
  };
  /**
   * 绑定和解绑操作 (目前只处理邮箱相关)
   * @param {Event} 事件对象
   * @param {Object} 操作配置信息
   */
  _pro.__doBind = function (evt, obj) {
    var value = _e._$getByClassName(_v._$getElement(evt, 'c:m-ps-con'), 'u-bind')[0].value;
    if (this.__layer) {
      this.__layer = null;
    }
    this.__layer = new PBindLayer({
      data: {
        cache: this.userCache,
        type: obj.type,
        key: obj.key,
        value: value
      }
    }).$inject(document.body);
  };

  // notify dispatcher
  _m._$regist(
    'setting-profile',
    _p._$$ModuleSettingProfile
  );
});
