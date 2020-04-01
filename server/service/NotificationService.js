/**
 * Notification Service Class
 */

const log = require('../util/log');
const Forbidden = require('../error/fe/ForbiddenError');
const _ = require('../util/utility');
const dbMap = require('../../common').db;

const NService = require('./NService');

class NotificationService extends NService {
  constructor(context) {
    super(context);
    this._dao = new (require('../dao/NotificationDao'))({context});
    this._nuDAO = new (require('../dao/NotificationUserDao'))({context});
    this._nrDAO = new (require('../dao/NotificationResourceDao'))({context});
    this._userService = new (require('./UserService'))(context);
  }

  /**
   * send notification to users
   * @param  {Array Number} recipientIds - recipient ids to send notification to
   * @param  {Object} data - e.g. {content:'hello', title: 'world', type: 0}
   * @param  [Object] opt - e.g. {resType: 1, resId: 10001}
   * @return {model/db/Notification} notification model
   */
  * sendNotification(recipientIds, data, opt, isRead = 0) {
    log.debug(
      '[%s.sendNotification] - send notification to users',
      this.constructor.name, recipientIds, data
    );
    return yield this._dao.sendNotification(recipientIds, data, opt, isRead);
  }

  /**
   * get notification list for user
   * @param  {Number} uid - user id
   * @param  {Object} opt - data
   * @param  {Number} [opt.type] - notification type
   * @param  {Number} [opt.offset] - search offset
   * @param  {Number} [opt.limit] - search limit
   * @return {Array db/model/Notification}
   */
  * getListForUser(uid, opt = {}) {
    log.debug(
      '[%s.getListForUser] - get notification list for user %d',
      this.constructor.name, uid
    );

    let pages = {
      limit: opt.limit || Number.MAX_SAFE_INTEGER,
      offset: opt.offset || 0
    };

    let type = opt.hasOwnProperty('type') ? [opt.type] : [dbMap.MSG_TYP_SYSTEM, dbMap.MSG_TYP_PRIVATE, dbMap.MSG_TYP_API];

    let conds = {userId: uid};
    if (opt.type === dbMap.MSG_TYP_AUDIT) { // 当消息为审核消息的时候
      conds.isRead = dbMap.AUDIT_TYP_PENDING;
    }

    let ret = yield this._nuDAO.search({
      sfields: ['is_read', 'create_time'],
      conds,
      joins: [{
        table: 'notification',
        fkmap: {'id': 'notification_id'},
        conds: {type},
        propagate: true,
        field: ['id', 'type', 'title', 'content']
      }],
      order: {field: 'create_time', desc: true},
      pages
    });
    return ret;
  }

  * getResNotificationList(resType, resId, opt = {}) {
    log.debug(
      '[%s.getResNotificationList] - get resource notification list',
      this.constructor.name, resType, resId
    );

    let apiNotifications = yield this._nrDAO.search({
      conds: {
        resType,
        resId,
      },
      joins: [{
        table: 'notification',
        fkmap: {id: 'notification_id'},
        conds: {
          type: dbMap.MSG_TYP_API
        }
      }, ...this._nrDAO._getUserJoins()],
      order: {field: 'create_time', desc: true},
      pages: {
        limit: opt.limit || Number.MAX_SAFE_INTEGER,
        offset: opt.offset || 0
      }
    });

    if (!apiNotifications.length) {
      return [];
    }

    let nofIds = apiNotifications.map(it => it.notificationId);

    let nofs = yield this._nuDAO.search({
      joins: [{
        table: 'notification',
        propagate: true,
        fkmap: {'id': 'notification_id'},
        field: ['title', 'content', 'type'],
        conds: {
          id: nofIds
        }
      }, {
        table: 'user',
        alias: 'user',
        fkmap: {id: 'user_id'},
        field: this._dao.USER_EXPORT_FIELD
      }]
    });

    let plainNofs = _._unwrap(nofs);
    let result = [];
    (nofIds || []).forEach((nid) => {
      let matchedNofs = (plainNofs || []).filter(nof => nof.notificationId === nid);
      let matchedNofRes = (apiNotifications || []).find(nof => nof.notificationId === nid);
      if (!matchedNofs || !matchedNofs.length) {
        return;
      }
      let fstMatched = matchedNofs[0];
      let obj = {
        title: fstMatched.title,
        content: fstMatched.content,
        id: fstMatched.notificationId,
        createTime: fstMatched.createTime,
        creator: matchedNofRes.ext.creator,
        type: fstMatched.type,
        confirmedUsers: [],
        unconfirmedUsers: []
      };

      (matchedNofs || []).forEach((nof) => {
        if (nof.isRead) {
          obj.confirmedUsers.push(nof.user);
        } else {
          obj.unconfirmedUsers.push(nof.user);
        }
      });
      result.push(obj);
    });

    return result;
  }

