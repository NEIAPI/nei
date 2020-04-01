const log = require('../../util/log');
const NController = require('../../arch/NController');
const OpenApiOfPATService = require('../../service/OpenApiOfPATService');

class OpenApiOfPATController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new OpenApiOfPATService(context.pat.creatorId, context);
  }

  * getProgroups() {
    log.debug(
      '[OPENAPI.%s.getProgroups] getProgroups',
      this.constructor.name
    );

    const pat = this._context.pat;
    const ret = yield this._service.getProgroups(pat);
    this.setModel(ret);

    yield this.next();
  }

  * getProjectsByPgid() {
    log.debug(
      '[API.%s.getProjectsByPgid]  getProjectsByPgid',
      this.constructor.name
    );

    const rule = {
      pgid: {required: true, isNumber: true}
    };
    const data = this.validate(rule);
    const pat = this._context.pat;
    const ret = yield this._service.getProjectsByPgid(data.pgid, pat);
    this.setModel(ret);

    yield this.next();
  }

  * getProjectById() {
    log.debug(
      '[API.%s.getProjectById]  getProjectById',
      this.constructor.name
    );

    const pat = this._context.pat;
    const pid = parseInt(this._context.params.id, 10);
    const ret = yield this._service.getProjectById(pid, pat);
    this.setModel(ret);

    yield this.next();
  }

  * getInterfacesByPid() {
    log.debug(
      '[API.%s.getInterfacesByPid]  getInterfacesByPid',
      this.constructor.name
    );

    const rule = {
      pid: {required: true, isNumber: true},
      excludeShared: {required: false, isBoolean: true}
    };

    const pat = this._context.pat;
    const data = this.validate(rule);
    const ret = yield this._service.getInterfacesByPid(data, pat);
    this.setModel(ret);

    yield this.next();
  }

  * getInterfaceDetailById() {
    log.debug(
      '[API.%s.getInterfaceDetailById]  getInterfaceDetailById',
      this.constructor.name
    );

    const pat = this._context.pat;
    const interfaceId = parseInt(this._context.params.id, 10);
    const ret = yield this._service.getInterfaceDetailById(interfaceId, pat);
    this.setModel(ret);

    yield this.next();
  }

  * getInterfaceDetailByPath() {
    log.debug(
      '[API.%s.getInterfaceDetailByPath]  getInterfaceDetailByPath',
      this.constructor.name
    );

    let rule = {
      pid: {required: true},
      path: {required: true},
      method: {required: false}
    };

    const data = this.validate(rule);
    const pat = this._context.pat;
    const ret = yield this._service.getInterfaceDetailByPath(data, pat);
    this.setModel(ret);

    yield this.next();
  }

  * getRpcInterfacesByPid() {
    log.debug(
      '[API.%s.getRpcInterfacesByPid]  getRpcInterfacesByPid',
      this.constructor.name
    );

    const rule = {
      pid: {required: true, isNumber: true},
      excludeShared: {required: false, isBoolean: true}
    };

    const data = this.validate(rule);
    const pat = this._context.pat;
    const ret = yield this._service.getRpcInterfacesByPid(data, pat);
    this.setModel(ret);

    yield this.next();
  }

  * getRpcInterfaceDetailById() {
    log.debug(
      '[API.%s.getRpcInterfaceDetailById]  getRpcInterfaceDetailById',
      this.constructor.name
    );

    const rpcId = parseInt(this._context.params.id, 10);
    const pat = this._context.pat;
    const ret = yield this._service.getRpcInterfaceDetailById(rpcId, pat);
    this.setModel(ret);

    yield this.next();
  }

  * getRpcInterfaceDetailByMethodName() {
    log.debug(
      '[API.%s.getRpcInterfaceDetailByMethodName]  getRpcInterfaceDetailByMethodName',
      this.constructor.name
    );

    const rule = {
      pid: {required: true, isNumber: true},
      className: {required: true},
      methodName: {required: true}
    };

    const data = this.validate(rule);
    const pat = this._context.pat;
    const ret = yield this._service.getRpcInterfaceDetailByMethodName(data, pat);
    this.setModel(ret);

    yield this.next();
  }

  * isInterUpdated() {
    log.debug(
      '[API.%s.isInterUpdated] isInterUpdated',
      this.constructor.name
    );

    const rule = {
      lastUpdateTime: {required: true, isNumber: true}
    };

    const data = this.validate(rule);
    data.id = parseInt(this._context.params.id, 10);
    const pat = this._context.pat;
    const ret = yield this._service.isInterUpdated(data, pat);
    this.setModel(ret);

    yield this.next();
  }

  * isRpcInterUpdated() {
    log.debug(
      '[API.%s.isRpcInterUpdated] isRpcInterUpdated',
      this.constructor.name
    );

    let rule = {
      lastUpdateTime: {required: true, isNumber: true}
    };

    const data = this.validate(rule);
    data.id = parseInt(this._context.params.id, 10);
    const pat = this._context.pat;
    const ret = yield this._service.isRpcInterUpdated(data, pat);
    this.setModel(ret);

    yield this.next();
  }

  * getDatatypesByPid() {
    log.debug(
      '[API.%s.getDatatypesByPid] getDatatypesByPid',
      this.constructor.name
    );

    const rule = {
      pid: {required: true, isNumber: true}
    };

    const data = this.validate(rule);
    const pat = this._context.pat;
    const ret = yield this._service.getDatatypesByPid(data, pat);
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = OpenApiOfPATController;
