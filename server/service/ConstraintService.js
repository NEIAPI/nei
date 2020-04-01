/**
 * Constraint Service Class
 */
let log = require('../util/log');
let db = require('../../common').db;

class ConstraintService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._type = db.RES_TYP_CONSTRAINT;
    this._dao = new (require('../dao/ConstraintDao'))({context});
  }

  /**
   * Create a constraint record
   * @param {model/db/Constraint} model - constraint object
   * @return {model/db/Constraint} constraint object to be inserted
   */
  * create(model) {
    let ret = yield this._checkCreatePermission(model.projectId);
    let progroupId = ret.progroupId;

    yield this._checkConflictInProject(model.projectId, {name: model.name}, '存在同名的规则函数');
    model.progroupId = progroupId;

    let constraint = yield super.create(model);
    return constraint;
  }

  * findDetailById(id) {
    yield this._checkSearchPermission(id);
    let ret = yield this._dao.find(id, {joins: this._dao._getUserJoins()});
    yield this._fillWatch(ret);
    return ret;
  }

  /**
   * get constraint list in project
   *
   * @param  {Number} pid - project id
   * @return {Array}  constraint list
   */
  * getListInProject(pid) {
    log.debug(
      '[%s.getListInProject] get constraint list in project %s',
      this.constructor.name, pid
    );

    let ret = yield super.getListInProject(pid);
    let systemList = yield this._dao.getListOfSystem();
    yield this._fillWatch(ret);
    let list = [...ret, ...systemList];
    return list;
  }
}

module.exports = ConstraintService;
