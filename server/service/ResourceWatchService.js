/**
 * Resource Watch Service Class
 */

const ResourceWatchDao = require('../dao/ResourceWatchDao');
const InterfaceDao = require('../dao/InterfaceDao');
const ViewDao = require('../dao/ViewDao');
const TemplateDao = require('../dao/TemplateDao');
const DatatypeDao = require('../dao/DataTypeDao');
const ConstraintDao = require('../dao/ConstraintDao');

const ProgroupService = require('./ProGroupService');

class ResourceWatchService extends require('./NService') {
  constructor(uid, context) {
    super(context);
    this._uid = uid;

    // Dao
    this._dao = new ResourceWatchDao({context});
    this._iDao = new InterfaceDao({context});
    this._vDao = new ViewDao({context});
    this._tDao = new TemplateDao({context});
    this._dDao = new DatatypeDao({context});
    this._cDao = new ConstraintDao({context});

    // Service
    this._progroupService = new ProgroupService(uid, context);
  }

  /**
   * 获取当前用户的关注资源列表
   */
  * getList() {
    let uid = this._uid;
    let result = {};

    // 用户的 progroup ids
    let progroupIds = (yield this._progroupService.getProgroupsForUser())
      .map(progroup => progroup.id);

    if (!progroupIds.length) {
      return result;
    }

    // 用户关注的资源 list
    let list = yield this._dao.search({
      conds: {
        userId: uid,
        progroupId: progroupIds
      }
    });

    let ids = this._getResourceIdsFromWatchList(list);

    let [pages, templates, interfaces, datatypes, constraints] = yield [
      ids.pageIds.length ? this._vDao.search({conds: {id: ids.pageIds}}) : [],
      ids.templateIds.length ? this._tDao.search({conds: {id: ids.templateIds}}) : [],
      ids.interfaceIds.length ? this._iDao.search({conds: {id: ids.interfaceIds}}) : [],
      ids.datatypeIds.length ? this._dDao.search({conds: {id: ids.datatypeIds}}) : [],
      ids.constraintIds.length ? this._cDao.search({conds: {id: ids.constraintIds}}) : [],
    ];

    return {
      pages,
      templates,
      interfaces,
      datatypes,
      constraints
    };
  }

  /**
   * 从关注资源列表中提取各类资源的Id列表
   */
  _getResourceIdsFromWatchList(list) {
    let pageIds = [];
    let templateIds = [];
    let interfaceIds = [];
    let datatypeIds = [];
    let constraintIds = [];

    list.forEach(item => {
      let resId = item.resId;

      switch (item.resType) {
        case 3:
          pageIds.push(resId);
          break;
        case 4:
          templateIds.push(resId);
          break;
        case 5:
          interfaceIds.push(resId);
          break;
        case 6:
          datatypeIds.push(resId);
          break;
        case 8:
          constraintIds.push(resId);
          break;
        default:
          break;
      }
    });

    return {
      pageIds,
      templateIds,
      interfaceIds,
      datatypeIds,
      constraintIds
    };
  }

}

module.exports = ResourceWatchService;
