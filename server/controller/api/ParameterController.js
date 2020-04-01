const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const AttributeService = require('../../service/AttributeService');

const db = require('../../../common').db;

class ParameterController extends NController {
  constructor(context, next) {
    super(context, next);
    this.data = this._fields || this._query;
    let parentType = this.data.hasOwnProperty('parentType') ? this.data.parentType : db.PAM_TYP_ATTRIBUTE;
    this._service = AttributeService.getInstanceByParentType(parentType, this._uid, context);
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
      defaultValue: {value: /^.{0,2000}$/},
      description: {},
      genExpression: {},
      required: {isNumber: true, value: /^[01]$/},
      position: {isNumber: true}
    };
    let importRule = {
      id: {required: true, isNumber: true},
      position: {isNumber: true},
      vars: {
        isArray: true, rule: {
          id: {required: true, isNumber: true},
          isArray: {isNumber: true, value: /^[01]$/},
          type: {isNumber: true},
          description: {},
          defaultValue: {value: /^.{0,2000}$/},
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
      params: {isArray: true, rule: paramRule},
      imports: {isArray: true, rule: importRule},
      parentType: {required: true, isNumber: true, value: /^[0-7]$/},
      parentId: {required: true, isNumber: true}
    };
    let rule = {
      items: {isArray: true, rule: itemRule}
    };
    let data = this.validate(rule, 'body');
    let ret = yield AttributeService.createBatch(data, this._uid, this._context);
    this.setModel(ret);

    yield this.next();
  }

  * remove() {
    log.debug(
      '[API.%s.remove] remove',
      this.constructor.name
    );
    _.translateParams(this._context.query, ['params', 'imports']);

    let rule = {
      params: {isArray: true, value: /^\d+$/},
      imports: {isArray: true, value: /^\d+$/},
      parentType: {required: true, isNumber: true, value: /^[0-7]$/},
      parentId: {required: true, isNumber: true}
    };

    let data = this.validate(rule, 'query');

    let ret = yield this._service.remove(data, {});
    this.setModel(ret);

    yield this.next();
  }

  * update() {
    log.debug(
      '[API.%s.update] update',
      this.constructor.name
    );
    let id = this._context._id;

    let paramRule = {
      name: {},
      type: {required: true, isNumber: true},
      isArray: {isNumber: true, value: /^[01]$/},
      defaultValue: {value: /^.{0,2000}$/},
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
          defaultValue: {value: /^.{0,2000}$/},
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
      name: {},
      type: {isNumber: true},
      typeName: {},
      isArray: {isNumber: true, value: /^[01]$/},
      defaultValue: {value: /^.{0,2000}$/},
      description: {},
      valExpression: {},
      genExpression: {},
      datatypeId: {isNumber: true},
      parentType: {isNumber: true, value: /^[0-7]$/},
      parentId: {isNumber: true},
      required: {isNumber: true, value: /^[01]$/},
      ignored: {isNumber: true, value: /^[01]$/},
      params: {isArray: true, rule: paramRule},
      imports: {isArray: true, rule: importRule}
    };

    let data = this.validate(rule, 'body');

    data.id = id;
    let ret = yield this._service.update(data);
    this.setModel(ret);

    yield this.next();
  }

  * updateBatch() {
    log.debug(
      '[API.%s.updateBatch] updateBatch',
      this.constructor.name
    );
    let paramRule = {
      action: {required: true},
      name: {},
      type: {isNumber: true},
      isArray: {isNumber: true, value: /^[01]$/},
      defaultValue: {value: /^.{0,2000}$/},
      description: {},
      valExpression: {},
      genExpression: {},
      id: {isNumber: true},
      required: {isNumber: true, value: /^[01]$/}
    };
    let importRule = {
      action: {required: true},
      id: {required: true, isNumber: true},
      vars: {
        isArray: true, rule: {
          id: {required: true, isNumber: true},
          isArray: {isNumber: true, value: /^[01]$/},
          type: {isNumber: true},
          description: {},
          defaultValue: {value: /^.{0,2000}$/},
          valExpression: {},
          genExpression: {},
          required: {isNumber: true, value: /^[01]$/},
          ignored: {isNumber: true, value: /^[01]$/}
        }
      }
    };
    let rule = {
      params: {isArray: true, rule: paramRule},
      imports: {isArray: true, rule: importRule},
      datatypeId: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.hiddenDtBatchOpt(data);
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
      parentType: {required: true, isNumber: true, value: /^[0-7]$/}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.updatePosition(data);
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = ParameterController;
