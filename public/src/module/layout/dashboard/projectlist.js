/*
 * 未处理申请列表组件-------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'text!./projectlist.html',
  'pro/notify/notify',
  'pro/uploadfile/upload_file'
], function (base, v, u, e, _, pg_cache, project_cache, tpl, Notify, uploadfile) {
  var ProcessList = base.extend({
    template: tpl,
    name: 'processlist',
    config: function () {
      this.__pgCache = pg_cache._$$CacheProGroup._$allocate({});
      this.__proCache = project_cache._$$CachePro._$allocate({
        onlistload: function () {
          var list = this.__proCache._$getListInCache(project_cache._$recentCacheKey);
          _._$resetLogo(list, 'name', 'namePinyin');
          this.data.xlist = list.slice(0);
          this.$update();
        }.bind(this)
      });
      this.__proCache._$getList({
        key: project_cache._$recentCacheKey
      });
    },
    init: function () {

    },
    _change: function (event, item, index) {
      this.__proCache._$updateItem({id: item.id, data: {logo: event.file}, ext: {progroupId: item.progroupId}});
      this.data.xlist[index].logo = event.file;
      this.$update();
    },
    _redirect: function (id) {
      if (e._$hasClassName(event.target, 'info-logo') || e._$hasClassName(event.target, 'upload')) {
        event.stopPropagation();
      } else {
        dispatcher._$redirect('/project?pid=' + id);
      }
    },
    destroy: function () {
      this.supr();
    }
  });
  return ProcessList;
});
