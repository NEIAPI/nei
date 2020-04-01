/**
 * Clients services
 */
const log = require('../util/log');
const _ = require('../util/utility');
const dbMap = require('../../common').db;
const NotFoundError = require('../error/fe/NotFoundError');
const IllegalRequest = require('../error/fe/IllegalRequestError');
const InterfaceService = require('./InterfaceService');
const RpcService = require('./RpcService');
const DataTypeService = require('./DataTypeService');
const history = require('./helper/history');

let _filter = (function () {
  const SENSITIVE_FIELDS = ['password', 'passwordSalt'];

  return function (user) {
    for (let field of SENSITIVE_FIELDS) {
      delete user[field];
    }
    return user;
  };
})();

const SERVICE_MAP = {
  [dbMap.RES_TYP_INTERFACE]: InterfaceService,
  [dbMap.RES_TYP_RPC]: RpcService,
  [dbMap.RES_TYP_DATATYPE]: DataTypeService
};

const ResourceService = require('./ResourceService');

class ResourceVersionService extends ResourceService {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._dao = new (require('../dao/ResourceVersionDao'))({context});
  }

  /**
   * create a model record
   *
   * @param  {Object} model - json or model object
   * @return {model/db/Model} model object to be inserted
   */
  * create(model) {
    let r = yield this._checkCreatePermission(model.projectId);
    let progroupId = r.progroupId;
    model.progroupId = progroupId;

    let parentVersion = yield this._dao.search({conds: {resType: model.resType, resId: model.parent}});
    const Service = SERVICE_MAP[model.resType];
    if (!Service) {
      //Todo error 处理
      throw new IllegalRequest('resType is illegal');
    }
    let service = new Service(this._uid, this._context);

    let origin = parentVersion.length === 0 ? model.parent : parentVersion[0].origin;

    let newResource = yield service.clone({
      pid: model.projectId,
      gid: model.groupId,
      tag: model.tag || '',
      copys: [{
        id: model.parent,
        name: model.name
      }],
      version: {
        name: model.version,
        origin: origin
      }
    });
    // clone 函数对parent已经做过权限验证
    if (parentVersion.length === 0) {// 无历史版本，这时候应该先为origin接口创建一个新版本
      let originVersionModel = {
        'resType': model.resType,
        'parent': model.parent,
        'resId': model.parent,
        'origin': model.parent,
        'projectId': model.projectId,
        'progroupId': progroupId,
        'description': '',
        'name': '初始版本',
      };
      let originVersion = yield super.create(originVersionModel);
      model.origin = originVersion.resId;
    } else {
      model.origin = parentVersion[0].origin;
    }
    model.resId = newResource[0].id;
    model.name = model.version; // 前端传过来的和数据库的不一致
    let ret = yield super.create(model);
    // 打日志
    this._async(history.log, {
      dName: this._dao.constructor.name,
      oprType: 'add',
      uid: this._uid,
      ret: {
        data: [{
          progroupId,
          name: model.name,
          projectId: model.projectId,
          resType: model.resType,
          resId: model.resId,
          parent: model.parent
        }]
      }
    });
    return ret;
  }

  * getListBatch(res_ids, res_type) {
    return yield this._dao.search({
      sfields: ['parent', 'origin', 'resId', 'name'],
      conds: {resId: res_ids, resType: res_type},
    });
  }

  /**
   * 移除资源版本， 需要保证该版本在链路的尾，即不能是其他版本的父
   * @param {Array} ids
   * @param notAndActopt
   * @return {*}
   */
  * removeBatch(res_ids, res_type, notAndActopt) {
    let versionToRemove = yield this._dao.search({
      sfields: Object.keys(this._dao._Model.getField()),
      field: {parent: 'DISTINCT'},
      conds: {parent: res_ids, resType: res_type},
    }); // 找出所有已经被引用的数据

    let versionIdMap = {};
    versionToRemove.forEach(function (obj) {
      versionIdMap[obj.parent] = obj.id;
    });

    let cantToRemoveIds = res_ids.filter(id => versionIdMap[id]);

    let toRemoveResIds = res_ids.filter(id => !versionIdMap[id]);
    let toRemoveObj = yield this._dao.search({
      sfields: Object.keys(this._dao._Model.getField()),
      conds: {resId: toRemoveResIds, resType: res_type}
    });
    let toRemoveIds = toRemoveObj.map(obj => obj.id);
    if (toRemoveIds.length == 0) {
      return [];
    }

    return yield super.removeBatch(toRemoveIds, notAndActopt);
  }
}

module.exports = ResourceVersionService;
