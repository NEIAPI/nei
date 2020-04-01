NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'base/event',
  'util/template/tpl',
  'pro/cache/spec_cache',
  'pro/common/module',
  'pro/common/regular/regular_base',
  'json!{3rd}/fb-modules/config/db.json'
], function (_k, _e, _u, _v, _l, _sCache, _m, _re, _db, _p, _pro) {
  /**
   * 项目组树模块
   * @class   {wd.m._$$ModulespecTree}
   * @extends {nej.ut._$$AbstractModule}
   */
  _p._$$ModulespecTree = _k._$klass();
  _pro = _p._$$ModulespecTree._$extend(_m._$$Module);

  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-tree')
    );
    this.__treeNode = _e._$getByClassName(document, 'tree-wrap')[0];
    this.__contentWrap = _e._$getSibling(this.__treeNode);
    this.__sCache = _sCache._$$CacheSpec._$allocate({
      onitemload: function (result) {
        var data = this.__sCache._$getItemInCache(result.id);
        switch (data.type) {
          case _db.CMN_TYP_WEB:
            this.specType = 'web';
            break;
          case _db.CMN_TYP_AOS:
            this.specType = 'aos';
            break;
          case _db.CMN_TYP_IOS:
            this.specType = 'ios';
            break;
          case _db.CMN_TYP_TEST:
            this.specType = 'test';
            break;
        }
        this.__initTree();
      }.bind(this)
    });
  };
  /**
   * 显示模块
   * @param {Object} 配置参数
   * @private
   */
  _pro.__onShow = function (_options) {
    this.listType = _options.param.l || (location.href.indexOf('/spec/create') != -1 ? 'my' : 'all');
    if (!_options.param.hasOwnProperty('s') && _options.param.hasOwnProperty('id')) {
      this.__sCache._$getItem({
        key: _sCache._$cacheKey,
        id: _options.param.id
      });
    } else {
      this.specType = 'web';
      this.__initTree();
    }
    this.__doInitDomEvent([
      [location, 'urlchange', function (opt) {
        this.__specTree.$emit('urlchange', opt);
      }.bind(this)]
    ]);
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    this.__specTree && this.__specTree.destroy();
    this.__specTree = null;
  };
  /**
   * 构建树结构
   * @return {Void}
   */
  _pro.__createTree = function () {
    var _this = this;
    var specTree = _re.extend({
      name: 'spec_tree',
      template: _l._$getTextTemplate('regular-spec-tree'),
      config: function () {
        this.data = _u._$merge({
          list: [
            {name: 'WEB', key: 'web'},
            {name: 'iOS', key: 'ios'},
            {name: 'Android', key: 'aos'},
            {name: '测试', key: 'test'}
          ]
        }, this.data);
        this.data.list.forEach(function (item) {
          item.open = true;
          item.selected = false;
        });
        this.data.showTreeFlag = window.sessionStorage.showSpecTreeFlag === 'true' ? true : false;
        this.supr();
      },
      init: function () {
        this.$on('urlchange', this.reset.bind(this));
      },
      toggle: function (item, event) {
        if (!Regular.dom.hasClass(event.target, 'u-create-btn')) {
          item.open = !item.open;
        }
      },
      reset: function (opt) { //url变化时的选中状态
        if (opt.href.indexOf('/spec/list') != -1) {
          if (opt.query.s && opt.query.l) {
            this.data.specType = opt.query.s;
            this.data.listType = opt.query.l;
            this.$update();
            _v._$dispatchEvent(document, 'onspeclistchange', {
              listHref: '/spec/list?s=' + this.data.specType + '&l=' + this.data.listType
            });
          }
        } else if (opt.href.indexOf('spec/create') != -1) {
          this.data.listType = 'my';
          this.$update();
          _v._$dispatchEvent(document, 'onspeclistchange', {
            listHref: '/spec/list?s=' + this.data.specType + '&l=' + this.data.listType
          });
        }
      },
      toggleTree: function () {
        this.data.showTreeFlag = !this.data.showTreeFlag;
        window.sessionStorage.showSpecTreeFlag = this.data.showTreeFlag;
        if (!this.data.showTreeFlag) {
          _e._$addClassName(_this.__treeNode, 'j-animation ');
          _e._$addClassName(_this.__contentWrap, 'j-contentAnimation');
        } else {
          _e._$delClassName(_this.__treeNode, 'j-animation');
          _e._$delClassName(_this.__contentWrap, 'j-contentAnimation');
        }
        this.$update();
      }

    });
    return specTree;
  };
  /**
   * 初始化规范树
   * @return {Void}
   */
  _pro.__initTree = function () {
    var specTree = this.__createTree();
    this.__specTree = new specTree({
      data: {
        specType: this.specType,
        listType: this.listType
      }
    }).$inject(this.__body, 'top');
  };
  // notify dispatcher
  _m._$regist(
    'spec-tree',
    _p._$$ModulespecTree
  );
});
