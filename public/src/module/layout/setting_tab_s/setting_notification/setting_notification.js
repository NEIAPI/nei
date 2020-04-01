NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/regular/regular_base',
  'pro/poplayer/profile_bind_layer',
  'pro/cache/notifysetting_cache',
  'pro/cache/user_cache',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _e, _v, _u, _l, _m, Base, PBindLayer, nsCache, usrCache, _db, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModuleSettingNotification}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleSettingNotification = _k._$klass();
  _pro = _p._$$ModuleSettingNotification._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-setting-notification')
    );
    this.__template = _l._$getTextTemplate('setting-notification-body');
    this.usrCache = usrCache._$$CacheUser._$allocate({
      onverify: function () {
        this.__setting.$emit('verify');
      }.bind(this)
    });
    var Setting = this.__createSetting();
    this.nsCache = nsCache._$$CacheNotifySetting._$allocate({
      onitemload: function () {
        var data = this.nsCache._$getNotifySettingsInCache();
        var user = this.usrCache._$getUserInCache();
        this.__setting = new Setting({
          data: _u._$merge(data, {
            emailState: user.emailState
          })
        }).$inject(this.__body)
          .$on('updateSetting', function (key, value) {
            var data = {};
            data[key] = value;
            this.nsCache._$updateItem({
              data: data
            });
          }.bind(this));
      }.bind(this),
      onitemupdate: function () {
        var data = this.nsCache._$getNotifySettingsInCache();
        this.__setting.data = _u._$merge(this.__setting.data, data);
        this.__setting.$update();
      }.bind(this)
    });
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__setting && this.__setting.destroy();
    this.__setting = null;
    this.nsCache._$getItem();
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__setting && this.__setting.destroy();
    this.__setting = null;
    this.__super();
  };
  /**
   * 创建通知设置
   * @returns {*}
   * @private
   */
  _pro.__createSetting = function () {
    var cache = this.usrCache;
    var user = cache._$getUserInCache();
    var Setting = Base.extend({
      template: this.__template,
      config: function () {
        _u._$merge({
          flag: _db.CMN_BOL_NO,
          methodEmail: _db.CMN_BOL_NO
        }, this.data);
        this.$on('verify', function () {
          this.layer.$emit('close');
          this.data.emailState = _db._db.CMN_BOL_YES;
        });
      },
      change: function (key) {
        if (key === 'flag' || this.data.flag === _db.CMN_BOL_YES) { //通知方式只有在flag=1的情况下修改
          if (key === 'methodEmail' && this.data.emailState === _db.CMN_BOL_NO) { //邮箱未绑定
            this.layer = new PBindLayer({
              data: {
                cache: cache,
                type: 'bind',
                key: 'email',
                value: user.email
              }
            }).$inject(document.body);
          } else {
            this.data[key] = this.data[key] == _db.CMN_BOL_YES ? _db.CMN_BOL_NO : _db.CMN_BOL_YES;
            this.$emit('updateSetting', key, this.data[key]);
          }
        }
      }
    });
    return Setting;
  };
  // notify dispatcher
  _m._$regist(
    'setting-notification',
    _p._$$ModuleSettingNotification
  );
});
