const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const TestcaseCollectionService = require('../../service/TestcaseCollectionService');

class TestcaseCollectionController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new TestcaseCollectionService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let rule = {
      projectId: {required: true, isNumber: true},
      host: {},
      name: {required: true},
      description: {},
      type: {isNumber: true}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
    this.setModel(ret);

    yield this.next();
  }

  * getList() {
    log.debug(
      '[API.%s.getList] getList',
      this.constructor.name
    );
    let {pid} = this.validate({
      pid: {isNumber: true}
    });
    let ret = yield this._service.getListInProject(pid);
    this.setModel(ret);

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
      host: {},
      name: {},
      description: {},
      data: {}
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
    let id = this._context._id;

    let ret = yield this._service.remove(id);
    this.setModel(ret);

    yield this.next();
  }

  * removeBatch() {
    log.debug(
      '[API.%s.removeBatch] removeBatch',
      this.constructor.name
    );
    _.translateParams(this._query, ['ids']);

    let ret = yield this._service.removeBatch(this._query.ids);
    this.setModel(ret);

    yield this.next();
  }

  * addTestcases() {
    log.debug(
      '[API.%s.addTestcases] addTestcases',
      this.constructor.name
    );
    let id = this._context._id;
    _.translateParams(this._context.body, ['caseIds']);
    let rule = {
      interfaceId: {required: true, isNumber: true},
      caseIds: {required: true, isArray: true, value: /^\d+$/}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.addTestcases(id, data.interfaceId, data.caseIds);
    this.setModel(ret);

    yield this.next();
  }

  * delTestcases() {
    log.debug(
      '[API.%s.delTestcases] delTestcases',
      this.constructor.name
    );
    let id = this._context._id;
    _.translateParams(this._query, ['caseIds']);
    let rule = {
      interfaceId: {required: true, isNumber: true},
      caseIds: {required: true, isArray: true, value: /^\d+$/}
    };
    let data = this.validate(rule);

    let ret = yield this._service.delTestcases(id, data.interfaceId, data.caseIds);
    this.setModel(ret);

    yield this.next();
  }

  * addInterfaces() {
    log.debug(
      '[API.%s.addInterfaces] addInterfaces',
      this.constructor.name
    );
    let id = this._context._id;
    _.translateParams(this._context.body, ['interfaceIds']);
    let ret = yield this._service.addInterfaces(id, this._context.body.interfaceIds);
    this.setModel(ret);

    yield this.next();
  }

  * delInterfaces() {
    log.debug(
      '[API.%s.delInterfaces] delInterfaces',
      this.constructor.name
    );
    let id = this._context._id;
    _.translateParams(this._query, ['interfaceIds']);
    let ret = yield this._service.delInterfaces(id, this._query.interfaceIds);
    this.setModel(ret);

    yield this.next();
  }

}

module.exports = TestcaseCollectionController;
