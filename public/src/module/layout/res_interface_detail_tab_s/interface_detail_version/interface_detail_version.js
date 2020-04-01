NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'util/event/event',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/stripedlist/stripedlist',
  'pro/cache/interface_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/cache/group_cache',
  'pro/notify/notify',
  'pro/modal/modal',
  'pro/res_bat/res_group/res_group',
  'pro/common/res_version',
  'text!pro/poplayer/share_layer.html'
], function (_k, _e, _t, _l, _c, _m, util, jstExt, stripedList, cache, _proCache, _pgCache, _usrCache, _groupCache, _notify, _modal, resGroup, resVersion, _html, _p, _pro) {

  _p._$$ModuleInterfaceDetailVersion = _k._$klass();
  _pro = _p._$$ModuleInterfaceDetailVersion._$extend(resVersion._$$ModuleResVersion);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-interface-detail-version')
    );

    var stripedListOption = {
      headers: [
        {
          name: '',
          key: '__isShare',
          valueType: 'share',
          sortable: false
        },
        {
          name: '名称',
          key: 'name',
          keyPinyin: 'namePinyin'
        },
        {
          name: '方法',
          key: 'method',
          noEscape: true
        },
        {
          name: '路径',
          key: 'path'
        },
        {
          name: '标签',
          key: 'tag',
          valueType: 'tag',
          keyPinyin: 'tagPinyin',
          filter: 'tag'
        },
        {
          name: '版本',
          key: 'version.name',
          valueType: 'deepKey'
        },
        {
          name: '分组',
          key: 'group.name',
          keyPinyin: 'group.namePinyin',
          valueType: 'deepKey',
          filter: 'group'
        },
        {
          name: '状态',
          key: 'status.name',
          keyPinyin: 'status.namePinyin',
          valueType: 'deepKey',
          filter: 'status'
        },
        {
          name: '负责人',
          key: 'respo.realname',
          keyPinyin: 'respo.realnamePinyin',
          valueType: 'deepKey'
        },
        {
          name: '创建时间',
          key: 'createTime',
          valueType: 'time',
          defaultSortUp: false
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions',
          sortable: false
        },
      ],
      filter: function (list, xlistState) {
        // 处理 action 列
        list.forEach(function (item) {
          var itemState = xlistState[item.id];
          var linkSuffix = '/?pid=' + item.projectId + '&id=' + item.id;
          var escapeName = jstExt.escape2(item.name);

          itemState['__ui_name'] = '<a href="/interface/detail' + linkSuffix + '" class="stateful">' + escapeName + '</a>';
          itemState['__ui_name_hit_template'] = '<a href="/interface/detail' + linkSuffix + '" class="stateful">{value}</a>';
          var str = '';
          //删除data-action字段
          var obj = {
            type: 'del',
            warn: true,
            cache: 'interface',
            key: this._listCacheKey,
            ids: [item.id]
          };
          // 查看详情
          str += '<a href="/interface/detail' + linkSuffix + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';

          // 引用列表
          str += '<a href="/interface/ref' + linkSuffix + '" title="查看引用列表" class="stateful"><em class="u-icon-link-normal"></em></a>';

          // 删除当前项
          str += '<a class="delete-icon" data-action=' + JSON.stringify(obj) + ' title="删除当前项"><em class="u-icon-delete-normal"></em></a>';
          itemState['__nei-actions'] = str;
        }._$bind(this));
        return list;
      }._$bind(this),
    };
    var _options = {
      resType: 'interface',
      cacheKey: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__inCache',
      //需注册的自定义事件
      cacheOption: {},
      stripedListOption: stripedListOption,
      canShare: true,
    };
    this.__super(_options);
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
    //添加参数是否重复获取striplist的 batchAction参数
    _options.batActionFlag = true;
    this.__super(_options);
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
  };

  /**
   * 获取stripedlist的batchAction参数
   */
  _pro.__getBatchAction = function () {
    var actionData = [{
      name: '设置标签',
      action: {
        event: 'res-tag'
      }
    }, {
      name: '设置分组',
      action: {
        event: 'res-group'
      }
    }, {
      name: '设置状态',
      action: {
        event: 'res-state'
      }
    }, {
      name: '删除',
      action: {
        type: 'del',
        cache: cache._$cacheKey,
        warn: true,
        key: this._listCacheKey
      }
    }];
    var batch = '';
    actionData.forEach(function (item) {
      batch += ('<a class="' + ['batch-action-item', item.class ? item.class : '', item.action.type == 'link' ? 'stateful' : ''].join(' ')
      + '" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>');
    });
    return batch;
  };

  // notify dispatcher
  _m._$regist(
    'interface-detail-version',
    _p._$$ModuleInterfaceDetailVersion
  );
});
