/**
 * ProGroupUser Service Class
 */
const log = require('../util/log');
const _ = require('../util/utility');
const dbMap = require('../../common').db;
const notificatioin = require('./helper/notification');
const history = require('./helper/history');
const IllegalRequest = require('../error/fe/IllegalRequestError');
const Forbidden = require('../error/fe/ForbiddenError');

const NService = require('./NService');

class ProGroupUserService extends NService {
  constructor(uid, context) {
    super(context);
    this._uid = uid;
    this._pgDao = new (require('../dao/ProGroupDao'))({context});
    this._pDao = new (require('../dao/ProjectDao'))({context});
    this._uDao = new (require('../dao/UserDao'))({context});
    this._dao = new (require('../dao/ProGroupUserDao'))({context});
    this._pgService = new (require('../service/ProGroupService'))(uid, context);
  }

  /**
   * set users for progroup.
   * @param {Object} model - set user data
   * @param {Number} model.id - progroup id
   * @param {Array Number} model.admins - admin user ids
   * @param {Array Number} model.developers - developer user ids
   * @param {Array Number} model.observers - observer user ids
   * @param {Array Number} model.testers - tester user ids
   * @param {Array Number} model.auditors - auditor user ids
   * @return {Array} progroup data
   */
  * setUserForProg({
    id: progroupId,
    users: userDatas = []
  }) {
    log.debug('[ProGroupUserService.setUserForProg] - set progroup users :%s', progroupId);

    yield this._pgService._checkUpdatePermission(progroupId);

    let delUserIds = [];
    let newProgroupUsers = [];
    let updateUsers = [];
    let userIds = [];

    // 获取项目组创建者
    let progroup = yield this._pgDao.find(progroupId);
    let creatorId = progroup.creatorId;

    let progroupUserMap = yield this._dao.findDetailUser(progroupId);
    let progroupUsers = progroupUserMap[progroupId];
    let progroupUserIds = [];
    Object.keys(progroupUsers).forEach(key => {
      progroupUsers[key].forEach(user => {
        progroupUserIds.push(user.id);
      });
    });

    let userRoleMap = {
      [dbMap.PRG_ROL_ADMIN]: '管理员',
      [dbMap.PRG_ROL_DEVELOPER]: '开发工程师',
      [dbMap.PRG_ROL_TESTER]: '测试工程师',
      [dbMap.PRG_ROL_GUEST]: '观察者',
      [dbMap.PRG_ROL_AUDITOR]: '接口审核者',
    };

    userDatas.forEach(item => {
      if (!userRoleMap[item.role]) {
        throw new IllegalRequest('您选择的角色存在异常', {id: progroupId});
      }

      if (item.id == creatorId) {
        throw new IllegalRequest('不能选则项目组创建者', {id: progroupId});
      }

      if (item.action == 'add') {
        if (progroupUserIds.indexOf(item.id) >= 0) {
          throw new IllegalRequest('不能重复添加项目组成员', {id: progroupId});
        }
        userIds.push(item.id);
        newProgroupUsers.push({progroupId, userId: item.id, role: item.role});
      } else if (item.action == 'update') {
        if (progroupUserIds.indexOf(item.id) < 0) {
          throw new IllegalRequest('您选择修改的项目组成员不存在', {id: progroupId});
        }
        userIds.push(item.id);
        updateUsers.push({progroupId, userId: item.id, role: item.role});
      } else if (item.action == 'delete') {
        if (progroupUserIds.indexOf(item.id) < 0) {
          throw new IllegalRequest('您选择删除的项目组成员不存在', {id: progroupId});
        }
        userIds.push(item.id);
        delUserIds.push(item.id);
      }
    });

    let userMap = {};
    if (userIds.length) {
      let users = yield this._uDao.findBatch(userIds);
      if (!users || users.length !== userIds.length) {
        // 存在用户id不存在的情况
        throw new IllegalRequest('您选择的用户不存在', {id: progroupId});
      }
      users.forEach(item => {
        userMap[item.id] = item;
      });
    }

    if (delUserIds.length) {
      let projects = yield this._pDao.search({conds: {progroupId, creatorId: delUserIds}});
      if (projects.length) {
        throw new IllegalRequest('不能删除项目的创建者', {id: progroupId});
      }
    }

    yield this._beginTransaction();
    // 删除成员
    if (delUserIds.length) {
      yield this._dao.removeUser(progroupId, delUserIds); //remove users
    }
    //添加成员
    if (newProgroupUsers.length) {
      yield this._dao.createBatch(newProgroupUsers); // insert new users
    }
    //修改角色
    if (updateUsers.length) {
      yield updateUsers.map((it) => {
        return this._dao.update(it, {
          progroupId: it.progroupId,
          userId: it.userId
        });
      });
    }

    yield this._endTransaction();

    let template = {type: this._pgService.constructor.name, ids: [progroupId], uid: this._uid};
    for (let item of newProgroupUsers) {
      let arg = Object.assign({}, template,
        {oprType: 'pass', realUid: item.userId});
      this._async(notificatioin.notify, arg);
      arg = Object.assign({}, template,
        {oprType: 'enter', realUid: item.userId});
      this._async(notificatioin.notify, arg);
    }
    for (let item of delUserIds) {
      let arg = Object.assign({}, template,
        {oprType: 'kick', realUid: item});
      this._async(notificatioin.notify, arg);
    }
    for (let item of updateUsers) {
      let arg = Object.assign({}, template,
        {oprType: 'change', realUid: item.userId});
      this._async(notificatioin.notify, arg);
    }

    let userObjs = [];
    userDatas.forEach(item => {
      userObjs.push({
        progroup,
        role: item.role,
        user: userMap[item.id],
        action: item.action == 'delete' ? 'del' : 'update'
      });
    });
    if (userObjs.length) {
      this._async(history.log, {
        dName: this._dao.constructor.name,
        uid: this._uid,
        ret: userObjs
      });
    }

    progroupUserMap = yield this._dao.findDetailUser(progroupId);
    progroup = Object.assign(progroup, progroupUserMap[progroupId]);
    return progroup;
  }

