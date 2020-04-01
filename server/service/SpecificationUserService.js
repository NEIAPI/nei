/**
 * SpecificationUser Service Class
 */

class SpecificationUserService extends require('./NService') {
  constructor(context) {
    super(context);
    this._dao = new (require('../dao/SpecificationUserDao'))({context});
  }
}

module.exports = SpecificationUserService;
