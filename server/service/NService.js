/**
 * Base Service Class
 */
const log = require('../util/log');
const co = require('co');
const notification = require('./helper/notification');
const history = require('./helper/history');
const Mysql = require('../dao/db/Mysql');

class NService extends require('../NObject') {
  constructor(context = {'_neiSql': {}}) {
    super();
    this._context = context;
    this._dao = null;
  }

  /**
   * begin transaction
   *
   * @protected
   * @return {Void}
   */
  * _beginTransaction() {
    yield Mysql.beginTransaction(this._context);
  }

  /**
   * end transaction
   *
   * @protected
   * @return {Void}
   */
  * _endTransaction() {
    yield Mysql.endTransaction(this._context);
  }


  /**
   * rollback transaction
   *
   * @protected
   * @return {Void}
   */
  * _rollbackTransaction() {
    return yield Mysql.rollbackTransaction(this._context);
  }

  /**
   * create a model record
   *
   * @param  {Object} model - json or model object
   * @return {model/db/Model} model object to be inserted
   */
  * create(model) {
    return (yield this.createBatch([model]))[0];
  }

  /**
   * create model batch
   *
   * @param  {Array} models - json/model list
   * @return {Array} model created in database
   */
  * createBatch(models) {
    if (this.toModels) {
      models = yield this.toModels(models);
    }
    log.debug(
      '[%s.createBatch] create multiple records',
      this.constructor.name
    );

    let ret = yield this._dao.createBatch(models);
    let cName = this.constructor.name;
    let dName = this._dao.constructor.name;
    let uid = this._uid;
    if (this.clearCache) {
      let pids = ret.map(it => it.projectId)
        .filter(it => it != null);

      if (pids.length) {
        yield this.clearCache({pids});
      }
    }
    this._async(notification.notify, {
      type: cName,
      ids: null,
      oprType: 'add',
      uid,
      oldResources: ret
    });
    this._async(history.log, {
      dName,
      oprType: 'add',
      uid,
      ret
    });
    return ret;
  }

  /**
   * update a record
   *
   * @param  {Object} model - model/json object
   * @return {model/db/Model} model object to be updated
   */
  * update(model, notAndActopt = {notification: {}, field: ''}) {
    let ret = (yield this.updateBatchModels([model], notAndActopt))[0];
    return ret;
  }

  /**
   * update multiple records
   *
   * @param  {Object} model - json/model object
   * @param  {Array} ids   - ids of resources to be updated
   * @return {Array} model list of updated
   */
  * updateBatch(model, ids, notAndActopt = {notification: {}, field: ''}) {
    let id = ids[0];
    let oData = yield this._dao.findBatch(ids);
    if (this._checkBatchPermission) {
      let ret = yield this._checkBatchPermission(ids);
      id = ret.id;
    }
    if (this._checkUpdatePermission) {
      yield this._checkUpdatePermission(id, notAndActopt);
    }
    log.debug(
      '[%s.updateBatch] update multiple models with ids %j',
      this.constructor.name, ids
    );
    let ret = yield this._dao.updateBatch(model, ids);
    let cName = this.constructor.name;
    let dName = this._dao.constructor.name;
    let uid = this._uid;
    if (this.clearCache) {
      let pids = ret.map(it => it.projectId)
        .filter(it => it != null);

      if (pids.length) {
        yield this.clearCache({pids});
      }
    }

    let template = {type: cName, ids, uid, oprType: 'update', updateData: model, realUid: model.creatorId};
    if (model.hasOwnProperty('creatorId')) {
      ['chCreator4Opr', 'chCreator4Successor', 'chCreator4Members'].forEach(oprType => {
        let arg = Object.assign({}, template,
          {oprType}, notAndActopt.notification);
        this._async(notification.notify, arg);
      });
    } else {
      this._async(notification.notify, Object.assign(template, notAndActopt.notification));
    }
    // 批量更新时，每个资源都要生成一条操作记录
    const items = ret.map(it => {
      return {
        _oData: oData.find(oit => oit.id === it.id),
        _model: Object.assign({}, model, {
          id: it.id
        })
      };
    });
    items.forEach(item => {
      this._async(history.log, {
        dName,
        oprType: 'update',
        uid,
        ret: item
      });
    });
    return ret;
  }

