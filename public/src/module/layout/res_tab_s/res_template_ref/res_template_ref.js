NEJ.define([
  'base/klass',
  'pro/common/res_ref_module',
  'pro/cache/template_cache'
], function (k, resRefModule, templateCache, p, pro) {

  p._$$ModuleResTemplateRef = k._$klass();
  pro = p._$$ModuleResTemplateRef._$extend(resRefModule._$$ResRefModule);

  pro.__doBuild = function () {
    this.__bodyTemplateId = 'module-res-template-ref';
    this.__detailTemplateId = 'module-res-template-ref-detail';
    this._cacheModule = templateCache;
    this._cacheKlass = this._cacheModule._$$CacheTemplate;
    this.__super();
  };

  resRefModule._$regist(
    'res-template-ref',
    p._$$ModuleResTemplateRef
  );
});
