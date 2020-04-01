const log = require('../util/log');
const dbMap = require('../../common').db;
const IllegalRequest = require('../error/fe/IllegalRequestError');
const OBSERVERS = 'observers';
const DEVELOPERS = 'developers';
const TESTERS = 'testers';
const AUDITORS = 'auditors';
const ADMINS = 'admins';
const OWNER = 'owner';

const NDao = require('./NDao');

class ProGroupUserDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ProgroupUser');
  }

  get _roleMap() {
    return {
      [dbMap.PRG_ROL_GUEST]: OBSERVERS,
      [dbMap.PRG_ROL_DEVELOPER]: DEVELOPERS,
      [dbMap.PRG_ROL_TESTER]: TESTERS,
      [dbMap.PRG_ROL_AUDITOR]: AUDITORS,
      [dbMap.PRG_ROL_ADMIN]: ADMINS,
      [dbMap.PRG_ROL_OWNER]: OWNER
    };
  }

  get _semanticRoleMap() {
    return {
      [dbMap.PRG_ROL_GUEST]: '观察者',
      [dbMap.PRG_ROL_DEVELOPER]: '开发者',
      [dbMap.PRG_ROL_TESTER]: '测试者',
      [dbMap.PRG_ROL_AUDITOR]: '接口审核者',
      [dbMap.PRG_ROL_ADMIN]: '管理员'
    };
  }

  /**
   * find users details for progroups
   * @param {Array Number} pgids - progroups ids
   * @return {Object} e.g. {
   *    10000: {
   *        owner: [{
   *            name: 'hello'
   *            id: 10027
   *        }],
   *        admins: [{
   *        }]
   *    }
   * }
   */
  * findDetailUser(pgids) {
    log.debug(
      '[%s.findDetailUser] get all progroup\'s users',
      this.constructor.name
    );

    let ret = yield this.search({
      conds: {
        progroup_id: pgids
      },
      joins: this._getUserJoins(true)
    });

    let map = {};
    let roleMap = this._roleMap;
    ret.forEach((row) => {
      let progroupId = row.progroupId;
      map[progroupId] = map[progroupId] || {
          [OBSERVERS]: [],
          [DEVELOPERS]: [],
          [TESTERS]: [],
          [AUDITORS]: [],
          [ADMINS]: [],
          [OWNER]: []
        };
      map[progroupId][roleMap[row.role]].push(Object.assign({
          createTime: row.createTime,
          role: row.role
        },
        row.ext.user));
    });

    return map;
  }

  /**
   * 查找指定角色的人
   * @param {Number} pgid - grogroup id
   * @param {Array<Number>} roles - array of role id
   */
  * getUsersOfRole(pgid, roles) {
    log.debug(
      '[%s.getUsersOfRole] get users belong to roles',
      this.constructor.name
    );

    return yield this.search({
      conds: {
        progroupId: pgid,
        role: roles
      },
      joins: this._getUserJoins(true)
    });
  }

  /**
   * 删除项目组用户
   * @param {Number} pgid - progroup id
   * @param {Array Number} uids - user ids to be removed
   * @return {Array db/model/progroupuser}
   */
  * removeUser(pgid, uids) {
    log.debug(
      '[%s.removeUser] remove progroup\'s users',
      this.constructor.name
    );

    return yield this.removeBatch({
      'progroup_id': pgid,
      'user_id': uids
    });
  }

  * createBatch(models) {
    //检查用户来源是否合法
    if (models.length) {
      let progroupId = models[0].progroupId;
      let userIds = models.map(item => item.userId);
      let pgDAO = new (require('./ProGroupDao'))(this._sqlOpt);
      let uDAO = new (require('./UserDao'))(this._sqlOpt);
      let pro = yield pgDAO.find(progroupId);
      userIds.push(pro.creatorId);
      let users = yield uDAO.findBatch(userIds);
      let ifFromOpenID = users.map(item => {
        return item.from == dbMap.USR_FRM_OPENID ? 1 : 0;
      }).reduce((pre, next) => {
        return pre + next;
      }, 0);

      if (ifFromOpenID != 0 && ifFromOpenID != users.length) {
        throw new IllegalRequest('添加失败', {id: progroupId});
      }
    }

    return yield super.createBatch(models);
  }
}

ProGroupUserDao['__history'] = {
  delText: '将 %s 请出项目组 %s ( %s)',
  updateText: '指派 %s 为项目组 %s 的 %s',
  resType: dbMap.RES_TYP_PROGROUP,
};

module.exports = ProGroupUserDao;
