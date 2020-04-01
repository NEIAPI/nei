class InterfaceHeaderCombinationDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/InterfaceHeaderCombination');
  }
}

module.exports = InterfaceHeaderCombinationDao;
