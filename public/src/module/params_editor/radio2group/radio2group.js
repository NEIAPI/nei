/*
 * radio2group 单选组件--------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'text!./radio2group.html'
], function (base, v, u, e, _, tpl, pro) {
  var Radio2Group = base.extend({
    name: 'radio2group',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        selected: null,
        selectedIndex: undefined || 0,
        source: [
          {id: _.db.MDL_FMT_HASH, name: '哈希表'},
          {id: _.db.MDL_FMT_ENUM, name: '枚举'},
          {id: _.db.MDL_FMT_ARRAY, name: '数组'},
          {id: _.db.MDL_FMT_STRING, name: '字符'},
          {id: _.db.MDL_FMT_NUMBER, name: '数值'},
          {id: _.db.MDL_FMT_BOOLEAN, name: '布尔'},
          {id: _.db.MDL_FMT_FILE, name: '文件'}
        ]
      });
      this.supr();
      if (typeof this.data.selectedIndex === 'number') {
        this.data.selected = this.data.source[this.data.selectedIndex];
      }
      // if(this.data.singlePattern) {
      //     this.data.source = [this.data.selected];
      // }
    },
    select: function (item) {
      if (item.id == this.data.selectedIndex) return;
      this.data.selected = item;
      this.data.selectedIndex = item.id;
      this.$emit('change', item.id);
    }

  });
  return Radio2Group;
});
