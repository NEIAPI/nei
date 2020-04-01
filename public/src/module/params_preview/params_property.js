/*
 * 显示参数类型属性列表组件--------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/datatype_cache',
  'pro/common/regular/regular_base',
  'text!./params_property.html'
], function (v, u, e, _, cache, Base, tpl) {

  var Menu = Base.extend({
    name: 'type-property',
    template: tpl,
    config: function (data) {
      _._$extend(this.data, {
        plist: []
      });
      this.initDom();
      this.supr(data);
    },
    _goto: function ($event, pid, id) {
      $event.stopPropagation();
      $event.preventDefault();
      dispatcher._$redirect('/datatype/detail/?pid=' + pid + '&id=' + id);
    },
    init: function () {
      this.supr();
      var that = this;
      // this.$watch(id, function () {
      //     that.initDom();
      // });
      Regular.dom.on(Regular.dom.element(this), 'click', function (event) {
        v._$stopBubble(event);
      });
    },
    initDom: function () {
      this.__dttypecache = cache._$$CacheDatatype._$allocate({
        onlistload: function (options) {
          var _opt = this.__dttypecache._$getItemInCache(this.data.id) || [];
          this.data.type = _opt.type;
          this.data.formatType = _opt.format;
          this.data.plist = _opt.params;
          this.$update();
        }.bind(this)
      });
      this.__dttypecache._$getList({
        key: this.__dttypecache._$getListKey(this.data.pid),
        data: {
          pid: this.data.pid
        }
      });
    }
  }).filter({
    'ctrShow': function (format) {
      if (format === 3 || format === 4 || format === 5) {
        return false;
      }
      return true;
    }
  });
  return Menu;
});
