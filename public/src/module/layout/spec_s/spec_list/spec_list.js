NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/event/event',
  'util/template/tpl',
  'util/list/page',
  'pro/common/module',
  'pro/common/util',
  'pro/modal/modal',
  'pro/stripedlist/stripedlist',
  'pro/poplayer/spec_delete_layer',
  'pro/poplayer/spec_copy_layer',
  'pro/cache/spec_cache',
  'pro/cache/user_cache',
  'json!{3rd}/fb-modules/config/db.json',
  'pro/common/regular/regular_base',
  'pro/common/util'
], function (_k, _e, _v, _u, c, _l, _t, _m, util, Modal, stripedlist, _deleteLayer, _copyLayer, specCache, usrCache, db, _rb, _cu, _p, _pro) {
  /**
   * 项目组树模块
   * @class   {wd.m._$$ModulespecList}
   * @extends {nej.ut._$$AbstractModule}
   */
  _p._$$ModulespecList = _k._$klass();
  _pro = _p._$$ModulespecList._$extend(_m._$$Module);

  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-list')
    );
    this.__addBtn = _e._$getByClassName(this.__body, 'u-spec-add')[0];
    this.__filterWrap = _e._$getByClassName(this.__body, 'spec-filter-wrap')[0];
    this.__specCache = specCache._$$CacheSpec._$allocate({
      onfavorite: function (_r) { //收藏（在我的收藏列表中，取消收藏之后从该列表中删除记录）
        var list = this.__specCache._$getListInCache('spec');
        this.__stripedList._$updateList(list);
      }.bind(this),
      onitemupdate: function (_r) { //分享（在我的分享列表中，取消分享之后从该列表中删除记录）
        if (this.__listType == 'share') {
          this.__stripedList._$hideItems(_r.data[0].id);
        } else {
          var shareIcon = _e._$getByClassName(this.__shareNode, 'u-icon-share-normal')[0];
          if (_r.data.isShare == db.CMN_BOL_YES) { //分享，添加样式
            _e._$addClassName(shareIcon, 'u-icon-share-pressed');
            this.__shareNode.title = '取消分享';
          } else { //取消分享，删除样式
            _e._$delClassName(shareIcon, 'u-icon-share-pressed');
            this.__shareNode.title = '分享';
          }
        }
      }.bind(this),
      onitemdelete: function (_r) {
        this.__stripedList._$update();
      }.bind(this),
      onclone: function (_r) {
        dispatcher._$redirect('/spec/detail?id=' + _r.data.id);
      },
      onshare: function (_r) {
        var list = this.__specCache._$getListInCache('spec');
        this.__stripedList._$updateList(list);
      }.bind(this),
      onlock: function (_r) {
        var list = this.__specCache._$getListInCache('spec');
        this.__stripedList._$updateList(list);
      }.bind(this)
    });
    this.__headers = [
      {
        name: '',
        key: 'isLock',
        valueType: 'lock',
        sortable: false
      },
      {
        name: '规范名称',
        key: 'name',
        keyPinyin: 'namePinyin'
      }, {
        name: '作者',
        key: 'creator.realname',
        keyPinyin: 'creator.realnamePinyin',
        valueType: 'deepKey'
      }, {
        name: '收藏数',
        key: 'favouriteCount'
      }, {
        name: '创建时间',
        key: 'createTime',
        valueType: 'time',
        defaultSortUp: false
      }, {
        name: '',
        key: '__nei-actions',
        valueType: '__nei-actions'
      }];
    this.__stripedListOptions = {
      queryData: {},
      parent: this.__body,
      listCache: 'spec',
      listCacheKey: 'spec',
      defaultSortKey: 'createTime',
      isDefaultSortUp: false,
      hasSearchBox: true
    };
    this.__stripedList = null;
    this.__addEvent(); //添加列表操作处理
    this.__specType = 'web';
    this.__listType = 'all';

    //实例化列表过滤组件
    this.__allocateListFilter();
  };

  /**
   * 实例化列表过滤组件
   * @param {Boolean} defaultSelect 是否默认选中全部
   * @return {Void}
   */
  _pro.__allocateListFilter = function () {
    var xlist = [
      {name: '我创建的', type: 'my'},
      {name: '我的分享', type: 'share'},
      {name: '我的收藏', type: 'favorite'},
      {name: '项目组内可见', type: 'group-visible'},
      {name: '其他人的分享', type: 'others-share'},
      {name: '全部可见', type: 'all'}
    ];
    var listFilter = this.__initFilter();
    this.__listFilter = new listFilter({
      data: {
        list: xlist
      }
    }).$inject(this.__filterWrap);
  };
  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.__specType = _options.param.s ? _options.param.s : this.__specType;
    this.__listType = _options.param.l ? _options.param.l : this.__listType;
    this.__saveListStatus();
    this.__addBtn.href = '/spec/create?s=' + this.__specType;
    if (this.__stripedList) {
      this.__stripedList._$recycle();
    }
    var headers = this.__headers.slice(0);
    //如果是全部列表，则自定义排序
    if (this.__listType == 'all') {
      this.__stripedListOptions.defaultSortKey = null;
    }
    this.__stripedListOptions.headers = headers;
    this.__stripedListOptions.filter = this.__getFilter();
    this.__stripedList = stripedlist._$$ModuleStripedList._$allocate(this.__stripedListOptions);
    //刷新时，触发过滤器事件，默认选中
    this.__listFilter.$emit('init-select');

  };

  /**
   * 规范过滤函数
   * @returns {Function}
   */
  _pro.__specFilter = function () {
    dispatcher._$redirect('/spec/list?s=' + this.__specType + '&l=' + this.__listType);
  };

  /**
   * 保存当前展示的列表状态到sessionStorage
   * @returns {Function}
   */
  _pro.__saveListStatus = function () {
    var _obj = {
      specType: this.__specType,
      listType: this.__listType
    };
    _v._$dispatchEvent(document, 'onspeclistchange', {
      listHref: '/spec/list?s=' + this.__specType + '&l=' + this.__listType
    });
    window.sessionStorage.specBack = JSON.stringify(_obj);
  };
  /**
   * 生成斑马纹列表的过滤函数
   * @returns {Function}
   */
  _pro.__getFilter = function () {
    var specTypeValue = this.__getSpecTypeValue(this.__specType);
    var listType = this.__listType;
    var userid = usrCache._$$CacheUser._$allocate({})._$getUserInCache().id;
    var creatorList = [], favoriteList = [], otherShareList = [], groupVisibleList = [], otherSpecList = [];
    return function (list, listStates) {
      /**
       * 生成列表项操作字符串
       * 全部规范：复制、详情、收藏(他人规范)或分享(自己规范)
       * 我的规范：查看引用、复制、详情、分享、删除
       * 我的分享：复制、详情、取消分享(取消分享之后从该列表中删除记录)
       * 我的收藏：复制、详情、取消收藏(取消收藏之后从该列表中删除记录)(若分享已取消，不能复制和详情，只能取消收藏)
       * 对于来自项目的规范且不是当前用户创建，如果已经被分享，则按照分享的规范操作，如果未被分享，则只能进行查看和复制的操作
       * 我的收藏：复制、详情、取消收藏(取消收藏之后从该列表中删除记录)(若分享已取消，不能复制和详情，只能取消收藏)
       * @param {Object} 列表项
       * @return {Void}
       */
      var getItemAction = function (item, itemState) {

        itemState['__nei-actions'] = '';
        if (item.creatorId != userid) {//非当前用户规范
          if (item.isShare || (!item.isShare && item.isFavorite)) { //规范被分享可以收藏
            itemState['__nei-actions'] += '<a title="' + (item.isFavorite ? '取消' : '') + '收藏" class="stateful" ' +
              'data-click=\'{"action":"favorite","id":' + item.id + '}\'>' +
              '<em class="u-icon-collect-normal ' + (item.isFavorite ? 'u-icon-collect-pressed' : '') + '"></em></a>';
          } else {
            itemState['__nei-actions'] += '<a class="no-icon"></a>';
          }
          if (listType == 'group-visible' && (item.isFromProgroup || item.isFromProject)) {
            //项目组内可见，别人设置的规范，显示查看引用按钮
            itemState['__nei-actions'] = '<a href="/spec/ref/?id=' + item.id + '" title="查看引用" class="stateful">' +
              '<em class="u-icon-link-normal "></em></a>' + itemState['__nei-actions'];
          }
        } else {//分享按钮、锁定按钮
          itemState['__nei-actions'] += '<a title="' + (item.isShare ? '取消' : '') + '分享" class="stateful" ' +
            'data-click=\'{"action":"share","id":' + item.id + '}\'>' +
            '<em class="u-icon-share-normal ' + (item.isShare ? 'u-icon-share-pressed' : '') + '"></em></a>';
          itemState['__nei-actions'] += '<a title="' + (item.isLock ? '取消' : '') + '锁定" class="stateful" ' +
            'data-click=\'{"action":"lock","id":' + item.id + '}\'>' +
            '<em class="u-icon-lock-normal ' + (item.isLock ? 'u-icon-unlock-normal' : '') + '"></em></a>';
        }
        if (listType == 'my') { //我的规范添加查看引用和删除按钮
          //查看引用
          itemState['__nei-actions'] = '<a href="/spec/ref/?id=' + item.id + '" title="查看引用" class="stateful">' +
            '<em class="u-icon-link-normal "></em></a>' + itemState['__nei-actions'];
          //删除按钮
          itemState['__nei-actions'] += '<a data-click=\'{"action":"deleteConfirm","id":' + item.id + ',"name":"'
            + item.name + '"}\' ' + 'title="删除规范" class="stateful" ><em class="u-icon-delete-normal"></em></a>';
        }

        if (item.creatorId == userid || item.isFromProgroup || item.isFromProject || item.isShare || !item.isFavorite) { //对于已取消且被收藏的规范不能复制和查看详情
          itemState['__ui_name'] = util._$renderByJst(
            '<a href="/spec/detail/?id=${id}" class="stateful">${name|escape2}</a>',
            item
          );
          itemState['__ui_name_hit_template'] = util._$renderByJst(
            '<a href="/spec/detail/?id=${id}" class="stateful">{value}</a>',
            item
          );
          itemState['__nei-actions'] = '<a title="复制规范" class="stateful" ' +
            'data-click=\'{"action":"copy","id":"' + item.id + '"}\'>' +
            '<em class="u-icon-file-normal"></em></a>' + itemState['__nei-actions'];
          itemState['__nei-actions'] = '<a href="/spec/detail/?id=' + item.id
            + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>' + itemState['__nei-actions'];
        } else { //对于取消分享的列表项
          item.name = '该规范已被取消分享';
          item.namePinyin = '';
          item.creator.realname = '';
          item.createTime = undefined;
          item.favouriteCount = 0;
          itemState['__class'] = 'share-cancel';//添加取消分享的样式
        }
      };
      /**
       * 对全部列表进行排序
       * @param {Object} item 列表项
       * @return {Void}
       */
      var sortList = function (item) {
        if (item.creatorId == userid) {
          creatorList.push(item);
        } else {
          //我收藏的
          if (item.isFavorite) {
            favoriteList.push(item);
            //项目组内已设置的其他人创建的规范
          } else if (!!item.isFromProgroup && item.isFromProgroup || !!item.isFromProject && item.isFromProject) {
            groupVisibleList.push(item);
          } else if (item.isShare) {
            //其他人分享的
            otherShareList.push(item);
          }
        }
      };

      list.forEach(function (item) {
        var itemState = listStates[item.id];
        itemState.__hidden = true;
        //指定规范类型
        if (item.type != specTypeValue) {
          if (listType == 'all') {
            //不是当前类型的规范
            otherSpecList.push(item);
          }
          return;
        }
        //指定列表类型
        switch (listType) {
          case 'all': //全部规范
            getItemAction(item, itemState);
            itemState.__hidden = false;
            sortList(item);
            break;
          case 'my':
            if (item.creatorId == userid) { //我的规范
              getItemAction(item, itemState);
              itemState.__hidden = false;
            }
            break;
          case 'share':
            if (item.isShare && item.creatorId == userid) { //我的分享
              getItemAction(item, itemState);
              itemState.__hidden = false;
            }
            break;
          case 'lock':
            if (item.isLock && item.creatorId == userid) { //锁定
              getItemAction(item, itemState);
              itemState.__hidden = false;
            }
            break;
          case 'favorite':
            if (item.isFavorite && item.creatorId != userid) { //我的收藏
              getItemAction(item, itemState);
              itemState.__hidden = false;
            }
            break;
          case 'group-visible':
            if ((item.isFromProgroup || item.isFromProject) && item.creatorId != userid) { //项目组内可见
              getItemAction(item, itemState);
              itemState.__hidden = false;
            }
            break;
          case 'others-share':
            if (item.isShare && item.creatorId != userid) { //其他人的分享
              getItemAction(item, itemState);
              itemState.__hidden = false;
            }
          default:
            break;
        }
      });
      //如果是全部列表，则对列表进行自定义排序
      if (listType == 'all') {
        _cu._$sortBy(creatorList, 'number', 'createTime', false);
        _cu._$sortBy(favoriteList, 'number', 'createTime', false);
        _cu._$sortBy(groupVisibleList, 'number', 'createTime', false);
        _cu._$sortBy(otherShareList, 'number', 'createTime', false);
        list = creatorList.concat(favoriteList, groupVisibleList, otherShareList, otherSpecList);
        creatorList = [], favoriteList = [], otherShareList = [], groupVisibleList = [] , otherSpecList = [];
      }
      return list;
    }.bind(this);
  };


  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__deleteLayer && this.__deleteLayer.destroy();
    this.__deleteLayer = null;
    this.__copyLayer && this.__copyLayer.destroy();
    this.__copyLayer = null;
    this.__shareModal && this.__shareModal.destroy();
    this.__shareModal = null;
    this.__lockModal && this.__lockModal.destroy();
    this.__lockModal = null;
    this.__super();
  };
  /**
   * 获取规范类型值
   * @param specType 规范类型
   * @returns {*}
   */
  _pro.__getSpecTypeValue = function (specType) {
    switch (specType) {
      case 'web':
        return db.CMN_TYP_WEB;
      case 'ios':
        return db.CMN_TYP_IOS;
      case 'aos':
        return db.CMN_TYP_AOS;
      case 'test':
        return db.CMN_TYP_TEST;
      default:
        return undefined;
    }
  };
  /**
   * 添加列表操作处理
   * @return {Void}
   */
  _pro.__addEvent = function () {
    _v._$addEvent(this.__body, 'click', function (evt) {
      var node = _v._$getElement(evt, 'data-click');
      if (!node) return;
      var data = JSON.parse(_e._$dataset(node, 'click'));
      var specData = this.__specCache._$getItemInCache(data.id);
      switch (data.action) {
        case 'copy' : //复制规范跳转创建页面
          if (!specData) return;
          this.__copyLayer = new _copyLayer({
            data: {
              name: specData.name + '【来自' + specData.creator.realname + '】'
            }
          }).$inject(this.__body)
            .$on('copy', function (name) {
              this.__copyLayer.destroy();
              this.__copyLayer = null;
              this.__specCache._$clone({
                id: data.id,
                name: name
              });
            }.bind(this));
          break;
        case 'favorite':
          this.__specCache._$favorite({
            id: data.id,
            actionMsg: specData.isFavorite === db.CMN_BOL_YES ? '取消成功' : '收藏成功',
            v: 1 - specData.isFavorite
          });
          break;
        case 'lock':
          this.__lockNode = node;
          var flag = specData.isLock === db.CMN_BOL_NO,
            title = '取消锁定确认',
            content = '确定要取消锁定该规范吗？';
          if (flag) {
            title = '锁定确认';
            content = '确定要锁定该规范吗？';
          }
          this.__lockModal = Modal.confirm({
            content: content,
            title: title
          }).$on('ok', function () {
            this.__lockModal = null;
            this.__specCache._$lock({
              id: specData.id,
              actionMsg: specData.isLock === db.CMN_BOL_YES ? '取消成功' : '锁定成功',
              v: 1 - specData.isLock
            });
          }.bind(this))
            .$on('cancel', function () {
              this.__lockModal = null;
            }.bind(this));
          break;
        case 'share':
          this.__shareNode = node;
          var flag = specData.isShare === db.CMN_BOL_NO,
            title = '取消分享确认',
            content = '确定要取消该规范的分享吗？';
          if (flag) {
            title = '分享确认';
            content = '确定要分享该规范吗？';
          }
          this.__shareModal = Modal.confirm({
            content: content,
            title: title
          }).$on('ok', function () {
            this.__shareModal = null;
            this.__specCache._$share({
              id: specData.id,
              actionMsg: specData.isShare === db.CMN_BOL_YES ? '取消成功' : '分享成功',
              v: 1 - specData.isShare
            });
          }.bind(this))
            .$on('cancel', function () {
              this.__shareModal = null;
            }.bind(this));
          break;
        case 'deleteConfirm': //删除确认
          this.__deleteLayer = new _deleteLayer({
            data: {
              id: data.id,
              name: data.name
            }
          }).$inject(this.__body)
            .$on('delete', function (id) { //确认删除的规范id
              this.__deleteLayer.destroy();
              this.__deleteLayer = null;
              this.__specCache._$deleteItem({
                key: specCache._$cacheKey,
                id: id
              });
            }.bind(this));
          break;
        default:
          break;
      }
    }.bind(this));
  };

  /**
   * 列表过滤器
   * @return {Void}
   */
  _pro.__initFilter = function () {
    var _this = this;
    var specFilter = _rb.extend({
      template: _l._$getTextTemplate('m-spec-filter-wrap'),
      config: function (data) {
        this.initSelect();
      },
      init: function () {
        this.$on('init-select', this.initSelect.bind(this));
      },
      filter: function (type) {
        _this.__listType = type;
        this.initSelect();
        _this.__specFilter();
      },
      initSelect: function () {
        _u._$forEach(this.data.list, function (item) {
          if (_this.__listType == item.type) {
            item.selected = true;
          } else {
            item.selected = false;
          }
        }._$bind(this));
        this.$update();
      }
    });
    return specFilter;
  };


  // notify dispatcher
  _m._$regist(
    'spec-list',
    _p._$$ModulespecList
  );
});
