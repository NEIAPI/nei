/*
 * 公式生成器
 */
NEJ.define([
  'base/util',
  'base/event',
  'pro/common/util',
  'pro/cache/constraint_cache',
  'text!./select.html',
  'json!./model.json'
], function (u, v, _, cache, html, model) {
  /**
   * 格式化数据
   */
  var list = (function (list) {
    u._$forEach(list, function (item) {
      var typelist = item.list;
      var alllist = [];
      u._$forEach(typelist, function (typeitem) {
        alllist = alllist.concat(typeitem.list);
      });
      typelist.unshift({
        name: item.name + 'All',
        label: '<全部>',
        list: alllist
      });
    });
    return list;
  })(model.data);
  return Regular.extend({
    template: html,
    name: 'expression-sel',
    config: function (data) {
      _._$extend(this.data, {});
      this.__cache = cache._$$CacheConstraint._$allocate({
        onlistload: function (option) {
          var _list = this.__cache._$getListInCache(option.key);
          _list.forEach(function (item) {
            item.label = item.name;
          });
          this.data.list[0].list[0].list = _list;
          this.$update();
        }._$bind(this)
      });
      this.data.list = list;
      this.data.selectElem = this.data.list[0];
      this.data.selectType = this.data.selectElem.list[0];
      this.__cache._$getList({
        key: this.__cache._$getListKey(this.data.pid, 'datatype'),
        data: {
          pid: this.data.pid
        }
      });
      this.supr();
    },
    init: function (data) {
      this.supr();
      //this.$on('reset', this.reset._$bind(this));
    },
    /**
     * 点击表达式元素
     */
    clickElem: function (evt, item) {
      v._$stop(evt);
      this.data.selectElem = item;
      this.data.selectType = item.list[0];
    },
    /**
     * 点击表达式类型
     */
    clickType: function (evt, item) {
      v._$stop(evt);
      this.data.selectType = item;
    },
    /**
     * 点击表达式值
     */
    clickVal: function (evt, item, eventType) {
      v._$stop(evt);
      var type = this.data.selectElem.name;
      this.$emit('select', {
        type: type,
        eventType: eventType,
        value: item.label,
        description: item.description
      });
    },
    /**
     * 重置选择
     */
    //reset: function() {
    //    //this.data.selectElem = this.data.list[0];
    //    //this.data.selectType = this.data.selectElem.list[0];
    //    //this.$update();
    //},
    destroy: function () {
      this.supr();
    }
  });
});
