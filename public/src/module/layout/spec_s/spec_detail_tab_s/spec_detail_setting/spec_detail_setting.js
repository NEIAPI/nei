NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/cache/varmap_cache',
  'pro/cache/jarmap_cache',
  'pro/cache/user_cache',
  'pro/cache/spec_cache',
  'pro/params_preview/params_preview',
  'json!{3rd}/fb-modules/config/db.json',
  'pro/notify/notify',
  'pro/modal/modal'
], function (_k, _e, _t, _l, _jst, _m, _varmapCache, _jarmapCache, _usrCache, _scache, _params, _db, _notify, _modal, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModulespecDetailRule}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModulespecDetailRule = _k._$klass();
  _pro = _p._$$ModulespecDetailRule._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-detail-rule')
    );
    this.__scache = _scache._$$CacheSpec._$allocate({
      onitemload: function () {
        var sdata = this.__scache._$getItemInCache(this.__specid);
        var usr = _usrCache._$$CacheUser._$allocate({})._$getUserInCache();
        _jst._$render(this.__body, 'm-spec-detail-rule', {
          key: sdata.toolKey
        });
        this.__varmapCache = _varmapCache._$$CacheVarMap._$allocate({
          onlistload: function (_r) {
            var data = this.__varmapCache._$getListInCache(this.__varmapCacheKey + '-' + sdata.type);
            this.__varmap && this.__varmap._$recycle();
            this.__varmap = _params._$$Editor._$allocate({
              parent: _e._$getByClassName(this.__body, 'm-rule-list')[0],
              parentId: this.__specid,
              specType: sdata.type,
              parentType: 0,
              params: data,
              format: 7,
              shape: 'standard',
              listKey: this.__varmapCacheKey,
              level: sdata.creator.id == usr.id ? 1 : 0
            });
            //获取复制到粘贴板的节点
            this.__copyTxt = _e._$getByClassName(this.__body, 'copy-txt')[0];
            this.__sampleCode = _e._$getByClassName(this.__body, 'sample-code')[0];
            this.__copyBtn = _e._$getByClassName(this.__body, 'copy-btn')[0];
            var editable = sdata.creator.id == usr.id ? 1 : 0;
            if (editable) {
              this.__refreshBtn = _e._$getByClassName(this.__body, 'refresh-btn')[0];
              _e._$delClassName(this.__refreshBtn, 'f-dn');
              this.__doInitDomEvent([[
                this.__refreshBtn, 'click', this.__refreshKey.bind(this)
              ]]);
            }
            this.__doInitDomEvent([[
              this.__copyBtn, 'click', this.__clipboard.bind(this)
            ]]);
            hljs.highlightBlock(this.__sampleCode);
          }.bind(this)
        });
        this.__varmapCache._$getList({
          key: this.__varmapCacheKey,
          data: {
            parentId: this.__specid,
            parentType: _db.SPC_MAP_SPEC
          }
        });
        //实例与类名映射 只有Web工程有，限制语言为 Java
        if (sdata.language != _db.SPC_LNG_JAVA) {
          var node = _e._$getByClassName(this.__body, 'm-jar-wrap')[0];
          _e._$addClassName(node, 'f-dn');
        }
        this.__jarmapCache = _jarmapCache._$$CacheJarMap._$allocate({
          onlistload: function (_r) {
            var data = this.__jarmapCache._$getListInCache(this.__jarmapCacheKey);
            this.__jarmap && this.__jarmap._$recycle();
            this.__jarmap = _params._$$Editor._$allocate({
              parent: _e._$getByClassName(this.__body, 'm-jar-list')[0],
              parentId: this.__specid,
              parentType: 0,
              params: data,
              format: 9,
              shape: 'standard',
              listKey: this.__jarmapCacheKey,
              level: sdata.creator.id == usr.id ? 1 : 0
            });
          }.bind(this)
        });
        //此处需要修改
        this.__jarmapCache._$getList({
          key: this.__jarmapCacheKey,
          data: {
            specId: this.__specid
          }
        });
      }.bind(this),
      onrefreshkey: function (evt) {
        var key = _e._$getByClassName(this.__copyTxt, 'key')[0];
        key.innerHTML = evt.data[0].toolKey;
      }._$bind(this)
    });
  };
  _pro.__onShow = function (options) {
    this.__super(options);
    this.__doInitDomEvent([
      [this.__scache.constructor, 'onlanguageupdate', function (evt) {
        var node = _e._$getByClassName(this.__body, 'm-jar-wrap')[0];
        if (evt.language == _db.SPC_LNG_JAVA) {
          _e._$delClassName(node, 'f-dn');
        } else {
          _e._$addClassName(node, 'f-dn');
        }
      }._$bind(this)]
    ]);
  };
  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    //参数映射列表
    this.__specid = _options.param.id;
    this.__varmapCacheKey = 'varmap-spec-' + this.__specid;
    this.__jarmapCacheKey = 'jarmap-spec-' + this.__specid;
    if (this.__specid) {
      this.__scache._$getItem({
        key: _scache._$cacheKey,
        id: this.__specid
      });
    }
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__varmap && this.__varmap._$recycle();
    this.__varmap = null;
    this.__super();
    this.__doClearDomEvent();
  };

  /**
   * 复制到剪贴板
   */
  _pro.__clipboard = function (evt) {
    var transfer = _e._$getByClassName(this.__body, 'copy-transfer')[0];
    if (!transfer) {
      transfer = _e._$create('textarea', 'copy-transfer', this.__body);
      var transferNode = _e._$getByClassName(this.__body, 'copy-transfer')[0];
      _e._$style(transferNode, {position: 'absolute', left: '-9999px', top: '-9999px'});
    }
    if (this.__copyTxt.innerText) {
      transfer.value = this.__copyTxt.innerText.trim();
      transfer.focus();
      transfer.select();
      document.execCommand('Copy', false, null);
      _notify.success('已成功复制到剪贴板');
    } else {
      _notify.error('工具标识为空');
    }
  };
  /**
   * 重新生成key
   */
  _pro.__refreshKey = function () {
    if (!!this.__refreshLayer) {
      this.__refreshLayer.destroy();
      this.__refreshLayer = null;
    }
    this.__refreshLayer = new _modal({
      data: {
        'contentTemplate': '<div>重新生成之后，之前的key将无法使用，确认重新生成吗？</div>',
        'class': 'm-modal-refresh',
        'title': '重新生成key',
        'closeButton': true,
        'okButton': true,
        'cancelButton': true
      }
    })
      .$on('ok', function () {
        this.__scache._$refreshKey({
          id: this.__specid,
          key: this.__varmapCacheKey
        });
      }.bind(this));
  };


  // notify dispatcher
  _m._$regist(
    'spec-detail-setting',
    _p._$$ModulespecDetailRule
  );
});
