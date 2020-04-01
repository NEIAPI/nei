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
  'pro/cache/config_caches',
  'pro/common/util',
  'pro/layout/doc/util',
  'json!{3rd}/fb-modules/config/db.json',
], function (k, _butil, e, v, _m, tpl, jst, caches, u, util, db, _p, _pro) {

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
    this.renderNode = e._$getByClassName(this.__body, 'markdown-body-doc')[0];
    this.relationalNode = e._$getByClassName(this.__body, 'markdown-body-doc')[1];
    this.cache = caches.doc._$allocate();
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

    var hash = location.hash.replace('#', '');
    if (hash.indexOf('-') > -1) {
      hash = hash.substring(0, hash.indexOf('-'));
    }
    this.__route = {
      'id': _options.param.resid || 0,
      'isHash': false,
      'hash': hash,
      'isVersion': _options.param.isversion || false
    };
    var datatypeData = this.cache._$getDatatypeData();
    var constraintsData = this.cache._$getConstraintData();

    var result = util.__getDatatypeDataByRoute(this.__route);
    var relationalData = [];
    result.forEach(function (data) {
      relationalData.push(data);
      util.__getDeepDatatype(relationalData, data);
    });
    this.renderNode.innerHTML = util._$renderDatatypesByRoute(this.__route);
    this.relationalNode.innerHTML = util._$renderRelationalDatatypes(relationalData, true);
    e._$addClassName(this.relationalNode, 'node-hide');
    $('h1.title').eq(1).css('display', 'none');
    u._$createSampleCode(this.renderNode, 'datatypes', datatypeData, constraintsData, datatypeData);
    u._$createSampleCode(this.relationalNode, 'datatypes', relationalData, constraintsData, datatypeData);
    //第二个数据类型隐藏，标题也隐藏
    util._$ajustToPrint();
    var projectId = _options.param.id;
    var paramsContainer = e._$getByClassName(this.renderNode, 'm-datatype-params')[0];
    if (this.__route.id) {
      util._$renderDatatypeParams(paramsContainer, projectId, parseInt(this.__route.id), datatypeData);
    }
  };

  _m._$regist(
    'layout-doc-datatypes',
    _p._$$Module
  );
  return _p;
});
