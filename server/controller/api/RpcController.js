const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const RpcService = require('../../service/RpcService');
const ResourceVersionService = require('../../service/ResourceVersionService');
let IllegalRequestError = require('../../error/fe/IllegalRequestError');

const db = require('../../../common').db;

class RpcController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new RpcService(this._uid, context);
    this._rvService = new ResourceVersionService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );

    let rule = {
      name: {required: true},
      className: {required: true},
      path: {required: true},
      tag: {},
      description: {},
      respoId: {required: true, isNumber: true},
      groupId: {isNumber: true},
      projectId: {required: true, isNumber: true},
      userIds: {isArray: true, value: /^\d+$/}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
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
      name: {required: true},
      tag: {},
      parent: {isNumber: true},
      projectId: {isNumber: true},
      groupId: {isNumber: true},
      description: {},
      version: {required: true}
    };

    let data = this.validate(rule, 'body');
    data.resType = db.RES_TYP_RPC;
    let nv = yield this._rvService.create(data);
    let ret = yield this._service.findDetailById(nv.resId);
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

  * updateStatusBatch() {
    log.debug(
      '[API.%s.updateStateBatch] update state',
      this.constructor.name
    );

    let rule = {
      ids: {required: true, isArray: true, value: /^\d+$/},
      statusId: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.updateStatusBatch(data);
    this.setModel(ret);

    yield this.next();
  }

  * getListByProgroupId() {
    log.debug(
      '[API.%s.getListByProgroupId] get list by progroupId',
      this.constructor.name
    );

    let {pgId} = this.validate({
      pgId: {isNumber: true}
    });
    let ret = yield this._service.getListInProGroup(pgId);
    this.setModel(ret);

    yield this.next();
  }

  * getListByProjectId() {
    log.debug(
      '[API.%s.getListByProjectId] get list by projectId',
      this.constructor.name
    );

    const {pid} = this.validate({
      pid: {isNumber: true}
    });

    let ret = yield this._service.getListInProject(pid);
    this.setModel(ret);

    yield this.next();
  }

  * getListByIds() {
    log.debug(
      '[API.%s.getListByIds] get list by ids',
      this.constructor.name
    );

    _.translateParams(this._query, ['ids']);
    let ret = yield this._service.findDetailByIds(this._query.ids);
    this.setModel(ret);

    yield this.next();
  }

  * audit() {
    log.debug(
      '[API.%s.audit] audit id',
      this.constructor.name
    );

    let id = this._context._id;
    let rule = {
      state: {isBoolean: true, required: true},
      reason: {}
    };
    let data = this.validate(rule, 'body');
    data.id = id;
    data.uid = this._uid;
    yield this._service.audit(data);
    let ret = yield this._service.findDetailById(id);
    this.setModel(ret);

    yield this.next();
  }

  * reAudit() {
    log.debug(
      '[API.%s.reAudit] reAudit',
      this.constructor.name
    );
    let id = this._context._id;
    yield this._service.reCreateAuditRecord(id);
    let ret = yield this._service.findDetailById(id);
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

  * update() {
    log.debug(
      '[API.%s.update] update',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      name: {},
      path: {},
      tag: {},
      description: {},
      statusId: {isNumber: true},
      userIds: {isArray: true, value: /^\d+$/},
      respoId: {isNumber: true},
      groupId: {isNumber: true},
      projectId: {isNumber: true},
      reqFormat: {isNumber: true, value: /^[0-7]$/},
      resFormat: {isNumber: true, value: /^[0-7]$/},
      className: {},
      versionName: {},
      mockDelay: {isNumber: true},
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

  * importBatch() {
    log.debug(
      '[API.%s.importBatch] import batch',
      this.constructor.name
    );

    let rule = {
      projectId: {isNumber: true, required: true},
      tag: {},
      groupId: {isNumber: true, required: true},
      rpcs: {required: true},
      datatypes: {required: true}
    };

    let data = this.validate(rule, 'body');
    let ret = yield this._service.importBatch(data);
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

  * watchBatch() {
    log.debug(
      '[API.%s.watch] watch',
      this.constructor.name
    );
    let rule = {
      ids: {required: true, isArray: true, value: /^\d+$/},
      v: {required: true, isNumber: true},
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.watchBatch(data.ids, data.v);
    this.setModel(ret);

    yield this.next();
  }

  * sendMsgToWatch() {
    log.debug(
      '[API.%s.sendMsgToWatch] sendMsgToWatch',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      msg: {required: true}
    };
    let data = this.validate(rule, 'body');
    data.id = id;
    let ret = yield this._service.sendMsgToWatch(data);
    this.setModel(ret);

    yield this.next();
  }

  * sendApiChangeMsgToWatch() {
    log.debug(
      '[API.%s.sendApiChangeMsgToWatch] sendApiChangeMsgToWatch',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      content: {required: true}
    };
    let data = this.validate(rule, 'body');
    data.id = id;
    let ret = yield this._service.sendApiChangeMsgToWatch(data);
    this.setModel(ret);

    yield this.next();
  }

  // 直接在线可调用的获取mock数据的接口
  * getApiMockData() {
    log.debug(
      '[API.%s.getApiMockData] get mock data from direct api access',
      this.constructor.name
    );

    const reqMethod = this._context.req.method;
    // 跨域请求时先发送的OPTIONS请求，直接通过
    if (reqMethod === 'OPTIONS') {
      return yield this.next();
    }

    if (reqMethod !== 'POST') {
      throw new IllegalRequestError(`请使用 POST 请求`);
    }

    const req = {
      body: this._context.body,
      apiPath: this._context.params[0],
      url: this._context.url,
      headers: this._context.headers
    };
    const data = {
      key: this._context.params.toolKey,
      req,
      isFromProgroup: req.url.startsWith('/api/rpcmock-v2/'),
      apiVersion: this._context.headers['nei-api-version']
    };

    const service = new RpcService(db.USR_ADMIN_ID, this._context);
    this._context.model = yield service.getApiMockData(data);

    yield this.next();

  }
}

module.exports = RpcController;
