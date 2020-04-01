NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'base/event',
  'pro/cache/pg_cache',
  'pro/cache/pg_applying_cache',
  'pro/cache/user_cache',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'util/template/jst',
  'pro/common/util',
  'pro/poplayer/p_apply_layer',
  'pro/common/regular/regular_progroup'
], function (_k, _e, _u, _v, _pgCache, _pgApplyCache, _usrCache, _t, _l, _m, _jst, util, _pal, proGroupTree, _p, _pro) {

  _p._$$ModuleProGroupDetail = _k._$klass();
  _pro = _p._$$ModuleProGroupDetail._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-detail')
    );
    var detailBody = _e._$getByClassName(this.__body, 'con-wrap')[0];
    var mainBody = _e._$getByClassName(this.__body, 'con-main')[0];
    var tabCon = _e._$getByClassName(this.__body, 'tab-con')[0];
    var tabWrap = _e._$getByClassName(this.__body, 'tab-wrap')[0];
    this.__loading = _e._$getByClassName(this.__body, 'u-loading')[0];
    this.__markdown = new markdownit({ //markdownit
      linkify: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value;
          } catch (e) {
          }
        }
        return ''; // use external default escaping
      }
    });
    var privileges = null;
    this.__pgCacheOptions = {
      onlistload: function () {
        privileges = this.__pgCache._$getPrivilege(this.pgid);
        if (privileges.isOthers) {
          _e._$addClassName(detailBody, 'z-applying');
          _e._$addClassName(mainBody, 'f-dn');
          // 统一跳转到此模块进行申请
          if (location.pathname != '/progroup/detail') {
            dispatcher._$redirect('/progroup/detail?pgid=' + this.pgid);
            return;
          }
          // 当前用户对当前项目组没有权限，则发送项目组详情请求，此请求只返回简单项目组信息
          this.__pgCache._$getItem({id: this.pgid});
        } else {
          _e._$delClassName(detailBody, 'z-applying');
          _e._$delClassName(mainBody, 'f-dn');
          //this.__loading = _e._$getByClassName(this.__body, 'u-loading')[0];
          //_e._$delClassName(this.__loading, 'f-dn');
          var projectGroup = this.__pgCache._$getItemInCache(this.pgid);
          var _data = {
            name: projectGroup.name,
            description: this.__markdown.render(projectGroup.description || ''),
            canModify: privileges.isAdminOrCreator,
            id: this.pgid,
            isOthers: privileges.isOthers,
            applying: false
          };
          _jst._$render(detailBody, 'progroup-detail', _data);
          // this.__nameInput = _e._$getByClassName(detailBody, 'pg-name')[0];
          // this.__descTextarea = _e._$getByClassName(detailBody, 'pg-desc')[0];
          _e._$addClassName(this.__loading, 'f-dn');
        }
      }.bind(this),
      onitemload: function () {
        var projectGroup = this.__pgCache._$getItemInCache(this.pgid);
        if (this.__applyId) {
          var pgs = this.__pgCache._$getListInCache(_pgCache._$cacheKey);
          pgs.push(projectGroup);
          _v._$dispatchEvent(
            _pgCache._$$CacheProGroup, 'listchange', {}
          );
          this.__applyRedirect();
          return;
        }
        // 申请列表Cache, 需要判断当前用户是否正在申请此项目组
        this.__pgApplyCache = _pgApplyCache._$$CachePGApplying._$allocate({
          onlistload: function (data) {
            if (this.__applyId) {
              var applyInfo = this.__pgApplyCache._$getItemInCache(this.__applyId);
              if (applyInfo.verifyResult === this.dbConst.PRG_ROP_SYSTEM) {
                this.__pgCache._$clearItemInCache(this.pgid);
                this.__pgCache._$getItem({
                  id: this.pgid,
                  key: _pgCache._$cacheKey
                });
              } else {
                this.__applyRedirect();
              }
            } else {

              var _data = {
                name: projectGroup.name,
                description: this.__markdown.render(projectGroup.description || ''),
                canModify: privileges.isAdminOrCreator,
                id: this.pgid,
                isOthers: privileges.isOthers,
                applying: this.__pgApplyCache._$isApplying(this.pgid)
              };
              _jst._$render(detailBody, 'progroup-detail', _data);
            }
          }.bind(this),
          onitemadd: function (_result) {
            this.__pgApplyCache._$clearListInCache(_pgApplyCache._$cacheKey);
            this.__applyId = _result.data.id;
            this.__pgApplyCache._$getList({
              key: _pgApplyCache._$cacheKey
            });
          }.bind(this)
        });
        this.__pgApplyCache._$getList({
          key: _pgApplyCache._$cacheKey
        });
      }.bind(this)
    };
    this.__export = {
      tab: tabWrap,
      parent: tabCon
    };

  };

  _pro.__applyRedirect = function () {
    delete this.__applyId;
    var privileges = this.__pgCache._$getPrivilege(this.pgid);
    if (privileges.isOthers) {
      dispatcher._$refresh();
    } else {
      var path;
      if (privileges.isAdminOrCreator) {
        path = '/progroup/detail/projectmanage/';
      } else {
        path = '/progroup/detail/project/';
      }
      dispatcher._$redirect(path + '?pgid=' + this.pgid);
    }
  };

  _pro.__onShow = function (_options) {
    this.origin = _options.referer;
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate(this.__pgCacheOptions);
    this.__super(_options);
    this.__doInitDomEvent([[
      window, 'apply',
      function (evt) {
        this.__alert(evt.name, evt.id);
      }.bind(this)
    ]]);
  };

  _pro.__onRefresh = function (_options) {
    _e._$delClassName(this.__loading, 'f-dn');
    this.pgid = parseInt(_options.param.pgid);
    this.__pgCache._$getList({
      key: _pgCache._$cacheKey
    });
    this.__super(_options);
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    // if( !!this.__nameInput){
    //   this.__nameInput.value = '' ;
    // }
    // if( !!this.__descTextarea){
    //   this.__descTextarea.value = '';
    // }
    this.__pgCache && this.__pgCache._$recycle();
    delete this.__pgCache;
    this.__pgApplyCache && this.__pgApplyCache._$recycle();
    delete this.__pgApplyCache;
  };
  /**
   * 申请权限弹窗
   * @param  {String} name 项目组名称
   * @param  {Number} id   项目组id
   */
  _pro.__alert = function (name, id) {
    this.__pgApplyLayer = new _pal({
      data: {
        progroupName: name,
        resId: id
      }
    }).$on('close', function () {
      delete this.__pgApplyLayer;
    }.bind(this)).$on('apply', function (description, pid) {
      delete this.__pgApplyLayer;
      this.__pgApplyCache._$addItem(
        {
          data: {
            pgId: pid,
            message: description
          }
        }
      );
    }.bind(this));
  };

  _m._$regist(
    'progroup-detail',
    _p._$$ModuleProGroupDetail
  );
});
