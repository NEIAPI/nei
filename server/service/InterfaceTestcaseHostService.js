/**
 * InterfaceTestcaseHost Service Class
 */
let Forbidden = require('../error/fe/ForbiddenError');

class InterfaceTestcaseHostService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._dao = new (require('../dao/InterfaceTestcaseHostDao'))({context});
    this._pDAO = new (require('../dao/ProjectDao'))({context});
  }

  /**
   * Create a host record
   * @param {Object} model - testcase host object
   * @return {model/db/InterfaceTestCaseHost} testcase host object to be inserted
   */
  * create(model) {
    let ret = yield this._checkCreatePermission(model.projectId);
    model.progroupId = ret.progroupId;
    return yield super.create(model);
  }

  * removeBatch(ids) {

    //检查是否被引用
    let projectId = yield this._dao.getProjects(ids);
    if (projectId.length !== 1) {
      throw new Forbidden(`资源不在同一个项目 id：${ids}`, {id: ids});
    }
    let project = yield this._pDAO.find(projectId[0]);
    if (project.hostId && ids.includes(project.hostId)) {
      throw new Forbidden(`资源被引用 id：${ids}`, {id: ids});
    }

    return yield super.removeBatch(ids);
  }

  * findDetailById(id) {
    yield this._checkSearchPermission(id);
    let ret = yield this._dao.find(id, {joins: this._dao._getUserJoins()});
    return ret;
  }
}

module.exports = InterfaceTestcaseHostService;
