const log = require('../util/log');
const db = require('../../common').db;
const NDao = require('./NDao');

class UserDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/User');
  }

  /**
   * get user by email
   *
   * @param  {String} email - user email
   * @return {model/db/User} - user model
   */
  * getUserByEmail(email) {
    log.debug(
      '[%s.getUserByEmail] get user by email %s',
      this.constructor.name, email
    );
    if (email) {
      let ret = yield this.search({
        conds: {email: email}
      });
      return (ret || [])[0];
    }
  }

  /**
   * get user by username
   *
   * @param  {String} username - username
   * @return {model/db/User} user model
   */
  * getUserByUserName(username, from) {
    log.debug(
      '[%s.getUserByUserName] get user by username %s',
      this.constructor.name, username
    );
    if (username) {
      let conds = {
        username: username,
      };
      if (from) {
        conds.from = from;
      }
      let ret = yield this.search({
        conds
      });
      return (ret || [])[0];
    }
  }

  /**
   * get all users
   *
   * @return {Array model/db/User} user model list
   */
  * getAllUsers() {
    log.debug(
      '[%s.getAllUsers] get all users',
      this.constructor.name
    );
    let ret = yield this.search({
      conds: {
        id: {
          op: '!=',
          value: db.USR_ADMIN_ID
        }
      }
    });
    return ret;
  }

  /**
   * get members in project group
   * @param  {Number} gid - project group id
   * @return {Array} member list
   */
  * getProGroupMembers(gid) {
    log.debug(
      '[%s.getProGroupMembers] get project group members with id %s',
      this.constructor.name, gid
    );
    return yield this.search({
      joins: [{
        field: ['role'],
        fkmap: {user_id: 'id'},
        table: 'progroup_user',
        conds: {'progroup_id': gid}
      }]
    });
  }
}

module.exports = UserDao;
