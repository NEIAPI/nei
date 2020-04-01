/**
 * Template Service Class
 */

const log = require('../util/log');
const db = require('../../common').db;
const _ = require('../util/utility');
const Forbidden = require('../error/fe/ForbiddenError');

class TemplateService extends require('./ResWithParamService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao', './ParamTemplateService');
    this._type = db.RES_TYP_TEMPLATE;
    this._dao = new (require('../dao/TemplateDao'))({context});
    this._vDAO = new (require('../dao/ViewDao'))({context});
  }

  /**
   * 删除模板
   * @param {Array} ids - 模板id列表
   * @return {model/db/Template} 被删除的模板列表
   */
  * removeBatch(ids) {
    yield this._checkQuotes(ids);

    let paramService = new (require(this.param))(this._uid, this._context);
    yield this._beginTransaction();
    //清空参数
    for (let parentId of ids) {
      yield paramService.remove({parentId}, {clearAll: true, sendMsg: false});
    }
    let ret = yield super.removeBatch(ids);
    yield this._endTransaction();
    return ret;
  }

  /**
   * check whether the templates have been quoted/referenced
   *
   * @param {Array} ids - template id list
   * @return {void}
   */
  * _checkQuotes(ids) {
    let quotes = yield this._vDAO.getListByTemplate(ids);
    if (quotes.length) {
      throw new Forbidden(`模板被引用 id：${ids}`, {id: ids});
    }
  }

  /**
   * get detail data for template by id
   * @param {Number} id - template id
   * @return {model/db/Template}
   */
  * findDetailById(id) {
    let template = yield super.findDetailById(id);
    let paramService = new (require(this.param))(this._uid, this._context);
    let parameters = yield paramService.getList(id);
    template.params = parameters || [];
    yield this._fillWatch(template);
    return template;
  }

  * getDetailListInProject(projectId, opt = {}) {
    let projectIds = opt.pids || (yield this._getSearchPids(projectId));
    let ret = yield this._dao.getListInProjects(projectIds);
    let paramService = new (require(this.param))(this._uid, this._context);
    let ids = (ret || []).map(it => it.id);
    let paramMap = yield paramService.getListBatch(ids, opt.dhash);
    for (let item of ret) {
      item.params = paramMap[item.id] || [];
    }
    return ret;
  }

  /**
   * get view list that references the template
   * @param {Number} id - template id
   * @return {Array model/db/View}
   */
  * getQuotes(ids) {
    log.debug('[%.getQuote] - get template quotes by ids:%s', this.constructor.name, ids);
    ids = _.toArray(ids);
    let ret = yield this._checkBatchPermission(ids);
    yield this._checkSearchPermission(ret.id);
    let quotes = yield this._vDAO.getListByTemplate(ids);
    return {pages: quotes};
  }

  * addList({projectId, groupId, items = [], tag = ''}) {
    let permission = yield this._checkCreatePermission(projectId);
    let progroupId = permission.progroupId;
    let ids = [];

    yield this._beginTransaction();

    for (let item of items) {
      let ret = yield super.create(Object.assign(item, {
        projectId,
        groupId,
        progroupId,
        tag
      }));
      let id = ret.id;
      ids.push(id);
    }

    yield this._endTransaction();

    let ret = [];
    if (ids.length) {
      ret = yield this._dao.findBatch(ids, {joins: this._dao._getUserJoins()});
    }
    return ret;
  }
}

module.exports = TemplateService;
