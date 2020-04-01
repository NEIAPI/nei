NEJ.define([
  'base/util',
  'base/element',
  'base/event',
  'util/template/tpl'
], function (u, e, v, t, p) {
  /**
   * 对象扩展
   * @param target 目标对象
   * @param source 对象来源
   * @param override 是否重写
   */
  p._$extend = function (target, source, override) {
    for (i in source) {
      if (!target[i] || override) {
        target[i] = source[i];
      }
    }
    return target;
  };
  /**
   * ajax请求状态码判断
   * @param {obeject} data
   * return {Boolean} 是否成功
   */
  p._$checkStatusCode = (function () {
    var _reg = /^2/;
    return function (_data) {
      return _data && _reg.test(_data.code);
    };
  })();
  return p;
});
