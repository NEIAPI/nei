/**
 * SpecificationKlassmap Service Class
 */

const Forbidden = require('../error/fe/ForbiddenError');

class SpecificationKlassmapService extends require('./NService') {
  constructor(uid, context) {
    super(uid);
    this._uid = uid;
    this._dao = new (require('../dao/SpecificationKlassmapDao'))({context});
    this._specificationService = new (require('./SpecificationService'))(uid, context);
  }

  * create(model) {
    let specId = model.specId;
    model.creatorId = this._uid;
    yield this._specificationService._checkUpdatePermission(specId);
    return yield super.create(model);
  }

  * findWithSpecId(specId) {
    yield this._specificationService._checkSearchPermission(specId);
    let ret = yield this._dao.search({
      conds: {
        specId
      },
      joins: this._dao._getUserJoins()
    });
    return ret;
  }

  * update(model) {
    let ret = yield this._dao.find(model.id);
    if (!ret) {
      throw new Forbidden(`找不到资源或者没有操作权限 id：${model.id}`);
    }
    yield this._specificationService._checkUpdatePermission(ret.specId);
    return yield super.update(model);
  }

  * removeBatch(ids) {
    let resources = yield this._dao.findBatch(ids);
    if (!resources.length || resources.some(item => {
        return item.specId != resources[0].specId;
      })) {
      throw new Forbidden(`找不到资源或者没有操作权限 ids：${ids}`);
    }
    let specId = resources[0].specId;
    yield this._specificationService._checkUpdatePermission(specId);
    return yield super.removeBatch(ids);
  }
}

module.exports = SpecificationKlassmapService;
