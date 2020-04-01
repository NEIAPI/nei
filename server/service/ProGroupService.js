/**
 * ProGroup Service Class
 */

const log = require('../util/log');
const _ = require('../util/utility');
const dbMap = require('../../common').db;
const Forbidden = require('../error/fe/ForbiddenError');
const ResourceService = require('./ResourceService');

class ProgroupService extends ResourceService {
  constructor(uid, context) {
    super(uid, context);
    this._dao = new (require('../dao/ProGroupDao'))({context});
    this._uDAO = new (require('../dao/UserDao'))({context});
    this._puDAO = new (require('../dao/ProGroupUserDao'))({context});
    this._pDAO = new (require('../dao/ProjectDao'))({context});
    this._bgDAO = new (require('../dao/BisGroupDao'))({context});
    this._puDAO = new (require('../dao/ProGroupUserDao'))({context});
    this._projectService = new (require('./ProjectService'))(uid, context);
  }

  _getGlobalSearchConds() {
    return {
      creator_id: {
        op: '!=',
        value: dbMap.USR_ADMIN_ID
      },
      type: dbMap.PRG_TYP_NORMAL
    };
  }

  /**
   * Create a progroup record
   * @param {Object} - json/model
   * @return {model/db/Progroup} progroup object to be inserted
   */
  * create(model) {
    model.toolKey = _.md5(_.randString(32, false, true));
    model.type = dbMap.PRG_TYP_NORMAL;
    let uid = this._uid;

    yield this._beginTransaction();
    let progroup = yield super.create(model);
    let publicProject = yield this._pDAO.create({
      type: dbMap.PRO_TYP_COMMON,
      name: '公共资源库',
      creatorId: uid,
      progroupId: progroup.id,
      toolKey: _.md5(_.randString(32, false, true))
    });

    let pubId = publicProject.id;
    yield this._bgDAO.create({
      type: dbMap.BIS_TYP_SYSTEM,
      name: '默认分组',
      creatorId: uid,
      respoId: uid,
      projectId: pubId,
      progroupId: progroup.id
    });
    yield this._pDAO.update({
      id: pubId,
      toolKey: _.getToolKey(pubId, _.toolKeyType.PROJECT)
    });
    yield this._dao.update({
      id: progroup.id,
      toolKey: _.getToolKey(progroup.id, _.toolKeyType.PROGROUP)
    });
    yield this._endTransaction();

    progroup = yield this.getProgroupDetailById(progroup.id);

    return progroup;
  }

  /**
   * remove progroup
   * @param {Array} id - progroup id
   * @return {model/db/Progroup} progroup
   */
  * remove(id) {
    let progroup = yield this._dao.find(id);

    if (progroup.type === dbMap.PRG_TYP_DEFAULT) {
      throw new Forbidden('不能删除默认分组', {rid: id, uid: this._uid});
    }
    return yield super.remove(id);
  }

  /**
   * stick project
   * @param  {Object} obj - stick data
   * @param  {Number} obj.projectId - id of the project to be operated
   * @param  {Boolean} obj.isTop - stick or unstick
   * @return {Array} progject order list
   */
  * stickProject({projectId, isTop}) {
    log.debug(
      '[%s.stickProject] stick project',
      this.constructor.name
    );

    // the user should have access to the progroup
    let ret = yield this._projectService._checkBatchPermission([projectId]);
    let progroupId = ret.progroupId;
    yield this._checkUpdatePermission(progroupId);
    let progroup = yield this._dao.find(progroupId);

    let projectTopList = (progroup.projectTopList || '').replace(/\s/g, '') || '';
    if (!!isTop) {
      projectTopList = _.strPad(projectTopList, projectId, 'add');
    } else {
      projectTopList = _.strPad(projectTopList, projectId); //remove from top list
    }

    yield this._dao.update({
      id: progroupId,
      projectTopList: projectTopList
    });

    let progroups = yield this._dao.getListForUser(this._uid, {id: progroupId});

    if (!progroups.length) {
      throw new Forbidden('找不到资源', {progroupId});
    }

    let projects = progroups[0].projects;

    return projects.map((project) => {
      let projectId = project.id;
      return {
        id: projectId,
        isTop: new RegExp(`.*${projectId}.*`).test(projectTopList)
      };
    });
  }

  /**
   * sort projects
   * @param {Object} obj
   * @param {Array Number} obj.ids - project ids
   * @param {Number} obj.type - project sort type
   * @return {Array} project order list
   */
  * sortProject({ids, type: projectOrder}) {
    log.debug('[ProGroupService.sortProject] - sort projects :%s', {ids, projectOrder});

    let ret = yield this._projectService._checkBatchPermission(ids);
    let progroupId = ret.progroupId;
    yield this._checkUpdatePermission(progroupId);

    let data = {
      id: progroupId,
      projectOrder,
      projectOrderList: ids.join(',')
    };

    let projects = yield this._pDAO.searchWithConds({id: ids});

    if (!_.isArraySameValues(projects.map(item => item.id), ids)) {
      throw new Forbidden('参数和项目内容不匹配', {id: ids}
      );
    }
    yield this._dao.update(data);

    return ids.map(item => {
      return {id: item};
    });
  }

  /**
   * get progroups for user
   * @return {Array model/db/Progroup} progroup model list
   */
  * getProgroupsForUser(conds) {
    log.debug('[ProGroupService.getProgroupsForUser] - get user\'s progroups :%s', this._uid);

    let progroups = yield this._dao.getListForUser(this._uid, conds);

    let ret = [];
    let progroupId = [];
    let progroupsMap = {};
    progroups.forEach((item) => {
      progroupsMap[item.id] = item;
      progroupId.push(item.id);
    });

    let progroupUserMap = yield this._puDAO.findDetailUser(progroupId);

    progroupId.forEach((id) => {
      ret.push(Object.assign(progroupsMap[id], progroupUserMap[id]));
    });
    return ret;
  }

  /**
   * get progroups for user
   * @param {Boolean} _notThrowError，是否不要招聘异常，内部使用
   * @return {Array model/db/Progroup} progroup model list
   */
  * getProgroupDetailById(id, _notThrowError = false) {
    log.debug('[ProGroupService.getProgroupDetailById] - get progroup by id :%s', id);

    let progroups = yield this._dao.getListForUser(this._uid, {id});
    let progroup;
    if (progroups.length) {
      progroup = progroups[0];
      let progroupUserMap = yield this._puDAO.findDetailUser(id);
      progroup = Object.assign(progroup, progroupUserMap[id]);
    } else {
      if (_notThrowError) {
        return null;
      } else {
        throw new Forbidden('找不到资源', {id});
      }
    }

    return progroup;
  }

  /**
   *
   * @param projectId
   */
  * getProgroupDetailByProjectId(projectId) {
    log.debug('[ProGroupService.getProgroupDetailByProjectId] - get progroup by project id :%s', projectId);

    let progroup = yield this._dao.search({
      joins: [{
        table: 'project',
        fkmap: {progroupId: 'id'},
        conds: {id: projectId}
      }],
      sfields: this._dao.PROGROUP_EXPORT_FIELD,
    });
    if (progroup.length == 0) {
      throw new Forbidden('找不到资源', {projectId});
    }

    return progroup[0];
  }


  /**
   * hook for remove
   * @param {Array<Number>} ids;
   * @override
   * @private
   */
  * _afterRemove(ids) {
    // 在删除progroup之后需要把所有相关的申请给删除

  }
}

module.exports = ProgroupService;
