NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/modal/modal',
  'pro/cache/spec_cache',
  'pro/cache/user_cache',
  'pro/leselect/leselect',
  'pro/poplayer/spec_copy_layer',
  'json!{3rd}/fb-modules/config/db.json',
  'pro/common/util'
], function (_k, _e, _v, _u, _t, _l, _j, _m, Modal, _specCache, _usrCache, LESelect, CopyLayer, db, _cu, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleSpecDetail}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleSpecDetail = _k._$klass();
  _pro = _p._$$ModuleSpecDetail._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-detail')
    );
    _j._$add('module-spec-detail-header');
    this.__conWrap = _e._$getByClassName(this.__body, 'con-wrap')[0];
    this.__tabPane = _e._$getByClassName(this.__body, 'tab-pane')[0];
    this.__export = {
      tab: _e._$getByClassName(this.__tabPane, 'tab-wrap')[0],
      parent: _e._$getByClassName(this.__tabPane, 'tab-con')[0]
    };
  };
  /**
   * 显示模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    var defaultBack = {
      specType: 'web',
      listType: 'all'
    };
    var showBack = !!window.sessionStorage.specBack ? JSON.parse(window.sessionStorage.specBack) : defaultBack;
    var showBackHref = '/spec/list?s=' + showBack.specType + '&l=' + showBack.listType;
    this.__scache = _specCache._$$CacheSpec._$allocate({
      onitemload: function (_r) {
        var usr = _usrCache._$$CacheUser._$allocate({})._$getUserInCache();
        var data = this.__scache._$getItemInCache(_r.id);
        var noDetail = !data || (usr.id !== data.creatorId && !(data.isFromProject || data.isFromProgroup) && !data.isShare);
        if (noDetail) { //当前规范不可查看（查不到数据或者不是来自项目和项目组的已被取消的取消分享的规范）
          _e._$addClassName(this.__conWrap, 'no-detail');
          _e._$addClassName(this.__tabPane, 'f-dn');
          _j._$render(this.__conWrap, 'module-spec-detail-header', {
            noDetail: noDetail,
            showBack: showBackHref
          });
        } else {
          _e._$delClassName(this.__tabPane, 'f-dn');
          var flag = true; //是否是用户的规范
          if (!usr || usr.id != data.creator.id)
            flag = false;
          _j._$render(this.__conWrap, 'module-spec-detail-header', {
            noDetail: noDetail,
            data: data,
            flag: flag,
            showBack: showBackHref
          });
          if (this.__le) {
            this.__le.destroy();
            this.__le = null;
          }
          this.__shareNode = _e._$getByClassName(this.__body, 'm-share')[0];
          this.__favNode = _e._$getByClassName(this.__body, 'm-fav')[0];
          this.__createSelect(flag, data.type, data.language, data.engine, data.viewExtension);
          //展开收起功能
          var toggleBtn = _e._$getByClassName(this.__body, 'u-info-toggle')[0];
          this.__toggleIcon = _e._$getByClassName(toggleBtn, 'icon')[0];
          this.__doInitDomEvent([[
            this.__toggleIcon, 'click', this.__infoToggle._$bind(this)
          ]]);
          //展开收起状态存到localstorage
          window.localStorage.specInfoToggle = _cu._$toBool(window.localStorage.specInfoToggle);
          //每次刷新查看状态
          _v._$dispatchEvent(this.__toggleIcon, 'click', {flag: false});
        }
      }._$bind(this),
      onitemupdate: function (_r) {
        var data = this.__scache._$getItemInCache(this.__specId);
        if (_r.ext) {
          if (_r.ext.updateShare) {
            var icons = _e._$getChildren(this.__shareNode);
            var title = data.isShare ? '取消分享' : '分享规范';
            if (data.isShare) {
              _e._$delClassName(this.__shareNode, 'f-hover');
            } else {
              _e._$addClassName(this.__shareNode, 'f-hover');
            }
            _u._$forEach(icons, function (icon) {
              icon.title = title;
            });
          } else if (_r.ext.updateLanguage) {
            _v._$dispatchEvent(
              this.__scache.constructor, 'onlanguageupdate', {
                language: data.language
              }
            );
          }
        }
      }.bind(this),
      onfavorite: function () {
        var data = this.__scache._$getItemInCache(this.__specId);
        var icons = _e._$getChildren(this.__favNode);
        var title = data.isFavorite ? '取消收藏' : '分享收藏';
        if (data.isFavorite) {
          _e._$delClassName(this.__favNode, 'f-hover');
        } else {
          _e._$addClassName(this.__favNode, 'f-hover');
        }
        _u._$forEach(icons, function (icon) {
          icon.title = title;
        });
      }.bind(this),
      onclone: function (result) {
        dispatcher._$redirect('/spec/detail?id=' + result.data.id); //跳转详情
      }.bind(this)
    });
    this.__doInitDomEvent([
      [this.__body, 'click', function (evt) {
        var node = _v._$getElement(evt, 'd:click');
        if (!node)
          return;
        var type = _e._$dataset(node, 'click');
        switch (type) {
          case 'share':
          case 'fav':
            this.__doShareOrFav(node);
            break;
          case 'copy':
            this.__copyDesc();
            break;
          default:
            break;
        }
      }.bind(this)]
    ]);
    this.__specId = _options.param.id;
    if (this.__specId) {
      this.__scache._$getItem({
        key: _specCache._$cacheKey,
        id: this.__specId
      });
    }
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param {Object} 配置参数
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    if (this.__specId != _options.param.id) {
      this.__specId = _options.param.id;
      if (this.__specId) {
        this.__scache._$getItem({
          key: _specCache._$cacheKey,
          id: this.__specId
        });
      }
    }
    this.__super(_options);
  };

  /**
   * 详情的展开收起
   * @param {Boolean} flag 是否进行折叠
   */
  _pro.__infoToggle = function (_options) {
    var infoHead = _e._$getByClassName(this.__body, 'm-detail')[0];
    //如果是刷新才会有该属性
    var flag = 'flag' in _options;
    //收起
    if (!flag && !_e._$hasClassName(this.__toggleIcon, 'z-close') || flag && !_cu._$toBool(window.localStorage.specInfoToggle)) {
      _e._$addClassName(infoHead, 'z-close');
      _e._$addClassName(this.__toggleIcon, 'z-close');
      _e._$attr(this.__toggleIcon, 'title', '展开');
      window.localStorage.specInfoToggle = false;
    } else {
      //展开
      _e._$delClassName(infoHead, 'z-close');
      _e._$delClassName(this.__toggleIcon, 'z-close');
      _e._$attr(this.__toggleIcon, 'title', '收起');
      window.localStorage.specInfoToggle = true;
    }
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__doClearDomEvent();
    this.__le && this.__le.destroy();
    this.__le = null;
    this.__copyLayer && this.__copyLayer.destroy();
    this.__copyLayer = null;
    this.__shareModal && this.__shareModal.destroy();
    this.__shareModal = null;
    this.__super();
  };
  /**
   * 创建级联下拉框
   * @param {Boolean} 是否是当前用户创建的规范
   * @param {Number} 规范类型
   * @param {Number} 规范实现语言
   * @param {Number} 规范模板引擎（只有web规范有该字段）
   * @param {String} 规范模板扩展名（只有web规范有该字段）
   */
  _pro.__createSelect = function (flag, specType, language, engine, viewExtension) {
    var optData = {
      specType: specType,
      preview: true,
      editable: flag,
      type: flag ? 'modify' : 'see',
      lid: language,
      eid: engine,
      viewExtension: viewExtension
    };
    this.__le = new LESelect({
      data: optData
    });
    this.__le.$inject(_e._$getByClassName(this.__body, 'm-detail-header')[0]);
    //监听updateSpec,更新规范详情
    this.__le.$on('updateSelect', function (evt) {
      if (!evt)
        return;
      this.__updateSpec({
        data: evt,
        ext: {
          updateLanguage: evt.hasOwnProperty('language')
        }
      });
    }.bind(this));
  };
  /**
   * 更新规范详情
   * @param {Object} 更新内容
   */
  _pro.__updateSpec = function (options) {
    this.__scache._$updateItem(_u._$merge({
      id: this.__specId
    }, options));
  };
  /**
   * 增加或取消收藏、分享操作
   * @param {Node} 事件节点
   */
  _pro.__doShareOrFav = function (node) {
    var type = _e._$dataset(node, 'click');
    var data = this.__scache._$getItemInCache(this.__specId);
    if (type == 'share') { //分享
      var flag = data.isShare === db.CMN_BOL_NO,
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
        var updateData = {
          isShare: flag ? db.CMN_BOL_YES : db.CMN_BOL_NO
        };
        this.__updateSpec({
          data: updateData,
          ext: {updateShare: true},
          actionMsg: flag ? '分享成功' : '取消成功'
        });
      }.bind(this))
        .$on('cancel', function () {
          this.__shareModal = null;
        }.bind(this));
    } else if (type == 'fav') { //收藏
      this.__scache._$favorite({
        id: data.id,
        v: data.isFavorite == db.CMN_BOL_NO ? db.CMN_BOL_YES : db.CMN_BOL_NO,
        actionMsg: data.isFavorite === db.CMN_BOL_NO ? '收藏成功' : '取消成功'
      });
    }
  };
  /**
   * 复制规范信息，调转规范创建，预填数据
   * @return {Void}
   */
  _pro.__copyDesc = function () {
    var data = this.__scache._$getItemInCache(this.__specId);
    this.__copyLayer = new CopyLayer({
      data: {
        name: data.name + '【来自' + data.creator.realname + '】'
      }
    }).$inject(this.__body)
      .$on('copy', function (name) {
        this.__copyLayer.destroy();
        this.__copyLayer = null;
        this.__scache._$clone({
          id: data.id,
          name: name
        });
      }.bind(this));
  };

// notify dispatcher
  _m._$regist(
    'spec-detail',
    _p._$$ModuleSpecDetail
  );
})
;
