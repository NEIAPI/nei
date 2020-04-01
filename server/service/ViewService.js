/**
 * View Service Class
 *
 */

const Forbidden = require('../error/fe/ForbiddenError');
const _ = require('../util/utility');

class ViewService extends require('./ResWithParamService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao', './ParamWebViewService');
    this._dao = new (require('../dao/ViewDao'))({context});
    this._tDAO = new (require('../dao/TemplateDao'))({context});
    this._iDAO = new (require('../dao/InterfaceDao'))({context});
    this._viDAO = new (require('../dao/ViewInterfaceDao'))({context});
    this._vtDAO = new (require('../dao/ViewTemplateDao'))({context});
  }

  /**
   * action after the view is created
   * @param  {Object} data
   * @param  {Number} viewId - view/resource id
   * @return
   */
  * _afterCreate({templateIds = [], interfaceIds = []}, viewId) {
    // view-template relationships
    if (templateIds && templateIds.length) {
      yield this._vtDAO.createBatch(templateIds.map((item) => {
        return {
          viewId,
          templateId: item
        };
      }));
    }

    // view-interface relationships
    if (interfaceIds && interfaceIds.length) {
      yield this._viDAO.createBatch(interfaceIds.map((item) => {
        return {
          viewId,
          interfaceId: item
        };
      }));
    }
  }

  /**
   * Create a view record
   * @param {Object} model - view object
   * @return {model/db/View}
   */
  * create({
    projectId,
    templateIds = [],
    interfaceIds = []
  }) {
    let model = arguments[0];

    let pids = yield this._getSearchPids(projectId);
    let validate = function*(arr) {
      for (let i = 0; i < arr.length; i++) {
        let {ids, dao, type} = arr[i];
        if (!ids.length) {
          return;
        }
        // check project
        let rec = yield dao.getProjects(ids);
        rec.some((pid) => {
          if (!pids.includes(pid)) {
            throw new Forbidden(
              `传入的${type} id列表有错 id：${ids}`
            );
          }
        });
        // check ids
        yield dao.checkIds(ids);
      }
    };

    yield validate([
      {ids: templateIds, dao: this._tDAO, type: 'template'},
      {ids: interfaceIds, dao: this._iDAO, type: 'interface'}
    ]);

    return yield super.create(model);
  }

  /**
   * clone views
   *
   * views 的复制无法直接使用 ResourceService.clone，需要连带复制“接口”和“模板”
   */
  * clone(argus) {
    let {
      copys: copys
    } = argus;

    // 复制页面本身
    let viewDatas = yield super.clone(argus);

    // 复制“接口”和“模板”
    let viewData, oldViewData, interfaceIds, templateIds;
    for (let i = 0, j = viewDatas.length; i < j; i++) {
      oldViewData = copys[i];
      viewData = viewDatas[i];

      interfaceIds = (yield this._iDAO.getListForWebView(oldViewData.id))
        .map(item => item.id);

      templateIds = (yield this._tDAO.getListForWebView(oldViewData.id))
        .map(item => item.id);

      yield this._afterCreate({
        templateIds,
        interfaceIds
      }, viewData.id);
    }

    return viewDatas;
  }

  * removeBatch(ids) {
    let paramService = new (require(this.param))(this._uid, this._context);

    yield this._beginTransaction();
    //清空参数
    for (let parentId of ids) {
      yield paramService.remove({parentId}, {clearAll: true, sendMsg: false});
    }
    yield this.clearRelation(ids, [this._viDAO, this._vtDAO]);
    let ret = yield super.removeBatch(ids);
    yield this._endTransaction();

    return ret;
  }

  /**
   * update a view record
   * @param {Object} model - view object
   * @return {model/db/View}
   */
  * update(model) {
    let viewId = model.id;

    let daoArr = [],
      templateIds,
      interfaceIds;
    if (model.hasOwnProperty('interfaceIds')) {
      daoArr.push(this._viDAO);
      interfaceIds = model.interfaceIds;
      delete model.interfaceIds;
    }
    if (model.hasOwnProperty('templateIds')) {
      daoArr.push(this._vtDAO);
      templateIds = model.templateIds;
      delete model.templateIds;
    }

    yield this._beginTransaction();
    if (Object.keys(model).some(it => it !== 'id')) {
      // update self attributes
      yield super.update(model);
    }
    if (daoArr.length) {
      yield this.clearRelation(viewId, daoArr);
    }
    yield this._afterCreate({
      templateIds,
      interfaceIds
    }, viewId);
    yield this._endTransaction();
    return yield this.findDetailById(viewId);
  }

  * clearRelation(viewId, dao) {
    dao = _.toArray(dao);
    yield dao.map((it) => {
      return it.removeBatch({viewId});
    });
  }

  /**
   * 获得页面数据
   * @param {Number} id - page view id
   * @return {model/db/View}
   */
  * findDetailById(id) {
    let ret = yield super.findDetailById(id);
    let paramService = new (require(this.param))(this._uid, this._context);
    let hash = yield {
      params: paramService.getList(id),
      interfaces: this._iDAO.getListForWebView(id),
      templates: this._tDAO.getListForWebView(id)
    };
    Object.assign(ret, hash);
    yield this._fillWatch(ret);
    return ret;
  }

  * getDetailListInProject(projectId, opt = {}) {
    let projectIds = opt.pids || (yield this._getSearchPids(projectId));
    let ret = yield this._dao.getListInProjects(projectIds);
    let paramService = new (require(this.param))(this._uid, this._context);
    let ids = (ret || []).map(it => it.id);
    let paramsMap = yield paramService.getListBatch(ids, opt.dhash);
    let dataMap = {};
    for (let item of ret) {
      dataMap[`${item.id}_interfaces`] = this._iDAO.getListForWebView(item.id);
      dataMap[`${item.id}_templates`] = this._tDAO.getListForWebView(item.id);
    }
    dataMap = yield dataMap;
    for (let item of ret) {
      item.params = paramsMap[item.id] || [];
      item.interfaces = dataMap[`${item.id}_interfaces`] || [];
      item.templates = dataMap[`${item.id}_templates`] || [];
    }
    return ret;
  }
}

module.exports = ViewService;
