/**
 * Filter Delegate Middleware
 */

const path = require('path');
const log = require('../util/log');

/**
 * Filter Delegate
 *
 * filter config key is regular expression
 *
 * ```json
 * {
 *      "/api/*": ["AbcFilter","DefFilter","UserFilter"],
 *      "/user/add": "UserFilter"
 * }
 * ```
 *
 * @param {Object} options - config options
 * @param {Object} options.filters - filters config object
 * @param {String} options.roots.appRoot    - app root path
 * @param {String} options.roots.filterPath - filter root path
 */

module.exports = function (options) {
  let root = path.join(
    options.roots.appRoot,
    options.roots.filterPath || '/filter/'
  );
  // {pattern:RegExp,filters:[AbcFilter]}
  let filters = [];
  Object.keys(options.filters).forEach(function (key) {
    let ret = {};
    // check filter class
    ret.pattern = new RegExp(key);
    let it = options.filters[key];
    if (!it) {
      log.warn('[Middleware.Filter] filter for pattern %s is empty', key);
      return;
    }
    // format filter to array
    if (typeof it === 'string') {
      it = [it];
    }
    // include filter module
    it.forEach(function (name, index, list) {
      list[index] = path.join(root, name + '.js');
    });
    // save filter config
    ret.filters = it;
    log.debug(
      '[Middleware.Filter] filter for pattern %s is %j',
      key, it
    );
    filters.push(ret);
  });
  // do nothing if no filters config
  if (!filters.length) {
    log.debug('[Middleware.Filter] no filter config');
    return function* filter(next) {
      yield next;
    };
  }
  // do filter
  return function* filter(next) {
    let ret = [],
      context = this,
      url = context.path,
      method = context.method;
    // dump matched filters and remove repetitive item
    filters.forEach(function (it) {
      // check rules
      if (!it.pattern.test(url)) {
        return;
      }
      // dump filters
      it.filters.forEach(function (file) {
        if (!ret.includes(file)) {
          ret.push(file);
        }
      });
    });
    // no filter match
    if (!ret.length) {
      return yield next;
    }
    log.debug(
      '[Middleware.Filter] filters match to %s:%s are %j',
      method, url, ret
    );
    // do next filter
    let index = 0;
    let chain = function* chain(context, next) {
      let file = ret[index++];
      if (file) {
        log.debug('[Middleware.Filter] do filter %s', file);
        let fn = new (require(file))(
          context, next, chain
        );
        yield fn.doFilter();
      } else {
        // last filter
        yield next;
      }
    };
    // begin filter
    yield chain(context, next);
  };
};
