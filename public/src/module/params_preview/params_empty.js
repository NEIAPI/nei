/*
 * 参数编辑器,无参数显示组件------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'json!./menu.json',
  'text!./params_empty.html'
], function (b, v, u, e, _, config, tpl) {
  var ParamsEmpty = b.extend({
    name: 'params-empty',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        source: [{id: 0, name: '哈希'}, {id: 1, name: '枚举'}, {id: 2, name: '数组'}, {id: 3, name: '字符'}, {
          id: 4,
          name: '数值'
        }, {id: 5, name: '布尔'}, {id: 6, name: '文件'}]
      });
      this.data.selected = this.data.source[this.data.format];
      this.data.xlist = config[this.data.format].filter(function (item) {
        return item.action != 'modify';
      });
      this.data.mlist = config[this.data.format].filter(function (item) {
        return item.action == 'modify';
      });
      if (this.data.parentType == 0 || this.data.parentType == 1) {
        this.data.mlist = [];
      }
      if (this.data.format == 7) {
        this.data.emptyTip = '变量映射规则';
      } else {
        this.data.emptyTip = '参数信息';
      }
      this.supr(this.data);
    },
    init: function () {
      this.supr();
    },
    _onChange: function ($event) {
      this.$parent._onMenuCheck({
        format: $event.selected.id,
        action: 'modify'
      });
    },
    _onAction: function (type) {
      if (type == 'add') {
        this.$parent.add();
      } else {
        this.$emit('import', type);
      }
    }

  });
  return ParamsEmpty;
});
