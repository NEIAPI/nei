/*
 * 未处理申请列表组件-------------------------------------------------
 * -------------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/modal/modal_agree',
  'pro/modal/modal_reject',
  'pro/cache/pg_applying_cache',
  'text!./processlist.html'
], function (base, v, u, e, _, ModalAgree, ModalReject, cache, tpl) {
  var ProcessList = base.extend({
    template: tpl,
    name: 'processlist',
    config: function () {
      _._$extend(this.data, {
        xlist: []
      });
      this.__cache = cache._$$CachePGApplying._$allocate({
        onlistload: function () {
          var list = this.__cache._$getListInCache(cache._$cacheKeyVerifying);
          list.forEach(function (item) {
            item.uiCreateTime = u._$format(new Date(item.createTime), 'yyyy/MM/dd HH:mm:ss');
          });
          list.sort(function (itemA, itemB) {
            return itemB.createTime - itemA.createTime;
          });
          this.data.xlist = list;
          this.$update();
        }.bind(this),
        onverify: function (option) {
          var item = this.__cache._$getItemInCache(option.ext.id);
          this.data.xlist[option.ext.index]['state'] = item.verifyResult;
          this.$update();
        }._$bind(this)
      });
      this.__cache._$getList({
        key: cache._$cacheKeyVerifying
      });
    },
    init: function () {

    },
    _agree: function (index, item) {
      this.__modal1 = new ModalAgree({
        data: {}
      });
      this.__modal1.$on('ok', function (option) {
        this._submit({v: _.db.CMN_BOL_YES, role: option.id, id: item.id, ext: {id: item.id, index: index}});
      }._$bind(this));
    },
    _reject: function (index, item) {
      this.__modal2 = new ModalReject({
        data: {}
      });
      this.__modal2.$on('ok', function (option) {
        this._submit({v: _.db.CMN_BOL_NO, message: option.message, id: item.id, ext: {id: item.id, index: index}});
      }._$bind(this));
    },
    _submit: function (data) {
      data.key = cache._$cacheKeyVerifying;
      this.__cache._$verify(data);
    },
    destroy: function () {
      this.supr();
    }
  });
  return ProcessList;
});
