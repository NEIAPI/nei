const log = require('../../util/log');
const db = require('../../../common').db;
const NController = require('../../arch/NController');
const ResourceHistoryService = require('../../service/ResourceHistoryService');

class ResourceHistoryController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new ResourceHistoryService(this._uid, context);
  }

  * find() {
    log.debug(
      '[API.%s.find] find',
      this.constructor.name
    );

    let rule = {
      id: {isNumber: true},
      type: {required: true, isNumber: true},
      lct: {isNumber: true},
      offset: {isNumber: true},
      limit: {required: true, isNumber: true},
      total: {isBoolean: true},
      pid: {isNumber: true},
    };
    let data = this.validate(rule);
    let ret = yield this._service.find(data);

    this.setModel(ret);

    yield this.next();
  }

  * findForSpec() {
    log.debug(
      '[API.%s.findForSpec] findForSpec',
      this.constructor.name
    );

    let rule = {
      id: {required: true, isNumber: true},
      lct: {isNumber: true},
      offset: {isNumber: true},
      limit: {required: true, isNumber: true},
      total: {isBoolean: true}
    };
    let data = this.validate(rule);
    data.type = db.RES_TYP_SPEC;
    let ret = yield this._service.find(data);

    this.setModel(ret);

    yield this.next();
  }

  * findAll() {
    log.debug(
      '[API.%s.findAll] findAll',
      this.constructor.name
    );

    let rule = {
      lct: {isNumber: true},
      limit: {isNumber: true},
      offset: {isNumber: true},
      // total: {isBoolean: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.findAll(data);

    this.setModel(ret);

    yield this.next();
  }
}

module.exports = ResourceHistoryController;
