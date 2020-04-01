class CollectionInterfaceTestcaseDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/CollectionInterfaceTestcase');
  }
}

module.exports = CollectionInterfaceTestcaseDao;
