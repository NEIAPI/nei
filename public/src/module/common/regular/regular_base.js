/*
 * component基类---------------------------------------------------
 */
NEJ.define([
  './regular_event.js',
  './regular_directive.js'
], function (event, directive, p, pro) {
  p.Component = Regular.extend({
    emitter: new Regular(),
    copy: function (object) {
      return JSON.parse(JSON.stringify(object));
    }
  })
    .event(event)
    .directive(directive)
    .filter({
      'ignoreTextStatus': function (item, index) {
        var text = '';
        var unignoreList = this.data.params[index].imports.filter(function (itm) {
          return !itm.ignored;
        });
        if (unignoreList.length <= 1 && !item.ignored) {
          text = '';
        } else {
          text = item.ignored ? '取消忽略' : '忽略';
        }
        return text;
      }
    })
  ;
  return p.Component;
});
