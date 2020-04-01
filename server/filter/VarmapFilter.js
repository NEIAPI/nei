/**
 * Varmap Filter Class
 * Check whether the assoicated progroup/sepc is locked
 */

const log = require('../util/log');
const sqlOpt = {noTransaction: true};
const db = require('../../common').db;
const _ = require('../util/utility');
const varmapDAO = new (require('../dao/SpecificationVarmapDao'))(sqlOpt);
const specDAO = new (require('../dao/SpecificationDao'))(sqlOpt);
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const progroupDAO = new (require('../dao/ProGroupDao'))(sqlOpt);
const NFilter = require('../arch/NFilter');

class VarmapFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do var map filter',
      this.constructor.name
    );

    if (this._rmethod === 'GET') {
      return yield super.chain();
    }
    let parentType, parentIds;
    if (this._context._id != null) { // single element update with id. i.e. /api/varmaps/11111
      let varmap = yield varmapDAO.find(this._context._id);
      parentIds = [varmap.parentId];
      parentType = varmap.parentType;
    } else {
      let body = this._body,
        query = this._query;

      if (this._rmethod === 'DELETE') {
        if (query.hasOwnProperty('ids')) {
          _.translateParams(query, ['ids']);
          let ids = query.ids;
          let varmaps = yield varmapDAO.findBatch(ids);
          parentType = varmaps[0].parentType;
          parentIds = varmaps.map(it => it.parentId);
        }
      } else {
        parentType = body.parentType;
        parentIds = [body.parentId];
      }
    }

    if (parentType == null || parentIds == null || !parentIds.length) {
      return yield super.chain();
    }

    let resources;
    if (parentType === db.SPC_MAP_PROJECT) {
      resources = yield progroupDAO.search({
        sfields: ['is_lock'],
        joins: [{
          table: 'project',
          fkmap: {'progroup_id': 'id'},
          conds: {id: parentIds}
        }]
      });
    } else if (parentType === db.SPC_MAP_PROGROUP) {
      resources = yield progroupDAO.findBatch(parentIds);
    } else {
      resources = yield specDAO.findBatch(parentIds);
    }

    if (resources.some(it => {
        return it.isLock;
      })) {
      let resType = [db.SPC_MAP_PROJECT, db.SPC_MAP_PROGROUP].includes(parentType) ? '项目(组)' : '规范';
      throw new IllegalRequestError(`该${resType}已被锁定，不能操作`);
    }

    return yield super.chain();
  }
}

module.exports = VarmapFilter;
