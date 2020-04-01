NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/jst',
  'pro/common/module',
  'util/list/waterfall',
  'text!./activitylist.html',
  'css!./activitylist.css',
  'pro/cache/activity_cache'
], function (_k, _e, _v, _u, _j, _m, _w, _html, _css, _c, _p, _pro) {
  /**
   * 动态列表模块
   * @class   {wd.m._$$ModuleActivityList}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleActivityList = _k._$klass();
  _pro = _p._$$ModuleActivityList._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    _e._$addStyle(_css);
    this.__jstKey = _j._$add(_html);
    this.__emptyHtml = '<div class="m-empty"><i class="u-empty-icon u-icon-no-dynamic-normal"></i>' +
      '<span class="u-empty-tip">无动态数据</span></div>';
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__reset = function (_options) {
    _e._$clearChildren(_options.parent);
    var listNode = _e._$create('div', 'm-activitylist', _options.parent);
    this.__super(_options);
    var data = {};
    if (_options.id) {
      data.id = _options.id;
    }
    this.lkey = _options.id ? _options.key + '-' + _options.id : _options.key;
    var hasPager = _options.hasPager == undefined ? true : _options.hasPager; //是否需要分页器，默认有分页器
    this.__mopt = {
      limit: 10,
      sbody: _options.sbody || _options.parent,
      parent: listNode,
      item: this.__jstKey,
      cache: {
        lkey: this.lkey,
        klass: _c._$$CacheActivity,
        data: data,
        clear: true,
        ext: {
          key: _options.key, //用来判断获取请求url参数
          pid: _options.pid
        }
      },

      onemptylist: function (event) { //列表为空时显示内容
        listNode.innerHTML = this.__emptyHtml;
        event.stopped = true;
      }.bind(this)
    };
    if (hasPager) {
      var pagerNode = _e._$create('div', 'm-page-box', _options.parent);
      _u._$merge(this.__mopt, {
        count: _options.count ? _options.count : 3,
        pager: {
          parent: pagerNode,
          clazz: 'm-act-pager m-pager',
          index: 1,
          label: {
            prev: '<span>上一页</span><i class="zprv-icon u-icon-arrow-left-normal normal">' +
            '</i><i class="zprv-icon u-icon-arrow-left-hover hover"></i>' +
            '<i class="zprv-icon u-icon-arrow-left-unable unable"></i>',
            next: '<span>下一页</span><i class="znxt-icon u-icon-arrow-right-normal normal"></i>' +
            '<i class="znxt-icon u-icon-arrow-right-hover hover"></i>' +
            '<i class="znxt-icon u-icon-arrow-right-unable unable"></i>'
          }
        }
      });
    }
    this.__list = _w._$$ListModuleWF._$allocate(this.__mopt);
  };
  /**
   * 控件回收
   */
  _pro.__destroy = function () {
    this.__list && this.__list._$recycle();
    this.__list = null;
    this.__super();
  };
});
