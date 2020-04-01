class NFilter extends require('./NController') {
  /**
   * Create a Filter
   * @param  {KoaContext} context - koa context object
   * @param  {GeneratorFunction} next  - next process
   * @param  {GeneratorFunction} chain - next filter
   */
  constructor(context, next, chain) {
    super(context, next);
    this._chain = chain;
  }

  /**
   * do next filter process
   * @return {Void}
   */
  * chain() {
    if (this._chain) {
      yield this._chain(
        this._context, this._next
      );
    }
  }

  /**
   * Do filter process. Overwrite by subclasses
   * @return {Void}
   */
  * doFilter() {
  }
}

module.exports = NFilter;
