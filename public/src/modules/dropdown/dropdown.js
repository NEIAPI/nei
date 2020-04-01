NEJ.define([
  'index/component/base',
  'base/event',
  'base/util',
  'base/element',
  'index/validation/validation',
  'text!./dropdown.html'
], function (b, v, u, e, Validation, tpl, pro) {
  var Base = b.Component;
  var Dropdown = Base.extend({
    name: 'roleSelect',
    template: tpl,
    config: function (data) {
      u._$merge(this.data, {
        value: 0,
        pass: true
      });
      this.supr();
      var $outer = this.$outer;
      if ($outer && $outer instanceof Validation) {
        $outer.controls.push(this);
      }
    },
    init: function () {
      this.supr();
    },
    toggle: function (open) {
      if (open === undefined) {
        open = !this.data.open;
      }
      this.data.open = open;
      var index = Dropdown.opens.indexOf(this);
      if (open && index < 0) {
        Dropdown.opens.push(this);
      } else if (!open && index >= 0) {
        Dropdown.opens.splice(index, 1);
      } else {

      }
      this.$emit('toggle', {
        sender: this,
        open: open
      });
    },
    select: function (item) {
      this.$emit('select', {
        sender: this,
        selected: item
      });
      this.data.value = item.id;
      this.data.title = item.name;
      this.data.pass = this.data.value != 0 ? true : false;
      this.toggle(false);
    },
    validate: function () {
      this.data.pass = this.data.value != 0 ? true : false;
      return this.data.pass;
    },
    destroy: function () {
      var index = Dropdown.opens.indexOf(this);
      index >= 0 && Dropdown.opens.splice(index, 1);
      this.supr();
    }

  });
  Dropdown.opens = [];
  v._$addEvent(document, 'click', function (event) {
    Dropdown.opens.forEach(function (dropdown, index) {
      // 这个地方不能用stopPropagation来处理，因为展开一个dropdown的同时要收起其他dropdown
      var element = dropdown.$refs.element;
      var element2 = event.target;
      while (element2) {
        if (element == element2) return;
        element2 = element2.parentElement;
      }
      dropdown.toggle(false);
      dropdown.$update();
    });
  });
  return Dropdown;
});
