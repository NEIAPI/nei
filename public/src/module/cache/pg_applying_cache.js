/*
 * 项目组申请权限缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _u, _v, _c, _d, dbConst, _p, pro) {
  _p._$$CachePGApplying = _k._$klass();
  _p._$cacheKey = 'pg-applying';
  _p._$cacheKeyVerifying = 'pg-applying-verifying';
  pro = _p._$$CachePGApplying._$extend(_d._$$Cache);

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };

  /**
   * 申请加入某个项目组
   * @param {Object} options - 参数对象
   * @property {String} options.data.pgId - 要申请的项目组标识
   * @property {String} [options.data.message=''] - 申请消息
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    if (!options.data.pgId) {
      // console.error('请输入有效的项目组标识');
      return;
    }
    this.__super(options);
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  pro.__getUrl = function (options) {
    var url;
    if (options.key === _p._$cacheKeyVerifying) {
      url = '/api/applying/?verifying';
    } else if (options.key.indexOf(_p._$cacheKey) > -1) {
      url = '/api/applying/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

  /**
   * 申请加入项目组的审批验证
   * @param {Object} options - 参数对象
   * @property {Boolean} options.v - true 时为通过, false 时为拒绝
   * @property {Boolean} options.id - 申请记录标识
   * @property {String} [options.role=""] - 通过的角色, options.v 为 true 有效
   * @property {String} [options.message=""] - 拒绝的消息, options.v 为 false 有效
   * @success dispatch event: onverify
   */
  pro._$verify = function (options) {
    var existItem = this._$getItemInCache(options.id);
    if (!existItem) return;
    var data = {
      v: options.v
    };
    if (data.v) {
      data.role = options.role;
    } else {
      data.message = options.message;
    }
    this.__doAction({
      key: options.key,
      data: data,
      method: 'PUT',
      action: 'verify',
      updateItem: true,
      triggerListchange: true,
      onload: 'onverify',
      id: options.id,
      ext: options.ext
    });
  };

  /**
   * 判断某个项目组是否正在申请中
   * @param  {String} pgId -  项目组id
   * @return {Object} 权限
   */
  pro._$isApplying = function (pgId) {
    var list = this._$getListInCache(this.__cacheKey);
    var found = list.find(function (item) {
      return item.applyingProGroup.id === pgId && item.verifyResult === dbConst.PRG_ROP_NONE;
    });
    return !!found;
  };

});
