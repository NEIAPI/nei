class SpecificationUserDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/SpecificationUser');
  }
}

module.exports = SpecificationUserDao;
