NEJ.define([
  'base/klass',
  'base/element',
  'util/event/event',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/stripedlist/stripedlist',
  'pro/cache/constraint_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/group_cache',
  'pro/cache/user_cache',
  'pro/notify/notify',
  'pro/modal/modal',
  'pro/res_bat/res_group/res_group',
  'text!pro/poplayer/share_layer.html',
  'pro/common/res_list'
], function (_k, _e, _c, _t, _l, _m, util, stripedList, cache, _proCache, _pgCache, _groupCache, _usrCache, _notify, _modal, resGroup, _html, resList, _p, _pro) {

  _p._$$ModuleResConstraint = _k._$klass();
  _pro = _p._$$ModuleResConstraint._$extend(resList._$$ModuleResList);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-constraint')
    );
    var stripedListOption = {
      filter: function (xlist, xlistState) {
        // 处理 action 列
        xlist.forEach(function (item) {
          var itemState = xlistState[item.id];
          // 公共资源库中的资源，并且当前项目不是公共资源库，检查是否设置了隐藏
          if (!this.__progroup.showPublicList && item.__isShare && this.__project.type !== util.db.PRO_TYP_COMMON) {
            itemState.__invisible = true;
            return;
          }
          //如果是系统内置类型
          if (item.type === 1) {
            itemState.__disabled = true;
            itemState['__ui_name'] = item.name;
            var str = util._$renderByJst(
              '<a href="https://github.com/x-orpheus/nei-toolkit/blob/master/doc/NEI%E5%B9%B3%E5%8F%B0%E7%B3%BB%E7%BB%9F%E9%A2%84%E7%BD%AE%E7%9A%84%E8%A7%84%E5%88%99%E5%87%BD%E6%95%B0%E9%9B%86.md"  target="blank" title="查看详情" ><em class="u-icon-detail-normal"></em></a>',
              item
            );
          } else {
            itemState['__ui_name'] = util._$renderByJst(
              '<a href="/constraint/detail/?pid=${projectId}&id=${id}" class="stateful">${name}</a>',
              item
            );
            itemState['__ui_name_hit_template'] = util._$renderByJst(
              '<a href="/constraint/detail/?pid=${projectId}&id=${id}" class="stateful">{value}</a>',
              item
            );
            var str = '';
            //删除data-action的信息字段
            var obj = {
              type: 'del',
              cache: cache._$cacheKey,
              ids: [item.id],
              warn: true,
              key: this._listCacheKey
            };
            // 查看详情
            str += util._$renderByJst(
              '<a href="/constraint/detail/?pid=${projectId}&id=${id}" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>',
              item
            );
            // 删除当前项
            str += '<a class="delete-icon" data-action=' + JSON.stringify(obj) + '  title="删除当前选择项"><em class="u-icon-delete-normal"></em></a>';
            //分享当前项
            if (this.__project.type == 0 && !item.__isShare) {
              str += '<a class="share-icon" title="分享" data-action=\'{"event": "constraint-share","id":' + item.id + '}\'><em class="u-icon-share-normal"></em></a>';
            }
          }

          itemState['__nei-actions'] = str;
        }._$bind(this));
        return xlist;
      }._$bind(this),
      batchAction: (function () {
        var actionData = {
          type: 'del',
          cache: cache._$cacheKey,
          warn: true,
          key: this._listCacheKey
        };
        return '<a class="batch-action-item" data-action=' + JSON.stringify(actionData) + '>删除</a>';
      })(),
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
          name: '描述',
          key: 'description'
        },
        {
          name: '标签',
          key: 'tag',
          valueType: 'tag',
          keyPinyin: 'tagPinyin',
          filter: 'tag'
        },
        {
          name: '分组',
          key: 'group.name',
          valueType: 'deepKey',
          filter: 'group'
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
          group: '业务分组',
          key: 'group'
        },
        {
          group: '创建者',
          key: 'creator'
        }
      ],
    };
    var _options = {
      resType: 'constraint',
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__conCache',
      //cache监听的回调事件
      callBackList: ['onshare', 'onclone', 'onmove', 'onsetgroup', 'ontag'],
      //需注册的自定义事件
      eventList: ['res-copy', 'res-move', 'res-group', 'res-tag'],
      cacheOption: {},
      stripedListOption: stripedListOption,
      canShare: true
    };
    this.__super(_options);
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    //添加参数是否重复获取striplist的 batchAction参数
    _options.batActionFlag = true;
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
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
        warn: true,
        key: this._listCacheKey
      }
    }];
    if (this.__project.type !== util.db.PRO_TYP_NORMAL) {//只有普通项目，可以移动、设置分组
      actionData.splice(2, 1);
    }
    var batch = '';
    actionData.forEach(function (item) {
      batch += '<a class="batch-action-item" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>';
    });
    return batch;
  };

  // notify dispatcher
  _m._$regist(
    'res-constraint',
    _p._$$ModuleResConstraint
  );
});
