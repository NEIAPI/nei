/*
 * 项目文档模块
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'pro/common/module',
  'util/template/tpl',
  'util/template/jst',
  'pro/cache/doc_cache',
  'pro/common/util',
  'pro/layout/doc/util',
  'json!{3rd}/fb-modules/config/db.json',
], function (k, e, v, _m, tpl, jst, cache, u, util, db, _p, _pro) {

  /**
   * 项目文档
   *
   * @class   _$$Module
   * @extends pro/widget/module._$$Module
   * @param  {Object} options - 模块输入参数
   */
  _p._$$Module = k._$klass();
  _pro = _p._$$Module._$extend(_m._$$Module);


  _pro.__doBuild = function () {
    this.__super();
    this.__body = e._$html2node(
      tpl._$getTextTemplate('markdown-body')
    );

    this.__renderNode = e._$getByClassName(this.__body, 'markdown-body-doc')[0];
    this.__cache = cache._$$CacheDoc._$allocate({});

  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    util._$initPrint(_options);
  };

  _pro.__onHide = function () {
    this.__super();
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var projectInfo = this.__cache._$getProjectInfo();
    this.__renderNode.innerHTML = util._$renderMembers();
  };


  _m._$regist(
    'layout-doc-members',
    _p._$$Module
  );
  return _p;
});
