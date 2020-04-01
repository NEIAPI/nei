/**
 * ResourceHistory Service Class
 */

const log = require('../util/log');
const _ = require('../util/utility');
const db = require('../../common').db;

class ResourceHistoryService extends require('./NService') {
  constructor(uid, context) {
    super();
    this._uid = uid;
    this._dao = new (require('../dao/ResourceHistoryDao'))({context});
    this._pgDAO = new (require('../dao/ProGroupDao'))({context});
    this._sDAO = new (require('../dao/SpecificationDao'))({context});
    this._pDAO = new (require('../dao/ProjectDao'))({context});
    this._specificationService = new (require('./SpecificationService'))(uid, context);

    this._serviceMap = {
      [db.RES_TYP_SPEC]: new (require('./SpecificationService'))(uid, context),
      [db.RES_TYP_PROGROUP]: new (require('./ProGroupService'))(uid, context),
      [db.RES_TYP_PROJECT]: new (require('./ProjectService'))(uid, context),
      [db.RES_TYP_WEBVIEW]: new (require('./ViewService'))(uid, context),
      [db.RES_TYP_TEMPLATE]: new (require('./TemplateService'))(uid, context),
      [db.RES_TYP_INTERFACE]: new (require('./InterfaceService'))(uid, context),
      [db.RES_TYP_RPC]: new (require('./RpcService'))(uid, context),
      [db.RES_TYP_DATATYPE]: new (require('./DataTypeService'))(uid, context),
      [db.RES_TYP_BISGROUP]: new (require('./BisGroupService'))(uid, context),
      [db.RES_TYP_CONSTRAINT]: new (require('./ConstraintService'))(uid, context),
      [db.RES_TYP_WORD]: new (require('./WordService'))(uid, context)
    };
  }

  /**
   * 获得资源操作历史数据
   * @param {Object} condition - 资源条件
   * @param {Number} userId - 操作者id
   * @return {model/db/Interface} 资源操作历史
   *
   * lct & offset： 为了处理跳页查找，如果有时间戳，则忽略偏移量；否则，使用偏移量查找
   */
  * find({
    type: resType,
    id: resId,
    lct,
    limit,
    offset = 0,
    total,
    pid
  }) {
    log.debug('[ResourceHistoryService.find] - get resourceHistories by id');
    let createTime;
    if (lct) {
      let timestamp = parseInt(lct, 10);
      timestamp += (8 * 60 * 60 * 1000 + new Date().getTimezoneOffset() * 60 * 1000);
      createTime = _.format(timestamp);
    }

    //用户是否有资源资源操作权限
    let resService = this._serviceMap[resType];
    //权限验证
    if (resService && resId) {
      yield resService._checkSearchPermission(resId);
    }

    let searchObj = {
      pages: {
        limit,
        offset
      },
      condition: {
        resType
      }
    };
    if (resId) {
      searchObj.condition.resId = resId;
    }
    if (createTime) {
      searchObj.condition.createTime = {
        op: '<',
        value: createTime
      };
      searchObj.pages.offset = 0;
    }

    //默认获得所有项目组的动态
    if (resType == db.RES_TYP_PROGROUP && !resId) {
      //添加所有项目组id
      let progroups = yield this._pgDAO.getListForUser(this._uid);
      let progroupIds = [];
      (progroups || []).forEach((item) => progroupIds.push(item.id));

      if (!progroupIds.length) {
        return {total: 0, result: []};
      }

      searchObj.condition.progroupId = progroupIds;
    } else if (!resId) {
      //没有权限
      return {
        result: [],
        total: 0
      };
    }

    if (resType == db.RES_TYP_WORD && pid) {
      // 当历史记录的资源类型为参数字典，且action为修改禁用关系时，projectId 表示的是操作禁用关系的项目，而非该资源的归属项目。
      // 所以此处需要限定 projectId，以过滤其他项目对该资源的修改历史。
      let sharedProject = yield this._pDAO.getSharedByProject(pid);
      searchObj.condition.projectId = {
        op: 'IN',
        value: sharedProject.id === pid ? [pid] : [pid, sharedProject.id]
      };
    }

    let ret = yield this._dao.findForPage(searchObj);
    if (total) {
      let totalCondition = searchObj.condition;
      delete totalCondition.createTime;
      let totalRet = yield this._dao.getTotal(totalCondition);
      ret = {
        result: ret,
        total: totalRet[0].total
      };
    } else {
      ret = {
        result: ret
      };
    }
    return ret;
  }

  * findAll({lct, limit, total}) {
    log.debug('[ResourceHistoryService.find] - get resourceHistories by id');
    let createTime;
    if (lct) {
      let timestamp = parseInt(lct, 10);
      timestamp += (8 * 60 * 60 * 1000 + new Date().getTimezoneOffset() * 60 * 1000);
      createTime = _.format(timestamp);
    }

    let progroups = yield this._pgDAO.getListForUser(this._uid);
    let progroupIds = progroups.map((progroup) => {
      return progroup.id;
    });

    let specIds = yield this._sDAO.findCollectAndCreateSpecIds(this._uid);

    let searchObj = {
      pages: {
        limit,
        offset: createTime ? 0 : limit
      },
      condition: []
    };
    let condTemp = {};
    if (createTime) {
      condTemp.createTime = {
        op: '<',
        value: createTime
      };
    }
    if (progroupIds.length) {
      searchObj.condition.push(Object.assign({}, condTemp, {progroupId: progroupIds}));
    }
    if (specIds.length) {
      searchObj.condition.push(Object.assign({}, condTemp, {resId: specIds, resType: db.RES_TYP_SPEC}));
    }

    let ret = yield this._dao.findForPage(searchObj);
    if (total) {
      let totalCondition = searchObj.condition;
      totalCondition.forEach(cond => {
        delete cond.createTime;
      });
      let totalRet = yield this._dao.getTotal(totalCondition);
      ret = {
        result: ret,
        total: totalRet[0].total
      };
    } else {
      ret = {
        result: ret
      };
    }
    return ret;
  }

  /**
   * 根据资源id和更新时间获取接口是否更新
   * @param {Number} resType - 资源类型
   * @param {Number} resId - 资源id
   * @param {String} lct - 创建时间
   * @return {Object} 资源是否有更新，返回对象只有一个字段 updated
   */
  * isUpdated({
    type: resType,
    id: resId,
    lct,
  }) {
    log.debug('[ResourceHistoryService.isUpdated] - whether the resource is update');
    let timestamp = parseInt(lct, 10);
    timestamp += (8 * 60 * 60 * 1000 + new Date().getTimezoneOffset() * 60 * 1000);
    let createTime = _.format(timestamp);

    //用户是否有资源资源操作权限
    let resService = this._serviceMap[resType];
    //权限验证
    yield resService._checkSearchPermission(resId);

    let searchObj = {
      condition: {
        resType,
        resId,
        createTime: {
          op: '>',
          value: createTime
        }
      }
    };

    let ret = yield this._dao.getTotal(searchObj.condition);
    // 有满足条件的查询结果就表示资源有更新
    return {
      updated: Array.isArray(ret) && ret[0].total > 0
    };
  }
}

module.exports = ResourceHistoryService;
