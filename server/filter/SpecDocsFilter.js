/**
 * SpecDocs Filter Class
 * Check whether the assoicated sepc is locked
 */

const log = require('../util/log');
const sqlOpt = {noTransaction: true};
const _ = require('../util/utility');
const specDAO = new (require('../dao/SpecificationDao'))(sqlOpt);
const specDocDAO = new (require('../dao/SpecificationDirectoryDao'))(sqlOpt);
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const NFilter = require('../arch/NFilter');

class SpecDocsFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do spec docs filter',
      this.constructor.name
    );

    if (this._rmethod === 'GET') {
      return yield super.chain();
    }

    let body = this._body,
      query = this._query,
      specIds;

    if (this._context._id) {
      let specDoc = yield specDocDAO.find(this._context._id);
      specIds = [specDoc.specId];
    } else {
      if (query.hasOwnProperty('import')) {
        // spec import
        specIds = [body.specId];
      } else if (query.hasOwnProperty('empty')) {
        // spec docs emptying
        specIds = [query.specId];
      } else if (body && body.hasOwnProperty('specId')) {
        specIds = [body.specId];
      } else if (query.hasOwnProperty('ids')) {
        _.translateParams(query, ['ids']);
        let specDocs = yield specDao.findBatch(query.ids);
        specIds = specDocs.map((doc) => doc.specId);
      }
    }

    let resources = [];
    if (specIds.length) {
      resources = yield specDAO.findBatch(specIds);
    }

    if (resources.some(it => {
        return it.isLock;
      })) {
      throw new IllegalRequestError(`该规范已被锁定，不能操作`);
    }
    return yield super.chain();
  }
}

module.exports = SpecDocsFilter;
