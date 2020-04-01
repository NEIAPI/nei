class SpecificationKlassmapDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/SpecificationKlassmap');
  }
}

module.exports = SpecificationKlassmapDao;
