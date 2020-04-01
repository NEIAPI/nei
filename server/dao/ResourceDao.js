const log = require('../util/log');
const _ = require('../util/utility');
const db = require('../../common').db;

const NDao = require('./NDao');

class ResourceDao extends NDao {
  constructor(feature = {}, sqlOpt) {
    super(sqlOpt);
    this._type = feature.type;
    this._owner = feature.owner || 'projectId';
  }

  /**
   * get unique id for progroup or project
   *
   * @private
   * @param  {Array}  ids - resource id list
   * @param  {String} key - field key
   * @return {Array} unique id list
   */
  * _getUniqueID(ids, key) {
    let rec = yield this.search({
      conds: {id: ids},
      field: {[key]: 'DISTINCT'}
    });
    return (rec || []).map(it => it[key]);
  }

  /**
   * get all project groups for resources
   *
   * @param  {Array} ids - resource id list
   * @return {Array} project group id list
   */
  * getProGroups(ids) {
    log.debug(
      '[%s.getProGroups] get project group ids for %s model with ids %j',
      this.constructor.name, this._Model.name, ids
    );
    let field = 'progroupId';
    // for progroup. progroup is also a resource
    if (!this._Model.getField('progroupId')) {
      field = 'id';
    }
    // search from database
    let ret = yield this._getUniqueID(
      ids, field
    );
    return ret;
  }

  /**
   * get all project for resources
   *
   * @param  {Array} ids - resource id list
   * @return {Array} project group id list
   */
  * getProjects(ids) {
    log.debug(
      '[%s.getProjects] get project ids for %s model with ids %j',
      this.constructor.name, this._Model.name, ids
    );
    // search from database
    let ret = yield this._getUniqueID(
      ids, 'projectId'
    );
    return ret;
  }

  /**
   * get role between user and resource, return -1 if no permission
   *
   * @param  {Number} id  - resource id
   * @param  {Number} uid - user id
   * @return {Object} role info between user and resource, e.g. {role:-1,progroupId:0}
   */
  * getRoleOfUser(id, uid) {
    log.debug(
      '[%s.getRoleOfUser] get role between user %s and %s %s',
      this.constructor.name, uid, this._Model.name, id
    );
    let rec;
    if (uid === db.USR_ADMIN_ID) {
      rec = yield this.find(id);
      return {
        role: db.PRG_ROL_OWNER,
        progroupId: rec.progroupId
      };
    }

    rec = yield this.search({
      conds: {id: id},
      joins: this._getProGroupJoins(uid)
    });

    // check role result
    if (rec.length > 0) {
      let user = rec[0].ext.pguser;
      return {
        role: user.role,
        progroupId: user.progroupId
      };
    }

    return {role: -1, progroupId: 0};
  }

  /**
   * get resource list for user
   *
   * @param  {Number} uid - user id
   * @param  {Number} options - search options
   * @return {Array} resource list
   */
  * getListForUser(uid, {conds = {}, joins = []}) {
    log.debug(
      '[%s.getListForUser] get %s list for user %s',
      this.constructor.name, this._Model.name, uid
    );
    return yield this.search({
      conds,
      joins: [
        ...joins,
        ...(this._getUserProGroupJoins(uid))
      ]
    });
  }

  /**
   * get resource list in project group
   *
   * @param  {Number} pgid - project group id
   * @return {Array} resource list
   */
  * getListInProGroup(pgid) {
    log.debug(
      '[%s.getListInProGroup] get %s list in project group %s',
      this.constructor.name, this._Model.name, pgid
    );
    return yield this.search({
      conds: Object.assign({
        progroup_id: pgid
      }, this._getResTypeFilter()),
      joins: this._getUserJoins()
    });
  }

  /**
   * get resource type filter
   *
   * @protected
   * @return {Object} type filter conditions
   */
  _getResTypeFilter() {
    // TODO
  };

  /**
   * get search selected fields
   *
   * @protected
   * @return {Array String} search selected fields array
   */
  _getSearchFields() {
    return ['id', 'name', 'name_pinyin', 'description'];
  }

  /**
   * get resource list in project
   *
   * @param  {Number} pid - project id
   * @return {Array} resource list
   */
  * getListInProject(pid) {
    return yield this.getListInProjects([pid]);
  }

