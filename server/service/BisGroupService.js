/**
 * BisGroup Service Class
 */
let log = require('../util/log');
let dbMap = require('../../common').db;
let Forbidden = require('../error/fe/ForbiddenError');

class BisGroupService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._type = dbMap.RES_TYP_BISGROUP;
    this._dao = new (require('../dao/BisGroupDao'))({context});
    this._dDAO = new (require('../dao/DataTypeDao'))({context});
    this._pDAO = new (require('../dao/ProjectDao'))({context});
    this._iDAO = new (require('../dao/InterfaceDao'))({context});
    this._tDAO = new (require('../dao/TemplateDao'))({context});
    this._vDAO = new (require('../dao/ViewDao'))({context});
    this._cDAO = new (require('../dao/ConstraintDao'))({context});
  }

  /**
   * Create a bisgroup record
   * @param {model/db/Bisgroup} bisgroup - bisgroup object
   * @return {model/db/Bisgroup} bisgroup object to be inserted
   */
  * create(model) {
    let ret = yield this._checkCreatePermission(model.projectId);
    let progroupId = ret.progroupId;
    model.progroupId = progroupId;
    return yield super.create(model);
  }

  /**
   * remove bisgroups in batch
   * @param {Array} ids - 业务分组id列表
   * @return {Array model/db/Bisgroup} 被删除的业务分组列表
   */
  * removeBatch(ids) {
    let bisgroups = yield this._dao.findBatch(ids);
    for (let bisgroup of bisgroups) {
      if (bisgroup.type === dbMap.BIS_TYP_SYSTEM) {
        // 默认分组不允许删除
        throw new Forbidden(`默认分组不允许删除 id：${ids}`, {id: ids});
      }
    }
    yield this._checkQuotes(ids);
    return yield super.removeBatch(ids);
  }

  * findDetailById(id) {
    yield this._checkSearchPermission(id);
    let ret = yield this._dao.find(id, {joins: this._dao._getUserJoins()});
    return ret;
  }

  /**
   * check whether the bisgroups have been quoted/referenced
   *
   * @param {Array} ids - bisgroup id list
   * @return {void}
   */
  * _checkQuotes(ids) {
    let quotes = yield this.getQuotes(ids);
    if (quotes.hasQuotes) {
      throw new Forbidden(`业务分组被引用 id：${ids}`, {id: ids});
    }
  }

  /**
   * 获取被引用列表
   * @param {Number} id - id
   * @return {model/db/Bisgroup} 引用列表
   */
  * getQuotes(id) {
    log.debug('[%s.getQuote] - get bisgroups quotes by id:%s',
      this.constructor.name, id);

    yield this._checkSearchPermission(id);

    let ret = yield {
      datatypes: this._dDAO.getListByBisGroup(id),
      interfaces: this._iDAO.getListByBisGroup(id),
      templates: this._tDAO.getListByBisGroup(id),
      pages: this._vDAO.getListByBisGroup(id),
      constraints: this._cDAO.getListByBisGroup(id)
    };

    let arr = [];
    Object.keys(ret).forEach((item) => {
      ret[item] = ret[item] || [];
      arr.push(...ret[item]);
    });

    return Object.assign(ret, {hasQuotes: !!arr.length});
  }
}

module.exports = BisGroupService;
