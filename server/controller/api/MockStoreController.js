const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const MockStoreService = require('../../service/MockStoreService');
const db = require('../../../common').db;

class MockStoreController extends NController {
  constructor(context, next) {
    super(context, next);
    this.service = new MockStoreService(this._uid, context);
  }

  * get() {
    log.debug(
      `[MockStore.${this.constructor.name}.get] get mock data`
    );
    const rule = {
      interfaceId: {required: false, isNumber: true},
      rpcId: {required: false, isNumber: true},
    };
    const data = this.validate(rule);

    const ret = yield this.service.getInterface(data);

    this.setModel(ret);
    yield this.next();
  }

  * save() {
    log.debug(
      `[MockStore.${this.constructor.name}.save] save mock data`
    );
    const rule = {
      interfaceId: {required: false, isNumber: true},
      rpcId: {required: false, isNumber: true},
      mockdata: {},
    };
    const data = this.validate(rule, `body`);
    const ret = yield this.service.saveInterface(data);

    this.setModel(ret);
    yield this.next();
  }

  * refresh() {
    log.debug(
      `[MockStore.${this.constructor.name}.refresh] refresh mock data`
    );
    const rule = {
      isRpc: {isBoolean: true},
    };
    const data = this.validate(rule, `body`);
    const options = {};
    if (data.isRpc) {
      options.rpcId = this._context._id;
    } else {
      options.interfaceId = this._context._id;
    }
    const ret = yield this.service.refreshInterface(options);

    this.setModel(ret);
    yield this.next();
  }
}

module.exports = MockStoreController;
