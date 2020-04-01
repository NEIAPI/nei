NEJ.define([
  'base/klass',
  'pro/common/res_ref_module',
  'pro/cache/datatype_cache'
], function (k, resRefModule, dataTypeCache, p, pro) {

  p._$$ModuleResDatatypeRef = k._$klass();
  pro = p._$$ModuleResDatatypeRef._$extend(resRefModule._$$ResRefModule);

  pro.__doBuild = function () {
    this.__bodyTemplateId = 'module-res-datatype-ref';
    this.__detailTemplateId = 'module-res-datatype-ref-detail';
    this._cacheModule = dataTypeCache;
    this._cacheKlass = this._cacheModule._$$CacheDatatype;
    this.__super();
  };

  resRefModule._$regist(
    'res-datatype-ref',
    p._$$ModuleResDatatypeRef
  );
});
