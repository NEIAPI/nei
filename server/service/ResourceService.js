/**
 * Resource Base Service Class
 */
const log = require('../util/log');
const rc = require('./config/role.json');
const db = require('../../common').db;
const dt = require('../dao/config/const.json');
const Forbidden = require('../error/fe/ForbiddenError');
const history = require('./helper/history');
const _ = require('../util/utility');
const lodash = require('lodash');
const HSError = require('../error/fe/HSError');
const IllegalRequest = require('../error/fe/IllegalRequestError');

const actionTypeMap = {
  'create': '创建',
  'remove': '删除',
  'update': '修改',
  'search': '查询',
  '_default': '操作'
};

const resourceTypeMap = {
  [db.RES_TYP_SPEC]: '规范',
  [db.RES_TYP_PROGROUP]: '项目组',
  [db.RES_TYP_PROJECT]: '项目',
  [db.RES_TYP_WEBVIEW]: '页面',
  [db.RES_TYP_TEMPLATE]: '模板',
  [db.RES_TYP_INTERFACE]: 'HTTP 接口',
  [db.RES_TYP_RPC]: 'RPC 接口',
  [db.RES_TYP_DATATYPE]: '数据类型',
  [db.RES_TYP_BISGROUP]: '业务分组',
  [db.RES_TYP_CONSTRAINT]: '约束函数',
  [db.RES_TYP_TESTCASE]: '测试用例',
  [db.RES_TYP_PARAMETER]: '参数',
  [db.RES_TYP_TESTCASECOLLECTION]: '测试集',
  [db.RES_TYP_SPECNODE]: '节点',
  [db.RES_TYP_WORD]: '参数字典',
  '_default': '资源'
};

const NService = require('./NService');

class ResourceService extends NService {
  constructor(uid, context, owner) {
    super(context);
    this._uid = uid;
    this._cache = new (require('../dao/cache/Redis'))({context});
    if (owner) {
      this._owDAO = new (require(owner))({context});
    }
    this._uDAO = new (require('../dao/UserDao'))({context});
    this._rwDAO = new (require('../dao/ResourceWatchDao'))({context});
    this._rvDAO = new (require('../dao/ResourceVersionDao'))({context});
    this._nrDAO = new (require('../dao/NotificationResourceDao'))({context});
    this._nuDAO = new (require('../dao/NotificationUserDao'))({context});
    this._nDAO = new (require('../dao/NotificationDao'))({context});
    this._pgDAO = new (require('../dao/ProGroupDao'))({context});
    this._bgDAO = new (require('../dao/BisGroupDao'))({context});
  }

  /**
   * check user and resource permission
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {String} action - action for user to resource
   * @return {Object} role and progroup id for user and resource
   */
  * _checkPermission(id, action, opt = {ret: {}, field: ''}) {
    // 内部开放接口不用检查权限
    if (this._uid === 'open_api') {
      return true;
    }
    let ret = opt.role;
    let field = opt.field;
    let msg = (ret && ret.role) ? undefined : ret;
    ret = (ret && ret.role !== undefined) ? ret : undefined;

    // FIXME: 上面赋值msg的逻辑没用看懂，为了前端正常展示，先添加了 typeof msg === 'object' 的判断逻辑
    if (!msg || typeof msg === 'object') {
      let actionType = actionTypeMap[action] || actionTypeMap._default;
      let resourceType = resourceTypeMap[this._dao._type] || resourceTypeMap._default;
      msg = `没有${actionType}相关${resourceType}的权限`;
    }

    // check error parameter
    if (!id || !this._uid) {
      throw new Forbidden(
        msg, {
          rid: id,
          uid: this._uid
        }
      );
    }
    // check role config
    let rec = [
      this._dao.getModelName().toUpperCase(),
      action.toUpperCase()
    ];
    if (field) {
      rec.push(field.toUpperCase());
    }
    let val = rc[rec.join('_')];
    // use resource permission
    if (val == null) {
      rec = ['RESOURCE', action.toUpperCase()];
      val = rc[rec.join('_')];
    }
    // check permission value
    let role = val;
    if (typeof role === 'string') {
      role = db[role];
    }
    log.debug(
      '[%s.checkPermission] permission between user %s and resource %s is %s',
      this.constructor.name, this._uid, id, role
    );
    // get role from database
    if (!ret) {
      ret = yield this._dao.getRoleOfUser(id, this._uid);
    }
    if (ret.role < role) {
      throw new Forbidden(
        msg, {
          rid: id,
          uid: this._uid
        }
      );
    }
    return ret;
  }

