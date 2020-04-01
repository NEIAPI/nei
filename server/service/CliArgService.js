/**
 * CliArg Service Class
 */

class CliArgService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._dao = new (require('../dao/CliArgDao'))({context});
  }

  /**
   * Create a CLI argument record
   * @param {Object} model - CLI argument object
   * @return {model/db/Arguments} arguments object to be inserted
   */
  * create(model) {
    let ret = yield this._checkCreatePermission(model.projectId);
    let progroupId = ret.progroupId;
    model.progroupId = progroupId;
    return yield super.create(model);
  }

  /**
   * get list in project
   *
   * @param {Number} pid - project id
   * @param {Number} type - same as spec type
   * @return {Object}
   */
  * getListInProject(pid, type) {
    let ret = yield super.getListInProject(pid);
    return (ret || []).filter((it) => {
      return it && (type == null || it.type === type);
    });
  }
}

module.exports = CliArgService;
