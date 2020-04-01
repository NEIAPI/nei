/**
 * Document services
 */

const ResourceService = require('./ResourceService');

class DocumentService extends ResourceService {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._pDAO = new (require('../dao/ProjectDao'))({context});
    this._dao = new (require('../dao/DocumenDao'))({context});
  }

  * create(model, conflictOpt) {
    let ret = yield this._checkCreatePermission(model.projectId);
    let progroupId = ret.progroupId;
    model.progroupId = progroupId;

    if (!conflictOpt) {
      conflictOpt = {name: model.name};
    }

    if (!conflictOpt.hasOwnProperty('uncheck')) {
      yield this._checkConflictInProject(model.projectId, conflictOpt, '存在冲突的资源');
    }

    return yield super.create(model);
  }
}

module.exports = DocumentService;
