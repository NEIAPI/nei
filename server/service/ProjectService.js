/**
 * Project Service Class
 */

const log = require('../util/log');
const _ = require('../util/utility');
const dbMap = require('../../common/config/db.json');
const history = require('./helper/history');
const Forbidden = require('../error/fe/ForbiddenError');

const specMap = {
  [dbMap.CMN_TYP_WEB]: 'toolSpecWeb',
  [dbMap.CMN_TYP_AOS]: 'toolSpecAos',
  [dbMap.CMN_TYP_IOS]: 'toolSpecIos',
  [dbMap.CMN_TYP_TEST]: 'toolSpecTest'
};

class ProjectService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProGroupDao');
    this._dao = new (require('../dao/ProjectDao'))({context});
    this._pgDAO = new (require('../dao/ProGroupDao'))({context});
    this._bgDAO = new (require('../dao/BisGroupDao'))({context});
    this._rcDAO = new (require('../dao/ResourceClientDao'))({context});
    this._puDAO = new (require('../dao/ProGroupUserDao'))({context});
    this._rhDAO = new (require('../dao/ResourceHistoryDao'))({context});
    this._dDAO = new (require('../dao/DataTypeDao'))({context});
    this._tDAO = new (require('../dao/TemplateDao'))({context});
    this._iDAO = new (require('../dao/InterfaceDao'))({context});
    this._vDAO = new (require('../dao/ViewDao'))({context});
    this._rvDAO = new (require('../dao/ResourceVersionDao'))({context});
    this._viDAO = new (require('../dao/ViewInterfaceDao'))({context});
    this._vtDAO = new (require('../dao/ViewTemplateDao'))({context});
    this._cDAO = new (require('../dao/ConstraintDao'))({context});
    this._tcDAO = new (require('../dao/TestcaseDao'))({context});
    this._sdDAO = new (require('../dao/SpecificationDirectoryDao'))({context});
    this._cliDAO = new (require('../dao/ClientDao'))({context});
    this._sDAO = new (require('../dao/SpecificationDao'))({context});
    this._piDAO = new (require('../dao/ProgroupIpDao'))({context});
    this._wPAO = new (require('../dao/WordDao'))({context});

    this._dataTypeService = new (require('./DataTypeService'))(uid, context);
    this._bisGroupService = new (require('./BisGroupService'))(uid, context);
    this._constraintService = new (require('./ConstraintService'))(uid, context);
    this._cliArgService = new (require('./CliArgService'))(uid, context);
    this._skService = new (require('./SpecificationKlassmapService'))(uid, context);
    this._wordService = new (require('./WordService'))(uid, context);
  }

  _getGlobalSearchConds() {
    return {
      creator_id: {
        op: '!=',
        value: dbMap.USR_ADMIN_ID
      },
      type: dbMap.PRO_TYP_NORMAL
    };
  }

  /**
   * Create a project record
   * @param {model/db/Project} project - project object
   * @return {model/db/Project} project object to be inserted
   */
  * create(model) {
    let ret = yield this._checkCreatePermission(model.progroupId);
    let progroupId = ret.progroupId;

    model.type = dbMap.PRO_TYP_NORMAL;
    model.toolKey = _.randString(32, false, true);
    // 默认打开响应参数可以选择“是否必需”
    model.resParamRequired = 1;

    yield this._beginTransaction();
    let project = yield super.create(model);
    let toolKey = _.getToolKey(project.id, _.toolKeyType.PROJECT);
    //添加默认业务分组
    yield this._bgDAO.create({
      type: dbMap.BIS_TYP_SYSTEM,
      name: '默认分组',
      creatorId: this._uid,
      respoId: this._uid,
      projectId: project.id,
      progroupId
    });
    //update toolKey
    project = yield this._dao.update({id: project.id, toolKey});
    yield this._endTransaction();

    return project;
  }

  /**
   * remove project
   * @param {Array} id - project id
   * @return {model/db/Progroup} project
   */
  * remove(id) {
    let project = yield this._dao.find(id);

    if (project.type === dbMap.PRO_TYP_COMMON) {
      // 公共库不允许删除
      throw new Forbidden(
        '公共库不允许删除', {
          rid: id,
          uid: this._uid
        }
      );
    }
    return yield super.remove(id);
  }

  /**
   * get projects
   * @param  {Object} conds - search conds
   * @param  {Boolean} hasDetail - has detail flag
   * @return {Array model/db/Project} Project model list
   */
  * findProjects(conds, hasDetail) {
    log.debug('[%s.findProjects] - find projects :%s',
      this.constructor.name, conds);

    let projects = yield this._dao.searchWithConds(conds) || [];

    if (!hasDetail) {
      return projects;
    }

    let pgids = _.uniq(
      projects.map((project) => {
        return project.progroupId;
      })
    );

    // 获取项目组相关的用户数据
    let progroupUserMap = yield this._puDAO.findDetailUser(pgids);
    projects.map((pro) => {
      let pgid = pro.progroupId;
      Object.assign(pro, progroupUserMap[pgid] || {});
    });
    return projects;
  }

  * getById(id) {
    log.debug('[%s.getProjectDetailById] - get project by id: %s', this.constructor.name, id);

    let project = yield this._dao.find(id);
    if (!project) {
      throw new Forbidden('找不到项目', {id});
    }
    let users = yield this._puDAO.search({conds: {progroupId: project.progroupId, userId: this._uid}});
    if (users.length) {
      project = yield super.getById(id);
    } else {
      let progroup = yield this._pgDAO.find(project.progroupId);
      if (!progroup) {
        throw new Forbidden('找不到项目组', {id: project.progroupId});
      }
      project = {
        progroupId: progroup.id,
        progroupName: progroup.name,
        id: project.id,
        name: project.name,
        description: project.description,
      };
    }

    return project;
  }

  /**
   * find recent projects
   * @return {Array model/db/Project} project model list
   */
  * findRecent() {
    log.debug('[%s.findRecent] - find recent projects', this.constructor.name);

    let projectObjs = yield this._rhDAO.findRecentProjects(this._uid);
    let projectIds = (projectObjs || []).map(item => item.projectId);
    if (!projectIds.length) {
      let publicProgroupId = yield this._pgDAO.getDefaultId(this._uid);
      let project = yield this._dao.getSharedByProGroup(publicProgroupId);
      projectIds.push(project.id);
    }
    let projects = yield this._dao.search({
      conds: {
        id: projectIds
      },
      joins: [{
        table: 'progroup',
        fkmap: {id: 'progroup_id'},
        field: this._dao.PROGROUP_EXPORT_FIELD
      }]
    });
    let ret = [];
    projectIds.forEach(pid => {
      let project = projects.find((pro) => {
        return pro.id === pid;
      });
      if (project != null) {
        let prog = project.ext.progroup;
        project.progroupName = prog.name;
        delete project.progroup;
        ret.push(project);
      }
    });
    return ret;
  }

  /**
   * reset toolkey
   * @param  {Number} pid - project id
   * @return {model/db/Project} project model
   */
  * rtk(pid) {
    let toolKey = _.getToolKey(pid, _.toolKeyType.PROJECT);
    return yield super.update({id: pid, toolKey});
  }

  /**
   * change porject creator
   * @param  {Number} id - project id
   *  @param  {Number} toId - to user id
   * @return {model/db/Project} project model
   */
  * changeCreator({id, toId}) {
    let ret = yield this._checkSearchPermission(id);
    let pgid = ret.progroupId;

    let project = yield this.getById(id);
    if (!project || project.creatorId !== this._uid) {
      throw new Forbidden('非创建者没有权限', {id});
    }

    let pus = yield this._puDAO.search({
      conds: {
        progroup_id: pgid,
        user_id: toId
      }
    });
    if (!pus.length) {
      throw new Forbidden('选择的用户不在当前项目组内', {toId});
    }

    /**
     * 17.12.18 项目创建者直接赋给owner的权限
     */
    return yield super.update({id, creatorId: toId}, {
      role: {role: dbMap.PRG_ROL_ADMIN}
    });
  }

  * clone({
    progroupId,
    projectId: oldProjectId,
    name,
    description
  }) {
    let userId = this._uid;

    yield this._checkCreatePermission(progroupId);
    let progroup = yield this._pgDAO.find(progroupId);
    if (!progroup) {
      throw new Forbidden('目标项目组不存在', {progroupId});
    }
    if (progroup.isLock) {
      throw new Forbidden('目标项目组被锁定', {progroupId});
    }

    let pubProject = yield this._dao.getSharedByProGroup(progroupId);
    let pubProjectId = pubProject.id;

    let oldProject = yield this._dao.find(oldProjectId);
    if (!oldProject) {
      throw new Forbidden('项目不存在', {oldProjectId});
    }
    let oldProgroupId = oldProject.progroupId;
    let oldProgroup = yield this._pgDAO.find(oldProgroupId);
    if (!oldProgroup) {
      throw new Forbidden('项目组不存在', {progroupId: oldProgroupId});
    }
    if (oldProject.creatorId != userId && oldProgroup.creatorId != userId) {
      throw new Forbidden('没有复制项目的权限', {oldProjectId});
    }
    let oldPubProject = yield this._dao.getSharedByProGroup(oldProgroupId);
    let oldPubProjectId = oldPubProject.id;

    let oldProjectIds = [oldProjectId];
    if (oldProjectId != oldPubProjectId) {
      oldProjectIds.push(oldPubProjectId);
    }

    let newHash = yield this._dataTypeService.getInProGroup(progroupId);
    let oldHash = yield this._dataTypeService.getInProGroup(oldProgroupId);

    //数据映射
    let datatypeMap = {};
    let interfaceMap = {};
    let templateMap = {};
    let viewMap = {};
    let groupMap = {};
    let parameterMap = {};
    let clientMap = {};

    //查找所有需要复制的资源
    let datatypeIdSet = new Set();
    let interfaceIdSet = new Set();
    let templateIdSet = new Set();
    let viewIdSet = new Set();
    let clientIdSet = new Set();

    let oldSources = yield {
      interfaces: this._iDAO.getListInProject(oldProjectId),
      templates: this._tDAO.getListInProject(oldProjectId),
      views: this._vDAO.getListInProject(oldProjectId),
      datatypes: this._dDAO.getListInProject(oldProjectId),
    };

    oldSources.interfaces.forEach(item => interfaceIdSet.add(item.id));
    oldSources.templates.forEach(item => templateIdSet.add(item.id));
    oldSources.views.forEach(item => viewIdSet.add(item.id));
    oldSources.datatypes.forEach(item => {
      if (item.type != dbMap.BIS_TYP_SYSTEM) datatypeIdSet.add(item.id);
    });

    //查找页面引用的公共资源库接口
    if (viewIdSet.size) {
      let viewInterdfaces = yield this._iDAO.getListForWebView(Array.from(viewIdSet));
      // 这些公共资源可能也存在版本
      let relateInter = yield this._rvDAO.getListByResId(viewInterdfaces.map(it => it.id), dbMap.RES_TYP_INTERFACE);
      viewInterdfaces.forEach(item => interfaceIdSet.add(item.id));
      relateInter.forEach(item => interfaceIdSet.add(item.resId));
    }
    //查找公共资源库中需要复制的数据模型
    if (oldProjectIds.length == 2) {
      let datatypes = yield this._dDAO.getListInProject(oldPubProjectId);
      for (let item of datatypes) {
        if (item.type != dbMap.BIS_TYP_SYSTEM) {
          // 这里可以看下此处改动的历史记录。原来的逻辑是要先检查这个公共资源库中的数据模型是否被该项目中的资源（异步接口、模型、页面等）引用，如果有引用，就复制，否则就不复制
          // 但检查是否被引用，太耗时了，这里就改成直接复制吧
          datatypeIdSet.add(item.id);
        }
      }
    }
    let datatypeIdList = yield this._dataTypeService.getListInDataType(oldProjectId, Array.from(datatypeIdSet));
    datatypeIdList.forEach(id => datatypeIdSet.add(id));
    //检查和目标公共资源库同名的数据模型
    Array.from(datatypeIdSet).forEach(id => {
      let datatype = oldHash[id];
      if (datatype.type != dbMap.MDL_TYP_HIDDEN) {
        let ret;
        Object.keys(newHash).forEach(key => {
          if (newHash[key].projectId == pubProjectId && newHash[key].name == datatype.name) {
            ret = newHash[key];
          }
        });
        if (ret) {
          datatypeIdSet.delete(id);
          datatypeMap[id] = ret.id;
        }
      }
    });

    let datatypeIds = Array.from(datatypeIdSet);
    let interfaceIds = Array.from(interfaceIdSet);
    let templateIds = Array.from(templateIdSet);
    let viewIds = Array.from(viewIdSet);

    yield this._beginTransaction();
    //复制项目
    let project = yield this.create({
      progroupId,
      name,
      description
    });
    let projectIds = [project.id, pubProjectId];
    let projectId = project.id;

    //复制业务分组
    let groups = yield this._bgDAO.getListInProject(oldProjectId);
    for (let group of groups) {
      if (group.type != dbMap.BIS_TYP_SYSTEM) {
        let ret = yield this._bisGroupService.create({
          name: group.name,
          projectId: project.id,
          progroupId
        });
        groupMap[group.id] = ret.id;
      }
    }

    //获取默认分组
    let groupId = yield this._bgDAO.getDefaultId(projectId);

    //复制客户端
    let clients = yield this._cliDAO.getListInProject(oldProjectId);
    for (let item of clients) {
      let client = _.filterObj(item, ['type', 'name', 'namePinyin', 'state', 'description', 'downloadLink', 'launchDate', 'closeDate', 'groupId', 'version', 'tag', 'tagPinyin']);
      client.respoId = userId;
      client.creatorId = userId;
      client.projectId = projectId;
      client.progroupId = progroupId;
      client.groupId = groupMap[client.groupId] || groupId;
      let ret = yield this._cliDAO.create(client);
      clientMap[item.id] = ret.id;
    }

    //复制规则函数
    let constraints = yield this._cDAO.getListInProjects(oldProjectIds);
    for (let constraint of constraints) {
      //判断是否存在同名规则函数
      let prev = yield this._cDAO.search({conds: {name: constraint.name, projectId: projectIds}});
      if (!prev.length) {
        let constrintObj = _.filterObj(constraint, ['name', 'tag', 'tagPinyin', 'type', 'description', 'apply', 'function']);
        yield this._constraintService.create(Object.assign(constrintObj, {
          groupId: groupMap[constraint.groupId] || groupId,
          projectId,
          progroupId,
        }));
      }
    }

    // 复制参数字典
    let words = yield this._wPAO.getListInProjects(oldProjectIds);
    let pubWords = yield this._wPAO.getListInProject(pubProjectId);
    let wordMap = {}; // 原参数字典id 与 新参数字典id的映射
    for (let word of words) {
      // 如果在目标项目组的公共项目内找到了同名参数字典，则不拷贝
      let exitWord = pubWords.find(pW => pW.name === word.name);
      if (exitWord) {
        // 词条不复制，但对该词条的禁用关系需要被复制，所以要保存映射关系
        // 以保证在新项目组内看到的禁用关系与被复制项目，完全一致。
        wordMap[word.id] = exitWord.id;
        continue;
      }

      let wordObj = _.filterObj(word, ['name', 'description', 'associatedWord', 'type', 'tag', 'tagPinyin']);
      let newWord = yield this._wordService.create(Object.assign(wordObj, {
        groupId: groupMap[word.groupId] || groupId,
        projectId,
        progroupId,
      }));
      wordMap[word.id] = newWord.id;
    }

    // 复制参数词库的禁用关系
    yield this._wordService._copyForbidStatus({
      oldPubProjectId,
      oldProjectId,
      projectId,
      wordMap,
      withSystem: true
    });

    this._interfaceService = new (require('./InterfaceService'))(this._uid);
    this._templateService = new (require('./TemplateService'))(this._uid);
    this._viewService = new (require('./ViewService'))(this._uid);

    //复制数据模型
    if (datatypeIds.length) {
      for (let id of datatypeIds) {
        let datatype = oldHash[id];
        let datatypeObj = _.filterObj(datatype, ['tag', 'tagPinyin', 'type', 'name', 'format', 'description']);
        let ret = yield this._dDAO.create(Object.assign(datatypeObj, {
          groupId: groupMap[datatype.groupId] || groupId,
          projectId,
          progroupId,
          creatorId: userId
        }));
        datatypeMap[datatype.id] = ret.id;
        this._async(history.log, {
          dName: this._dDAO.constructor.name,
          oprType: 'add',
          uid: this._uid,
          ret
        });
      }
      //复制参数
      let {
        parentType,
        parameterDaoUrl,
        headerParentType,
        headerDaoUrl
      } = this._dataTypeService._getResParentMapAndDaoUrl();
      yield this._dataTypeService._copyParams({
        ids: datatypeIds,
        progroupId,
        newHash,
        oldHash,
        parameterDaoUrl,
        headerParentType,
        headerDaoUrl,
        datatypeMap,
        parameterMap,
        cloneResourceMap: datatypeMap
      });
    }

    //复制接口
    if (interfaceIds.length) {
      let interfaces = yield this._iDAO.findBatch(interfaceIds);
      for (let item of interfaces) {
        let interfaceObj = _.filterObj(item, ['tag', 'tagPinyin', 'name', 'namePinyin', 'status', 'statusPinyin', 'stateId', 'path', 'type',
          'method', 'isRest', 'className', 'description', 'paramsOrder', 'reqFormat', 'resFormat', 'beforeScript', 'afterScript', 'schema']);
        interfaceObj.progroupId = progroupId;
        interfaceObj.projectId = projectId;
        interfaceObj.groupId = groupMap[item.groupId] || groupId;
        interfaceObj.creatorId = userId;
        interfaceObj.respoId = userId;

        let ret = yield this._iDAO.create(interfaceObj);
        interfaceMap[item.id] = ret.id;
        this._async(history.log, {
          dName: this._iDAO.constructor.name,
          oprType: 'add',
          uid: this._uid,
          ret
        });
      }
      //复制参数
      let {
        parentType,
        parameterDaoUrl,
        headerParentType,
        headerDaoUrl
      } = this._interfaceService._getResParentMapAndDaoUrl();
      yield this._interfaceService._copyParams({
        ids: interfaceIds,
        progroupId,
        newHash,
        oldHash,
        parameterDaoUrl,
        headerParentType,
        headerDaoUrl,
        datatypeMap,
        parameterMap,
        cloneResourceMap: interfaceMap
      });
    }

    //复制版本
    if (interfaceIds.length || datatypeIds.length) {
      let versions = yield this._rvDAO.getListInProject(oldProjectId);
      for (let item of versions) {
        let version = _.filterObj(item, ['resId', 'resType', 'origin', 'parent', 'launchDate', 'closeDate', 'description', 'name']);
        version.progroupId = progroupId;
        version.projectId = projectId;
        version.creatorId = userId;
        let map;
        if (version.resType == dbMap.RES_TYP_INTERFACE) {
          map = interfaceMap;
        } else if (version.resType == dbMap.RES_TYP_DATATYPE) {
          map = datatypeMap;
        } else {
          continue;
        }
        // 修改映射关系
        version.origin = map[version.origin];
        version.parent = map[version.parent];
        version.resId = map[version.resId];
        yield this._rvDAO.create(version);
      }
    }

    // 复制版本映射关系
    let resourceClients = yield this._rcDAO.getListInProject(oldProjectId);
    for (let item of resourceClients) {
      if (item.resId in interfaceMap && item.clientId in clientMap) {
        item.resId = interfaceMap[item.resId];
        item.projectId = projectId;
        item.progroupId = progroupId;
        item.clientId = clientMap[item.clientId];
        yield this._rcDAO.create(item);
      }
    }

    //复制模板
    if (templateIds.length) {
      let templates = yield this._tDAO.findBatch(templateIds);
      for (let item of templates) {
        let oldId = item.id;
        delete item.createTime;
        delete item.id;
        item.progroupId = progroupId;
        item.projectId = projectId;
        item.groupId = groupMap[item.groupId] || groupId;
        item.creatorId = userId;
        item.respoId = userId;
        let ret = yield this._tDAO.create(item);
        templateMap[oldId] = ret.id;
        this._async(history.log, {
          dName: this._tDAO.constructor.name,
          oprType: 'add',
          uid: this._uid,
          ret
        });
      }
      //复制模板参数
      let {
        parentType,
        parameterDaoUrl,
        headerParentType,
        headerDaoUrl
      } = this._templateService._getResParentMapAndDaoUrl();
      yield this._templateService._copyParams({
        ids: templateIds,
        progroupId,
        newHash,
        oldHash,
        parameterDaoUrl,
        headerParentType,
        headerDaoUrl,
        datatypeMap,
        parameterMap,
        cloneResourceMap: templateMap
      });
    }

    //复制页面视图
    if (viewIds.length) {
      let views = yield this._vDAO.findBatch(viewIds);
      for (let item of views) {
        let oldId = item.id;
        delete item.createTime;
        delete item.id;
        item.progroupId = progroupId;
        item.projectId = projectId;
        item.groupId = groupId;
        item.creatorId = userId;
        item.respoId = userId;
        let ret = yield this._vDAO.create(item);
        viewMap[oldId] = ret.id;
        this._async(history.log, {
          dName: this._vDAO.constructor.name,
          oprType: 'add',
          uid: this._uid,
          ret
        });
      }
      //复制页面参数
      let {
        parentType,
        parameterDaoUrl,
        headerParentType,
        headerDaoUrl
      } = this._viewService._getResParentMapAndDaoUrl();
      yield this._viewService._copyParams({
        ids: viewIds,
        progroupId,
        newHash,
        oldHash,
        parameterDaoUrl,
        headerParentType,
        headerDaoUrl,
        datatypeMap,
        parameterMap,
        cloneResourceMap: viewMap
      });
    }

    yield this._endTransaction();

    yield this._dataTypeService.clearCache({pgid: progroupId});
    return project;
  }

  /* get all project detail for doc or tool
   * @param {Object} data
   * @param {String} [data.key] project toolkey
   * @param {Number} [data.spectype] spec type
   * @param {Number} [data.pid] project id
   * @param {Number} [data.userId] user id
   * @return {Object}
   */
  * getAllDetailForDoc({fromTool = false, key, spectype, userId, pid}) {
    let project;
    if (fromTool) {
      //工具进入
      let authType;
      if (pid) {
        // cookie授权
        yield this._checkSearchPermission(pid, 'cookie授权有误');
        project = yield this._dao.find(pid, {joins: this._dao._getUserJoins()});
        authType = dbMap.PRO_AUTH_COOKIE;
      } else {
        // key授权
        let ret = yield this._dao.search({
          conds: {toolKey: key},
          joins: this._dao._getUserJoins()
        });
        if (!ret.length) {
          throw new Forbidden('没有权限');
        }
        project = ret[0];
        authType = dbMap.PRO_AUTH_KEY;
      }
      if (project.authType !== authType) {
        throw new Forbidden('项目授权方式有误');
      }

      //ip验证
      let ips = yield this._piDAO.search({conds: {progroupId: project.progroupId}});
      let ip = this._context.accept.headers['x-forwarded-for'] ||
        this._context.accept.headers['x-real-ip'] ||
        this._context.request.ip;
      ips = ips.map(item => item.ip);
      log.debug(
        '[%s.getAllDetailForDoc] progroup allowed accessing ips: %s',
        this.constructor.name, JSON.stringify(ips)
      );
      log.debug(
        '[%s.getAllDetailForDoc] find data from tool with ip %s',
        this.constructor.name, ip
      );
      if (ips.length && !ips.includes(ip)) {
        throw new Forbidden('不在项目组授权的ip范围内');
      }
    } else {
      // 文档获取
      yield this._checkSearchPermission(pid);
      project = yield this._dao.find(pid, {joins: this._dao._getUserJoins()});
    }

    let id = project.id;
    let progroupId = project.progroupId;
    // 获取项目组相关的用户数据
    let progroupUserMap = yield this._puDAO.findDetailUser(progroupId);
    let progroupUser = progroupUserMap[progroupId];
    project.members = progroupUser;
    let projectIds = yield this._getSearchPids(id);
    let dhash = yield this._dataTypeService.getInProject(id);
    let vmService = new (require('./SpecificationVarmapService'))(this._uid, this._context);
    let iService = new (require('./InterfaceService'))(this._uid, this._context);
    let rService = new (require('./RpcService'))(this._uid, this._context);
    let tService = new (require('./TemplateService'))(this._uid, this._context);
    let vService = new (require('./ViewService'))(this._uid, this._context);
    let ret = yield {
      datatypes: this._dataTypeService.getListInProject(id),
      testcases: this._tcDAO.getListWithProjectId(projectIds),
      cliargs: this._cliArgService.getListInProject(id, spectype),
      varmaps: vmService.findWithParentTypeAndId({parentId: id, parentType: dbMap.RES_TYP_PROJECT}),
      groups: this._bgDAO.getListInProjects([id]),
      constraints: this._constraintService.getListInProject(id),
      interfaces: iService.getDetailListInProject(id, {pids: projectIds, dhash}),
      rpcs: rService.getDetailListInProject(id, {pids: projectIds, dhash}),
      templates: tService.getDetailListInProject(id, {pids: projectIds, dhash}),
      pages: vService.getDetailListInProject(id, {pids: projectIds, dhash})
    };
    Object.assign(ret, {project});
    // 获取变量映射
    let varmaps = ret.varmaps;
    delete ret.varmaps;

    let testcases = ret.testcases;
    delete ret.testcases;

    // 如果有 spectype，再加上 spec 信息
    // 有 spectype 是给nei构建工具使用，没有spectype，只返回项目数据，给第三方工具使用
    if (spectype !== undefined) {
      let specIds = [];

      if (project[specMap[spectype]]) {
        specIds.push(project[specMap[spectype]]);
      }

      (ret.interfaces || []).forEach(function (item) {
        let ret = testcases.filter((testcase) => {
          return testcase.interfaceId === item.id;
        });
        item.testcases = ret;
      });

      let specs = [];
      let attributes = ['viewRoot', 'webRoot', 'mockApiRoot', 'mockViewRoot', 'jarRoot', 'engine', 'viewExtension'];
      for (let i = 0, len = specIds.length; i < len; i++) {
        let specId = specIds[i];
        let importConstruction = yield this._sdDAO.buildTreeForSpec(specId);
        let docs = importConstruction.roots;

        let spec = yield this._sDAO.find(specId);

        spec.attributes = {specId: spec.id};
        attributes.forEach(att => {
          spec.attributes[att] = spec[att];
        });
        let klassmaps = yield this._skService.findWithSpecId(specId);
        if (spec) {
          specs.push({
            docs,
            spec,
            varmaps: varmaps.filter((varmap) => {
              return (varmap.parentId === specId && varmap.parentType === dbMap.SPC_MAP_SPEC)
                || (varmap.parentId === id && varmap.parentType === dbMap.SPC_MAP_PROJECT && varmap.type === spectype)
                || (varmap.parentId === progroupId && varmap.parentType === dbMap.SPC_MAP_PROGROUP && varmap.type === spectype);
            }),
            jarConfig: klassmaps
          });
        }
      }
      ret.specs = specs;
    }
    return ret;
  }

  * updateTestcase({
    key,
    testcases = []
  }) {
    let ret = yield this._dao.search({conds: {toolKey: key}});
    if (!ret.length) {
      throw new Forbidden('没有权限');
    }
    let project = ret[0];

    let testcaseIds = testcases.map(item => item.id);
    if (!testcaseIds.length) {
      throw new Forbidden('没有权限');
    }
    let testcaseObjs = yield this._tcDAO.findBatch(testcaseIds);

    let interfaceIds = [];
    testcaseObjs.forEach(item => {
      if (interfaceIds.indexOf(item.interfaceId) == -1) {
        interfaceIds.push(item.interfaceId);
      }
    });
    if (!interfaceIds.length) {
      throw new Forbidden('没有权限');
    }
    let interfaces = yield this._iDAO.findBatch(interfaceIds);
    let projectIds = [];
    interfaces.forEach(item => {
      if (projectIds.indexOf(item.projectId) == -1) {
        projectIds.push(item.projectId);
      }
    });
    if (projectIds.length != 1 || projectIds[0] != project.id) {
      throw new Forbidden('没有权限');
    }

    yield this._tcDAO.updateBatchModels(testcases);

    return {};
  }

  * search({
    offset = 0,
    limit = 20,
    v = '',
  }) {
    let ret = yield super.search({offset, limit, v});

    //补充项目组名称信息
    let progroupIds = [];
    (ret.list || []).forEach(project => {
      if (!progroupIds.includes(project.progroupId)) {
        progroupIds.push(project.progroupId);
      }
    });

    let progroups = yield this._pgDAO.findBatch(progroupIds);
    let progroupNameMap = {};
    progroups.forEach(progroup => {
      progroupNameMap[progroup.id] = progroup.name;
    });
    (ret.list || []).forEach(project => {
      project.progroupName = progroupNameMap[project.progroupId] || '';
    });

    return ret;
  }
}

module.exports = ProjectService;
