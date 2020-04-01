/*
 * filter---------------------------------------------------
 */
NEJ.define([
  '3rd/regularjs/dist/regular'
], function (r) {
  var dom = Regular.dom;
  return {
    'enter': function (elem, fire) {
      var _eventHandle = function (event) {
        if (event.which == 13) {
          event.preventDefault();
          event.stopPropagation();
          fire(event);
        }
      };
      dom.on(elem, 'keypress', _eventHandle);
      return function destroy() {
        dom.off(elem, 'keypress', _eventHandle);
      };
    }
  };
});
