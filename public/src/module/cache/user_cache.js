NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js'
], function (_k, _u, _v, _c, _d, _p, _pro) {
  _p._$$CacheUser = _k._$klass();
  _pro = _p._$$CacheUser._$extend(_d._$$Cache);
  _p._$cacheKey = 'user';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
    // user cache 可能被多个模块实例化, 所以这里需要判断一下
    if (window.pageConfig.user) {
      var user = window.pageConfig.user;
      var propertyToEscape = ['company', 'realname', 'username', 'blog', 'github', 'weixin', 'yixin', 'paopao', 'qq'];
      propertyToEscape.forEach(function (item) {
        user[item] = user[item].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      });
      this.__setDataInCache(_p._$cacheKey, user);
      // 防止后续直接操作该数据,直接冻结该对象
      // Object.freeze(window.pageConfig.user);
      delete window.pageConfig.user;
    }
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * 支持更新用户基本资料的字段有:
   * @property {String} [options.name] - 姓名
   * @property {String} [options.company] - 企业
   * @property {String} [options.role] - 角色
   * @property {String} [options.phone] - 手机
   * @property {Array} [options.email] - 邮箱
   * @property {Array} [options.workTime] - 工作时间
   * @property {Array} [options.blog] - 个人博客
   * @property {Array} [options.github] - github
   * @property {Array} [options.weixin] - 微信
   * @property {Array} [options.yixin] - 易信
   * @property {Array} [options.popo] - 泡泡
   * @property {Array} [options.qq] - QQ
   * @success dispatch event: onitemupdate
   */
  _pro.__doUpdateItem = function (options) {
    options.onload = function (data) {
      this.__setDataInCache(_p._$cacheKey, data);
      var event = {
        key: options.id,
        data: data,
        action: 'update'
      };
      _v._$dispatchEvent(
        this.constructor, 'update', {
          data: data,
          action: event.action
        }
      );
    }.bind(this);
    this.__super(options);
  };

  /**
   * 获取用户信息
   * @return {Object} 用户对象
   */
  _pro._$getUserInCache = function () {
    return this.__getDataInCache(_p._$cacheKey);
  };

  /**
   * 绑定邮箱或者手机(V3只支持邮箱绑定)
   * @param {Object} options - 参数对象
   * 支持绑定的类型有:
   * @property {String} [options.email] - 需要绑定的邮箱
   * @success dispatch event: onbind
   */
  _pro._$bind = function (options) {
    this.__doAction({
      actionMsg: false,
      data: {
        email: options.email
      },
      method: 'PUT',
      ext: options.ext,
      action: 'bind',
      onload: 'onbind'
    });
  };

  /**
   * 解绑邮箱或者手机(V3只支持邮箱解绑)
   * @param {Object} options - 参数对象
   * 支持解绑的类型有:
   * @property {Boolean} [options.isEmail] - 是否是解绑邮箱
   * @success dispatch event: onunbind
   */
  _pro._$unbind = function (options) {
    this.__doAction({
      actionMsg: false,
      data: {
        isEmail: options.isEmail
      },
      method: 'PUT',
      action: 'unbind',
      onload: 'onunbind'
    });
  };

  /**
   * 校验验证码正确性
   * @param {Object} options - 参数对象
   * 支持解绑的类型有:
   * @property {String} [options.code] - 验证码
   * @success dispatch event: onunbind
   */
  _pro._$verify = function (options) {
    this.__doAction({
      data: {
        code: options.code
      },
      method: 'PUT',
      action: 'verify',
      ext: options.ext,
      onload: function (result) {
        this.__setDataInCache(_p._$cacheKey, result.data);
        this._$dispatchEvent('onverify', result);
      }.bind(this)
    });
  };
  /**
   * 修改密码
   * @param {Object} options - 参数对象
   * @property {String} [options.opwd] - 原密码
   * @property {String} [options.npwd] - 新密码
   * @success dispatch event: onupdatepwd
   */
  _pro._$updatePwd = function (options) {
    this.__doAction({
      data: {
        opwd: options.opwd,
        npwd: options.npwd
      },
      method: 'PUT',
      action: 'cpwd',
      onload: 'onupdatepwd'
    });
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url;
    switch (options.key) {
      case _p._$cacheKey:
        url = '/api/users/';
        if (options.action) {
          url += '?' + options.action;
        }
        break;

      default:
        break;
    }
    return url;
  };

});
