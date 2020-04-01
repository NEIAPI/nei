class UserLoginDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/Usrlogin');
  }
}

module.exports = UserLoginDao;
