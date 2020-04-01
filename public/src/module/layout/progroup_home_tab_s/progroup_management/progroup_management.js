NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/common/list_drag',
  'pro/common/regular/regular_progroup',
  'json!3rd/fb-modules/config/db.json',
  'pro/notify/notify',
  'pro/cardlist/cardlist'
], function (_k, _e, _v, _u, _l, _m, pgCache, userCache, _drag, _r, _dbConst, Notify, cardlist, _p, _pro) {

  _p._$$ModuleProGroupManagement = _k._$klass();
  _pro = _p._$$ModuleProGroupManagement._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-management')
    );
    this.__export = {
      apply: _e._$getByClassName(this.__body, 'apply-wrap')[0],
      parent: _e._$getByClassName(this.__body, 'con-wrap')[0]
    };
    this.__pgCache = pgCache._$$CacheProGroup._$allocate({
      onlistload: function (result) {
        var projectGroups = this.__pgCache._$getListInCache(pgCache._$cacheKey);
        this.__pgList = new proGroupList({
          data: {
            progroups: projectGroups
          }
        }).$inject(this.__export.parent);
        //拖拽控件实例化
        this.__dragWidget = _drag._$$DraggerSort._$allocate({
          parent: _e._$getByClassName(this.__export.parent, 'res-ul')[0],
          list: _e._$getByClassName(this.__export.parent, 'res-list')[0],
          type: 'progroup',
          dragEnd: function (pgids) {
            this.__pgCache._$sort({ids: pgids, type: _dbConst.CMN_ORD_CUSTOM});
            this.__pgList.$emit('drag-sorted');
          }.bind(this)
        });
      }.bind(this),
      ontokensload: function (evt) {
        var image = evt.ext.image;
        var pgid = evt.ext.id;
        var tokens = this.__pgCache.__getDataInCache(evt.key);
        var formData = new FormData();
        var uploadToNos = function (data, file) { //封装上传操作
          var req = new XMLHttpRequest();
          req.open('POST', window.pageConfig.nosServer);
          req.responseType = 'json';
          req.onloadend = function () {
            if (req.status >= 200 && req.status < 300) {
              var logo = req.response.url;
            } else {
              Notify.show(file.name + '文件上传失败', 'error', 2000);
            }
            if (!!logo) {
              this.__pgCache._$updateItem({id: pgid, data: {logo: logo}});
            }
          }.bind(this);
          req.send(data);
        }.bind(this);
        formData.append('x-nos-token', tokens[0].token);
        formData.append('Object', tokens[0].key);
        formData.append('file', image);
        uploadToNos(formData, image);
      }._$bind(this)
    });
    var proGroupList = this._initList();
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([[
      pgCache._$$CacheProGroup, 'listchange',
      function (_result) {
        var list = this.__pgCache._$getListInCache(pgCache._$cacheKey);
        if (_result.action == 'add') {
          this.__pgList.$emit('list-change', list, _result.action);
        } else {
          !!this.__pgList && this.__pgList.$emit('list-change', list);
        }
      }._$bind(this)
    ], [
      pgCache._$$CacheProGroup, 'update',
      function (_result) {
        this.__pgList.$emit('update', _result.data);
      }._$bind(this)
    ]]);
  };
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    // 请求项目组数据
    this.__pgCache._$getList({key: pgCache._$cacheKey});
  };
  /**
   * 初始化组件元素
   * @return {Object}
   */
  _pro._initList = function () {
    var _this = this;
    var proGroupList = _r.extend({
      name: 'proGroupList',
      template: _l._$getTextTemplate('progroup-list'),
      config: function (data) {
        this.supr(data);
        var orderType = parseInt(userCache._$$CacheUser._$allocate()._$getUserInCache().progroupOrder);
        //初始化卡片列表组件所需参数
        data.cardListOptions = {
          isAllocateByTag: true,
          resType: 3,
          addable: true,
          sortable: true,
          countable: true,
          hasStickList: true,
          cache: _this.__pgCache,
          orderType: orderType,
          sortlist: [{name: '名称', type: 'name'}, {name: '创建时间', type: 'time'}, {name: '项目数', type: 'count'}],
          title: '我的项目组',
          hasQuickEntrence: false,
          entranceList: [],
        };
        this.data.data = data;
      },
      init: function () {
        this.supr();
        this.$on('drag-sorted', this.clearSortStyle.bind(this));
      },
      uploadLogo: function ($event, pg) {
        var imageList = $event.target.files;
        this.data.image = imageList[0];
        if (this.data.image.type == 'image/png' || this.data.image.type == 'image/jpg' || this.data.image.type == 'image/jpeg') {
          if (imageList.length > 0) {
            _this.__pgCache._$getTokens({
              key: 'progroup-token',
              ext: {image: this.data.image, id: pg.id}
            });
          }
        } else {
          Notify.error('请选择图片格式文件！');
        }
      },
      //清除排序方式
      clearSortStyle: function () {
        this.data.sortType = '';
        this.$update();
      },
    });
    return proGroupList;
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    this.__pgList && this.__pgList.destroy();
    this.__dragWidget = this.__dragWidget && this.__dragWidget._$recycle();
  };


  _m._$regist(
    'progroup-management',
    _p._$$ModuleProGroupManagement
  );
});
