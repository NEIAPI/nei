NEJ.define([
  '/src/lib/regularjs/dist/regular.js'
], function (r, p) {
  var dom = Regular.dom;
  p.Component = Regular.extend({
    emmiter: new Regular(),
    copy: function (object) {
      return JSON.parse(JSON.stringify(object));
    }
  }).directive({
    'r-autofocus': function (elem, value) {
      setTimeout(function () {
        elem.focus();
      }, 0);
    }
  });
  return p;
});
