/**
 * Progroup Verfication Service Class
 */

const log = require('../util/log');
const _ = require('../util/utility');
const dbMap = require('../../common').db;
const notificatioin = require('./helper/notification');
const history = require('./helper/history');
const IllegalRequest = require('../error/fe/IllegalRequestError');

class ProGroupVerService extends require('./NService') {
  constructor(uid, context) {
    super(context);
    this._uid = uid;
    this._dao = new (require('../dao/ProGroupVerDao'))({context});
    this._pgDAO = new (require('../dao/ProGroupDao'))({context});
    this._pgvoDAO = new (require('../dao/ProGroupVerOPDao'))({context});
    this._pguDAO = new (require('../dao/ProGroupUserDao'))({context});
    this._pgService = new (require('./ProGroupService'))(uid, context);
  }

  _toApplyingRecord({
    verification,
    verificationOp,
    progroup,
    admins
  }) {
    verification = _._unwrap(verification);
    verificationOp = _._unwrap(verificationOp || {});
    return Object.assign(
      _.rename(verification, {
        message: 'applyMessage'
      }), {
        applyingProGroup: Object.assign(
          progroup, {
            admins
          })
      }, !_.isEmptyObj(verificationOp) ? verificationOp : {verifyResult: dbMap.PRG_ROP_NONE});
  }

  /**
   * format data into applying record list
   * @param  {Array db/model/ProgroupVerification} applyings - verification application list
   * @return {Array db/model/ProgroupVerification}
   */
  * _formatList(applyings) {
    let pgids = [],
      aids = [];

    (applyings || []).forEach((it) => {
      pgids.push(it.progroupId);
      aids.push(it.id);
    });

    let [progUsers, progroups, verifyOps] = yield [
      this._pguDAO.findDetailUser(pgids),
      this._pgDAO.findBatch(pgids, {joins: this._pgDAO._getUserJoins()}),
      this._pgvoDAO.findOperations(aids)
    ];
    const result = [];
    // rename attribute
    applyings.forEach((applying, index, arr) => {
      let pgid = applying.progroupId;
      let progroup = _.filterArr(progroups, (it) => {
        return it.id === pgid;
      }, true);
      let admins = (progUsers[pgid] && progUsers[pgid].admins) || [];
      // 申请加入的项目组有可能已经被删除了
      if (!progroup) {
        return false;
      }
      admins = admins.concat([progroup.ext.creator]);
      arr[index] = this._toApplyingRecord({
        verification: applying,
        verificationOp: _.filterArr(verifyOps, (vpOp) => {
          return vpOp.verificationId === applying.id;
        }, true),
        admins,
        progroup
      });
      delete arr[index]['verificationId'];
      result.push(arr[index]);
      return true;
    });
    return result;
  }

  /**
   * Create a progroup verificatioin record
   * @param {Object} data - json/model
   * @param {Number} data.pgId - progroup id
   * @param {String} data.message - applying message
   * @return {model/db/Progroup} progroup object to be inserted
   */
  * create({
    pgId: progroupId,
    message
  }) {
    let progroup = yield this._pgDAO.find(progroupId);
    if (!progroup) {
      // 不存在对应项目组
      throw new IllegalRequest('不存在对应项目组id', {progroupId});
    }
    let userId = this._uid;

    yield this._beginTransaction();
    let ret = yield super.create({
      progroupId,
      message,
      userId
    });
    let id = ret.id;
    if (progroup.verification === dbMap.PRG_VRF_PASS) {
      let role = progroup.verificationRole;
      yield this._pgvoDAO.create({
        role,
        verificationId: id,
        result: dbMap.PRG_ROP_SYSTEM,
        message: this._pguDAO._semanticRoleMap[role],
        userId: dbMap.USR_ADMIN_ID
      });
      yield this._pguDAO.removeUser(progroupId, userId);
      yield this._pguDAO.create({progroupId, userId, role});
    } else {
      yield this._pgvoDAO.create({
        role: dbMap.PRG_ROL_GUEST,
        verificationId: id,
        result: dbMap.PRG_ROP_NONE,
        message: ''
      });
    }
    yield this._endTransaction();
    ret = yield this._dao.find(id);
    return ret;
  }

  /**
   * get my progroup application list
   *
   * @param  {Number} uid - user id
   * @return {Array db/model/ProgroupVerification}
   */
  * getListForUser(uid) {
    log.debug(
      '[%s.getListForUser] get application list by user id %d',
      this.constructor.name, uid
    );
    let applyings = (yield super.getListForUser(uid)) || [];
    applyings = yield this._formatList(applyings);
    return applyings;
  }

  /**
   * get applications by progroup id
   *
   * @param  {Number|Array} pgid - progroup id
   * @return {Array db/model/ProgroupVerification}
   */
  * getListByProGroup(pgid) {
    log.debug(
      '[%s.getListByProGroup] get application list by progroup id %d',
      this.constructor.name, pgid
    );
    let applyings = yield this._dao.search({
      conds: {
        'progroupId': pgid
      },
      joins: this._dao._getUserJoins(true)
    });
    applyings = yield this._formatList(applyings);
    return applyings;
  }

