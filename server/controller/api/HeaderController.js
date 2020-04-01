const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const AttributeService = require('../../service/AttributeService');

class HeaderController extends NController {
  constructor(context, next) {
    super(context, next);
    this.data = this._fields || this._query;
    this._service = AttributeService.getInstanceByHeaderParentType(this.data.parentType, this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let paramRule = {
      name: {},
      defaultValue: {},
      description: {}
    };
    let importRule = {
      id: {required: true, isNumber: true},
      vars: {
        isArray: true, rule: {
          id: {required: true, isNumber: true},
          description: {},
          defaultValue: {}
        }
      }
    };
    let rule = {
      params: {isArray: true, rule: paramRule},
      imports: {isArray: true, rule: importRule},
      parentId: {required: true, isNumber: true},
      parentType: {required: true, isNumber: true, value: /^[0-1]$/}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
    this.setModel(ret);

    yield this.next();
  }

  * update() {
    log.debug(
      '[API.%s.update] update',
      this.constructor.name
    );
    let rule = {
      name: {},
      parentType: {required: true, isNumber: true},
      defaultValue: {},
      description: {},
      parentId: {isNumber: true},
      datatypeId: {isNumber: true},
      ignored: {isNumber: true, value: /^[01]$/},
    };
    let data = this.validate(rule, 'body');

    let id = this._context._id;
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
    _.translateParams(this._query, ['params', 'imports']);
    let rule = {
      params: {isArray: true, value: /^\d+$/},
      imports: {isArray: true, value: /^\d+$/},
      parentId: {required: true, isNumber: true},
      parentType: {isNumber: true}
    };
    let data = this.validate(rule);

    let ret = yield this._service.remove(data);
    this.setModel(ret);

    yield this.next();
  }

  * updatePosition() {
    log.debug(
      '[API.%s.updatePosition] updatePosition',
      this.constructor.name
    );
    let paramRule = {
      id: {isNumber: true},
      datatypeId: {isNumber: true},
      position: {required: true, isNumber: true}
    };
    let rule = {
      params: {isArray: true, rule: paramRule},
      parentId: {required: true, isNumber: true},
      parentType: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.updatePosition(data);
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = HeaderController;