  /**
   * quit progroup
   * @param {Number} progroupId - progroup id
   * @return {model/db/Progroup} progroup
   */
  * quitProg(progroupId) {
    log.debug('[ProGroupUserService.quit] - quit progroup by id:%s', progroupId);

    let userId = this._uid;
    let progroup = yield this._pgDao.find(progroupId);

    let ret = yield this._pgService._checkQuitPermission(progroupId);
    if (ret.role === dbMap.PRG_ROL_OWNER) {
      throw new Forbidden('创建者不能退出', {id: progroupId});
    }

    // 12.19
    // 当创建过项目的成员要退出项目组,移交他的所有项目
    ret = yield this._pDao.search({
      conds: {
        progroupId,
        creatorId: userId
      }
    });

    yield this._beginTransaction();
    if (ret.length) {
      let pids = ret.map(it => it.id);
      yield this._pDao.updateBatch({'creatorId': progroup.creatorId}, pids);
    }

    yield this._dao.removeUser(progroupId, userId);
    let user = yield this._uDao.find(userId);
    let progroupOrderList = _.strPad((user.progroupOrderList || '').replace(/\s/g, ''));
    yield this._uDao.update({id: userId, progroupOrderList});
    let progroupUserMap = yield this._dao.findDetailUser(progroupId);
    yield this._endTransaction();

    let template = {type: this._pgService.constructor.name, ids: [progroupId], uid: this._uid};
    let arg = Object.assign({}, template,
      {oprType: 'quitOwn', realUid: userId});
    this._async(notificatioin.notify, arg);
    arg = Object.assign({}, template,
      {oprType: 'quitOthers', realUid: userId});
    this._async(notificatioin.notify, arg);

    return Object.assign(progroup, progroupUserMap[progroupId]);
  }

  /**
   * change creator for progroup
   * @param {Number} progroupId - progroup id
   * @param {Number} toId - user id to transfer the progroup to
   * @return {model/db/Progroup} progroup
   */
  * changeProgCreator(progroupId, toId) {
    log.debug('[ProGroupUserService.changecreator] - change progroup creator by id:%s', progroupId);

    yield this._pgService._checkChangeCreatorPermission(progroupId); //check permission
    yield this._uDao.checkIds([toId]); // check user

    yield this._beginTransaction();
    yield this._pgService.update({id: progroupId, creatorId: toId});
    yield this._dao.removeUser(progroupId, [this._uid, toId]);
    // change the previous owner to admin
    yield this._dao.createBatch([
      {progroupId, userId: this._uid, role: dbMap.PRG_ROL_DEVELOPER},
      {progroupId, userId: toId, role: dbMap.PRG_ROL_OWNER}
    ]);

    // 移交项目组时，更改公共资源库的创建者
    let sharedProject = yield this._pDao.search({
      conds: {
        progroupId,
        type: 1,
        creatorId: this._uid
      }
    });
    if (sharedProject.length) {
      yield this._pDao.update({id: sharedProject[0].id, creatorId: toId});
    }

    let progroup = yield this._pgDao.find(progroupId);
    let progroupUserMap = yield this._dao.findDetailUser(progroupId);
    yield this._endTransaction();

    return Object.assign(progroup, progroupUserMap[progroupId]);
  }

  /**
   * 查找指定角色的人
   * @param {Number} pgid - grogroup id
   * @param {Array<Number>} roles - array of role id
   */
  * getUsersOfRole(pgid, roles) {
    return yield this._dao.getUsersOfRole(pgid, roles);
  }
}

module.exports = ProGroupUserService;