  /**
   * check resource visit permission for user
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Object} role - role result
   */
  * _checkSearchPermission(id, opt = {role: {}}) {
    return yield this._checkPermission(
      id, 'search', opt
    );
  }

  /**
   * check resource quit permission for user
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Object} role - role result
   */
  * _checkQuitPermission(id, opt = {role: {}}) {
    return yield this._checkPermission(
      id, 'quit', opt
    );
  }

  /**
   * check change creator permission for user
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Object} role - role result
   */
  * _checkChangeCreatorPermission(id, opt = {role: {}}) {
    return yield this._checkPermission(
      id, 'changecreator', opt
    );
  }

  /**
   * check approve verification permission
   * only admin and owner can approve
   *
   * @param  {Number} id - resource/progroup id
   * @param  {Object} role - role result
   */
  * _checkApproveVerificationPermission(id, opt = {role: {}}) {
    return yield this._checkPermission(
      id, 'approveVerification', opt
    );
  }

  /**
   * check resource create permission for user
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Object} role - role result
   */
  * _checkCreatePermission(id, opt = {role: {}}) {
    // delegate to owner dao if owner dao exists
    if (Object.keys(opt.role).length === 0 && this._owDAO) {
      opt.role = yield this._owDAO.getRoleOfUser(
        id, this._uid
      );
    }
    return yield this._checkPermission(
      id, 'create', opt
    );
  }

  /**
   * check resource update permission for user
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Object} [opt] - role result
   */
  * _checkUpdatePermission(id, opt = {role: {}, field: ''}) {
    return yield this._checkPermission(
      id, 'update', opt
    );
  }

  /**
   * check resource remove permission for user
   *
   * @protected
   * @param  {Number} id - resource id
   * @param  {Object} [opt] - role result
   */
  * _checkRemovePermission(id, opt = {role: {}, field: ''}) {
    return yield this._checkPermission(
      id, 'remove', opt
    );
  }

  /**
   * check resource batch action permission
   *
   * @protected
   * @param  {Array}  ids - resource id list
   * @return {Object}
   */
  * _checkBatchPermission(ids) {
    let gids = yield this._dao.getProGroups(ids);
    gids = gids.filter((gid) => {
      return gid !== db.PRG_SYS_HIDDEN;
    });
    if (gids.length > 1) {
      throw new IllegalRequest(
        `resources [${ids.join(',')}] not in the same project group ${gids.join(',')}`, {
          ids: ids,
          group: gids
        }
      );
    }
    return {
      id: ids[0],
      progroupId: gids[0]
    };
  }

  /**
   * 统一检验业务分组
   */
  * _checkBisGroupPermission(projectId, groupId) {
    let bisgroup = yield this._bgDAO.search({
      conds: {
        project_id: projectId,
        id: groupId
      }
    });
    if (!bisgroup.length) {
      throw new Forbidden(`can't find bisgroup with id ${groupId}`);
    }
  }

  /**
   * 全局搜索的SQL条件
   */
  * _getGlobalSearchConds() {
    let progroups = yield this._pgDAO.getListForUser(this._uid);
    let ids = [];

    if (progroups && progroups.length) {
      ids = progroups.map(progroup => progroup.id);
    }

    return {
      progroup_id: ids
    };
  }

  /**
   * 过滤全局搜索结果
   *
   * @param {Array Object} list
   */
  * _filterGlobalSearchResult(list) {
    return list;
  }

  /**
   * validate inputs and feed add-on attributes
   *
   * @param {Object | Array Object} models - data
   * @return {Object | Array Object} model list with add-on attributes
   */
  * toModels(models) {
    if (!Array.isArray(models)) {
      models = [models];
    }

    let theModel = this._dao._Model;
    for (let i = 0, len = models.length; i < len; i++) {
      let model = models[i];
      if (model.hasOwnProperty('respoId') && theModel.getField('respoId')) {
        this._uDao = new (require('../dao/UserDao'))({context: this._context});
        let user = yield this._uDao.find(model.respoId);
        if (!user) {
          // assign creator as respo if respo doesn't exist
          model.respoId = this._uid;
        }
      }

      if (theModel.getField('creatorId') &&
        !model.hasOwnProperty('creatorId') &&
        this._uid) {
        model.creatorId = this._uid;
      }

      if (theModel.getField('respoId') &&
        !model.hasOwnProperty('respoId') &&
        this._uid) {
        model.respoId = this._uid;
      }

      if (model.hasOwnProperty('projectId') &&
        theModel.getField('groupId')) {
        this._bgDao = new (require('../dao/BisGroupDao'))({context: this._context});
        if (!model.hasOwnProperty('groupId')) {
          model.groupId = yield this._bgDao.getDefaultId(model.projectId);
        } else {
          let groups = yield this._bgDao.search({
            conds: {
              id: model.groupId,
              projectId: model.projectId
            }
          });
          if (!groups.length) {
            model.groupId = yield this._bgDao.getDefaultId(model.projectId);
          }
        }
      }

      _.addPinyin(model, theModel, this._dao.PINYIN);
    }

    return models;
  }

