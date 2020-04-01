/**
 * ProGroupApiSpec Service Class
 */
const log = require('../util/log');
const _ = require('../util/utility');
const dbMap = require('../../common').db;
const notification = require('./helper/notification');
const history = require('./helper/history');
const IllegalRequest = require('../error/fe/IllegalRequestError');
const Forbidden = require('../error/fe/ForbiddenError');
const NService = require('./NService');
const ProGroupDao = require('../dao/ProGroupDao');
const ProGroupApiSpecDao = require('../dao/ProGroupApiSpecDao');
const UserDao = require('../dao/UserDao');
const ProGroupService = require('../service/ProGroupService');

class ProGroupApiSpecService extends NService {
  constructor(uid, context) {
    super(context);
    this._uid = uid;
    this._dao = new ProGroupApiSpecDao({context});
    this._pgDao = new ProGroupDao({context});
    this._userDao = new UserDao({context});
    this._pgService = new ProGroupService(uid, context);
  }

  * getSpecByProgroupId(progroupId) {
    const spec = yield this._dao.search({
      conds: {progroupId}
    });
    return spec;
  }

  /**
   * 更新或者创建 http 接口规范
   */
  * updateOrCreateHttpSpec({id: progroupId, httpSpec: httpSpec}) {
    log.debug(
      '[%s.updateOrCreateHttpSpec] update or create http spec of progroup id %s',
      this.constructor.name, progroupId
    );
    yield this._pgService._checkUpdatePermission(progroupId);
    const oldApiSpec = yield this._dao.search({
      conds: {progroupId, type: dbMap.INTERFACE_TYP_HTTP}
    });
    const specDetails = {
      path: httpSpec.path,
      pathDescription: httpSpec.pathDescription,
      param: httpSpec.param,
      paramDescription: httpSpec.paramDescription,
      paramdesc: httpSpec.paramdesc,
      paramdescDescription: httpSpec.paramdescDescription,
      method: httpSpec.method,
      methodDescription: httpSpec.methodDescription,
      tag: httpSpec.tag,
      tagDescription: httpSpec.tagDescription,
      resSchema: httpSpec.resSchema,
      resSchemaDescription: httpSpec.resSchemaDescription,
      interfaceSchema: httpSpec.interfaceSchema,
      interfaceSchemaDescription: httpSpec.interfaceSchemaDescription,
    };
    yield this._beginTransaction();
    if (oldApiSpec.length) {
      // update
      yield this._dao.update(Object.assign({}, oldApiSpec[0], specDetails));
    } else {
      // create
      yield this._dao.create(Object.assign({}, specDetails, {progroupId}));
    }
    yield this._endTransaction();
    const newApiSpec = yield this._dao.search({
      conds: {progroupId, type: dbMap.INTERFACE_TYP_HTTP}
    });
    const progroup = yield this._pgDao.find(progroupId);
    this._async(history.log, {
      dName: this._dao.constructor.name,
      uid: this._uid,
      progroup,
      apiType: dbMap.INTERFACE_TYP_HTTP,
      ret: {
        oldApiSpec: oldApiSpec[0],
        newApiSpec: newApiSpec[0]
      }
    });
    return {
      httpSpec: {
        path: newApiSpec[0].path,
        pathDescription: newApiSpec[0].pathDescription,
        param: newApiSpec[0].param,
        paramDescription: newApiSpec[0].paramDescription,
        paramdesc: newApiSpec[0].paramdesc,
        paramdescDescription: newApiSpec[0].paramdescDescription,
        method: newApiSpec[0].method,
        methodDescription: newApiSpec[0].methodDescription,
        tag: newApiSpec[0].tag,
        tagDescription: newApiSpec[0].tagDescription,
        resSchema: newApiSpec[0].resSchema,
        resSchemaDescription: newApiSpec[0].resSchemaDescription,
        interfaceSchema: newApiSpec[0].interfaceSchema,
        interfaceSchemaDescription: newApiSpec[0].interfaceSchemaDescription
      }
    };
  }
}

module.exports = ProGroupApiSpecService;
