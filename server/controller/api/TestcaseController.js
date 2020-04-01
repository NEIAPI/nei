const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const TestcaseService = require('../../service/TestcaseService');

class TestcaseController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new TestcaseService(this._uid, context);
  }

  * createBatch() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let itemRule = {
      interfaceId: {required: true, isNumber: true},
      name: {},
      description: {},
      reqHeader: {},
      reqData: {},
      resExpect: {},
      resExpectHeader: {},
      host: {required: true}
    };
    let data = this.validate({
      notCheckInSameInterface: {},
      items: {isArray: true, rule: itemRule}
    }, 'body');

    let ret = yield this._service.createBatch(data.items, !!data.notCheckInSameInterface);
    this.setModel(ret);

    yield this.next();
  }

  * getListByCollectionOrInterface() {
    log.debug(
      '[API.%s.getListByCollectionOrInterface] getListByCollectionOrInterface',
      this.constructor.name
    );

    if (this._query.hasOwnProperty('collection')) {
      let data = this.validate({
        interfaceId: {isNumber: true},
        collectionId: {required: true, isNumber: true}
      });
      let ret = yield this._service.getListByCollection(data);
      this.setModel(ret);
    } else {
      let {interfaceId} = this.validate({
        interfaceId: {isNumber: true}
      });
      let ret = yield this._service.getListByInterface(interfaceId);
      this.setModel(ret);
    }

    yield this.next();
  }

  * findDetailById() {
    log.debug(
      '[API.%s.getList] getList',
      this.constructor.name
    );

    let id = this._context._id;
    let ret = yield this._service.findDetailById(id);
    this.setModel(ret);

    yield this.next();
  }

  * update() {
    log.debug(
      '[API.%s.update] update',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      state: {},
      name: {},
      host: {},
      description: {},
      testerId: {},
      testBegTime: {isNumber: true, value: /^\d{13}$/},
      testEndTime: {isNumber: true, value: /^\d{13}$/},
      reqHeader: {},
      reqData: {},
      resHeader: {},
      resExpect: {},
      resExpectHeader: {},
      resData: {},
      report: {}
    };
    let data = this.validate(rule, 'body');
    data.id = id;
    let ret = yield this._service.update(data);
    this.setModel(ret);

    yield this.next();
  }

  * remove() {
    log.debug(
      '[API.%s.remove] remove',
      this.constructor.name
    );
    _.translateParams(this._query, ['ids']);

    let ret = yield this._service.removeBatch(this._query.ids);
    this.setModel(ret);

    yield this.next();
  }

}

module.exports = TestcaseController;
