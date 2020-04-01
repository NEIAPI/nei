const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const WordService = require('../../service/WordService');

class ConstraintController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new WordService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let rule = {
      name: {value: /^.{1,100}$/},
      type: {isNumber: true, value: /^[01]$/},
      tag: {},
      associatedWord: {},
      projectId: {isNumber: true},
      groupId: {isNumber: true},
      description: {},
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
    this.setModel(ret);

    yield this.next();
  }

  * createBatch() {
    let wordRule = {
      name: {value: /^.{1,100}$/},
      associatedWord: {},
      description: {},
    };

    let rule = {
      words: {isArray: true, rule: wordRule},
      projectId: {isNumber: true},
      groupId: {isNumber: true},
      tag: {},
    };

    let data = this.validate(rule, 'body');
    let ret = yield this._service.createBatchWapper(data);
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
      id: {},
      name: {value: /^.{1,100}$/},
      type: {isNumber: true, value: /^[01]$/},
      tag: {},
      groupId: {isNumber: true},
      description: {},
      associatedWord: {},
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

  * share() {
    log.debug(
      '[API.%s.share] share',
      this.constructor.name
    );
    let id = this._context._id;
    let ret = yield this._service.share(id);
    this.setModel(ret);

    yield this.next();
  }

  * move() {
    log.debug(
      '[API.%s.move] move',
      this.constructor.name
    );

    let rule = {
      pid: {required: true, isNumber: true},
      gid: {required: true, isNumber: true},
      moves: {required: true, isArray: true},
      tag: {required: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.move(data);
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

  * tag() {
    log.debug(
      '[API.%s.tag] tag',
      this.constructor.name
    );

    let rule = {
      ids: {required: true, isArray: true, value: /^\d+$/},
      tags: {required: true, isArray: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.tag(data);
    this.setModel(ret);

    yield this.next();
  }

  * updateForbidBatch() {
    log.debug('[API.%s.updateForbidBatch', this.constructor.name);

    let rule = {
      pid: {required: true, isNumber: true},
      ids: {required: true, isArray: true, value: /^\d+$/},
      forbidStatus: {required: true, isNumber: true, value: /^[01]$/}
    };

    let data = this.validate(rule, 'body');
    let ret = yield this._service.updateForbidBatch(data);
    this.setModel(ret);
    yield this.next();
  }

  * clone() {
    log.debug(
      '[API.%s.clone] clone',
      this.constructor.name
    );

    let copyRule = {
      id: {required: true, isNumber: true},
      name: {required: true}
    };
    let rule = {
      pid: {required: true, isNumber: true},
      gid: {required: true, isNumber: true},
      copys: {required: true, isArray: true, rule: copyRule},
      tag: {required: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.clone(data);
    this.setModel(ret);

    yield this.next();
  }

  * watch() {
    log.debug(
      '[API.%s.watch] watch',
      this.constructor.name
    );

    let id = this._context._id;
    let rule = {
      v: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.watch(id, data.v);
    this.setModel(ret);

    yield this.next();
  }

  * getCandidateList() {
    log.debug(
      '[API.%s.getCandidateList] getCandidateList',
      this.constructor.name
    );

    let rule = {
      pid: {required: true, isNumber: true},
      importProgroup: {required: true, isBoolean: true},
    };
    let data = this.validate(rule);
    let ret;
    if (data.importProgroup) {
      ret = yield this._service.getProgroupCandidateList(data.pid);
    } else {
      ret = yield this._service.getProjectCandidateList(data.pid);
    }
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = ConstraintController;
