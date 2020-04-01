/**
 * Clients services
 */
let log = require('../util/log');
let _ = require('../util/utility');
let moment = require('moment');
let Forbidden = require('../error/fe/ForbiddenError');

const ResourceService = require('./ResourceService');

class ClientService extends ResourceService {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._pDAO = new (require('../dao/ProjectDao'))({context});
    this._dao = new (require('../dao/ClientDao'))({context});
    this._iDAO = new (require('../dao/InterfaceDao'))({context});
    this._rcDao = new (require('../dao/ResourceClientDao'))({context});
    this._interfaceService = new (require('./InterfaceService'))(uid, context);
  }

  _transformToDatetime(model) {
    // 转换 lauchDate 和 closeDate
    const fields = ['launchDate', 'closeDate'];
    fields.forEach(field => {
      if (model[field]) {
        model[field] = moment.unix(model[field] / 1000).format('YYYY-MM-DD HH:mm:ss.SSS');
      }
    });
  }

  * create(model, conflictOpt) {
    let ret = yield this._checkCreatePermission(model.projectId);
    let progroupId = ret.progroupId;
    model.progroupId = progroupId;
    this._transformToDatetime(model);

    if (!conflictOpt) {
      conflictOpt = {name: model.name};
    }
    if (!conflictOpt.hasOwnProperty('uncheck')) {
      yield this._checkConflictInProject(model.projectId, conflictOpt, '存在冲突的资源');
    }

    return yield super.create(model);
  }

  * update(model) {
    this._transformToDatetime(model);
    return yield super.update(model);
  }

  /**
   * remove clients
   * need to check the quotes before remove
   * @override
   */
  * removeBatch(ids) {
    yield this._checkQuotes(ids);
    return yield super.removeBatch(ids);
  }

  /**
   * get client quote list
   * @param {Number} ids - id
   * @return {Object} reference list object
   */
  * getQuotes(ids) {
    ids = _.toArray(ids);
    let ret = yield this._checkBatchPermission(ids);
    ret = yield this._checkSearchPermission(ret.id);
    let progroupId = ret.progroupId;

    // 获取该项目组下的所有project
    let projectIds = yield this._pDAO.getPidsInProGroup(progroupId);

    //获得引用该客户端的接口
    let interfaceIdList = yield this._rcDao.getQuotesById(ids, projectIds);
    interfaceIdList = interfaceIdList.map(it => it.resId);

    ret = yield {
      interfaces: this._interfaceService.findBatchWithVersion(interfaceIdList),
    };

    let arr = [];
    Object.keys(ret).forEach((item) => {
      ret[item] = (ret[item] || []).filter((item) => {
        return projectIds.includes(item.projectId);
      });
      ret[item] = ret[item] || [];
      arr.push(...ret[item]);
    });

    return Object.assign(ret, {hasQuotes: !!arr.length});
  }

  * _checkQuotes(ids) {
    let quotes = yield this.getQuotes(ids);
    if (quotes.hasQuotes) {
      throw new Forbidden(`客户端被引用 id：${ids}`);
    }
  }
}

module.exports = ClientService;
