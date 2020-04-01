const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const InterfaceService = require('../../service/InterfaceService');
const ResourceVersionService = require('../../service/ResourceVersionService');
const ResourceClientService = require('../../service/ResourceClientService');
const ResourceViewHistoryService = require('../../service/ResourceViewHistoryService');

const db = require('../../../common').db;

class InterfaceController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new InterfaceService(this._uid, context);
    this._resourceViewHistoryservice = new ResourceViewHistoryService(this._uid, context);
    this._rvService = new ResourceVersionService(this._uid, context);
    this._rcService = new ResourceClientService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );

    let rule = {
      name: {required: true},
      path: {},
      tag: {},
      method: {value: /^\w+$/},
      isRest: {isNumber: true},
      description: {},
      type: {},
      respoId: {required: true, isNumber: true},
      groupId: {isNumber: true},
      userIds: {isArray: true, value: /^\d+$/},
      projectId: {required: true, isNumber: true},
      className: {},
      schema: {}
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
      name: {},
      tag: {},
      parent: {isNumber: true},
      projectId: {isNumber: true},
      groupId: {isNumber: true},
      description: {},
      version: {}
    };

    let data = this.validate(rule, 'body');
    data.resType = db.RES_TYP_INTERFACE;
    let nv = yield this._rvService.create(data);
    let ret = yield this._service.findDetailById(nv.resId);
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

  * crud() {
    log.debug(
      '[API.%s.crud] crud',
      this.constructor.name
    );

    let curdRule = {
      name: {required: true},
      method: {required: true, value: /^\w+$/},
      path: {required: true},
      type: {required: true, isNumber: true},
      connectId: {required: true, isNumber: true},
      connectType: {required: true, isNumber: true, value: /^([0-9]|1[0-1])$/},
    };
    let itemRule = {
      tag: {required: true},
      gid: {required: true, isNumber: true},
      datatypeId: {required: true, isNumber: true},
      interfaces: {required: true, isArray: true, rule: curdRule}
    };
    let rule = {
      pid: {required: true, isNumber: true},
      mid: {isNumber: true},
      items: {required: true, isArray: true, rule: itemRule}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.crud(data);
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
    // 生成查看详情的历史记录
    yield this._resourceViewHistoryservice.create({
      userId: this._uid,
      resId: id,
      resType: db.RES_TYP_INTERFACE,
      projectId: ret.projectId,
      progroupId: ret.progroupId
    });
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
      name: {},
      path: {},
      tag: {},
      method: {value: /^\w+$/},
      isRest: {isNumber: true},
      description: {},
      type: {},
      statusId: {isNumber: true},
      userIds: {isArray: true, value: /^\d+$/},
      respoId: {isNumber: true},
      groupId: {isNumber: true},
      projectId: {isNumber: true},
      reqFormat: {isNumber: true, value: /^[0-7]$/},
      resFormat: {isNumber: true, value: /^[0-7]$/},
      clientIds: {isArray: true, value: /^\d+$/},
      beforeScript: {},
      afterScript: {},
      className: {},
      versionName: {},
      connectId: {isNumber: true},
      connectType: {isNumber: true, value: /^([0-9]|1[0-1])$/},
      blbScript: {},
      blaScript: {},
      mockDelay: {isNumber: true},
      schema: {}
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

  * importBatch() {
    log.debug(
      '[API.%s.importBatch] import batch',
      this.constructor.name
    );

    let rule = {
      projectId: {isNumber: true, required: true},
      tag: {},
      groupId: {isNumber: true, required: true},
      interfaces: {required: true},
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

  // 给 NEI 构建工具调用的获取mock数据的接口
  * getMockData() {
    log.debug(
      '[API.%s.getMockData] get mock data from nei toolkit',
      this.constructor.name
    );

    let data = this.validate({
      id: {},
      method: {},
      path: {},
      type: {required: true, isNumber: true},
      key: {required: true}
    });
    let service = new InterfaceService(db.USR_ADMIN_ID, this._context);
    let ret = yield service.getMockData(data);
    this.setModel(ret);

    yield this.next();
  }

  // 直接在线可调用的获取mock数据的接口
  * getApiMockData(isFromProgroup = false) {
    log.debug(
      '[API.%s.getApiMockData] get mock data from direct api access',
      this.constructor.name
    );

    const reqMethod = this._context.req.method;
    if (reqMethod === 'OPTIONS') {
      return yield this.next();
    }

    const req = {
      method: reqMethod,
      query: this._context.query,
      body: this._context.body,
      apiPath: '/' + this._context.params[0],
      url: this._context.url,
      headers: this._context.headers
    };
    const data = {
      key: this._context.params.toolKey,
      req,
      isFromProgroup: req.url.startsWith('/api/apimock-v2/'),
      apiVersion: this._context.headers['nei-api-version']
    };

    const service = new InterfaceService(db.USR_ADMIN_ID, this._context);
    this._context.model = yield service.getApiMockData(data);

    yield this.next();
  }

  * getApiMockCallTimes() {
    log.debug(
      '[API.%s.getApiMockCallTimes] get mockstore api call times',
      this.constructor.name
    );

    const service = new InterfaceService(db.USR_ADMIN_ID, this._context);
    const times = yield service.getApiMockCallTimes();
    this.setModel(times);

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
}

module.exports = InterfaceController;
