const NViewResolver = require('./NViewResolver');

/**
 * JSON View Resolver Class
 */

class JSONResolver extends NViewResolver {
  /**
   * render view
   * @param  {Object} model - model back to UA
   * @return {String} view result
   */
  render(model) {
    return model;
  }
}

module.exports = JSONResolver;
