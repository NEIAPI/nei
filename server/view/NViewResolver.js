/**
 * Base View Resolver Class
 */

const path = require('path');
// default config
const DEFAULT = {
  suffix: '',
  root: '',
  xhr: 'X-Requested-With'
};

const NObject = require('../NObject');

class NViewResolver extends NObject {
  /**
   * Create a NViewResolver
   * @param {Object} options - view config
   * @param {String} options.root   - view root path
   * @param {String} options.suffix - view file suffix
   */
  constructor(options) {
    super();
    this._options = Object.assign(
      {}, DEFAULT, options
    );
  }

  /**
   * absolute file path and complete file suffix if necessary
   * @protected
   * @param  {String} file - file name or path
   * @return {String} file name append suffix
   */
  _completeFileName(file) {
    let suffix = this._options.suffix;
    if (suffix) {
      let reg = new RegExp(
        '\\.' + suffix + '$', 'i'
      );
      if (!reg.test(file)) {
        file = file + '.' + suffix;
      }
    }
    return path.join(this._options.root, file);
  }

  /**
   * render view
   * @abstract
   * @param  {Object} model - model back to UA
   * @return {String} view result
   */
  * render(model) {
    // TODO
  }
}

module.exports = NViewResolver;
