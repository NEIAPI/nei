NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'pro/cache/testcase_cache',
  'util/animation/linear',
  'pro/common/module',
  'pro/layout/res_tab_s/res_interface_testprogress/res_interface_testprogress',
  'pro/cache/notification_cache',
  'pro/cache/user_cache',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _e, _v, _u, _t, _l, cache, linear, _m, ModalProcess, ncache, _usrCache, _db, _p, _pro) {

  _p._$$ModuleSystemTab = _k._$klass();
  _pro = _p._$$ModuleSystemTab._$extend(_m._$$Module);
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-system-tab')
    );
    this.__tab = _e._$getChildren(_e._$getByClassName(
      this.__body, 'tab-top')[0]);
    this.__tab.push(_e._$getByClassName(this.__body, 'setting')[0]);
    this.__tbview = _t._$$TabView._$allocate({
      list: this.__tab,
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
    var roleConfig = [{
      id: _db.USR_ROL_IOS,
      listHref: '/spec/list?s=ios&l=all'
    },
      {
        id: _db.USR_ROL_AOS,
        listHref: '/spec/list?s=aos&l=all'
      },
      {
        id: _db.USR_ROL_TEST,
        listHref: '/spec/list?s=test&l=all'
      }
    ];
    this.__process = _e._$getByClassName(this.__body, 'process-con')[0];
    this.__processPct = _e._$getByClassName(this.__process, 'process-percent')[0];
    this.__crlL = _e._$getByClassName(this.__process, 'crl-l')[0];
    this.__crlR = _e._$getByClassName(this.__process, 'crl-r')[0];
    this.__etestNode = _e._$getByClassName(this.__body, 'j-process')[0];
    this.__unread = _e._$getByClassName(this.__body, 'u-unread')[0];
    this.__notification = _e._$getByClassName(this.__body, 'j-notification')[0];
    this.__spec = _e._$getByClassName(this.__body, 'j-spec')[0];
    var popoNode = _e._$getByClassName(this.__body, 'popo')[0];
    this.__nCache = ncache._$$CacheNotification._$allocate({});
    var updateUnreadHandler = this.__updateUnread.bind(this);
    //更新未读数量
    _v._$addEvent(ncache._$$CacheNotification, 'onunreadload', updateUnreadHandler);
    _v._$addEvent(ncache._$$CacheNotification, 'onunreadupdate', updateUnreadHandler);
    //删除消息时重新获取未读
    _v._$addEvent(ncache._$$CacheNotification, 'itemsdeleted', this.__getUnread.bind(this));
    _v._$addEvent(ncache._$$CacheNotification, 'delete', this.__getUnread.bind(this));
    //记录规范列表选中状态
    _v._$addEvent(document, 'onspeclistchange', this.__changeSpecList.bind(this));
    this.__getUnread();
    if (this.__interval) {
      window.clearInterval(this.__interval);
      this.__interval = null;
    }
    this.__interval = window.setInterval(this.__getUnread.bind(this), 60 * 1000); //轮询
    //根据用户角色设置规范列表的href
    var user = _usrCache._$$CacheUser._$allocate()._$getUserInCache();
    var role = roleConfig.find(function (item) {
      return item.id == user.id;
    });
    if (role) {
      this.__changeSpecList(role);
    }
    if (user.from === _db.USR_FRM_OPENID) {
      _e._$delClassName(popoNode, 'f-dn');
    } else {
      _e._$addClassName(popoNode, 'f-dn');
    }
    this.__finishNum = 0;
    this.__totalNum = 0;
    //测试队列
    this.__queue = [];
    var that = this;
    _v._$addEvent(this.__etestNode, 'click', function (event) {
      _v._$stop(event);
      this.__showTestProgress();
    }._$bind(this));
    // 监听事件之前要先实例化
    this.__tcCache = cache._$$CacheTestCase._$allocate();
    //全局监听事件
    _v._$addEvent(cache._$$CacheTestCase, 'itemsadded', function (option) {
      _e._$setStyle(this.__etestNode, 'visibility', 'visible');
      that.__queue = that.__queue.concat(option.data);
      // that.__queue.forEach(function (item) {
      // if (item.state == 1 || item.state == 2) {
      //     that.__finishNum++;
      // }
      if (that.__queue.length > 0) {
        that.__totalNum = that.__queue.length;
        that.__updateProcess(that.__finishNum / that.__totalNum);
      }
      // });
    }._$bind(this));
    _v._$addEvent(cache._$$CacheTestCase, 'update', function (option) {
      _e._$setStyle(this.__etestNode, 'visibility', 'visible');
      // that.__queue.forEach(function (item) {
      if (option.data.state == 1 || option.data.state == 2) {
        that.__finishNum++;
      }
      that.__queue = this.__tcCache._$getTestQueue();
      if (that.__queue.length > 0) {
        that.__totalNum = that.__queue.length;
        that.__updateProcess(that.__finishNum / that.__totalNum);
      }
      // });
    }._$bind(this));

    dispatcher._$addEvent('ontitlechange', function (evt) {
      setTimeout(function () {
        updateUnreadHandler();
      }, 0);
    });
  };

  _pro.__onMessage = function (evt) {
    var evtData = evt.data;
    if (evtData.type === 'show-test-progress') {
      this.__showTestProgress();
    }
  };

  _pro.__showTestProgress = function () {
    new ModalProcess();
  };

  _pro.__onRefresh = function (_options) {
    this.__pid = _options.param.pid;
    this.__super(_options);
    this.__tbview._$match(
      this.__getPathFromUMI(_options)
    );


    // testcode
    // var i = 0;
    // setInterval(function(){
    //     if (i>10) {
    //         i=0;
    //     }
    //     this.__updateProcess(i/10);
    //     i++;
    // }._$bind(this), 100);

  };
  /**
   * 获取未读数量
   * @return {Void}
   */
  _pro.__getUnread = function () {
    this.__nCache._$getUnread({
      isPolling: true,
      ext: {}
    });
  };
  /**
   * 更新消息未读显示
   * @return {Void}
   */
  _pro.__updateUnread = function () {
    var data = this.__nCache.__getDataInCache(ncache._$cacheKeyUnread);
    if (data.system == 0 && data.personal > 0) {
      _e._$attr(this.__notification, 'href', '/notification/personal/');
    } else {
      _e._$attr(this.__notification, 'href', '/notification/system/');
    }
    var number = data.system + data.personal + data.api + data.audit;
    var rawTitle = document.title.replace(/^\(\d+[^)]+\)\s+/, '');
    if (number > 0) {
      document.title = '(' + number + '条消息) ' + rawTitle;
      this.__unread.textContent = number > 99 ? '···' : number;
      _e._$addClassName(this.__unread, 'unread');
    } else {
      document.title = rawTitle;
      this.__unread.textContent = '';
      _e._$delClassName(this.__unread, 'unread');
    }
  };
  /**
   * 更新规范列表选中状态
   * @param {Object} href
   * @return {Void}
   */
  _pro.__changeSpecList = function (_options) {
    _e._$attr(this.__spec, 'href', _options.listHref);
  };
  /**
   * 动态显示测试进度
   * @param  {number} newPct 当前测试进度[0,1]
   * @return {Void}
   */
  _pro.__updateProcess = function (pct) {
    if (pct < 0 || pct > 1) {
      return;
    }
    if (pct == 0) {
      _e._$replaceClassName(this.__process, 'begin', 'stop');
      this.__crlR.style.transform = 'rotate(0deg)';
      this.__crlL.style.transform = 'rotate(0deg)';
    } else {
      _e._$replaceClassName(this.__process, 'stop', 'begin');
      if (pct < 0.5) {
        this.__crlR.style.transform = 'rotate(' + pct * 360 + 'deg)';
        this.__processPct.innerHTML = Math.ceil(pct * 100) + '%';
      } else {
        this.__crlR.style.transform = 'rotate(180deg)';
        this.__crlL.style.transform = 'rotate(' + (pct - 0.5) * 360 + 'deg)';
        this.__processPct.innerHTML = Math.ceil(pct * 100) + '%';
      }
    }
  };

  /**
   * 验证选中项
   * @param  {Object} 事件信息
   * @return {Void}
   */
  _pro.__doCheckMatchEQ = function (_event) {
    if (_event.target == '/' || _event.target.startsWith('/globalsearch/')) {
      _event.target = '/dashboard/';
    }
    if (_event.source == '/progroup/home/management/') {
      _event.source = '/progroup/';
    }
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };

  _m._$regist(
    'system-tab',
    _p._$$ModuleSystemTab
  );

});
