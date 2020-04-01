const db = require('../../common').db;

class CliArgDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_CLIARG
    }, sqlOpt);
    this._Model = require('../model/db/Arguments');
  }
}

module.exports = CliArgDao;
