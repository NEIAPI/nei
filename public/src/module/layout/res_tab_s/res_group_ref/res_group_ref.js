NEJ.define([
  'base/klass',
  'pro/common/res_ref_module',
  'pro/cache/group_cache'
], function (k, resRefModule, groupCache, p, pro) {

  p._$$ModuleResGroupRef = k._$klass();
  pro = p._$$ModuleResGroupRef._$extend(resRefModule._$$ResRefModule);

  pro.__doBuild = function () {
    this.__bodyTemplateId = 'module-res-group-ref';
    this.__detailTemplateId = 'module-res-group-ref-detail';
    this._cacheModule = groupCache;
    this._cacheKlass = this._cacheModule._$$CacheGroup;
    this.__super();
  };

  resRefModule._$regist(
    'res-group-ref',
    p._$$ModuleResGroupRef
  );
});
