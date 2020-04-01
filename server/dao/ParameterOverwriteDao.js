class ParameterOverwriteDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ParameterOverwrite');
  }
}

module.exports = ParameterOverwriteDao;