  /**
   * get applications list that need to be approved by the user
   *
   * @param  {Number} uid - user id
   * @return {Array db/model/ProgroupVerification}
   */
  * getApprovalListByUserId(uid) {
    log.debug(
      '[%s.getApprovalListByUserId] get applications list that need to be approved by the user %d',
      this.constructor.name, uid
    );
    let progroups = yield this._pguDAO.search({
      conds: {
        'userId': uid,
        'role': [dbMap.PRG_ROL_ADMIN, dbMap.PRG_ROL_OWNER]
      }
    });
    let pgids = (progroups || []).map(it => it.progroupId);

    let ret = yield this.getListByProGroup(pgids);
    return ret.filter((applying) => {
      applying.applyingProGroup = {
        name: applying.applyingProGroup.name
      };
      applying.applicant = {
        realname: applying.applicant.realname,
        email: applying.applicant.email,
      };
      return !applying.verifyResult ||
        applying.verifyResult === dbMap.PRG_VRF_AUTH;
    });
  }

  /**
   * approve progroup verification
   *
   * @param {Number} uid - verifier id
   * @param {Object} data - config data
   * @param {Boolean} data.v - flag to approve or reject
   * @param {Number} data.id - verification id
   * @param {Number} data.role - progroup role if approved
   * @return {Array db/model/ProgroupVerification}
   */
  * approve(uid, {v = false, id, role, message = ''}) {
    let verifyResult = !!v ? dbMap.PRG_ROP_PASS : dbMap.PRG_ROP_REFUSE;
    let applying = yield this._dao.find(id);
    let progroupId = applying.progroupId;
    if (verifyResult === dbMap.PRG_ROP_PASS) {
      message = this._pguDAO._semanticRoleMap[role];
    }

    //check permission
    let progroupService = new (require('./ProGroupService'))(uid, this._context);
    yield progroupService._checkApproveVerificationPermission(progroupId);

    yield this._beginTransaction();
    yield this._pgvoDAO.create({
      role: role,
      userId: uid,
      verificationId: id,
      result: verifyResult,
      message
    });

    if (verifyResult === dbMap.PRG_ROP_PASS) {
      //remove old relationship
      yield this._pguDAO.removeBatch({progroupId, userId: applying.userId});
      //add new relationship
      yield this._pguDAO.create({progroupId, userId: applying.userId, role});
    }

    yield this._endTransaction();
    //发送通知 & 操作日志
    this._async(history.log, {
      dName: this._pgvoDAO.constructor.name,
      uid: this._uid,
      ret: {
        role,
        userId: applying.userId,
        v,
        progroupId
      }
    });

    let tmpOpts = {
      realUid: applying.userId,
      type: this._pgService.constructor.name,
      ids: [progroupId],
      uid: this._uid
    };
    if (v) {
      // 通过
      this._async(notificatioin.notify, Object.assign({}, tmpOpts, {oprType: 'enter'}));
      this._async(notificatioin.notify, Object.assign({}, tmpOpts, {oprType: 'pass'}));
    } else {
      // 拒绝
      this._async(notificatioin.notify, Object.assign({}, tmpOpts, {oprType: 'reject'}));
    }

    return yield this._formatList(
      yield this._dao.findBatch([id])
    );
  }

  /**
   * batch approve progroup verification
   *
   * @param {Number} uid
   * @param {Object} data - config data
   * @param {Boolean} data.v - flag to approve or reject
   * @param {Number} data.ids - verification ids
   * @param {Number} data.role - progroup role if approved
   * @return {Array db/model/ProgroupVerification}
   */
  * approveBatch(uid, {v = false, ids, role, message = ''}) {
    let verifyResult = !!v ? dbMap.PRG_ROP_PASS : dbMap.PRG_ROP_REFUSE;

    if (!Array.isArray(ids)) {
      ids = [ids];
    }

    let applyings = yield this._dao.findBatch(ids);
    let progroupIds = Array.from(
      new Set(applyings.map(applying => applying.progroupId))
    );

    if (verifyResult === dbMap.PRG_ROP_PASS) {
      message = this._pguDAO._semanticRoleMap[role];
    }

    //check permission
    let progroupService = new (require('./ProGroupService'))(uid, this._context);
    for (let i = 0, j = progroupIds.length; i < j; i++) {
      yield progroupService._checkApproveVerificationPermission(progroupIds[i]);
    }

    yield this._beginTransaction();
    yield this._pgvoDAO.createBatch(
      ids.map(id => ({
        role: role,
        userId: uid,
        verificationId: id,
        result: verifyResult,
        message
      }))
    );

    if (verifyResult === dbMap.PRG_ROP_PASS) {
      //remove old relationship

      for (let i = 0, j = applyings.length; i < j; i++) {
        yield this._pguDAO.removeBatch({
          progroupId: applyings[i].progroupId,
          userId: applyings[i].userId
        });
      }

      //add new relationship
      yield this._pguDAO.createBatch(
        applyings.map(applying => ({
          progroupId: applying.progroupId,
          userId: applying.userId,
          role
        }))
      );
    }

    yield this._endTransaction();

    //发送通知 & 操作日志
    applyings.forEach(applying => {
      let progroupId = applying.progroupId;
      let userId = applying.userId;

      this._async(history.log, {
        dName: this._pgvoDAO.constructor.name,
        uid: this._uid,
        ret: {
          role,
          userId,
          v,
          progroupId
        }
      });

      let tmpOpts = {
        realUid: userId,
        type: this._pgService.constructor.name,
        ids: [progroupId],
        uid: this._uid
      };

      if (v) {
        // 通过
        this._async(notificatioin.notify, Object.assign({}, tmpOpts, {oprType: 'enter'}));
        this._async(notificatioin.notify, Object.assign({}, tmpOpts, {oprType: 'pass'}));
      } else {
        // 拒绝
        this._async(notificatioin.notify, Object.assign({}, tmpOpts, {oprType: 'reject'}));
      }
    });

    return yield this._formatList(
      yield this._dao.findBatch(ids)
    );
  }
}

module.exports = ProGroupVerService;
