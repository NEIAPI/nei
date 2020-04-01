/**
 * User Login Service Class
 */

const IPService = require('./IPService');

class UserLoginService extends require('./NService') {
  constructor(context) {
    super(context);
    this._dao = new (require('../dao/UserLoginDao'))({context});
  }

  * create(model) {
    let ip = this._context.ip;
    let address = '';

    if (ip) {
      let addressObj = (yield IPService.getAddress(ip)) || {};
      address = [
        addressObj.country,
        addressObj.province,
        addressObj.city,
        addressObj.county
      ].filter(item => !!item).join('-');
    }

    Object.assign(model, {
      ip,
      address
    });

    yield this._beginTransaction();
    yield super.createBatch([model]);
    yield this._endTransaction();
  }
}

module.exports = UserLoginService;
