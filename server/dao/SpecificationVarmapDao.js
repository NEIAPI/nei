class SpecificationVarmapDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/SpecificationVarmap');
  }

  * getVarmaps(conds) {
    let ret = yield this.search({
      conds,
      joins: this._getUserJoins()
    });
    return ret;
  }
}

module.exports = SpecificationVarmapDao;
