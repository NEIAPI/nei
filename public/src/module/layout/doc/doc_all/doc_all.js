/*
 * 项目文档模块
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'pro/common/module',
  'util/template/tpl',
  'util/template/jst',
  'pro/cache/doc_cache',
  'pro/common/util',
  'pro/layout/doc/util',
  'json!{3rd}/fb-modules/config/db.json',
], function (k, _butil, e, v, _m, tpl, jst, cache, u, util, db, _p, _pro) {

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

    this.cache = cache._$$CacheDoc._$allocate({});
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    util._$initPrint(_options);
    var html = util._$renderAll();
    $(this.__body).prepend(html);

    var interfaceData = util._$getInterfaceDataByRoute({
      id: 0
    });
    var datatypeData = this.cache._$getDatatypeData();
    var templateData = this.cache._$getTemplateData();
    var pageData = this.cache._$getPageData();
    var constraintsData = this.cache._$getConstraintData();

    u._$createSampleCode($('section.interfaces')[0], 'interfaces', interfaceData, constraintsData, datatypeData);
    u._$createSampleCode($('section.datatypes')[0], 'datatypes', datatypeData, constraintsData, datatypeData);
    u._$createSampleCode($('section.templates')[0], 'templates', templateData, constraintsData, datatypeData);
    u._$createSampleCode($('section.pages')[0], 'pages', pageData, constraintsData, datatypeData);
    util._$ajustToPrint();
  };

  _pro.__onHide = function () {
    this.__super();
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
  };

  _m._$regist(
    'layout-doc-all',
    _p._$$Module
  );
  return _p;
});
