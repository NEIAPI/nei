/**
 * Spec Filter Class
 * Check whether the assoicated sepc is locked
 */

const log = require('../util/log');
const sqlOpt = {noTransaction: true};
const specDAO = new (require('../dao/SpecificationDao'))(sqlOpt);
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const NFilter = require('../arch/NFilter');

class SpecFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do spec filter',
      this.constructor.name
    );
    let query = this._query;

    if (this._rmethod === 'GET' ||
      ['share', 'favorite', 'clone', 'lock'].some(Object.prototype.hasOwnProperty, query)) {
      // don't block share/clone/fav/unlock specs
      return yield super.chain();
    }

    let spec = yield specDAO.find(this._context._id);
    if (spec && spec.isLock) {
      throw new IllegalRequestError(`该规范已被锁定，不能操作`);
    }

    return yield super.chain();
  }
}

module.exports = SpecFilter;
