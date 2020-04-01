/**
 * EJS View Resolver Class
 */

const wrap = require('thunkify-wrap');
const ejs = wrap(require('ejs').renderFile);
// default ejs config
const DEFAULT = {
  cache: true,
  client: false,
  _with: false,
  suffix: 'ejs'
};

const NViewResolver = require('./NViewResolver');

class EJSResolver extends NViewResolver {
  /**
   * Create ejs Resolver
   * Configuration see https://github.com/mde/ejs#options
   *
   * @param {Object} options - config object
   */
  constructor(options) {
    super(Object.assign(
      {}, DEFAULT, options
    ));
  }

  /**
   * render view
   * @param  {Object} model - model back to UA
   * @param  {String} view  - view filename
   * @return {String} view result
   */
  * render(model, view) {
    view = this._completeFileName(view);
    return yield ejs(view, model, this._options);
  }
}

module.exports = EJSResolver;
