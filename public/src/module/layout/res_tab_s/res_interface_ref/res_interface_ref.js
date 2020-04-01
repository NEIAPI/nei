NEJ.define([
  'base/klass',
  'pro/common/res_ref_module',
  'pro/cache/interface_cache'
], function (k, resRefModule, interfaceCache, p, pro) {

  p._$$ModuleResInterfaceRef = k._$klass();
  pro = p._$$ModuleResInterfaceRef._$extend(resRefModule._$$ResRefModule);

  pro.__doBuild = function () {
    this.__bodyTemplateId = 'module-res-interface-ref';
    this.__detailTemplateId = 'module-res-interface-ref-detail';
    this._cacheModule = interfaceCache;
    this._cacheKlass = this._cacheModule._$$CacheInterface;
    this.__super();
  };

  resRefModule._$regist(
    'res-interface-ref',
    p._$$ModuleResInterfaceRef
  );
});
