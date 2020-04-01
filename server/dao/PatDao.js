const log = require('../util/log');
const db = require('../../common').db;
const NDao = require('./NDao');

class PatDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/Pat');
  }

  /**
   * get pat list for user
   *
   * @param  {Number} uid - user id
   * @return {Array} resource list
   */
  * getPatListForUser(uid) {
    return yield this.search({
      conds: {
        revoked: 0,
        creatorId: uid
      },
      joins: [
        ...(this._getUserJoins(uid))
      ]
    });
  }

  // 根据 token 值查 pat
  * getByToken(token) {
    const result = yield this.search({
      conds: {
        token
      }
    });
    return result[0];
  }
}

module.exports = PatDao;
