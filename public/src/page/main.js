/**
 * app 启动
 */
NEJ.define([
  'util/dispatcher/dispatcher',
  'base/event',
  'base/element',
  './main_umi_config.js'
], function (dsp, v, e, umiConfig) {
  // 使用 pushState 方式
  history.auto = true;
  // 开始处理 UMI
  dsp._$startup({
    rules: umiConfig._$rules,
    modules: umiConfig._$modules,
    onbeforechange: function (options) {
      var umi = options.path;
      if (umi.substr(-1) !== '/') {
        umi += '/';
      }
      if (umi && umi.indexOf('/?') === -1 && umi.indexOf('/m') !== 0) {
        switch (umi) {
          case '/setting/':
            umi += 'profile/';
            break;

          case '/spec/':
            umi += 'list/';
            break;

          case '/spec/detail/':
            umi += 'doc/';
            break;

          case '/progroup/':
            umi += 'home/management/';
            break;

          case '/progroup/detail/':
            umi += 'projectmanage/';
            break;

          case '/project/':
            umi += 'res/interface/';
            break;

          case '/project/res/':
            umi += 'interface/';
            break;

          case '/interface/detail/':
            umi += 'req/';
            break;

          case '/rpc/detail/':
            umi += 'req/';
            break;

          case '/datatype/detail/':
            umi += 'attribute/';
            break;

          case '/test/':
            umi += 'group/case/';
            break;

          case '/test/record/':
            umi += 'create/';
            break;

          case '/test/group/':
            umi += 'case/';
            break;

          case '/notification/':
            umi += 'system/';
            break;

          default:
            break;
        }
        options.path = '/m' + umi;
      }
    }
  });
  // 处理不用跳转的超链接, 只改变 url 即可
  v._$addEvent(document, 'click', function (evt) {
    var target = v._$getElement(evt, 'c:stateful');
    if (target && target.tagName === 'A') {
      v._$stop(evt);
      dispatcher._$redirect(target.href);
    }
  });
  // 给 html 标签加个类名, pc 上需要重置滚动条样式
  if (navigator.userAgent.indexOf('Windows NT') !== -1) {
    e._$addClassName(document.documentElement, 'os-pc');
  }
  // ace 配置
  var aceResDir = '/res/ace/src-min/';
  ace.config.set('modePath', aceResDir);
  ace.config.set('themePath', aceResDir);
  ace.config.set('workerPath', aceResDir);
});
