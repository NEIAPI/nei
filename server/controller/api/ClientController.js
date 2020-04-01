const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const ClientService = require('../../service/ClientService');

class ClientController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new ClientService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let rule = {
      name: {required: true},
      tag: {},
      description: {},
      projectId: {isNumber: true},
      groupId: {isNumber: true},
      downloadLink: {},
      launchDate: {isDate: true},
      respoId: {isNumber: true},
      closeDate: {isDate: true},
      version: {}
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

    let rule = {
      pid: {required: true, isNumber: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.getListInProject(data.pid);
    this.setModel(ret);

    yield this.next();
  }

  * findDetailById() {
    log.debug(
      '[API.%s.findDetailById] findDetailById',
      this.constructor.name
    );
    let id = this._context._id;
    let ret = yield this._service.getById(id, {userJoin: true});
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
      id: {},
      name: {},
      tag: {},
      downloadLink: {},
      groupId: {isNumber: true},
      description: {},
      respoId: {isNumber: true},
      launchDate: {isDate: true},
      closeDate: {isDate: true},
      version: {},
      versionName: {}
    };
    let data = this.validate(rule, 'body');
    data.id = id;
    let ret = yield this._service.update(data);
    this.setModel(ret);

    yield this.next();
  }


  * clone() {
    log.debug(
      '[API.%s.remove] remove',
      this.constructor.name
    );

    let copyRule = {
      id: {required: true, isNumber: true},
      name: {required: true}
    };

    let rule = {
      pid: {required: true, isNumber: true},
      gid: {required: true, isNumber: true},
      copys: {
        required: true, isArray: true,
        rule: copyRule
      },
      tag: {required: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.clone(data);
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

  * updateBisGroupBatch() {
    log.debug(
      '[API.%s.updateBisGroupBatch] update bisgroup',
      this.constructor.name
    );

    let rule = {
      ids: {required: true, isArray: true, value: /^\d+$/},
      groupId: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.updateBisGroupBatch(data);
    this.setModel(ret);

    yield this.next();
  }

  * getQuotes() {
    log.debug(
      '[API.%s.getQuotes] get quotes',
      this.constructor.name
    );
    let id = this._context._id;
    let ret = yield this._service.getQuotes(id);
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = ClientController;