  /**
   * search resources with conditions
   *
   * @param  {Object} conds - search conds
   * @return
   */
  * searchWithConds(conds) {
    let user = yield this._uDAO.find(this._uid);
    let formCond = user.from === db.USR_FRM_OPENID ?
      {from: db.USR_FRM_OPENID} :
      {from: [db.USR_FRM_SITE, db.USR_FRM_URS, db.USR_FRM_URS_PHONE]};
    return yield this._dao.searchWithConds(conds, formCond);
  }

  /**
   * search resources
   * @param  {Object} obj - search data
   * @param  {Number} obj.offset - offset
   * @param  {Number} obj.limit - limit
   * @param  {String} v - search criteria
   * @return {Object} {list: [], total: 1111}
   */
  * search({offset = 0, limit = 20, v = '',}) {
    log.debug(
      '[%s.search] - search resource',
      this.constructor.name
    );

    let list = [];
    let total;
    if (v) {
      let searchConds = yield this._getGlobalSearchConds();
      list = yield this.searchWithConds(searchConds);

      let modelFields = this._dao._Model.getField();
      let searchFields = this._dao._getSearchFields()
        .map(field => _.toCamel(field))
        .filter(field => {
          return modelFields[field] && modelFields[field].searchable;
        });

      list = list.filter((item) => {
        let isMatch = false;
        v = v.toLowerCase();

        for (let i = 0, j = searchFields.length; i < j; i++) {
          let field = searchFields[i];
          let value = item[field];

          if (!value) {
            continue;
          }

          if (/pinyin/i.test(field) && _.isPinyinMatch(value, v)) {
            isMatch = true;
            break;
          } else if (value.toString().toLowerCase().includes(v)) {
            isMatch = true;
            break;
          }
        }

        return isMatch;
      });

      // 过滤（根据权限）
      list = yield this._filterGlobalSearchResult(list);

      total = list.length;
    }

    list = list.slice(offset, offset + limit);
    return {list, total};
  }

  /**
   * get search project ids for resource.
   * @param  {Number} pid - project id
   * @return {Array Number}
   */
  * _getSearchPids(pid) {
    return yield this._dao._getSearchPids(pid);
  }

  /**
   * get list in project
   *
   * @param {Number} pid - 项目id
   * @return {Object}
   */
  * getListInProject(pid) {
    let pids = yield this._getSearchPids(pid);
    let ret = yield this.getListInProjects(pids);
    yield this._fillWatch(ret);
    return ret;
  }

  /**
   * get list in projects
   *
   * @param {Number} pids - 项目 ids
   * @return {Object}
   */
  * getListInProjects(pids) {
    log.debug('[%s.getListInProjects] - get by pids', this.constructor.name, pids);
    let pService = new (require('./ProjectService'))(this._uid, this._context);
    yield pService._checkSearchPermission(pids[0]);
    let ret = yield this._dao.getListInProjects(pids);
    return ret;
  }

  /**
   * get list in progroup
   *
   * @param {Number} pgid - progroup id
   * @return {Object}
   */
  * getListInProGroup(pgid) {
    log.debug('[%s.getListInProGroup] - get by pgid', this.constructor.name, pgid);
    return yield this._dao.getListInProGroup(pgid);
  }

  /**
   * actions that should be performed after the resource is shared
   *
   * @param {Object} res - resource that has been shared
   * @return {Object}
   */
  * _afterShare() {
  }

