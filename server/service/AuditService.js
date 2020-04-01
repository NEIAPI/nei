/**
 * Notification Service Class
 */
const log = require('../util/log');
const Forbidden = require('../error/fe/ForbiddenError');
const dbMap = require('../../common').db;
const history = require('./helper/history');
const notificationHelper = require('./helper/notification');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const ResourceService = require('./ResourceService');

class AuditService extends ResourceService {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._dao = new (require('../dao/AuditDao'))({context});
    this._userService = new (require('./UserService'))(context);
    this._ntService = new (require('./NotificationService'))(context);
    this._interfaceService = new (require('./InterfaceService'))(uid, context);
    this._rpcService = new (require('./RpcService'))(uid, context);
    this._pguService = new (require('./ProGroupUserService'))(uid, context);
    this._ntrService = new (require('./NotificationResourceService'))(uid, context);
    this._ntuService = new (require('./NotificationUserService'))(context);
    this._projectService = new (require('./ProjectService'))(uid, context);
    this._url = {
      develop: `http://localhost:${this._context.app.config.port}`,
      test: process.appConfig.testDomain,
      online: process.appConfig.onlineDomain
    }[process.appConfig.mode];
  }

  getResName(res) {
    switch (res.type) {
      case dbMap.INTERFACE_TYP_HTTP:
        return {
          name: 'HTTP',
          url: 'interface'
        };
      case dbMap.INTERFACE_TYP_RPC:
        return {
          name: 'RPC',
          url: 'rpc'
        };
    }
  }

  getResType(res) {
    switch (res.type) {
      case dbMap.INTERFACE_TYP_HTTP:
        return dbMap.RES_TYP_INTERFACE;
      case dbMap.INTERFACE_TYP_RPC:
        return dbMap.RES_TYP_RPC;
    }
  }

  getService(interfaceType) {
    switch (interfaceType) {
      case dbMap.INTERFACE_TYP_HTTP:
        return this._interfaceService;
      case dbMap.INTERFACE_TYP_RPC:
        return this._rpcService;
    }
  }

  /**
   * @param model
   */
  * audit(model, interfaceType) {
    const interfaceId = model.id;
    const uid = model.uid;
    delete model.uid;
    let pendingRecords = yield this._dao.search({
      conds: {
        interfaceId: interfaceId,
        state: dbMap.AUDIT_TYP_PENDING
      },
    });

    if (pendingRecords.length > 1) {
      throw new IllegalRequestError('该接口存在多个未被处理的审核记录');
    } else if (pendingRecords.length === 0) {
      throw new IllegalRequestError('该接口不存在未被处理的审核记录');
    }
    model.id = pendingRecords[0].id;
    let statusId = model.state ? dbMap.STATUS_SYS_UNDERDEVELOPMENT : dbMap.STATUS_SYS_AUDIT_FAILED;
    model.state = model.state ? dbMap.AUDIT_TYP_APPROVED : dbMap.AUDIT_TYP_REJECT;
    let service = this.getService(interfaceType);
    yield this._beginTransaction();
    yield this.update(model);
    yield service._dao.update({statusId, id: interfaceId});
    let detail = yield service.findDetailById(interfaceId);
    yield service.clearCache({pids: detail.projectId});
    let users = yield this._pguService.getUsersOfRole(detail.progroupId, [dbMap.PRG_ROL_AUDITOR, dbMap.PRG_ROL_OWNER, dbMap.PRG_ROL_ADMIN]);
    let userIds = users.map(e => e.userId);
    if (!userIds.includes(detail.creatorId)) {
      userIds.push(detail.creatorId);
    }

    let title;
    let content = '';
    const resName = this.getResName(detail);
    if (model.state === dbMap.AUDIT_TYP_APPROVED) {
      title = `${resName.name} 接口【<a class="stateful" href="/${resName.url}/detail/?pid=${detail.projectId}&id=${detail.id}">${detail.name}</a>】已被${this._context.session.user.realname}审核通过，创建者为${detail.ext.creator.realname}`;
    } else {
      title = `${resName.name} 接口【<a class="stateful" href="/${resName.url}/detail/?pid=${detail.projectId}&id=${detail.id}">${detail.name}</a>】审核失败，操作人为${this._context.session.user.realname}，接口创建者为${detail.ext.creator.realname}`;
      content = model.reason;
    }

    let notification = yield this._ntService.sendNotification(userIds, {
      content,
      title,
      type: dbMap.MSG_TYP_AUDIT
    }, {resType: this.getResType(detail), resId: detail.id}, model.state);

    // 同时将该审核记录上的所有消息都置为已读
    let needUpdateNotificationUsers = yield this._ntuService._dao.search({
      conds: {
        isRead: 0,
      }, joins: [{
        table: 'notification_resource',
        fkmap: {
          notification_id: 'notification_id'
        },
        conds: {
          resType: this.getResType(detail),
          resId: detail.id
        }
      }]
    });

    let userSet = new Set();
    let notificationSet = new Set();
    needUpdateNotificationUsers.forEach(it => {
      userSet.add(it.userId);
      notificationSet.add(it.notificationId);
    });
    yield this._ntuService._dao.updateBatch({
      'is_read': dbMap.CMN_BOL_YES
    }, {
      'notification_id': Array.from(notificationSet),
      'user_id': Array.from(userSet)
    });

    yield this._endTransaction();

    // 审核者需要得到站内消息
    let inSiteToUsers = users.filter(it => it.role === dbMap.PRG_ROL_AUDITOR).map(it => it.ext.user);
    this._async(notificationHelper.sendWeb, title, inSiteToUsers);

    // 将审核结果通知给创建者
    let toUsersIds = [detail.creatorId];
    if (model.state === dbMap.AUDIT_TYP_APPROVED) {//使用绝对路径,审核通过
      title = `${resName.name} 接口【<a href="${this._url}/${resName.url}/detail/?pid=${detail.projectId}&id=${detail.id}">${detail.name}</a>】已被${this._context.session.user.realname}审核通过，创建者为${detail.ext.creator.realname}`;
      if (detail.creatorId !== detail.respoId) {
        toUsersIds.push(detail.respoId);// 如果审核通过，同时也要告知接口负责人
      }
    } else {
      title = `${resName.name} 接口【<a href="${this._url}/${resName.url}/detail/?pid=${detail.projectId}&id=${detail.id}">${detail.name}</a>】审核失败，操作人为${this._context.session.user.realname}，接口创建者为${detail.ext.creator.realname}`;
    }
    // 生成操作历史
    this._async(history.log, {
      dName: this._dao.constructor.name,
      oprType: 'audit',
      uid,
      model,
      resType: this.getResType(detail),
      ret: detail
    });

    let toUsers = yield this._userService._dao.findBatch(toUsersIds);
    let data = {
      text: title,
      hasDomainText: title,
      toUsers: toUsers,
      skipMedia: false
    };
    this._async(notificationHelper.send, data);//站内消息+popo+邮件
    return detail;
  }

  /**
   * 创建新的审核记录，当interfaceId对应的接口已有审核记录
   * 的时候，返回错误
   * @param {integer} interfaceId
   * @param {number} interfaceType 接口类型
   * @param {bool} [recreate] 是否为重新提交审核
   */
  * create(interfaceId, interfaceType, recreate = false) {
    let service = this.getService(interfaceType);
    // 判断该interfaceId是否有待审核的审核记录
    let detail = yield service.findDetailById(interfaceId);
    if (!detail) {
      throw new IllegalRequestError('非法请求, 未找到该接口');
    }
    let userList = yield this._pguService.getUsersOfRole(detail.progroupId, [dbMap.PRG_ROL_ADMIN, dbMap.PRG_ROL_OWNER, dbMap.PRG_ROL_AUDITOR]);
    // 项目创建者需要另外查找
    let project = yield this._projectService.getById(detail.projectId);

    let userIdList = userList.map(e => e.userId);
    if (!userIdList.includes(project.creatorId)) {
      userIdList.push(project.creatorId);
    }
    if (!recreate && userIdList.includes(this._uid)) {
      return null;
    } else if (userIdList.includes(this._uid)) {
      throw new IllegalRequestError('只有接口创建者才可以重新提交审核');
    }
    let result = yield this._dao.search({
      field: {
        id: {
          func: 'COUNT',
          alias: 'count'
        }
      },
      conds: {
        interfaceId: interfaceId,
        state: dbMap.AUDIT_TYP_PENDING
      },
    });

    if (result[0].count > 0) {
      throw new IllegalRequestError('非法请求, 该接口已有未审核记录');
    }

    yield this._beginTransaction();
    // 创建审核记录
    let ret = yield super.create({
      interfaceId,
      state: dbMap.AUDIT_TYP_PENDING,
    });

    /*
     *分发审核任务给项目管理员、审核者
     */
    let title;
    const resName = this.getResName(detail);
    if (!recreate) {
      title = `${resName.name} 接口【<a class="stateful" href="/${resName.url}/detail/?pid=${detail.projectId}&id=${detail.id}\">${detail.name}</a>】待审核，创建者为${detail.ext.creator.realname}`;
    } else {
      title = `${resName.name} 接口【<a class="stateful" href="/${resName.url}/detail/?pid=${detail.projectId}&id=${detail.id}\">${detail.name}</a>】重新发起了审核，创建者为${detail.ext.creator.realname}`;
    }

    // 项目组创建者、项目创建者、管理员、审核者都可以收到审核任务
    let message = {
      title,
      content: '',
      type: dbMap.MSG_TYP_AUDIT
    };
    yield this._ntService.sendNotification(userIdList, message, {
      resType: this.getResType(detail),
      resId: detail.id
    });

    yield this._endTransaction();

    //将审核记录邮件通知给审核者
    if (!recreate) { // 绝对地址
      title = `${resName.name} 接口【<a href="${this._url}/${resName.url}/detail/?pid=${detail.projectId}&id=${detail.id}">${detail.name}</a>】待审核，创建者为${detail.ext.creator.realname}`;

    } else {
      title = `${resName.name} 接口【<a href="${this._url}/${resName.url}/detail/?pid=${detail.projectId}&id=${detail.id}">${detail.name}</a>】重新发起了审核，创建者为${detail.ext.creator.realname}`;
    }

    // 只有审核者才能收到邮件通知
    this._async(this.sendMessage, title, userList.filter(it => it.role === dbMap.PRG_ROL_AUDITOR).map(it => it.ext.user));
    return ret;
  }

  * sendMessage(text, toUsers) {
    if (!toUsers.length) {
      return;
    }
    for (let i = 0; i < toUsers.length; i++) {
      let toUser = toUsers[i];
      yield notificationHelper.sendMail(text, toUser);
    }
  }

}

module.exports = AuditService;
