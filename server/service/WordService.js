/**
 * Word Service Class
 */
const log = require('../util/log');
const db = require('../../common').db;
const history = require('./helper/history');
const Forbidden = require('../error/fe/ForbiddenError');

class WordService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._type = db.RES_TYP_WORD;
    this._dao = new (require('../dao/WordDao'))({context});
    this._pDao = new (require('../dao/ProjectDao'))({context});
    this._paramDao = new (require('../dao/ParameterDao'))({context});
    this._iDao = new (require('../dao/InterfaceDao'))({context});
    this._rDao = new (require('../dao/RpcDao'))({context});
    this._dataTypeService = new (require('./DataTypeService'))(uid, context);
  }

  /**
   * Create a word record
   * @param {model/db/Word} model - word object
   * @return {model/db/Word} word object to be inserted
   */
  * create(model) {
    let ret = yield this._checkCreatePermission(model.projectId);
    let progroupId = ret.progroupId;

    yield this._checkConflictInProject(model.projectId, {name: model.name}, '存在同名的参数字典');
    model.progroupId = progroupId;

    let word = yield super.create(model);
    word.forbidStatus = db.WORD_STATUS_NORMAL;
    return word;
  }

  * createBatchWapper(model) {
    let projectId = model.projectId;
    let ret = yield this._checkCreatePermission(projectId);
    let progroupId = ret.progroupId;
    let names = model.words.map(w => {
      return w.name;
    });
    yield this._checkConflictInProject(projectId, {name: names}, '存在同名的参数字典');

    let newModels = model.words.map(w => ({
      name: w.name,
      type: db.WORD_TYP_NORMAL,
      associatedWord: w.associatedWord,
      description: w.description,
      projectId: projectId,
      tag: model.tag,
      groupId: model.groupId,
      progroupId: progroupId,
    }));
    ret = yield super.createBatch(newModels);
    ret.forEach(w => {
      w.forbidStatus = db.WORD_STATUS_NORMAL;
    });
    return ret;
  }

  /**
   * check whether conflict exists
   * @overwrite 重写了父类的 _hasConflictInProject
   * @param {Number} pid - project id
   * @param {Object} fields - match fields, e.g. {feild1:'value'}
   * @return {Object}
   */
  * _hasConflictInProject(pid, fields) {
    let _pDAO = new (require('../dao/ProjectDao'))({context: this._context});
    let pubProject = yield _pDAO.getSharedByProject(pid);
    let pids;
    if (pubProject.id === pid) {
      // 此处与父类的处理逻辑不同，公共项目创建时，不去查询普通项目是否含有同名资源
      pids = [pid];
    } else {
      pids = [pid, pubProject.id];
    }
    // 检查系统预置项目
    pids.push(10000);

    return yield this._dao.hasConflictInProject(pids, fields);
  }

  * findDetailById(id) {
    yield this._checkSearchPermission(id);
    let ret = yield this._dao.find(id, {joins: this._dao._getUserJoins()});
    yield this._fillWatch(ret);
    return ret;
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
  * move(data) {
    yield this._beginTransaction();

    let proIds = yield this._dao.getProjects(data.moves);
    let ret = yield super.move(data);

    yield this.moveForbidStatus({
      proIds: proIds,
      projectId: data.pid,
      ids: data.moves
    });

    yield this._endTransaction();
    return ret;
  }

  * moveForbidStatus({proIds, projectId, ids,}) {
    // super.move 内已经检查过权限，此处不再校验
    if (proIds.length !== 1) {
      throw new Forbidden(`资源不在同一个项目内 id：${ids}`, {id: ids});
    }
    let oldProjectId = proIds[0];
    let progroupId = yield this._pDao.getProGroupID(projectId);

    let wordOverwriteDao = this._dao._expModels[0].Dao;
    let overwrites = yield wordOverwriteDao.getListInProject(oldProjectId);
    log.info(`overWriteLength: ${overwrites.length}`);
    log.info(`ids:${ids}`);
    let targetOverWrites = overwrites
      .filter(model => ids.indexOf(model.wordId) > -1);

    log.info(`targetLength: ${targetOverWrites.length}`);
    // 为新项目创建禁用关系
    let newModels = targetOverWrites.map(model => {
      return {
        projectId: projectId,
        progroupId: progroupId,
        wordId: model.wordId,
        forbid: model.forbid,
        creatorId: this._uid
      };
    });

    if (newModels.length > 0) {
      yield wordOverwriteDao.createBatch(newModels);
    }

    // 移除老项目的禁用关系
    let removeIds = targetOverWrites.map(model => model.wordId);
    if (removeIds.length > 0) {
      yield wordOverwriteDao.removeBatch({
        projectId: oldProjectId,
        wordId: removeIds,
      });
    }
    yield wordOverwriteDao.clearListCache(oldProjectId);
    yield wordOverwriteDao.clearListCache(projectId);
  }

  /**
   * 处理引用关系回调，此处原样返回，以便在_copyResParamsQuotesData中使用
   * @param {Object} data - data
   * @param {Array} data.ids - resouce ids;
   * @param {Number} data.projectId - 目标项目id
   * @param {Number} data.progroupId - 目标项目组id
   * @param {Number} data.oldProjectId - 原始项目id
   * @param {Number} data.oldProgroupId - 原始项目组id
   * @param {Number} data.oldPubProjectId - 原始公共项目id
   * @param {Number} data.groupId - 业务组
   */
  * _checkResParamsQuotes(data) {
    return data;
  }

  /**
   * 复制资源时处理引用关系回调，在此处理禁用关系的复制
   * @param {Object} cloneResourceMap - 原始id与新id的映射
   * @param {Object} quotesData - data
   * @param {Array} quotesData.ids - resouce ids;
   * @param {Number} quotesData.projectId - 目标项目id
   * @param {Number} quotesData.progroupId - 目标项目组id
   * @param {Number} quotesData.oldProjectId - 原始项目id
   * @param {Number} quotesData.oldProgroupId - 原始项目组id
   * @param {Number} quotesData.oldPubProjectId - 原始公共项目id
   * @param {Number} quotesData.groupId - 业务组
   */
  * _copyResParamsQuotesData(quotesData, cloneResourceMap) {
    yield this._copyForbidStatus({
      oldPubProjectId: quotesData.oldPubProjectId,
      oldProjectId: quotesData.oldProjectId,
      projectId: quotesData.projectId,
      wordMap: cloneResourceMap,
      withSystem: false
    });
  }

  /**
   * get word list in project
   *
   * @param  {Number} pid - project id
   * @return {Array}  word list
   */
  * getListInProject(pid) {
    log.info(
      '[%s.getListInProject] get word list in project %s',
      this.constructor.name, pid
    );

    let ret = yield super.getListInProject(pid);
    let systemList = yield this._dao.getListOfSystem();
    yield this._fillWatch(ret);
    let list = [...ret, ...systemList];
    yield this._fillForbidStatus(list, pid);
    list = yield this._filterDuplicate(list, pid);
    return list;
  }

  // 添加上禁用关系
  * _fillForbidStatus(ret, pid) {
    let wordOverwriteDao = this._dao._expModels[0].Dao;

    let sharedProject = yield this._pDao.getSharedByProject(pid);
    let sharedOverwrites = yield wordOverwriteDao.getListInProject(sharedProject.id);
    // 先填充上公共项目的禁用关系
    ret.forEach(r => {
      const overwrite = sharedOverwrites.find(o => o.wordId === r.id);
      r.forbidStatus = overwrite ? overwrite.forbid : db.WORD_STATUS_NORMAL;
    });

    // 再填充上项目自己的禁用关系
    if (sharedProject.id !== pid) {
      let projectOverwrites = yield wordOverwriteDao.getListInProject(pid);
      ret.forEach(r => {
        const overwrite = projectOverwrites.find(o => o.wordId === r.id);
        r.forbidStatus = overwrite ? overwrite.forbid : r.forbidStatus;
      });
    }
  }

  /**
   * 同名词条去重逻辑
   * 应对场景： 普通项目创建了一个词条后，公共项目又创建了一个同名词条。在拉取普通项目词条列表时，应将公共项目的同名词条过滤。
   *
   */
  * _filterDuplicate(list, pid) {
    let sharedProject = yield this._pDao.getSharedByProject(pid);
    // 如果是公共项目，无需去重
    if (pid === sharedProject.id) {
      return list;
    }
    // 普通项目自己创建的词条
    let projectWords = list.filter(w => w.projectId === pid);
    list = list.filter(w => {
      if (w.projectId !== sharedProject.id) {
        return true;
      }
      let hasSameName = projectWords.findIndex(projectW => projectW.name === w.name) > -1;
      // 如果在普通项目自己创建的词条中，发现了同名词条，则过滤掉。
      return !hasSameName;
    });
    return list;
  }

  /**
   * 批量更新禁用状态
   * @param {*} params
   * @param {number} params.pid 项目id
   * @param {array} params.ids 参数字典id
   * @param {number} params.forbidStatus 禁用状态 0-非禁用  1-禁用
   * @memberof WordService
   */
  * updateForbidBatch(params) {
    yield this._checkUpdateForbidPermission(params.pid);
    let projectId = params.pid;
    let ids = params.ids || [];
    let newStatus = params.forbidStatus;
    let progroupId = yield this._pDao.getProGroupID(projectId);
    let wordOverwriteDao = this._dao._expModels[0].Dao;

    // 找出已存在的，批量更新这部分
    let overwrites = yield wordOverwriteDao.getListInProject(projectId);
    let updateModels = overwrites
      .filter(model => ids.indexOf(model.wordId) > -1)
      .map(model => {
        return {
          forbid: newStatus,
          wordId: model.wordId,
          _conds: {
            projectId: projectId,
            wordId: model.wordId
          }
        };
      });
    if (updateModels.length > 0) {
      yield wordOverwriteDao.updateBatchModels(updateModels);
    }

    // 批量创建剩余的部分
    let newModels = ids
      .filter(id => updateModels.findIndex(model => model.wordId === id) === -1)
      .map(id => ({
        projectId: projectId,
        progroupId: progroupId,
        wordId: id,
        forbid: newStatus,
        creatorId: this._uid
      }));
    if (newModels.length > 0) {
      yield wordOverwriteDao.createBatch(newModels);
    }
    yield wordOverwriteDao.clearListCache(projectId);

    if (ids.length > 0) {
      const models = yield this._dao.findBatch(ids);
      this._async(history.log, {
        dName: this._dao.constructor.name,
        oprType: 'forbid',
        uid: this._uid,
        ret: {projectId, progroupId, models, newStatus}
      });
    }

    return ids.map(id => ({
      id,
      forbidStatus: newStatus
    }));
  }

  * _checkUpdateForbidPermission(projectId, opt = {role: {}}) {
    // 此处获取的是在项目内的角色
    opt.role = yield this._owDAO.getRoleOfUser(
      projectId, this._uid
    );
    return yield this._checkPermission(projectId, 'update', opt);
  }

  /**
   * 此方法用于ProjectService的项目复制逻辑中
   * @param {*} params
   * @param {number} params.oldProjectId 被复制的项目id
   * @param {number} params.oldPubProjectId 被复制的公共项目Id，与oldProjectId可能一致
   * @param {number} params.projectId 目标项目id
   * @param {number} params.wordMap 被复制的参数字典id 与 新创建的参数字典id 的映射，只有出现在此映射中id的才会被设置上禁用关系
   * @param {number} params.withSystem 是否需要拷贝项目对系统参数字典的禁用关系
   * @memberof WordService
   */
  * _copyForbidStatus({oldPubProjectId, oldProjectId, projectId, wordMap, withSystem}) {
    let wordForbidMap = {};
    let wordOverwriteDao = this._dao._expModels[0].Dao;
    let pubProOverwrites = yield wordOverwriteDao.getListInProject(oldPubProjectId);
    pubProOverwrites.forEach(ow => {
      wordForbidMap[ow.wordId] = ow.forbid;
    });
    if (oldPubProjectId !== oldProjectId) {
      let proOverwrites = yield wordOverwriteDao.getListInProject(oldProjectId);
      proOverwrites.forEach(ow => {
        // 项目的禁用关系可以覆盖公共项目中的禁用关系
        wordForbidMap[ow.wordId] = ow.forbid;
      });
    }

    if (withSystem) {
      let systemList = yield this._dao.getListOfSystem();
      systemList.forEach(systemWord => {
        // 只有设置上，才标记为需要被复制
        wordMap[systemWord.id] = systemWord.id;
      });
    }

    let wordNormalList = [];
    let wordForbidList = [];
    Object.keys(wordForbidMap).forEach(id => {
      if (!wordMap.hasOwnProperty(id)) return;

      if (wordForbidMap[id] === db.WORD_STATUS_NORMAL) {
        wordNormalList.push(wordMap[id]);
      } else {
        wordForbidList.push(wordMap[id]);
      }
    });

    if (wordNormalList.length > 0) {
      yield this.updateForbidBatch({
        pid: projectId,
        ids: wordNormalList,
        forbidStatus: db.WORD_STATUS_NORMAL
      });
    }

    if (wordForbidList.length > 0) {
      yield this.updateForbidBatch({
        pid: projectId,
        ids: wordForbidList,
        forbidStatus: db.WORD_STATUS_FORBID
      });
    }
  }

  * _checkSearchPermission(id, opt = {role: {}}) {
    let ret = yield this._dao.find(id);
    if (!ret) {
      throw new Forbidden('资源不存在', {id});
    }
    // 系统类型则都有查看权限
    if (ret.type === db.WORD_TYP_SYSTEM) {
      return true;
    }
    return super._checkSearchPermission(id, opt);
  }

  /**
   * 根据项目已有的参数名，提供待创建的可选项
   * @param {*} projectId 项目资源id
   * @memberof WordService
   */
  * getProjectCandidateList(projectId) {
    yield this._checkCreatePermission(projectId);
    // 获取项目所有的数据模型
    const hash = yield this._dataTypeService.getInProject(projectId);
    const timesMap = {};
    let datatypeParam = [];
    Object.keys(hash).forEach(key => {
      const dt = hash[key];
      // 系统预置类型
      if (dt.type === 1) {
        return;
      }
      if (dt.params) {
        datatypeParam = datatypeParam.concat(dt.params);
        // 此处无需再递归收集了，因为所有的非基础类型的子参数都已在hash内
      }
    });
    // 获取项目的所有http接口
    const interfaces = yield this._iDao.getListInProject(projectId);
    const interfaceParam = yield this._paramDao.getParamTimes({
      parentId: interfaces.map(i => i.id),
      parentType: [db.PAM_TYP_INPUT, db.PAM_TYP_OUTPUT]
    });

    const rpcs = yield this._rDao.getListInProject(projectId);
    const rpcParam = yield this._paramDao.getParamTimes({
      parentId: rpcs.map(i => i.id),
      parentType: [db.PAM_TYP_RPC_INPUT, db.PAM_TYP_RPC_OUTPUT]
    });
    const totalParam = [].concat(datatypeParam, interfaceParam, rpcParam);
    totalParam.forEach(param => {
      timesMap[param.name] = (timesMap[param.name] || 0) + (param.timing ? param.timing : 1);
    });

    // 已创建的参数词
    let words = yield this.getListInProject(projectId);
    let wordMap = words.reduce((acc, w) => {
      acc[w.name] = 1;
      return acc;
    }, {});

    return Object.keys(timesMap)
      .filter(name => {
        return !!name && !wordMap[name];
      })
      .map(name => ({
        name: name,
        times: timesMap[name]
      }))
      .sort((a, b) => {
        return b.times - a.times;
      });
  }

  /**
   * 根据项目组已有的参数名，提供待创建的可选项
   * @param {*} publicProjectId 公共资源项目id
   */
  * getProgroupCandidateList(publicProjectId) {
    yield this._checkCreatePermission(publicProjectId);

    let sharedProject = yield this._pDao.getSharedByProject(publicProjectId);
    let exitParams = yield this._paramDao.getParamTimes({
      progroupId: sharedProject.progroupId
    });
    let words = yield this.getListInProject(sharedProject.id);

    let wordMap = words.reduce((acc, w) => {
      acc[w.name] = 1;
      return acc;
    }, {});

    let candidateWords = exitParams.filter(param => {
      // 尚未创建的参数词库
      return !wordMap[param.name] && !!param.name;
    });

    return candidateWords;
  }
}

module.exports = WordService;
