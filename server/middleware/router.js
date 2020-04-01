/**
 * Router Delegate Middleware
 */

const util = require('util');
const path = require('path');
const _ = require('../util/utility');
const log = require('../util/log');

/**
 * Router Delegate， Routes rule config
 *
 * ```json
 * {
 *      "get /page":{
 *          "view": "/page",
 *          "action": "SiteController.home"
 *      },
 *
 *      "get /api/user": "UserController.get",
 *      "get /api/users: "UserController.search",
 *      "post /api/user/add": "UserController.create",
 *      "patch /api/user/:id": "UserController.update",
 *      "delete /api/user/:id": "UserController.remove"
 * }
 * ```
 *
 * @param {Object} options - config options
 * @param {Object} options.routes - route rule config
 * @param {Object} options.roots  - root path config
 * @param {String} options.roots.appRoot  - app root path
 * @param {String} options.roots.webRoot  - web root path
 * @param {String} options.roots.webPath  - web controller root path
 * @param {String} options.roots.apiPath  - api controller root path
 */

module.exports = function (options) {
  // parse resource root
  let roots = options.roots,
    routes = options.routes,
    apiRoot = path.join(
      roots.appRoot,
      roots.apiPath || '/controller/api/'
    ),
    webRoot = path.join(
      roots.appRoot,
      roots.webPath || '/controller/web/'
    );
  // map routers
  let router = new (require('koa-router'))();
  Object.keys(routes).forEach(function (key) {
    // ['get','/login']
    let arr = key.split(/\s+/);
    // default request method is get
    if (arr.length < 2) {
      arr.unshift('GET');
    }
    let [rMethod, rPath] = arr;
    rPath = [rPath];
    let func = router[rMethod.toLowerCase()];
    // method not supported
    if (!func) {
      log.warn(
        '[Middleware.Router] not support route rule %s:%s',
        rMethod, rPath
      );
      return;
    }
    // map url to controller method
    let it = routes[key],
      root = apiRoot,
      action = it,
      view = null;
    // page request
    if (util.isObject(it) && it.view) {
      root = webRoot;
      view = it.view;
      action = it.action;
      if (it.morePaths) {
        rPath.push(...(it.morePaths));
      }
    }
    // parse Controller and method name
    // ['UserController','login']
    let ctrl, method, de4lt;
    if (_.isObject(action)) {
      ctrl = action.ctrl;
      // e.g. {'stick': 'StickProject', 'rtk': 'resetToolKey'}
      method = action.method;
      de4lt = action.de4lt;
    } else {
      [ctrl, method] = action.split('.');
    }

    let file = path.join(root, ctrl + '.js');
    for (let ph of rPath) {
      func.call(router, ph, function*(next) {
        log.debug(
          '[Middleware.Router] dispatch to %s:%s',
          file, method
        );
        if (view) {
          this.viewFile = view;
        }
        let ctrl = new (require(file))(
          this, next
        );
        let cmethod;
        if (_.isObject(method)) {
          Object.keys(method).some(it => {
            if (Object.prototype.hasOwnProperty.call(this.query, it)) {
              cmethod = method[it];
              return true;
            }
          });
          if (typeof cmethod !== 'string' && de4lt) {
            cmethod = de4lt;
          }
        }
        yield ctrl[cmethod || method]();

        // save model to context
        this.model = this.model || ctrl.model || {};

        // go to next middleware
        yield next;
      });
    }
  });
  return router.routes();
};
