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
  'text!./list_head.html'
], function (v, u, e, _, cache, Base, tpl) {

  var ListHead = Base.extend({
    name: 'list-head',
    template: tpl,
    config: function (data) {
      _._$extend(this.data, {
        checked: false,
        allChecked: false,
        hasChecked: false
      });

      this.supr(data);
    },
    selectAll: function () {
      this.data.allChecked = this.data.hasChecked = !this.data.allChecked;
      this.$emit('headstatuschange', this.data.allChecked);
    },
    init: function () {
      this.supr();
    },
    listCheckChanged: function (listStatus) {
      this.data.allChecked = true;
      var checkNum = 0;
      for (var key in listStatus) {
        if (!listStatus[key]) {
          this.data.allChecked = listStatus[key];
        } else {
          this.data.hasChecked = listStatus[key];
          checkNum++;
        }
      }
      this.data.checkNum = checkNum;
      if (checkNum === 0) {
        this.data.allChecked = this.data.hasChecked = false;
      }
    },
    clearSelected: function () {
      this.data.hasChecked = false;
      this.data.allChecked = false;
      this.$emit('headstatuschange', false);
    },
    reverseSelected: function () {
      if (this.data.allChecked) {
        this.data.hasChecked = this.data.allChecked = !this.data.allChecked;
      }
      this.$emit('reverseSelected');
    },
    resetSelected: function () {
      this.data.hasChecked = false;
      this.data.allChecked = false;
      this.data.checkNum = 0;
      this.$update();
    },
    batRemove: function () {
      this.$emit('batRemove');
    },
    doAppendModel: function () {
      this.$emit('appendModel');
    },
    reset: function () {
      this.data.hasChecked = false;
      this.data.allChecked = false;
    }
  });
  return ListHead;
});
