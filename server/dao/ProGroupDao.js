const log = require('../util/log');
const dt = require('./config/const.json');
const utility = require('../util/utility');
const db = require('../../common').db;

const DEFAULT_HTTP_SPEC = {
  path: '',
  pathDescription: '',
  param: '',
  paramDescription: '',
  paramdesc: '',
  paramdescDescription: '',
  methodDescription: '',
  method: '',
  tag: '',
  tagDescription: '',
  resSchema: '',
  resSchemaDescription: '',
  interfaceSchema: '',
  interfaceSchemaDescription: ''
};

class ProGroupDao extends require('./ResourceDao') {
  constructor(sqlOpt) {
    super({
      owner: 'creatorId',
      defOwner: db.USR_ADMIN_ID,
      type: db.RES_TYP_PROGROUP
    }, sqlOpt);
    this._Model = require('../model/db/Progroup');
    this._pguDAO = new (require('./ProGroupUserDao'))(sqlOpt);
    this._pgApiSpecDAO = new (require('./ProGroupApiSpecDao'))(sqlOpt);
    this._projectDao = new (require('./ProjectDao'))(sqlOpt);
    this._uModel = require('../model/db/User');
  }

  /**
   * get resource type filter
   *
   * @protected
   * @return {Object} type filter conditions
   */
  _getResTypeFilter() {
    return {
      type: {
        op: '!=',
        value: db.PRG_TYP_HIDDEN
      }
    };
  };

  /**
   * get user default project group id
   * @param  {Number} uid - user id
   * @return {Number} default project group id
   */
  * getDefaultId(uid) {
    log.debug(
      '[%s.getDefaultId] get default project group id for user %s',
      this.constructor.name, uid
    );
    return yield this._doWithCache(
      dt.RDS_PROGROUP_DEFAULT + uid, function*() {
        let ret = yield this.search({
          conds: {
            creator_id: uid,
            type: db.PRG_TYP_DEFAULT
          }
        });
        return (ret[0] || {}).id || 0;
      }
    );
  }

  /**
   * get progroup list for user
   *
   * @param  {Number} uid - user id
   * @param  {Object} [conds] - search condtions
   * @return {Array} resource list
   */
  * getListForUser(uid, conds = {}) {
    let progroups = yield super.getListForUser(uid, {conds});
    let pgids = (progroups || []).map(pg => pg.id);
    //  查询项目组中的项目列表
    let projects = yield this._projectDao.search({
      conds: {
        progroupId: pgids
      },
      joins: this._getUserJoins()
    });
    progroups.forEach((pg) => {
      pg.projects = projects.filter((pro) => pro.progroupId === pg.id);
    });
    // 查询项目组的接口规范设置
    const apiSpecs = yield this._pgApiSpecDAO.search({
      conds: {
        progroupId: pgids
      }
    });
    progroups.forEach((pg) => {
      const pgId = pg.id;
      // 先只实现 http 接口的规范
      const foundHttpSpec = apiSpecs.find(apiSpec => {
        return apiSpec.progroupId === pgId && apiSpec.type === db.INTERFACE_TYP_HTTP;
      });
      pg.httpSpec = foundHttpSpec || Object.assign(DEFAULT_HTTP_SPEC);
    });

    let user = yield (new (require('./UserDao'))(this._sqlOpt)).find(uid);
    // sort progrups
    let {progroupOrderList = '', progroupTopList = ''} = user;
    progroups = utility.sortWithOrderList(progroups, [progroupTopList, progroupOrderList]);

    // sort projects inside each progroup
    progroups.forEach(pg => {
      let {projectOrderList = '', projectTopList = ''} = pg;
      pg.projects = utility.sortWithOrderList(pg.projects, [projectTopList, projectOrderList]);
    });
    return progroups;
  }

  /**
   * create model batch
   *
   * @param  {Array} models - model list
   * @return {Array} model created in database
   */
  * createBatch(models) {
    yield this._beginTransaction();
    let list = yield super.createBatch(models);
    let pguserList = list.map((it) => {
      return {
        role: db.PRG_ROL_OWNER,
        userId: it.creatorId,
        progroupId: it.id
      };
    });
    yield this._pguDAO.createBatch(pguserList);
    yield this._endTransaction();
    return list;
  }

  /**
   * get progroup list that uses the spec
   * @param  {Number} sid - spec id
   * @return {Array} progroup list
   */
  * getListBySpecId(sid) {
    let ret = yield this.search({
      conds: this.TOOLSPEC.map(it => {
        return {
          [it]: sid
        };
      }),
      sfields: this.PROGROUP_EXPORT_FIELD
    });
    return ret;
  }
}

ProGroupDao['__history'] = {
  addText: '新建项目组 %s',
  delText: '删除项目组 %s',
  resType: db.RES_TYP_PROGROUP,
  updateText: {
    name: {
      text: '更新项目组 %s 名称为 %s'
    },
    description: {
      text: '更新项目组 %s 描述为 %s',
    },
    verification: {
      text: '更新项目组 %s 验证方式为 %s',
    },
    isLock: {
      text: '修改项目组 %s 锁定状态为 %s'
    },
    toolSpecWeb: {
      text: '修改项目组 %s WEB工程规范为 %s',
    },
    toolSpecAos: {
      text: '修改项目组 %s Android工程规范为 %s',
    },
    toolSpecIos: {
      text: '修改项目组 %s iOS工程规范为 %s',
    },
    toolSpecTest: {
      text: '修改项目组 %s 测试工程规范为 %s',
    },
    apiUpdateControl: {
      text: '更新项目组 %s 更新接口 %s 接口关注者确认'
    },
    apiAudit: {
      text: '更新项目组 %s 新建接口 %s 审核'
    },
    showPublicList: {
      text: '更新项目组 %s 在普通项目的资源列表中 %s 公共资源列表'
    },
    useWordStock: {
      text: '更新项目组 %s %s 参数字典校验'
    }
  }
};

module.exports = ProGroupDao;
