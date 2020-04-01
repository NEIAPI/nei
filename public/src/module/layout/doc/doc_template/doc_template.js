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
], function (k, butil, e, v, _m, tpl, jst, cache, u, util, db, _p, _pro) {

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

    //根据项目id获取模型数据
    var datatyeData = this.__cache._$getDatatypeData();
    //根据项目id获取规则
    var constraintsData = this.__cache._$getConstraintData();

    var selectedData = util._$getTemplateDataByRoute(_options);
    var relationalData = [];
    selectedData.forEach(function (data) {
      relationalData.push(data);
      util.__getDeepDatatype(relationalData, data);
    });

    this.relationalNode.innerHTML = util._$renderRelationalDatatypes(selectedData, true);
    this.renderNode.innerHTML = util._$renderTemplatesByRoute(_options);
    e._$addClassName(this.relationalNode, 'node-hide');
    u._$createSampleCode(this.renderNode, 'templates', selectedData, constraintsData, datatyeData);
    u._$createSampleCode(this.relationalNode, 'datatypes', relationalData, constraintsData, datatyeData);
    util._$ajustToPrint();
  };


  _pro.__getWholeTemplateDataByRoute = function (route) {
    var data = this.__projectInfo;
    var selectedData = this.__getTemplateDataByRoute(route);
    data.selectedData = selectedData;
    return data;
  };

  _pro.__getTemplateDataByRoute = function (route) {
    var templatesData = this.__cache._$getTemplateData();
    var idsArray = route.param.resid || 0;
    var selectedData = [];
    if (idsArray != 0) {
      if (!butil._$isArray(idsArray)) {
        idsArray = idsArray.split(',');
      }

      templatesData.forEach(function (item) {
        idsArray.forEach(function (id) {
          if (id == item.id) {
            selectedData.push(item);
          }
        });
      });

    } else {
      selectedData = templatesData;
    }
    return selectedData;
  };


  _m._$regist(
    'layout-doc-templates',
    _p._$$Module
  );
  return _p;
});
