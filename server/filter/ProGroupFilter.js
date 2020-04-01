const log = require('../util/log');
const sqlOpt = {noTransaction: true};
const pgDAO = new (require('../dao/ProGroupDao'))(sqlOpt);
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const NFilter = require('../arch/NFilter');

class ProGroupFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do progroup filter',
      this.constructor.name
    );

    let query = this._query,
      body = this._body;
    if (this._rmethod === 'GET' ||
      ['lock', 'setmembers', 'quit'].some(Object.prototype.hasOwnProperty, query) ||  //lock, set progroup members or quit
      (this._rmethod === 'PATCH' && body.hasOwnProperty('verification')) // change verfiication method
    ) {
      return yield super.chain();
    }

    let progroup = yield pgDAO.find(this._context._id);
    if (progroup && progroup.isLock) {
      throw new IllegalRequestError(`该项目组已被锁定，不能操作`);
    }
    return yield super.chain();
  }
}

module.exports = ProGroupFilter;
