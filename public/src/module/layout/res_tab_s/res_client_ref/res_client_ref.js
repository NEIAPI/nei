NEJ.define([
  'base/klass',
  'pro/common/res_ref_module',
  'pro/cache/client_cache'
], function (k, resRefModule, _cache, p, pro) {

  p._$$ModuleResClientRef = k._$klass();
  pro = p._$$ModuleResClientRef._$extend(resRefModule._$$ResRefModule);

  pro.__doBuild = function () {
    this.__bodyTemplateId = 'module-res-client-ref';
    this.__detailTemplateId = 'module-res-client-ref-detail';
    this._cacheModule = _cache;
    this._cacheKlass = this._cacheModule._$$CacheClient;
    this.__super();
  };

  resRefModule._$regist(
    'res-client-ref',
    p._$$ModuleResClientRef
  );
});
