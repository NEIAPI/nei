const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const SpecificationVarmapService = require('../../service/SpecificationVarmapService');

class VarmapController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new SpecificationVarmapService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let rule = {
      parentId: {required: true, isNumber: true},
      parentType: {required: true, isNumber: true, value: /^[0-2]$/},
      type: {isNumber: true},
      orgName: {required: true},
      varName: {required: true}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
    this.setModel({params: [ret]});

    yield this.next();
  }

  * getList() {
    log.debug(
      '[API.%s.getList] getList',
      this.constructor.name
    );

    let rule = {
      parentId: {required: true, isNumber: true},
      parentType: {required: true, isNumber: true, value: /^[0-2]$/}
    };
    let data = this.validate(rule);
    let ret = yield this._service.findWithParentTypeAndId(data);
    this.setModel({params: ret});

    yield this.next();
  }

  * update() {
    log.debug(
      '[API.%s.update] update',
      this.constructor.name
    );
    let id = this._context._id;

    let rule = {
      orgName: {},
      varName: {}
    };
    let data = this.validate(rule, 'body');
    data.id = id;

    let ret = yield this._service.update(data);
    this.setModel({params: [ret]});

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
      '[API.%s.removeBatch] removeBatch',
      this.constructor.name
    );
    _.translateParams(this._query, ['ids']);

    let ret = yield this._service.removeBatch(this._query.ids);
    this.setModel(ret);

    yield this.next();
  }

}

module.exports = VarmapController;
