const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const SpecificationKlassmapService = require('../../service/SpecificationKlassmapService');

class SpecificationKlassmapController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new SpecificationKlassmapService(this._uid, context);
  }


  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let rule = {
      specId: {required: true, isNumber: true},
      instanceName: {required: true},
      klassName: {required: true}
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
      specId: {required: true, isNumber: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.findWithSpecId(data.specId);
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
      instanceName: {},
      klassName: {}
    };
    let data = this.validate(rule, 'body');
    data.id = id;

    let ret = yield this._service.update(data);
    this.setModel({params: [ret]});

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

module.exports = SpecificationKlassmapController;
