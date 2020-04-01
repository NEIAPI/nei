NEJ.define([
  'base/klass',
  'pro/common/res_ref_module',
  'pro/cache/spec_cache'
], function (k, resRefModule, specCache, p, pro) {

  p._$$ModuleSpecRef = k._$klass();
  pro = p._$$ModuleSpecRef._$extend(resRefModule._$$ResRefModule);

  pro.__doBuild = function () {
    this.__bodyTemplateId = 'module-spec-ref';
    this.__detailTemplateId = 'module-spec-ref-detail';
    this._cacheModule = specCache;
    this._cacheKlass = this._cacheModule._$$CacheSpec;
    this._refType = 'spec';
    this.__super();
  };

  resRefModule._$regist(
    'spec-ref',
    p._$$ModuleSpecRef
  );
});
