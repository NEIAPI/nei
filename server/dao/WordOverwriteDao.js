const db = require('../../common').db;

class WordOverwriteDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_WORD_OVERWRITE
    }, sqlOpt);
    this._Model = require('../model/db/WordOverwrite');
  }

  clearListCache(pid) {
    const rdsKey = this._RDS[this._type] + pid;
    return this._cache.remove(rdsKey);
  }
}

WordOverwriteDao['__history'] = {
  // TODO
};

module.exports = WordOverwriteDao;
