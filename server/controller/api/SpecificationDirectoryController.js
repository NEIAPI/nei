const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const SpecificationDirectoryService = require('../../service/SpecificationDirectoryService');

class SpecificationDirectoryController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new SpecificationDirectoryService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );

    let rule = {
      specId: {required: true, isNumber: true},
      parent: {isNumber: true},
      type: {isNumber: true, value: /^[01]$/},
      name: {},
      description: {},
      mime: {},
      content: {},
      isUpload: {isNumber: true},
      dataSource: {isNumber: true}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
    this.setModel(ret);

    yield this.next();
  }

  * createBatch() {
    log.debug(
      '[API.%s.createBatch] create batch',
      this.constructor.name
    );

    let itemRule = {
      type: {isNumber: true, value: /^[01]$/},
      name: {},
      description: {},
      mime: {},
      content: {},
      dataSource: {isNumber: true},
      filePath: {}
    };
    let rule = {
      isUpload: {isNumber: true},
      specId: {required: true, isNumber: true},
      parent: {isNumber: true},
      items: {required: true, isArray: true, rule: itemRule},
      isDir: {isNumber: true, value: /^[01]$/}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.addNodeList(data);
    this.setModel(ret);

    yield this.next();
  }

  * findNode() {
    log.debug(
      '[API.%s.findNode] find node',
      this.constructor.name
    );
    let rule = {
      specId: {required: true, isNumber: true},
      parent: {required: true, isNumber: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.findNode(data.specId, data.parent);
    this.setModel(ret);

    yield this.next();
  }

  * getToken() {
    log.debug(
      '[API.%s.getToken] getToken',
      this.constructor.name
    );
    let rule = {
      n: {isNumber: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.getToken(data.n);
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
      parent: {isNumber: true},
      name: {},
      description: {},
      mime: {},
      content: {},
      dataSource: {isNumber: true}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.update(id, data);
    this.setModel(ret);

    yield this.next();
  }

  * moveNode() {
    log.debug(
      '[API.%s.moveNode] move node',
      this.constructor.name
    );

    let rule = {
      specId: {required: true, isNumber: true},
      toId: {required: true, isNumber: true},
      ids: {isArray: true, value: /^\d+$/},
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.moveNode(data.specId, data.ids, data.toId);
    this.setModel(ret);

    yield this.next();
  }

  * remove() {
    log.debug(
      '[API.%s.remove] remove',
      this.constructor.name
    );
    let id = this._context._id;

    let ret = yield this._service.removeBatch([id]);
    this.setModel(ret.find((item) => item.id === id));

    yield this.next();
  }

  * removeBatch() {
    log.debug(
      '[API.%s.removeBatch] remove batch',
      this.constructor.name
    );
    _.translateParams(this._query, ['ids']);

    let ret = yield this._service.removeBatch(this._query.ids);
    this.setModel(ret);

    yield this.next();
  }

  * empty() {
    log.debug(
      '[API.%s.empty] empty',
      this.constructor.name
    );
    let rule = {
      specId: {required: true, isNumber: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.empty(data.specId);
    this.setModel(ret);

    yield this.next();
  }

  * import() {
    log.debug(
      '[API.%s.import] import',
      this.constructor.name
    );
    let rule = {
      importSpecId: {isNumber: true},
      specId: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');

    if (data.importSpecId) {
      let ret = yield this._service.import(data);
      this.setModel(ret);
    } else {

      data.filePath = this._context.request.files.file.path;

      let ret = yield this._service.importFromZip(data);
      this.setModel(ret);
    }

    yield this.next();
  }

  * export() {
    log.debug(
      '[API.%s.export] export',
      this.constructor.name
    );
    let rule = {
      specId: {required: true, isNumber: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.export(data.specId);
    this._context.model = ret.data;
    this._context.response.set('Content-disposition', 'attachment; filename=' + encodeURI(ret.name));
    this._context.response.set('Content-type', 'application/gzip');

    yield this.next();
  }

}

module.exports = SpecificationDirectoryController;
