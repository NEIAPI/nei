NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/notify/notify',
  'pro/stripedlist/stripedlist',
  'pro/cache/notification_cache',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _e, _v, _t, _l, _m, Notify, _sl, _ncache, db, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModuleNotificationPersonal}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleNotificationPersonal = _k._$klass();
  _pro = _p._$$ModuleNotificationPersonal._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-notification-personal')
    );
    this.__nCache = _ncache._$$CacheNotification._$allocate();
    //记录当前是否有新的未读
    this.__hasUnread = false;
    this.__listOpt = {
      listCache: 'notification',
      listCacheKey: _ncache._$cacheKeyPersonal,
      queryData: {
        type: 1,
        limit: 20,
        total: true,
        offset: 0
      },
      hasPager: true,
      parent: _e._$getByClassName(this.__body, 'm-notification-list')[0],
      filter: function (list, listStates) {
        // 处理 action 列
        list.forEach(function (item) {
          var itemState = listStates[item.id];
          // 删除
          itemState['__nei-actions'] = '<a title="删除" class="u-icon-delete-normal"' +
            ' data-action=\'{"type":"del","cache":"notification","ids":["' + item.id + '"],"key":"' +
            _ncache._$cacheKeyPersonal + '"}\' ></a>';
          if (item.isRead === db.CMN_BOL_NO) { //显示标记已读图标
            itemState['__nei-actions'] += '<a title="标记已读" class="u-icon-yes-normal"' +
              ' data-action=\'{"type":"read","keyType":"personal","key":"' + _ncache._$cacheKeyPersonal + '",' +
              '"ids":["' + item.id + '"]}\' ></a>';
            item.status = '未读';
          } else {
            item.status = '已读';
            itemState['__class'] = 'read-row';
          }
        });
        this.__list = list;
        return list;
      }.bind(this),
      headers: [{
        name: '标题',
        key: 'title',
        valueType: 'notificationTitle',
        noEscape: true
      },
        {
          name: '时间',
          key: 'createTime',
          valueType: 'time'
        },
        {
          name: '状态',
          key: 'status'
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions'
        }
      ],
      sortable: false,
      // 批量处理的元素
      batchAction: (function () {
        return '<a class="batch-action-item" data-action=\'{"type": "del", "cache": "notification"}\'>删除</a>' +
          '<a class="batch-action-item" data-action=\'{"type": "read","keyType":"personal"}\'>标记已读</a>' +
          '<a class="batch-action-item" data-action=\'{"type": "read","keyType":"personal","isAll":true}\'>全部标记已读</a>';
      })(),
      noItemTip: '暂无数据',
      showHeader: true // 是否要显示表头, 默认为 true
    };
    this.updateList = function () {
      Notify.destroy();
      this.__hasUnread = false;
      this.__stripedList._$refresh();
    }.bind(this);
    this.show = false;
    _v._$addEvent(_ncache._$$CacheNotification, 'onunreadload', function (_r) {
      //监听到系统未读消息有新增，显示提示
      if (_r.ext && _r.ext.personalUpdated && !this.__hasUnread) {
        this.__hasUnread = true;
        if (this.show) {
          Notify.tip('有新增的未读消息，请及时查看', 0);
        }
      }
    }.bind(this));
  };
  /**
   * 显示模块
   * @param {Object} 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.show = true;
    this.__stripedList = _sl._$$ModuleStripedList._$allocate(this.__listOpt);
    this.__doInitDomEvent([
      [_ncache._$$CacheNotification, 'onunreadupdate',
        function (_r) {
          //监听标记已读事件
          if (_r.action != 'personal') return;
          _r.data.forEach(function (item) {
            var oldValue = this.__list.find(function (itm) {
              return itm.id == item.id;
            });
            if (oldValue) {
              this.__stripedList._$setItemState(oldValue, {
                '__nei-actions': '<a title="删除" class="u-icon-delete-normal"' +
                ' data-action=\'{"type":"del","cache":"notification","ids":["' +
                oldValue.id + '"],"key":"' + _ncache._$cacheKeyPersonal + '"}\'></a>',
                '__class': 'read-row'
              });
              oldValue.status = '已读';
            }
          }.bind(this));
          this.__stripedList._$update();
        }.bind(this)
      ]
    ]);
    Notify.notify.$on('click', this.updateList);
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    if (this.__hasUnread && this.__stripedList) {
      this.__hasUnread = false;
      this.__stripedList._$refresh();
    }
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__stripedList && this.__stripedList._$recycle();
    this.__stripedList = null;
    Notify.notify.$off('click', this.updateList);
    Notify.destroy();
    this.__doClearDomEvent();
    this.show = false;
    this.__super();
  };
  // notify dispatcher
  _m._$regist(
    'notification-personal',
    _p._$$ModuleNotificationPersonal
  );
});
