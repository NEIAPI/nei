const db = require('../../common').db;

class ProgroupIpDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_PROGROUPIP
    }, sqlOpt);
    this._Model = require('../model/db/ProgroupIp');
  }
}

module.exports = ProgroupIpDao;
