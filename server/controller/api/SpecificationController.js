const log = require('../../util/log');
const NController = require('../../arch/NController');
const SpecificationService = require('../../service/SpecificationService');

class SpecificationController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new SpecificationService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );

    let query = this._query;
    let rule = {
      name: {required: true},
      description: {},
      language: {isNumber: true},
      document: {},
      type: {value: /^[0-3]$/}
    };

    if (query.hasOwnProperty('web')) {
      Object.assign(rule, {
        engine: {isNumber: true},
        viewExtension: {}
      });
    }

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
    let ret = yield this._service.getListForUser();
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

  * getQuotes() {
    let id = this._context._id;
    let ret = yield this._service.getQuotes(id);
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
      name: {},
      description: {},
      language: {isNumber: true},
      engine: {isNumber: true},
      viewExtension: {},
      isShare: {isNumber: true},
      viewRoot: {},
      webRoot: {},
      mockApiRoot: {},
      mockViewRoot: {},
      document: {},
      argsConfig: {isNumber: true},
      jarRoot: {}
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

  * favorite() {
    log.debug(
      '[API.%s.favorite] favorite',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      v: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.favorite(id, data.v);
    this.setModel(ret);

    yield this.next();
  }

  * share() {
    log.debug(
      '[API.%s.share] share',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      v: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.update({id, isShare: data.v});
    this.setModel(ret);

    yield this.next();
  }

  * lock() {
    log.debug(
      '[API.%s.lock] lock',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      v: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.update({id, isLock: data.v});
    this.setModel(ret);

    yield this.next();
  }

  * clone() {
    log.debug(
      '[API.%s.clone] clone',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      name: {required: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.clone(id, data.name);
    this.setModel(ret);

    yield this.next();
  }

  * getAllDetailForSpec() {
    log.debug(
      '[API.%s.getAllDetailForSpec] getAllDetailForSpec',
      this.constructor.name
    );
    let rule = {
      key: {required: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.getAllDetailForSpec(data);
    this.setModel(ret);

    yield this.next();
  }

  * rtk() {
    log.debug(
      '[API.%s.rtk] rtk',
      this.constructor.name
    );
    let id = this._context._id;
    let ret = yield this._service.rtk(id);
    this.setModel([ret]);

    yield this.next();
  }

}

module.exports = SpecificationController;
