NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_applying_cache',
  'pro/poplayer/p_apply_layer',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _e, _u, _v, _t, _l, _jst, _m, _cu, jstExt, _pgCache, _proCache, _pgApplyCache, _pal, _dbConst, _p, _pro) {
  /**
   * 项目模块
   * @class   {wd.m._$$ModuleProGroupP}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupP = _k._$klass();
  _pro = _p._$$ModuleProGroupP._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-p')
    );
    this.__export = {
      tab: _e._$getByClassName(this.__body, 'tab-wrap')[0],
      parent: _e._$getByClassName(this.__body, 'tab-con')[0]
    };
    this._tabWrap = _e._$getByClassName(this.__body, 'tab-wrap ')[0];
    this._othersView = _e._$getByClassName(this.__body, 'others-view')[0];

    // 这里需要根据当前用户的权限显示不同的信息
    this.__proCache = _proCache._$$CachePro._$allocate({
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        //项目组cache
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onlistload: function () {
            var isMyProject = false;
            var progroups = this.__pgCache._$getListInCache(_pgCache._$cacheKey);
            _u._$forEach(progroups, function (item) {
              if (item.id == this.__project.progroupId) {
                isMyProject = true;
                var role = this.__pgCache._$getRole(item.id);
                if (role == 'observer') {
                  _e._$addClassName(this.__body, 'member-observer');
                } else {
                  _e._$delClassName(this.__body, 'member-observer');
                }
              }
            }._$bind(this));
            if (!isMyProject) {
              if (location.pathname.replace(/\/$/, '') != '/project') {
                dispatcher._$redirect('/project?pid=' + this.__pid);
                return;
              }
              _e._$delClassName(this._othersView, 'f-dn');
              _e._$addClassName(this.__export.parent, 'f-dn');
              _e._$addClassName(this.__export.tab, 'f-dn');
              _e._$addClassName(this._tabWrap, 'f-dn');

              //申请记录cache
              this.__pgApplyCache = _pgApplyCache._$$CachePGApplying._$allocate({
                onlistload: function () {
                  var pgid = this.__project.progroupId;
                  if (this.__applyId) {
                    var applyInfo = this.__pgApplyCache._$getItemInCache(this.__applyId);
                    if (applyInfo.verifyResult === this.dbConst.PRG_ROP_SYSTEM) {
                      this.__pgCache._$clearItemInCache(pgid);
                      this.__pgCache._$getItem({
                        id: pgid
                      });
                    } else {
                      this.__applyRedirect();
                    }
                  } else {
                    var applyList = this.__pgApplyCache._$getListInCache(_pgApplyCache._$cacheKey);
                    var isApplying = false;
                    _u._$forEach(applyList, function (item) {
                      if (item.progroupId == pgid && item.verifyResult == _dbConst.PRG_ROP_NONE) {
                        //若是尚未处理，则显示正在申请中
                        isApplying = true;
                      }
                    }._$bind(this));
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

                    _jst._$render(this._othersView, 'pro-simple-info',
                      {
                        name: this.__project.name,
                        description: this.__markdown.render(this.__project.description || ''),
                        id: pgid,
                        pgname: this.__project.progroupName,
                        other: true,
                        applying: isApplying
                      }
                    );
                  }
                }._$bind(this),
                onitemadd: function (_result) {
                  this.__pgApplyCache._$clearListInCache(_pgApplyCache._$cacheKey);
                  this.__applyId = _result.data.id;
                  this.__pgApplyCache._$getList({
                    key: _pgApplyCache._$cacheKey
                  });
                }._$bind(this)
              });
              this.__pgApplyCache._$getList({
                key: _pgApplyCache._$cacheKey
              });
            } else {
              _e._$addClassName(this._othersView, 'f-dn');
              _e._$delClassName(this.__export.parent, 'f-dn');
              _e._$delClassName(this.__export.tab, 'f-dn');
              _e._$delClassName(this._tabWrap, 'f-dn');
            }
          }._$bind(this),
          onitemload: function () {
            var projectGroup = this.__pgCache._$getItemInCache(this.__project.progroupId);
            var pgs = this.__pgCache._$getListInCache(_pgCache._$cacheKey);
            pgs.push(projectGroup);
            _v._$dispatchEvent(
              _pgCache._$$CacheProGroup, 'listchange', {}
            );
            this.__applyRedirect();
          }._$bind(this)
        });
        this.__pgCache._$getList({
          key: _pgCache._$cacheKey
        });
      }._$bind(this)
    });
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
    var tabCon = _e._$getByClassName(this.__body, 'tab-con')[0];
    this.__doInitDomEvent([
      [
        window, 'apply',
        function (evt) {
          this.__alert(evt.name, evt.id);
        }._$bind(this)
      ],
      [
        tabCon, 'scroll',
        function (evt) {
          if (tabCon.scrollTop === 0) {
            _e._$delClassName(this._tabWrap, 'nei-scrolled');
          } else {
            _e._$addClassName(this._tabWrap, 'nei-scrolled');
          }
        }._$bind(this)
      ]
    ]);
  };

  _pro.__applyRedirect = function () {
    delete this.__applyId;
    dispatcher._$refresh();
  };
  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    // 隐藏加载中状态，防止模块中未隐藏。
    _e._$addClassName(_e._$getByClassName(this.__body, 'u-loading')[0], 'f-dn');
    this.__pid = _options.param.pid;
    this.__super(_options);
    //发送项目请求
    this.__proCache._$getItem({
      id: this.__pid
    });
    this._addClassByTargetUMI(_options.target);
  };

  // 给 this.__body 添加类, 不同的模块样式有所差异
  _pro._addClassByTargetUMI = function (umi) {
    if (umi.indexOf('res') > -1) {
      // 资源管理
      _e._$addClassName(this.__body, 'res-view');
    } else {
      // 其他
      _e._$delClassName(this.__body, 'res-view');
    }
  };
  /**
   * 隐藏模块
   * @return {[type]} [description]
   */
  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    delete this.__project;
    _e._$addClassName(this._othersView, 'f-dn');
    _e._$delClassName(this._tabWrap, 'nei-scrolled');
    this.__pgCache && this.__pgCache._$recycle();
    delete this.__pgCache;
    this.__pgApplyCache && this.__pgApplyCache._$recycle();
    delete this.__pgApplyCache;
  };

  /**
   * 申请权限弹窗
   * @param  {String} name 项目组名称
   * @param  {Number} id   项目组id
   * @return {Void}
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

  // notify dispatcher
  _m._$regist(
    'progroup-p',
    _p._$$ModuleProGroupP
  );
});