  /**
   * share the resource
   *
   * @param {Number} id - resource id
   * @return Void
   */
  * share(id) {
    log.debug('[%s.share] - share resource', this.constructor.name, id);
    let ret = yield this._checkUpdatePermission(id);
    let progroupId = ret.progroupId;

    let pDAO = new (require('../dao/ProjectDao'))({context: this._context});
    let pubProject = yield pDAO.getSharedByProGroup(progroupId);
    let pubProjectId = pubProject.id;
    let bgDAO = new (require('../dao/BisGroupDao'))({context: this._context});
    let defGroupId = yield bgDAO.getDefaultId(pubProjectId);
    let oldData = yield this._dao.find(id);

    yield this._beginTransaction();
    let datatypes = yield this._afterShare({id, progroupId, projectId: pubProjectId, groupId: defGroupId}, oldData);
    let res = yield this._dao.update({
      id,
      projectId: pubProjectId,
      groupId: defGroupId
    });

    yield this._endTransaction();
    yield this.clearCache({pids: pubProjectId});

    let returnData = {};
    if (this._type === db.RES_TYP_DATATYPE) {
      returnData = datatypes.concat([res]);
    } else if (this._type === db.RES_TYP_INTERFACE) {
      returnData.datatypes = datatypes;
      returnData.interface = res;
    } else {
      returnData = res;
    }
    return returnData;
  }

  /**
   * fill change confirmation information
   *
   * @param {Array}  list
   * @returns
   * @memberof ResourceService
   */
  * _fillChangeConfirmation(list) {
    let resType = this._type;
    let resIds = (list || []).filter(it => {
      // 只处理有关注者的接口
      // 这里有一种情形：有人关注接口后，接口变更后没有进行确认，然后又取消关注，此时也不进行提醒
      if (it.watchList.length) {
        return true;
      }
    }).map(it => it.id);
    if (!resIds.length) {
      return;
    }
    const resourceNotifications = yield this._nrDAO.search({
      conds: {
        resType,
        resId: resIds
      }
    });
    if (!resourceNotifications.length) {
      return;
    }
    let notificationIds = resourceNotifications.map(n => n.notificationId);

    const notifications = yield this._nDAO.search({
      conds: {
        type: db.MSG_TYP_API,
        id: notificationIds
      }
    });
    if (!notifications.length) {
      return;
    }
    // 再次缩小范围
    notificationIds = notifications.map(it => it.id);
    const notificationUsersOfUnread = yield this._nuDAO.search({
      conds: {
        isRead: db.CMN_BOL_NO,
        notificationId: notificationIds
      }
    });
    if (!notificationUsersOfUnread.length) {
      return;
    }
    (list || []).forEach((it) => {
      if (it.watchList.length) {
        const allNotifications = resourceNotifications.filter(rn => rn.resId === it.id);
        it.isConfirmed = !allNotifications.find(notification => {
          let nid = notification.notificationId;
          return notificationUsersOfUnread.find(c => c.notificationId === nid) && notifications.find(c => c.id === nid);
        });
      }
    });
  }

  * _fillWatch(ret) {
    let isArray = Array.isArray(ret);
    ret = _.toArray(ret);
    let pids = [];
    (ret || []).forEach(it => {
      if (!pids.includes(it.projectId)) {
        pids.push(it.projectId);
      }
    });

    let watchMap = {};
    for (let pid of pids) {
      let list = yield this._rwDAO.getListOfResourceWatch(pid, this._dao._type);
      Object.keys(list).forEach(id => {
        watchMap[id] = list[id];
      });
    }
    ret.forEach(item => {
      item.watchList = watchMap[item.id] || [];
      item.isWatched = item.watchList.includes(this._uid) ? db.CMN_BOL_YES : db.CMN_BOL_NO;
    });

    return isArray ? ret : ret[0];
  }

  /**
   * 批量关注资源
   * @param {Array<Integer>}ids
   * @param v
   */
  * watchBatch(ids, v = true) {
    log.debug('[%s.watch] - watch resource', this.constructor.name, ids);
    yield this._beginTransaction();
    let res = yield this._dao.findBatch(ids);
    if (res.length === 0) {
      throw new IllegalRequest('资源不存在');
    }
    // 必须同处一个projectId中
    let equal = res.reduce((pre, cur) => {
      if (pre.equal && pre.projectId === cur.projectId) {
        return pre;
      } else {
        return {projectId: 0, equal: false};
      }
    }, {projectId: res[0].projectId, equal: true});
    if (!equal.equal) {
      throw new IllegalRequest('所有资源必须来自同一个project');
    }
    // todo ids可能有一些是不存在的资源的

    let resIds = res.map(it => it.id);
    let opt = {
      resType: this._dao._type,
      resId: resIds,
      projectId: res[0].projectId,
      progroupId: res[0].progroupId,
      userId: this._uid,
    };
    if (v) {
      // 先查出已有的记录
      let collects = yield this._rwDAO.search({
        conds: opt
      });
      let hasWatchedId = collects.map(it => it.resId);
      let hasWatchedIdSet = new Set(hasWatchedId);
      let needAddedIds = resIds.filter(it => !hasWatchedIdSet.has(it));
      if (needAddedIds.length === 0) {
        return;
      }
      yield this._rwDAO.createBatch(needAddedIds.map(it => {
        return {
          resType: this._dao._type,
          resId: it,
          projectId: res[0].projectId,
          progroupId: res[0].progroupId,
          userId: this._uid,
        };
      }));

      this._async(history.log, {
        // 统一处理所有资源的 history log text 在 ResourceWatchDao里
        dName: this._rwDAO.constructor.name,
        oprType: 'add',
        progroupId: res[0].progroupId,
        projectId: res[0].projectId,
        uid: this._uid,
        resType: this._dao._type,
        ret: {
          data: needAddedIds.map(it => res.find(i => i.id === it))
        }
      });

    } else {
      yield this._rwDAO.removeBatch({
        resType: this._dao._type,
        resId: resIds,
        projectId: res[0].projectId,
        progroupId: res[0].progroupId,
        userId: this._uid,
      });
      this._async(history.log, {
        dName: this._rwDAO.constructor.name,
        oprType: 'del',
        progroupId: res[0].progroupId,
        projectId: res[0].projectId,
        uid: this._uid,
        resType: this._dao._type,
        ret: {
          data: resIds.map(it => res.find(i => i.id === it))
        }
      });
    }
    yield this._endTransaction();
    yield this._cache.remove(`${this._dao._type}${dt.RES_WATCH}${res[0].projectId}`);
  }

