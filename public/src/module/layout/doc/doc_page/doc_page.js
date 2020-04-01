/*
 * 项目文档模块
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'pro/common/module',
  'util/template/tpl',
  'pro/cache/doc_cache',
  'pro/common/util',
  'pro/layout/doc/util',
], function (k, e, v, _m, tpl, cache, u, util, _p, _pro) {

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
    this.pageNode = e._$getByClassName(this.__body, 'markdown-body-doc')[0];
    this.relationalDatatypeNode = e._$getByClassName(this.__body, 'markdown-body-doc')[2];
    this.relationalTemplateNode = e._$getByClassName(this.__body, 'markdown-body-doc')[1];
    this.cache = cache._$$CacheDoc._$allocate({});

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
    var datatyeData = this.cache._$getDatatypeData();
    //根据项目id获取规则
    var constraintsData = this.cache._$getConstraintData();
    var templateData = this.cache._$getTemplateData();
    var selectedData = util._$getPageDataByRoute(_options);
    var relationalData = [];
    var relationalTemplateData = [];
    selectedData.forEach(function (data) {
      //查找模版对应的数据
      if (data.templates.length > 0) {
        data.templates.forEach(function (template) {
          var templateId = template.id;
          templateData.forEach(function (td) {
            if (td.id == templateId) {
              //需要加去重处理
              if (!util.__checkRepeated(relationalTemplateData, td)) {
                relationalTemplateData.push(td);
              }
            }
          });
        });
      }
      relationalData.push(data);
      util.__getDeepDatatype(relationalData, data);
    });
    relationalTemplateData.forEach(function (data) {
      relationalData.push(data);
      util.__getDeepDatatype(relationalData, data);
    });


    this.relationalDatatypeNode.innerHTML = util._$renderRelationalDatatypes(relationalData, true);
    e._$addClassName(this.relationalDatatypeNode, 'node-hide');
    this.pageNode.innerHTML = util._$renderPagesByRoute(_options);
    this.relationalTemplateNode.innerHTML = util._$renderTemplate(relationalTemplateData);
    e._$addClassName(this.relationalTemplateNode, 'node-hide');
    u._$createSampleCode(this.pageNode, 'pages', selectedData, constraintsData, datatyeData);
    u._$createSampleCode(this.relationalDatatypeNode, 'datatypes', relationalData, constraintsData, datatyeData);
    u._$createSampleCode(this.relationalTemplateNode, 'templates', relationalTemplateData, constraintsData, datatyeData);
    util._$ajustToPrint();
  };
  _m._$regist(
    'layout-doc-pages',
    _p._$$Module
  );
  return _p;
});
