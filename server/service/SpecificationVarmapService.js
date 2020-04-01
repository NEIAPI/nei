/**
 * SpecificationVarmap Service Class
 */

const log = require('../util/log');
const Forbidden = require('../error/fe/ForbiddenError');
const dbMap = require('../../common').db;
const specTypes = ['toolSpecWeb', 'toolSpecAos', 'toolSpecIos', 'toolSpecTest'];

function addSpecs(specIds, data) {
  if (!data) {
    return;
  }
  specTypes.forEach(function (specType) {
    if (!!data[specType]) {
      specIds.push(data[specType]);
    }
  });
}

class SpecificationVarmapService extends require('./NService') {
  constructor(uid, context) {
    super(uid, context);
    this._uid = uid;
    this._dao = new (require('../dao/SpecificationVarmapDao'))({context});
    this._specificationService = new (require('./SpecificationService'))(uid, context);
    this._projectService = new (require('./ProjectService'))(uid, context);
    this._proGroupService = new (require('./ProGroupService'))(uid, context);
  }

  * _checkPermission(parentType, parentId) {
    if (parentType === dbMap.SPC_MAP_SPEC) {
      yield this._specificationService._checkSearchPermission(parentId);
    } else if (parentType === dbMap.SPC_MAP_PROJECT) {
      yield this._projectService._checkSearchPermission(parentId);
    } else if (parentType === dbMap.SPC_MAP_PROGROUP) {
      yield this._proGroupService._checkSearchPermission(parentId);
    }
  }

  /**
   * create a spec varmap
   *
   * @param {Object} model - spec data
   * @return {db/model/SpecificationVarmap}
   */
  * create(model) {
    let parentType = model.parentType;
    let parentId = model.parentId;
    yield this._checkPermission(parentType, parentId);
    model.creatorId = this._uid;
    return yield super.create(model);
  }

  * findWithParentTypeAndId({
    parentId,
    parentType
  }) {
    log.debug('[SpecificationVarmapService.findWithParentTypeAndId] - ' +
      'get SpecificationVarmap by parentId:%s, and parentType:%s', parentId, parentType);
    let specIds = [],
      projectIds = [],
      progroupIds = [];
    yield this._checkPermission(parentType, parentId);

    if (parentType === dbMap.SPC_MAP_SPEC) {
      specIds.push(parentId);
    } else if (parentType === dbMap.SPC_MAP_PROJECT) {
      projectIds.push(parentId);
      let project = yield this._projectService._dao.find(parentId);
      addSpecs(specIds, project);

      let prgId = project.progroupId;
      progroupIds.push(prgId);
      let progroup = yield this._proGroupService._dao.find(prgId);
      addSpecs(specIds, progroup);
    } else if (parentType === dbMap.SPC_MAP_PROGROUP) {
      progroupIds.push(parentId);
      let progroup = yield this._proGroupService._dao.find(parentId);
      addSpecs(specIds, progroup);
    }

    let ret = [];
    if (specIds.length > 0) {
      ret = ret.concat(yield this._dao.getVarmaps({
        parentId: specIds,
        parentType: dbMap.SPC_MAP_SPEC
      }));
    }

    if (projectIds.length > 0) {
      ret = ret.concat(yield this._dao.getVarmaps({
        parentId: projectIds,
        parentType: dbMap.SPC_MAP_PROJECT
      }));
    }

    if (progroupIds.length > 0) {
      ret = ret.concat(yield this._dao.getVarmaps({
        parentId: progroupIds,
        parentType: dbMap.SPC_MAP_PROGROUP
      }));
    }
    return ret;
  }

  * update(model) {
    let ret = yield this.getById(model.id);
    if (!ret) {
      throw new Forbidden(`找不到资源或者没有操作权限 id：${model.id}`);
    }
    yield this._checkPermission(ret.parentType, ret.parentId);
    return yield super.update(model);
  }

  * removeBatch(ids) {
    let resources = yield this._dao.findBatch(ids);
    if (!resources.length || resources.some(item => {
        return item.id != resources[0].id;
      })) {
      throw new Forbidden(`找不到资源或者没有操作权限 ids：${ids}`);
    }
    yield this._checkPermission(resources[0].parentType, resources[0].parentId);
    return yield super.removeBatch(ids);
  }
}

module.exports = SpecificationVarmapService;
