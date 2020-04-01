NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'util/event/event',
  'pro/common/module',
  'pro/common/util',
  'pro/stripedlist/stripedlist',
  'pro/cache/page_cache',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/user_cache',
  'pro/cache/group_cache',
  'pro/notify/notify',
  'pro/res_bat/res_copy_move/res_copy_move',
  'pro/res_bat/res_group/res_group',
  'pro/common/res_list',
], function (_k, _e, _t, _l, _c, _m, util, stripedList, cache, _pgCache, _proCache, _usrCache, _groupCache, _notify, resCopyMove, resGroup, resList, _p, _pro) {

  _p._$$ModuleProGroupPP = _k._$klass();
  _pro = _p._$$ModuleProGroupPP._$extend(resList._$$ModuleResList);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-p-p')
    );

    var stripedListOption = {
      filter: function (list, listStates) {
        // 处理 action 列
        list.forEach(function (item) {
          var itemState = listStates[item.id];
          itemState['__ui_name'] = util._$renderByJst(
            '<a href="/page/detail/?pid=${projectId}&id=${id}" class="stateful">${name|escape2}</a>',
            item
          );
          itemState['__ui_name_hit_template'] = util._$renderByJst(
            '<a href="/page/detail/?pid=${projectId}&id=${id}" class="stateful">{value}</a>',
            item
          );
          var obj = {
            type: 'del',
            warn: true,
            cache: 'page',
            ids: [item.id],
            key: this._listCacheKey
          };
          var str = '';
          // 查看详情
          str += util._$renderByJst(
            '<a href="/page/detail/?pid=${projectId}&id=${id}" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>',
            item
          );
          // 删除当前项
          str += '<a class="delete-icon" data-action = ' + JSON.stringify(obj) + '  title="删除当前项"><em class="u-icon-delete-normal"></em></a>';
          itemState['__nei-actions'] = str;
        }._$bind(this));
        return list;
      }._$bind(this),
      headers: [
        {
          name: '名称',
          key: 'name',
          keyPinyin: 'namePinyin'
        },
        {
          name: '路径',
          key: 'path'
        },
        {
          name: '描述',
          key: 'description'
        },
        {
          name: '标签',
          key: 'tag',
          keyPinyin: 'tagPinyin',
          valueType: 'tag',
          filter: 'tag'
        },
        {
          name: '分组',
          key: 'group.name',
          keyPinyin: 'group.namePinyin',
          valueType: 'deepKey',
          filter: 'group'
        },
        {
          name: '负责人',
          key: 'respo.realname',
          keyPinyin: 'respo.realnamePinyin',
          valueType: 'deepKey',
          filter: 'respo'
        },
        {
          name: '创建者',
          key: 'creator.realname',
          keyPinyin: 'creator.realnamePinyin',
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
          valueType: '__nei-actions'
        }
      ],
      batchAction: this.__getBatchAction()
    };
    var _options = {
      resType: 'page',
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__pageCache',
      //cache监听的回调事件
      callBackList: ['onclone', 'onmove', 'onsetgroup', 'ontag'],
      //需注册的自定义事件
      eventList: ['res-copy', 'res-move', 'res-group', 'res-tag'],
      cacheOption: {},
      stripedListOption: stripedListOption,
      canShare: true
    };
    this.__super(_options);
    //注册自定义事件
    _c._$$CustomEvent._$allocate({
      element: window,
      event: [
        'res-copy',
        'res-move',
        'res-group'
      ]
    });
  };

  _pro.__getBatchAction = function () {
    var actionData = [{
      name: '复制',
      action: {
        event: 'res-copy'
      }
    }, {
      name: '移动',
      action: {
        event: 'res-move'
      }
    }, {
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
      name: '删除',
      action: {
        type: 'del',
        cache: cache._$cacheKey,
        warn: true
      }
    }];
    var batch = '';
    actionData.forEach(function (item) {
      batch += '<a class="batch-action-item" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>';
    });
    return batch;
  };

  _m._$regist(
    'progroup-p-page',
    _p._$$ModuleProGroupPP
  );
});
