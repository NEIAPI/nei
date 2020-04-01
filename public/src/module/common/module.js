/*
 * 项目模块基类实现文件
 */
NEJ.define([
  'base/klass',
  'util/dispatcher/module',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _m, dbConst, _p, _pro) {
  /**
   * 项目模块基类对象
   * @class   {wd.m._$$Module}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$Module = _k._$klass();
  _pro = _p._$$Module._$extend(_m._$$ModuleAbstract);

  /**
   * 数据库常量
   */
  _pro.dbConst = dbConst;

  /**
   * 从UMI信息中解析出真实地址
   * @return {String} UMI信息
   */
  _pro.__getPathFromUMI = function (_options) {
    var _reg0 = /\?|#/;
    var _reg1 = /^\/m\//i;
    var path = (_options && _options.basePath) || window.location.pathname;
    if (path.substr(-1) !== '/') {
      path += '/';
    }
    path = path.split(_reg0)[0].replace(_reg1, '/');

    var resRegExp = /^\/((interface|rpc|template|datatype|group|constraint|word|client)\/.*)$/;
    var pageRegExp = /^\/page\/(.*)$/;
    var projectRegExp = /^\/project(\/)?(.*)$/;
    var searchRegExp = /^\/search(\/)?(.*)$/;

    if (resRegExp.test(path)) {
      path = path.replace(resRegExp, '/progroup/p/res/$1');
    } else if (pageRegExp.test(path)) {
      path = path.replace(pageRegExp, '/progroup/p/page/$1');
    } else if (projectRegExp.test(path)) {
      path = path.replace(projectRegExp, '/progroup/p/$2');
    } else if (searchRegExp.test(path)) {
      path = path.replace(searchRegExp, '/progroup/search/$2');
    }

    switch (path) {
      case '/setting/':
        path += 'profile/';
        break;

      case '/spec/detail/':
        path += 'doc/';
        break;

      case '/progroup/':
        path += 'home/management/';
        break;

      case '/progroup/detail/':
        path += 'projectmanage/';
        break;

      case '/progroup/p/':
        path += 'res/interface/';
        break;

      case '/progroup/p/res/':
        path += 'interface/';
        break;

      case '/progroup/p/res/interface/detail/':
        path += 'req/';
        break;

      case '/progroup/p/res/rpc/detail/':
        path += 'req/';
        break;

      case '/progroup/p/res/datatype/detail/':
        path += 'attribute/';
        break;

      case '/progroup/search/':
        path += 'group/';
        break;

      case '/test/':
        path += 'group/case/';
        break;

      case '/test/record/':
        path += 'create/';
        break;

      case '/test/group/':
        path += 'case/';
        break;

      default:
        break;
    }
    return path;
  };
  // export regist api
  _p._$regist = _m._$regist;
});
