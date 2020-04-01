/**
 * 记录 调用 apimock 接口 时的一些信息
 */

const IPService = require('./IPService');

class CallApiMockService extends require('./NService') {
  constructor(context) {
    super(context);
    this._dao = new (require('../dao/CallApiMockDao'))({context});
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
    yield this._dao.increaseCallTimes();
  }

  * getCallTimes() {
    return yield this._dao.getCallTimes();
  }
}

module.exports = CallApiMockService;