  /**
   * update batch models
   * notAndActopt 中可以传入field字段来做字段级别的权限管理
   *
   * @param  {Array Object} models/jsons - json/model list
   * @return {Void}
   */
  * updateBatchModels(models, notAndActopt = {notification: {}, field: ''}) {
    let ids = models.map(model => model.id);
    let oData = yield this._dao.findBatch(ids);
    let id = ids[0];
    if (this._checkBatchPermission) {
      let ret = yield this._checkBatchPermission(ids);
      id = ret.id;
    }
    if (this._checkUpdatePermission) {
      yield this._checkUpdatePermission(id, notAndActopt);
    }
    log.debug(
      '[%s.updateBatchModels] update multiple models',
      this.constructor.name
    );

    let ret = yield this._dao.updateBatchModels(models);
    let cName = this.constructor.name;
    let dName = this._dao.constructor.name;
    let uid = this._uid;
    if (this.clearCache) {
      let pids = ret.map(it => it.projectId)
        .filter(it => it != null);

      if (pids.length) {
        yield this.clearCache({pids});
      }
    }
    for (let i = 0; i < ids.length; i++) {
      let model = models[i];
      let template = {
        type: cName,
        ids: [ids[i]],
        oprType: 'update',
        uid,
        updateData: model,
        realUid: model.creatorId
      };
      if (model.hasOwnProperty('creatorId')) {
        ['chCreator4Opr', 'chCreator4Successor', 'chCreator4Members'].forEach(oprType => {
          let arg = Object.assign({}, template,
            {oprType}, notAndActopt.notification);
          this._async(notification.notify, arg);
        });
      } else {
        this._async(notification.notify, Object.assign(template, notAndActopt.notification));
      }

      this._async(history.log, {
        dName,
        oprType: 'update',
        uid,
        ret: {
          _oData: oData.find(oit => oit.id === model.id),
          _model: model
        }
      });
    }
    return ret;
  }

  /**
   * remove a record
   * @param  {Number} id - model id
   * @return {model/db/Model} model object removed
   */
  * remove(id, notAndActopt = {notification: {}, field: ''}) {
    return (yield this.removeBatch([id], notAndActopt))[0];
  }

  /**
   * remove multiple records
   *
   * @param  {Array} ids - id list to be removed
   * @return {Array} model list removed
   */
  * removeBatch(ids, notAndActopt = {notification: {}, field: ''}) {
    let id = ids[0];
    if (this._checkBatchPermission) {
      let ret = yield this._checkBatchPermission(ids);
      id = ret.id;
    }
    if (this._checkRemovePermission) {
      yield this._checkRemovePermission(id, notAndActopt);
    }

    let dName = this._dao.constructor.name;
    let ret = yield this._dao.removeBatch(ids);
    let cName = this.constructor.name;
    let uid = this._uid;
    if (this.clearCache) {
      let pids = ret.map(it => it.projectId)
        .filter(it => it != null);

      if (pids.length) {
        yield this.clearCache({pids});
      }
    }
    this._async(notification.notify, Object.assign({
      type: cName,
      ids,
      oprType: 'del',
      uid,
      oldResources: ret
    }, notAndActopt.notification));
    this._async(history.log, {
      dName,
      oprType: 'del',
      uid,
      ret
    });
    return ret;
  }

  /**
   * get item by id
   *
   * @param  {Number} id - item id
   * @param  {Object} [opt]
   * @return {Model} item model
   */
  * getById(id, opt = {}) {
    if (this._checkSearchPermission && this._uid) {
      yield this._checkSearchPermission(id);
    }
    if (opt.hasOwnProperty('userJoin') && opt['userJoin']) {
      opt.joins = this._dao._getUserJoins();
      delete opt.userJoin;
    }
    let ret = yield this._dao.find(id, opt);
    return ret;
  }

  /*
   * get list by user id
   * @param {Number} uid - user id
   * @param {Boolean} singleton - flag to return single element
   * @return {Array Model}
   */
  * getListForUser(uid, singleton = false) {
    let ret = yield this._dao.search({
      conds: {
        'user_id': uid
      },
      joins: this._dao._getUserJoins()
    });

    return singleton ? ret[0] : ret;
  }

  _async(gen, ...args) {
    let fn = co.wrap(gen);
    setTimeout(() => {
      fn(...args).catch(err => {
        log.error(err);
      });
    }, 500);
  }

  * delay(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

module.exports = NService;
