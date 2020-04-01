const NDao = require('./NDao');

class ProGroupVerDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ProgroupVerification');
  }
}

module.exports = ProGroupVerDao;