  * watch(id, v = true) {
    log.debug('[%s.watch] - watch resource', this.constructor.name, id);
    yield this._checkSearchPermission(id);

    let res = yield this._dao.find(id);
    let opt = {
      resType: this._dao._type,
      resId: id,
      projectId: res.projectId,
      progroupId: res.progroupId,
      userId: this._uid,
    };
    if (v) {
      //watch the resource
      let collects = yield this._rwDAO.search({
        conds: opt
      });
      if (collects.length) {
        throw new Forbidden('已经关注过该资源');
      }
      yield this._rwDAO.create(opt);
      this._async(history.log, {
        dName: this._rwDAO.constructor.name,
        oprType: 'add',
        progroupId: res.progroupId,
        projectId: res.projectId,
        uid: this._uid,
        resType: this._dao._type,
        ret: {
          data: [res]
        }
      });
    } else {
      yield this._rwDAO.removeBatch(opt);
      this._async(history.log, {
        dName: this._rwDAO.constructor.name,
        oprType: 'del',
        progroupId: res.progroupId,
        projectId: res.projectId,
        uid: this._uid,
        resType: this._dao._type,
        ret: {
          data: [res]
        }
      });
    }
    yield this._cache.remove(`${this._dao._type}${dt.RES_WATCH}${res.projectId}`);

    let ret = yield this._dao.find(id);
    yield this._fillWatch(ret);
    return ret;
  }

  * _afterRemove() {
  }

  * removeBatch(ids, notAndActopt) {
    yield this._beginTransaction();
    let res = yield super.removeBatch(ids, notAndActopt);
    yield this._rwDAO.removeBatch({resType: this._dao._type, resId: ids});
    let versions = yield this._rvDAO.removeBatch({resType: this._dao._type, resId: ids});
    // 将删除的version加入到res中，保证返回的数据有version字段
    versions.forEach(it => {
      let t = res.find(itt => itt.id === it.resId);
      if (t) {
        t.version = {
          origin: it.origin,
          parent: it.parent,
          name: it.name
        };
      }
    });
    if (versions.length > 0) {
      this._async(history.log, {
        dName: this._rvDAO.constructor.name,
        oprType: 'del',
        uid: this._uid,
        ret: {
          data: versions
        }
      });
    }
    let rec = yield this._afterRemove(ids);
    yield this._endTransaction();
    return rec || res;
  }

  /**
   * check resource parameters for cloning
   */
  * _checkResParamsQuotes() {
  }

  /**
   * copy resource parameters
   */
  * _copyResParamsQuotesData() {
  }

  * _checkResParamsMoveQuotes() {
  }

  /**
   * move resource parameters
   *
   * @param {Object} obj - resource data
   * @return
   */
  * _moveResParamsQuotesData() {
  }

  * create(model) {
    // 统一校验业务分组
    if (model.hasOwnProperty('groupId')) {
      yield this._checkBisGroupPermission(model.projectId, model.groupId);
    }
    return yield super.create(model);
  }

  * update(model, notAndActopt) {
    // 统一校验业务分组
    if (model.hasOwnProperty('groupId')) {
      let res = yield this._dao.find(model.id);
      yield this._checkBisGroupPermission(res.projectId, model.groupId);
    }
    return yield super.update(model, notAndActopt);
  }