  /**
   * get total number of notifications for user
   * @param  {Number} uid - user id
   * @param  {Object} opt - data
   * @param  {Number} [opt.type] - notification type
   * @return {Number}
   */
  * getTotal(uid, opt = {}) {
    let conds = {'user_id': uid};
    // 当消息为审核消息的时候
    if (opt.type && opt.type === dbMap.MSG_TYP_AUDIT) {
      conds.isRead = dbMap.AUDIT_TYP_PENDING;
    }
    let ret = yield this._dao.search({
      field: {
        'id': {
          alias: 'total',
          func: 'count'
        }
      },
      conds: opt,
      joins: [{
        table: 'notification_user',
        fkmap: {
          'notification_id': 'id'
        },
        conds: conds
      }]
    });
    return ret[0].total;
  }

  /**
   * get total number of api notifications
   * @param  {Number} resType - resource type
   * @param  {Number} resId - resource id
   * @return {Number}
   */
  * getTotalApiNofs(resType, resId) {
    let ret = yield this._nrDAO.search({
      field: {
        'id': {
          alias: 'total',
          func: 'count'
        }
      },
      conds: {
        resType,
        resId
      },
    });
    return ret[0].total;
  }

  /**
   * get unread notifications for user
   * @param  {Number} uid - user id
   * @return {Array db/model/Notification}
   */
  * getUnread(uid) {
    log.debug(
      '[%s.getUnread] get unread notifications for user %d',
      this.constructor.name, uid
    );

    let ret = yield this._dao.search({
      field: {
        'id': {
          alias: 'total',
          func: 'count'
        }
      },
      sfields: ['type'],
      joins: [{
        table: 'notification_user',
        fkmap: {
          'notification_id': 'id'
        },
        conds: {
          'user_id': uid,
          'is_read': dbMap.CMN_BOL_NO
        }
      }],
      group: 'type'
    });

    let data = {
      system: 0,
      personal: 0,
      api: 0,
      audit: 0
    };
    ret.forEach((it) => {
      if (it.type === dbMap.MSG_TYP_SYSTEM) {
        data.system = it.total;
      } else if (it.type === dbMap.MSG_TYP_PRIVATE) {
        data.personal = it.total;
      } else if (it.type === dbMap.MSG_TYP_API) {
        data.api = it.total;
      } else if (it.type === dbMap.MSG_TYP_AUDIT) {
        data.audit = it.total;
      }
    });
    return data;
  }

  /**
   * remove a notification
   * @param {Number} id - model id
   * @param {Number} uid - user id
   * @return {model/db/Model} model object removed
   */
  * remove(id, uid) {
    return (yield this.removeBatch([id], uid))[0];
  }

  /**
   * remove multiple notifications
   *
   * @param {Array} ids - id list to be removed
   * @param {Number} uid - user id
   * @return {Array} model list removed
   */
  * removeBatch(ids, uid) {
    log.debug(
      '[%s.removeBatch] remove multiple records with ids %j',
      this.constructor.name, ids
    );
    let ret = yield this._nuDAO.search({conds: {userId: uid, notificationId: ids}});
    let realIds = ret.map(item => item.notificationId);
    if (ids.length > realIds.length) {
      throw new Forbidden('没有权限', {id: ids});
    }

    let notifications = yield this._dao.findBatch(ids);

    yield this._beginTransaction();

    yield this._nuDAO.removeBatch({
      'notification_id': ids,
      'user_id': uid
    });

    let privateMsgs = notifications.filter(it => it.type === dbMap.MSG_TYP_PRIVATE);
    ids = privateMsgs.map(it => it.id);
    if (ids.length) {
      yield super.removeBatch(ids);
    }

    yield this._endTransaction();
    return notifications;
  }
}

module.exports = NotificationService;
