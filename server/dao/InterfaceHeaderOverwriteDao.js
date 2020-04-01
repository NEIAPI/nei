class InterfaceHeaderOverwriteDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/InterfaceHeaderOverwrite');
  }
}

module.exports = InterfaceHeaderOverwriteDao;