  /**
   * clone resources
   * @param {Object} obj - clone data
   * @param {Number} obj.pid - project id
   * @param {Number} obj.gid - group id
   * @param {String} obj.tag - tag
   * @param {Array} obj.copys - resource info. e.g. [{id: 1111, name: 'hello'}]
   * retrun {Array} clone data
   */
  * clone({pid: projectId, gid: groupId, tag, copys, version}) {
    log.debug('[%s.clone] - clone resources', this.constructor.name);
    if (!copys || !copys.length) {
      return [];
    }
    let ids = [];
    let cloneResourceNameMap = {};
    let cloneResourceNames = [];
    let cloneResourceMap = {};
    copys.forEach((item) => {
      cloneResourceNameMap[item.id] = item.name;
      cloneResourceNames.push(item.name);
      ids.push(item.id);
    });
    yield this._checkBisGroupPermission(projectId, groupId);
    let ret = yield this._dao.getProjects(ids);
    if (ret.length !== 1) {
      throw new Forbidden(`资源不在同一个项目内 id：${ids}`, {id: ids});
    }
    let cloneResources = yield this._dao.checkIds(ids);
    ret = yield this._checkCreatePermission(projectId);
    let progroupId = ret.progroupId;
    let oldProgroupId = cloneResources[0].progroupId;
    let oldProjectId = cloneResources[0].projectId;
    let pDAO = new (require('../dao/ProjectDao'))({context: this._context});
    let oldPubProject = yield pDAO.getSharedByProGroup(oldProgroupId);
    let oldPubProjectId = oldPubProject.id;


    let checkFields = {name: cloneResourceNames};
    let message = '资源名称冲突';
    if (version) {
      checkFields.version = {
        name: version.name,
        origin: version.origin
      };
      message = '资源冲突或该版本已存在';
    }
    yield this._checkConflictInProject(projectId, checkFields, message);

    //参数引用数据检查
    let quotesData = yield this._checkResParamsQuotes({
      ids,
      progroupId,
      oldProgroupId,
      projectId,
      oldProjectId,
      oldPubProjectId,
      groupId
    });

    yield this._beginTransaction();
    let returnData = [];
    //复制资源
    for (let item of cloneResources) {
      let oldId = item.id;
      _.filterObj(item, ['id', 'createTime', 'respoId', 'creatorId']);
      item.progroupId = progroupId;
      item.projectId = projectId;
      item.groupId = groupId;
      item.name = cloneResourceNameMap[oldId];
      // tag 如果为空，说明在复制的时候没有在弹窗中设置新标签，较合理的逻辑是保持原有标签不变
      if (tag) {
        item.tag = tag;
      }
      ret = yield super.create(item);
      let id = ret.id;
      cloneResourceMap[oldId] = id;
      returnData.push(ret);
    }
    //复制参数相关数据
    yield this._copyResParamsQuotesData(quotesData, cloneResourceMap);
    yield this._endTransaction();
    let dtService = new (require('./DataTypeService'))(this._uid, this._context);
    yield dtService.clearCache({pids: projectId});
    yield this.clearCache({pids: projectId});

    // 避免在创建版本的时候也产生一条复制的日志
    if (!version) {
      this._async(history.log, {
        dName: this._dao.constructor.name,
        oprType: 'clone',
        uid: this._uid,
        ret: {
          progroupId,
          obj: arguments[0],
          targetRes: returnData
        }
      });
    }
    return returnData;
  }

  /**
   * set tags
   * @param {Object} obj tag data
   * @param {Array} obj.ids tag ids
   * @param {Array} obj.tags tags
   */
  * tag({ids = [], tags = []}) {
    log.debug(
      '[%s.tag] update tags of resource %s',
      this.constructor.name, ids.join(',')
    );
    yield this._dao.checkIds(ids);
    let projects = yield this._dao.getProjects(ids);
    if (projects.length > 1) {
      throw new Forbidden(`resources from different projects ${ids}`);
    }

    let resList = [];
    for (let id of ids) {
      resList.push(yield this.getById(id));
    }
    const tagList = resList.map(res => res.tag.split(','));
    const commonTags = lodash.intersection(...tagList);
    const result = [];
    const models = [];
    for (let res of resList) {
      const originalTags = res.tag ? res.tag.split(',') : [];
      let tagChanged = false;
      commonTags.forEach(t => {
        if (tags.indexOf(t) === -1) {
          // 说明删除了这个公共 tag
          const idx = originalTags.indexOf(t);
          originalTags.splice(idx, 1);
          tagChanged = true;
        }
      });
      tags.forEach(t => {
        if (commonTags.indexOf(t) === -1) {
          // 说明添加了这个公共 tag
          if (originalTags.indexOf(t) === -1) {
            // 防止重复添加
            originalTags.push(t);
            tagChanged = true;
          }
        }
      });
      if (tagChanged) {
        models.push({
          id: res.id,
          tag: originalTags.join(',')
        });
      } else {
        result.push(res);
      }
    }
    if (!models.length) {
      return result;
    }
    const updatedResList = yield this._dao.updateBatchModels(models);
    const map = this._dao._RDS;
    const rdsKey = map[this._type];
    yield this._cache.remove(`${rdsKey}${updatedResList[0].projectId}`);
    return updatedResList.concat(result);
  }

