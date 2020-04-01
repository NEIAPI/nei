const log = require('../../util/log');
const dbMap = require('../../../common').db;
const NController = require('../../arch/NController');
const ProGroupVerService = require('../../service/ProGroupVerService');

class ProgroupVerController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new ProGroupVerService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let rule = {
      pgId: {required: true, isNumber: true},
      message: {}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
    this.setModel(ret);

    yield this.next();
  }

  * getListByUserId() {
    log.debug(
      '[API.%s.getListByUserId] get list byu serId',
      this.constructor.name
    );

    let ret = yield this._service.getListForUser(this._uid);
    this.setModel(ret);

    yield this.next();
  }

  * getListByProGroup() {
    log.debug(
      '[API.%s.getListByProGroup] get list by progroup',
      this.constructor.name
    );

    let rule = {
      pgId: {required: true, isNumber: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.getListByProGroup(data.pgId);
    this.setModel(ret);

    yield this.next();
  }

  * getApprovalListByUserId() {
    log.debug(
      '[API.%s.getApprovalListByUserId] get approval list by userId',
      this.constructor.name
    );

    let ret = yield this._service.getApprovalListByUserId(this._uid);
    this.setModel(ret);

    yield this.next();
  }

  * approve() {
    log.debug(
      '[API.%s.approve] approve',
      this.constructor.name
    );

    let id, ids = [];
    try {
      id = this._context.params.id;
      ids = id.toString()
        .split(',')
        .map(item => +item);

      ids = Array.from(new Set(ids));

      if (!ids.length) {
        throw new Error('参数错误');
      }
    } catch (error) {
      throw new IllegalRequestError(`参数错误: ids`);
    }

    if (this._body.v === dbMap.CMN_BOL_NO) {
      this._body.role = dbMap.PRG_ROL_GUEST;
    }

    let rule = {
      v: {required: true, isNumber: true},
      role: {required: true, isNumber: true, value: /^[0129]$/},
      message: {}
    };
    let data = this.validate(rule, 'body');

    data.ids = ids;

    let ret = yield this._service.approveBatch(this._uid, data);
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = ProgroupVerController;
