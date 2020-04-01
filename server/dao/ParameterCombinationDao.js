class ParameterCombinationDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ParameterCombination');
  }
}

module.exports = ParameterCombinationDao;