  /**
   * check whether the resources have been quoted/referenced
   *
   * @param {Array} ids - resource id list
   * @return {void}
   */
  * _checkQuotes(ids) {
  }

  /**
   * move resources
   * @param {Object} obj - move data
   * @param {Number} obj.pid - dest project id
   * @param {Number} obj.gid - group id
   * @param {String} obj.tag - tag
   * @param {Array} obj.moves - resource id list
   * retrun {Array} move data
   */
  * move({pid: projectId, gid: groupId, tag, moves: ids}) {
    let resType = this._dao._type;
    yield this._checkBisGroupPermission(projectId, groupId);
    let ret = yield this._dao.getProjects(ids);
    if (ret.length !== 1) {
      throw new Forbidden(`资源不在同一个项目内 id：${ids}`, {id: ids});
    }

    let moveResources = yield this._dao.checkIds(ids);
    let {progroupId: oldProgroupId, projectId: oldProjectId} = moveResources[0];
    if (oldProjectId === projectId) {
      throw new Forbidden('不能移动资源至当前项目', {projectId});
    }
    let moveNames = moveResources.map(item => item.name);

    let {progroupId} = yield this._checkCreatePermission(projectId);
    if (oldProgroupId !== progroupId) {
      throw new Forbidden('不能跨项目组移动资源', {progroupId});
    }

    let pDAO = new (require('../dao/ProjectDao'))({context: this._context});
    let {id: pubProjectId} = yield pDAO.getSharedByProGroup(progroupId);
    if (pubProjectId === projectId &&
      !([db.RES_TYP_DATATYPE, db.RES_TYP_INTERFACE, db.RES_TYP_CONSTRAINT, db.RES_TYP_WORD].includes(resType))
    ) {
      throw new Forbidden('当前资源不能移动至公共资源库', {resType});
    }

    if (ids.length) {
      //判断资源是否被非目标项目内的资源引用
      if ([db.RES_TYP_DATATYPE, db.RES_TYP_INTERFACE, db.RES_TYP_TEMPLATE].includes(resType)) {
        let quotes = yield this.getQuotes(ids);
        Object.keys(quotes).forEach(key => {
          let items = quotes[key];
          if (!Array.isArray(items)) {
            items = [];
          }
          items.forEach(item => {
            if (item.projectId !== projectId && !ids.includes(item.id)) {
              throw new Forbidden('移动失败，资源已被其他资源引用，请确认', {ids});
            }
          });
        });
      }
    }
    yield this._checkConflictInProject(projectId, {name: moveNames, unCheckIds: ids}, '资源名称冲突');


    //参数引用数据检查
    let quotesData = yield this._checkResParamsMoveQuotes({
      ids,
      progroupId,
      oldProgroupId,
      projectId,
      oldProjectId,
      oldPubProjectId: pubProjectId,
      groupId,
      tag
    });

    yield this._beginTransaction();
    let returnData = [];
    //移动资源
    if (ids.length) {
      const updatingAttributes = {projectId, groupId};
      // tag 如果为空，说明在移动的时候没有在弹窗中设置新标签，较合理的逻辑是保持原有标签不变
      if (tag) {
        updatingAttributes.tag = tag;
      }
      returnData = yield this.updateBatch(updatingAttributes, ids);
      //移动资源的操作历史
      let rhDAO = new (require('../dao/ResourceHistoryDao'))({context: this._context});
      yield rhDAO.update({projectId}, {resType: this._dao._type, resId: ids});
    }
    //移动参数相关数据
    yield this._moveResParamsQuotesData(quotesData);
    yield this._endTransaction();

    let dtService = new (require('./DataTypeService'))(this._uid, this._context);
    yield dtService.clearCache({pids: [oldProjectId, projectId]});
    yield this.clearCache({pids: [oldProjectId, projectId]});
    yield this._afterMove({oldProjectId, projectId, ids});
    this._async(history.log, {
      dName: this._dao.constructor.name,
      oprType: 'move',
      uid: this._uid,
      ret: {
        progroupId,
        obj: arguments[0],
        oldProgroupId,
        oldProjectId,
        moveNames
      }
    });

    return returnData;
  }

