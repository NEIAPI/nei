const log = require('../util/log');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const NFilter = require('../arch/NFilter');

class IdFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do id filter',
      this.constructor.name
    );

    let url = this._context.url;
    let paths = url.split('/');
    let id = paths.pop();

    if (!id) {
      throw new IllegalRequestError(
        `can't find id`
      );
    }

    id = parseInt(id, 10);

    if (isNaN(id)) {
      throw new IllegalRequestError(
        `invalid id`
      );
    } else {
      this._context._id = id;
    }

    yield super.chain();
  }
}

module.exports = IdFilter;
