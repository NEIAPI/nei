const db = require('../../common').db;

class TestcaseCollectionDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_TESTCASECOLLECTION
    }, sqlOpt);
    this._Model = require('../model/db/TestcaseCollection');
  }
}

module.exports = TestcaseCollectionDao;