  /**
   * check conflict and throw exception if conflict exists
   *
   * @protected
   * @param {Number} pid - project id
   * @param {Object} fields - match fields, e.g. {feild1:'value'}
   * @param {String} [msg] - error message
   * @return {Object}
   */
  * _checkConflictInProject(pid, fields, msg) {
    let hasConflictInProject = yield this._hasConflictInProject(pid, fields);
    if (hasConflictInProject) {
      throw new HSError(msg || '存在同名的对应资源');
    }
  }

  /**
   * check whether conflict exists
   *
   * @protected
   * @param {Number} pid - project id
   * @param {Object} fields - match fields, e.g. {feild1:'value'}
   * @return {Object}
   */
  * _hasConflictInProject(pid, fields) {
    let _pDAO = new (require('../dao/ProjectDao'))({context: this._context});
    let pids = yield _pDAO.getRelationPids(pid);

    // check version
    let version = fields.version;
    if (version) {
      let unCheckids = yield this._rvDAO.search({
        conds: {
          res_type: this._dao._type,
          origin: version.origin,
          name: {
            value: version.name,
            op: '!='
          }
        },
        sfields: ['res_id']
      });
      fields.unCheckIds = unCheckids.map(it => it.resId);
      fields.unCheckIds.push(version.origin);
      delete fields.version;
    }

    return yield this._dao.hasConflictInProject(pids, fields);
  }

  /**
   * 批量修改业务分组
   * @param {Object} obj - update data
   * @param {Object} obj.ids - ids of the resources
   * @param {Object} obj.groupId - bisgroup id to move the resources to
   * @return {Array} 资源列表
   */
  * updateBisGroupBatch({ids = [], groupId}) {
    log.debug(
      '[%s.updateBisGroupBatch] update bisgroup of resource %s to %d',
      this.constructor.name, ids.join(','), groupId
    );
    yield this._dao.checkIds(ids);
    let pid = yield this._dao.getProjects(ids);
    if (pid.length > 1) {
      throw new Forbidden(`resources from different projects ${ids}`);
    }
    yield this._checkBisGroupPermission(pid[0], groupId);
    return yield super.updateBatch({groupId}, ids);
  }

  /**
   * clear resource hash/cache either by projects or by progroup
   *
   * @param  {Object} options
   * @param  {Object} options.pids - project ids
   * @param  {Object} options.pgid - progroup ids
   * @return {Void}
   */
  * clearCache({pids, pgid, detailOnly}) {
    let map = this._dao._RDS;
    let rdsKey = map[this._type];
    if (rdsKey == null) {
      return;
    }
    let pDAO = new (require('../dao/ProjectDao'))({context: this._context});
    if (pgid) {
      pids = yield pDAO.getPidsInProGroup(pgid);
    } else {
      pids = _.toArray(pids);
      let pid = pids[0];
      let pubProject = yield pDAO.getSharedByProject(pid);
      if (pids.includes(pubProject.id)) {
        pids = yield pDAO.getPidsInProGroup(pubProject.progroupId);
      }
    }
    let clearArr = [];
    if (this._type === db.RES_TYP_DATATYPE) {
      clearArr = clearArr.concat(pids.map(it => {
        return this._cache.remove(dt.RDS_DATATYPE_DETAIL + it);
      }));
      clearArr = clearArr.concat(detailOnly ? [] : pids.map(it => {
        return this._cache.remove(rdsKey + it);
      }));
    } else if (this._type === db.RES_TYP_BISGROUP) {
      [dt.RDS_DATATYPE,
        dt.RDS_DATATYPE_DETAIL,
        dt.RDS_INTERFACE,
        dt.RDS_RPC,
        dt.RDS_TEMPLATE,
        dt.RDS_CONSTRAINT,
        dt.RDS_BISGROUP].forEach(function (key) {
        clearArr = clearArr.concat(pids.map(it => {
          return this._cache.remove(key + it);
        }));
      }, this);
    } else {
      clearArr = pids.map(it => {
        return this._cache.remove(rdsKey + it);
      });
    }
    yield clearArr;
  }

  * _afterUpdate() {

  }

  * _afterCreate() {

  }

  * _afterMove() {

  }
}

module.exports = ResourceService;
