const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const InterfaceTestcaseHostService = require('../../service/InterfaceTestcaseHostService');

class HostController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new InterfaceTestcaseHostService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let rule = {
      value: {},
      name: {},
      header: {},
      projectId: {required: true, isNumber: true}
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
    let {pid} = this.validate({
      pid: {isNumber: true}
    });
    let ret = yield this._service.getListInProject(pid);
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
      name: {},
      value: {},
      header: {}
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

  * removeBatch() {
    log.debug(
      '[API.%s.remove] remove',
      this.constructor.name
    );
    this.validate({
      ids: {required: true}
    });
    _.translateParams(this._query, ['ids']);

    let ret = yield this._service.removeBatch(this._query.ids);
    this.setModel(ret);

    yield this.next();
  }

}

module.exports = HostController;
