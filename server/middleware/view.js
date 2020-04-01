/**
 * Content Negotiation Response Middleware
 */

const log = require('../util/log');
const path = require('path');

/**
 * Content Negotiation，see View Resolver Options for other configuration
 *
 * @param {Object} options - view resolver config
 * @param {Object} options.root     - view root
 * @param {Object} options.resolver - view resolver name
 */

module.exports = function (options) {
  // build view resolver
  let root = '../view/';
  // complete system resolver
  let resolver = options.resolver;
  if (!resolver.includes('/')) {
    resolver = path.join(root, resolver);
  }
  let json = new (require(path.join(root, 'JSONResolver')))();
  let engine = new (require(resolver))(options);
  /**
   * check request by XHR
   * @private
   * @param  {KoaContext} ctx - koa context object
   * @return {Boolean} whether request by XHR
   */
  let _isRequestByXHR = function (ctx) {
    return ctx.headers[options.xhr] != null ||
      Object.prototype.hasOwnProperty.call(ctx.query, '_json');
  };
  /**
   * Content Negotiation Response Middleware
   * @param  {GeneratorFunction} next - next process
   * @return {Void}
   */
  return function* view(next) {
    let model = this.model;
    // non-template view
    if (!this.viewFile) {
      if (model) {
        this.body = json.render(model);
      }
      return yield next;
    }
    // check model back to UA
    log.debug(
      '[Middleware.ViewResolver] resolve view %s',
      this.viewFile, {model: model}
    );
    // check content for view
    if (_isRequestByXHR(this)) {
      log.debug(
        '[Middleware.ViewResolver] resolve view %s as json',
        this.viewFile
      );
      this.body = json.render(model);
      return yield next;
    }
    // content return back to UA
    this.body = yield engine.render(
      model, this.viewFile
    );
    yield next;
  };
};
