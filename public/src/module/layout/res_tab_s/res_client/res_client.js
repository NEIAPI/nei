NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/stripedlist/stripedlist',
  'pro/cache/client_cache',
  'pro/common/res_list'
], function (_k, _e, _t, _l, _m, util, stripedList, cache, resList, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleResClient}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResClient = _k._$klass();
  _pro = _p._$$ModuleResClient._$extend(resList._$$ModuleResList);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-client')
    );
    var stripedListOption = {
      filter: function (list, listStates) {
        list.forEach(function (item) {
          var itemState = listStates[item.id];
          itemState['__ui_name'] = util._$renderByJst(
            '<a href="/client/detail/?pid=${projectId}&id=${id}" class="stateful">${name|escape2}</a>',
            item
          );
          itemState['__ui_name_hit_template'] = util._$renderByJst(
            '<a href="/client/detail/?pid=${projectId}&id=${id}" class="stateful">{value}</a>',
            item
          );
          var str = '';
          //删除data-action配置
          var obj = {
            type: 'del',
            cache: 'client',
            ids: [item.id],
            key: this._listCacheKey,
            warn: true
          };
          // 查看详情
          str += util._$renderByJst(
            '<a href="/client/detail?pid=${projectId}&id=${id}" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>',
            item
          );
          // 引用列表
          str += util._$renderByJst(
            '<a href="/client/ref?pid=${projectId}&id=${id}" title="查看引用列表" class="stateful"><em class="u-icon-link-normal"></em></a>',
            item
          );
          // 删除当前项
          str += '<a  class="delete-icon" data-action=' + JSON.stringify(obj) + ' title="删除当前项"><em class="u-icon-delete-normal"></em></a>';
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
          name: '描述',
          key: 'description'
        },
        {
          name: '分组',
          key: 'group.name',
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
          valueType: '__nei-actions',
          sortable: false
        }
      ],
      listGroups: [
        {
          group: '负责人',
          key: 'respo'
        },
        {
          group: '创建者',
          key: 'creator'
        }
      ]
    };
    var _options = {
      resType: 'client',
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__clientCache',
      //cache监听的回调事件
      callBackList: ['onsetgroup', 'onclone'],
      //需注册的自定义事件
      eventList: ['res-copy', 'res-move', 'res-group', 'res-state'],
      cacheOption: {},
      stripedListOption: stripedListOption,
    };
    this.__super(_options);
  };

  /**
   * 获取stripedlist的batchAction参数
   */
  _pro.__getBatchAction = function () {
    var actionData = [{
      name: '复制',
      action: {
        event: 'res-copy'
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

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    _options.batActionFlag = true;
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
  };

  // notify dispatcher
  _m._$regist(
    'res-client',
    _p._$$ModuleResClient
  );
});
