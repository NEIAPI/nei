NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'text!./radio_group.html'
], function (base, v, u, e, _, tpl, pro) {
  return base.extend({
    name: 'radio-group',
    template: tpl,
    config: function (data) {
    },
    onRadioChange: function (evt) {
      this.$emit('change', evt.event.target.value);
    }
  });
});
