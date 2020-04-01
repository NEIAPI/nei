/*
 * directive--------------------------------------------------
 */
NEJ.define([
  'lib/base/element',
  '3rd/regularjs/dist/regular'
], function (e, r) {
  return {
    'r-autofocus': function (elem, value) {
      setTimeout(function () {
        elem.focus();
      }, 0);
    },
    'r-show': function (elem, value) {
      if (typeof value === 'object' && value.type == 'expression') {
        this.$watch(value, function (newValue, oldValue) {
          if (!newValue == !oldValue) return;

          if (typeof newValue === 'string') {
            elem.style.display = newValue;
          } else {
            elem.style.display = newValue ? 'block' : '';
          }
        });

      } else if (!!value || value === '') {
        if (typeof value === 'string' && value !== '') {
          elem.style.display = value;
        } else {
          elem.style.display = value ? 'block' : '';
        }
      }
    },
    'z-sel': function (elem, value) {
      if (typeof value === 'object' && value.type == 'expression') {
        this.$watch(value, function (newV, oldV) {
          if (newV) {
            e._$addClassName(elem, 'z-sel');
          } else {
            e._$delClassName(elem, 'z-sel');
          }
        });
      } else if (!!value || value === '') {
        e._$addClassName(elem, 'z-sel');
      }
    }
  };
});
