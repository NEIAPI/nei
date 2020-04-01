const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const DataTypeService = require('../../service/DataTypeService');
const ResourceVersionService = require('../../service/ResourceVersionService');

const dbMap = require('../../../common').db;

class DataTypeController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new DataTypeService(this._uid, context);
    this._rvService = new ResourceVersionService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );

    let paramRule = {
      name: {},
      type: {required: true, isNumber: true},
      isArray: {isNumber: true, value: /^[01]$/},
      defaultValue: {},
      description: {},
      valExpression: {},
      genExpression: {},
      required: {isNumber: true, value: /^[01]$/}
    };
    let importRule = {
      id: {required: true, isNumber: true},
      vars: {
        isArray: true, rule: {
          id: {required: true, isNumber: true},
          isArray: {isNumber: true, value: /^[01]$/},
          type: {isNumber: true},
          description: {},
          defaultValue: {},
          valExpression: {},
          genExpression: {},
          required: {isNumber: true, value: /^[01]$/},
          ignored: {isNumber: true, value: /^[01]$/}
        }
      }
    };
    paramRule.params = {isArray: true, rule: paramRule};
    paramRule.imports = {isArray: true, rule: importRule};
    importRule.vars.rule.params = {isArray: true, rule: paramRule};
    importRule.vars.rule.imports = {isArray: true, rule: importRule};
    let rule = {
      name: {value: /^\w{1,100}$/},
      tag: {},
      format: {isNumber: true, value: /^[0-7]$/},
      projectId: {required: true, isNumber: true},
      groupId: {isNumber: true}, // 针对匿名类型，不需要groupId
      description: {},
      params: {isArray: true, rule: paramRule},
      imports: {isArray: true, rule: importRule}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
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
    let ret = yield this._service.findDetailById(id);
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

  * update() {
    log.debug(
      '[API.%s.update] update',
      this.constructor.name
    );
    let id = this._context._id;

    let rule = {
      name: {value: /^\w{1,100}$/},
      tag: {},
      format: {isNumber: true, value: /^[0-7]$/},
      groupId: {isNumber: true},
      description: {},
      versionName: {}
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

  * createNewVersion() {
    log.debug(
      '[API.%s.createNewVersion] createNewVersion',
      this.constructor.name
    );

    let rule = {
      id: {isNumber: true},
      name: {},
      tag: {},
      parent: {isNumber: true},
      projectId: {isNumber: true},
      groupId: {isNumber: true},
      description: {},
      version: {}
    };

    let data = this.validate(rule, 'body');
    data.resType = dbMap.RES_TYP_DATATYPE;
    let nv = yield this._rvService.create(data);
    let ret = yield this._service.findDetailById(nv.resId);
    this.setModel(ret);

    yield this.next();
  }

  * createBatch() {
    log.debug(
      '[API.%s.createBatch] createBatch',
      this.constructor.name
    );
    let paramRule = {
      name: {},
      type: {},
      typeName: {},
      isArray: {isNumber: true, value: /^[01]$/},
      defaultValue: {},
      description: {},
      valExpression: {},
      genExpression: {},
      required: {isNumber: true, value: /^[01]$/}
    };
    let importRule = {
      id: {required: true, isNumber: true},
      vars: {
        isArray: true, rule: {
          id: {required: true, isNumber: true},
          isArray: {isNumber: true, value: /^[01]$/},
          type: {isNumber: true},
          description: {},
          defaultValue: {},
          valExpression: {},
          genExpression: {},
          required: {isNumber: true, value: /^[01]$/},
          ignored: {isNumber: true, value: /^[01]$/}
        }
      }
    };
    paramRule.params = {isArray: true, rule: paramRule};
    paramRule.imports = {isArray: true, rule: importRule};
    importRule.vars.rule.params = {isArray: true, rule: paramRule};
    importRule.vars.rule.imports = {isArray: true, rule: importRule};
    let itemRule = {
      id: {isNumber: true},
      name: {value: /^\w{1,100}$/},
      tag: {},
      type: {isNumber: true, value: /^[0-2]$/},
      format: {isNumber: true, value: /^[0-7]$/},
      groupId: {isNumber: true}, // 针对匿名类型，不需要groupId
      description: {},
      defaultValue: {},
      params: {isArray: true, rule: paramRule},
      imports: {isArray: true, rule: importRule}
    };
    let rule = {
      projectId: {isNumber: true},
      groupId: {isNumber: true},
      items: {isArray: true, rule: itemRule},
      tag: {}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.addList(data);
    this.setModel(ret);

    yield this.next();
  }

  * sendChangeMsgToWatch() {
    log.debug(
      '[API.%s.sendChangeMsgToWatch] sendChangeMsgToWatch',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      content: {required: true}
    };
    let data = this.validate(rule, 'body');
    data.id = id;
    let ret = yield this._service.sendChangeMsgToWatch(data);
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = DataTypeController;
