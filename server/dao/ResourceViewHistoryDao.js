const NDao = require('./NDao');

class ResourceViewHistoryDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ResourceViewHistory');
  }
}

module.exports = ResourceViewHistoryDao;