  /**
   * get resouce list in multi-project
   *
   * @param  {Array} pids - project ids
   * @return {Array} resource list
   */
  * getListInProjects(pids) {
    const rdsKey = this._RDS[this._type];
    let ret = [];
    if (rdsKey != null) {
      for (let pid of pids) {
        let rec = yield this._doWithCache(
          rdsKey + pid,
          this.__$getListInProjects,
          pid
        );
        ret.push(...rec);
      }
    } else {
      ret = yield this.__$getListInProjects(pids);
    }
    return ret;
  }

  /**
   * get resouce list in multi-project
   *
   * private
   * @param  {Array} pids - project ids
   * @return {Array} resource list
   */
  * __$getListInProjects(pids) {
    return yield this.search({
      conds: Object.assign({
        project_id: pids
      }, this._getResTypeFilter()),
      joins: [...(this._getUserJoins()), ...(this._getStatusJoins())]
    });
  }

  /**
   * get resource reference list by bisgroup
   *
   * @param  {Array} ids - bisgroup id list
   * @return {Array} resource model list
   */
  * getListByBisGroup(ids) {
    log.debug(
      '[%s.getRefByBisGroup] get reference by business group %j',
      this.constructor.name, ids
    );
    let field = this._Model.getField('groupId');
    if (!field) {
      log.warn(
        '[%s.getRefByBisGroup] not allowed to get %s reference by business group',
        this.constructor.name, this._Model.name
      );
      return;
    }
    return yield this.search({
      conds: {
        group_id: ids
      },
      joins: this._getUserJoins()
    });
  }

  /**
   * check resource conflict in projects
   *
   * @param  {Array}   ids - project id list
   * @param  {Object}  fields - match fields, e.g. {feild1: ['value']}
   * @return {Boolean} has conflict for resource
   */
  * hasConflictInProject(ids, fields) {
    log.debug(
      '[%s.hasConflictInProject] check %s conflict in projects %j',
      this.constructor.name, this._Model.name, ids, fields
    );
    let unCheckIds = fields.unCheckIds || [];
    unCheckIds = _.toArray(unCheckIds);
    delete fields.unCheckIds;
    let ret = yield this.search({
      conds: Object.assign(fields, {
        project_id: ids
      })
    });

    return ret.some((it) => {
      return Object.keys(fields).some((key) => {
        fields[key] = _.toArray(fields[key]);
        return fields[key].includes(it[key]) && !unCheckIds.includes(it.id);
      });
    });
  }

  /**
   * search resources with conditions and res type filter
   *
   * @param  {Object} conds - search conds
   * @return
   */
  * searchWithConds(conds, jconds = {}) {
    log.debug(
      '[%s.searchWithConds] - search resource',
      this.constructor.name
    );

    let joins = [];

    let userJoins = this._getUserJoins();
    if (Object.keys(jconds).length) {
      userJoins.forEach(pJoin => {
        if (pJoin.table !== 'user') {
          return;
        }
        Object.assign(pJoin || {}, {
          conds: jconds
        });
      });
    }

    let statusJoins = this._getStatusJoins();
    let projectJoins = this._getProjectJoins();

    joins = [...userJoins, ...statusJoins, ...projectJoins];

    let opt = {
      conds: Object.assign({}, this._getResTypeFilter() || {}, conds || {}),
      joins,
      order: {
        field: 'id', // 新的在前，旧的在后
        desc: true
      }
    };
    let searchFields = this._getSearchFields();
    if (Array.isArray(searchFields) && searchFields.length) {
      opt.sfields = searchFields;
    }
    return yield this.search(opt);
  }

  /**
   * get search project ids for resource.
   * @param  {Number} pid - project id
   * @return {Array Number}
   */
  * _getSearchPids(pid) {
    let pDAO = new (require('./ProjectDao'))(this._sqlOpt);
    let pubProject = yield pDAO.getSharedByProject(pid);
    if (pubProject.id === pid) {
      return [pid];
    }
    return [pid, pubProject.id];
  }
}

ResourceDao['__history'] = {
  cloneText: '复制 %s 项目组 %s 项目 %s %s 到 %s 项目组 %s 项目 %s 业务分组 %s %s',
  moveText: '移动 %s 项目组 %s 项目 %s %s 到 %s 项目组 %s 项目 %s 业务分组 %s %s',
};
module.exports = ResourceDao;
