const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');
const NotificationService = require('../../service/NotificationService');
const NotificationUserService = require('../../service/NotificationUserService');
const NotificationSettingService = require('../../service/NotificationSettingService');

class NotificationController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new NotificationService(context);
    this._nuService = new NotificationUserService(context);
    this._nsService = new NotificationSettingService(context);
  }

  * getList() {
    log.debug(
      '[API.%s.getList] getList',
      this.constructor.name
    );

    let it;
    let rule = {
      type: {required: true, isNumber: true},
      offset: {required: true, isNumber: true},
      limit: {required: true, isNumber: true},
      total: {isBoolean: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.getListForUser(this._uid, data);
    if (data.total) {
      let total = yield this._service.getTotal(this._uid, {type: data.type});
      it = {total};
    }
    this.setModel(ret, it);
    yield this.next();
  }

  * getUnread() {
    let ret = yield this._service.getUnread(this._uid);
    this.setModel(ret);
    yield this.next();
  }

  * getResourceNotifications() {
    log.debug(
      '[API.%s.getResourceNotifications] getResourceNotifications',
      this.constructor.name
    );

    let rule = {
      type: {required: true, isNumber: true},
      id: {required: true, isNumber: true},
      offset: {isNumber: true},
      limit: {isNumber: true},
      total: {isBoolean: true},
    };
    let data = this.validate(rule);
    let nofs = yield this._service.getResNotificationList(data.type, data.id, {
      limit: data.limit,
      offset: data.offset
    });
    let ret = {result: nofs};
    if (data.total) {
      let total = yield this._service.getTotalApiNofs(data.type, data.id);
      Object.assign(ret, {total});
    }
    this.setModel(ret);
    yield this.next();
  }

  * markRead() {
    log.debug(
      '[API.%s.markRead] markRead',
      this.constructor.name
    );
    let rule = {
      ids: {required: true, isArray: true, value: /^\d+$/}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._nuService.markRead(this._uid, data.ids);
    this.setModel(ret);

    yield this.next();
  }

  * markAllRead() {
    log.debug(
      '[API.%s.markReadAll] markReadAll',
      this.constructor.name
    );
    let rule = {
      type: {required: true, isArray: false, value: /^\d+$/}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._nuService.markAllRead(this._uid, data.type);
    this.setModel(ret);

    yield this.next();
  }

  * remove() {
    log.debug(
      '[API.%s.remove] remove',
      this.constructor.name
    );
    let id = this._context._id;

    let ret = yield this._service.remove(id, this._uid);
    this.setModel(ret.find((item) => item.id === id));

    yield this.next();
  }

  * removeBatch() {
    log.debug(
      '[API.%s.removeBatch] removeBatch',
      this.constructor.name
    );
    _.translateParams(this._query, ['ids']);

    let ret = yield this._service.removeBatch(this._query.ids, this._uid);
    this.setModel(ret);

    yield this.next();
  }

  * getSettings() {
    log.debug(
      '[API.%s.getSettings] getSettings',
      this.constructor.name
    );

    let ret = yield this._nsService.getListForUser(this._uid, true);
    this.setModel(ret);
    yield this.next();
  }

  * updateSettings() {
    log.debug(
      '[API.%s.updateSettings] updateSettings',
      this.constructor.name
    );
    let rule = {
      flag: {isNumber: true, value: /^[01]$/},
      methodYixin: {isNumber: true, value: /^[01]$/},
      methodEmail: {isNumber: true, value: /^[01]$/},
      methodPhone: {isNumber: true, value: /^[01]$/},
      methodPaopao: {isNumber: true, value: /^[01]$/}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._nsService.update(this._uid, data);
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = NotificationController;
