const db = require('../../common').db;

class InterfaceTestcaseHostDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_TESTCASEHOST
    }, sqlOpt);
    this._Model = require('../model/db/InterfaceTestcaseHost');
  }
}

module.exports = InterfaceTestcaseHostDao;
