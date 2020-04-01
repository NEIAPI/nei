const Mysql = require('./db/Mysql');
const log = require('../util/log');
const _ = require('../util/utility');
const dbModel = require('../model/db/Model');
const db = require('../../common').db;
const dt = require('./config/const.json');
const IllegalRequest = require('../error/fe/IllegalRequestError');
const NObject = require('../NObject');

class NDao extends NObject {
  /**
   * Dao constructor
   * @param  {Object} sqlOpt - sql config options
   * @param  {Object} sqlOpt.context - koa context used to store transcation connection
   * @param  {Object} sqlOpt.noTransaction - transaction flag used for async notification and resource history
   * @return
   */
  constructor(sqlOpt = {context: {'_neiSql': {}}, noTransaction: false}) {
    super();
    // sub class should bind the model class
    this._Model = null;
    this._cache = new (require('./cache/Redis'))();
    if (sqlOpt.context == null) {
      sqlOpt.context = {'_neiSql': {}};
    }
    this._database = new Mysql(sqlOpt);
    this._sqlOpt = sqlOpt;
  }

  get _context() {
    return this._sqlOpt.context;
  }

  get USER_EXPORT_FIELD() {
    return [
      'id', 'username', 'portrait', 'realname', 'realname_pinyin'
    ];
  }

  get USER_DETAIL_EXPORT_FIELD() {
    // user detail exported fields
    return [
      'id', 'username', 'portrait', 'realname', 'realname_pinyin', 'paopao', 'email'
    ];
  }

  get BISGROUP_EXPORT_FIELD() {
    // bisgroup exported fields
    return [
      'id', 'name', 'name_pinyin', 'description', 'rpc_pom', 'rpc_key',
      'respo_id', 'project_id', 'creator_id'
    ];
  }

  get PROGROUP_USER_EXPORT_FIELD() {
    // progroup_user exported fields
    return ['role', 'user_id', 'progroup_id'];
  }

  get PROGROUP_API_SPEC_EXPORT_FIELD() {
    // progroup_api_spec exported fields
    return ['type', 'path', 'param', 'method'];
  }

  get PROGROUP_EXPORT_FIELD() {
    // progroup exported fields
    return [
      'id', 'name', 'name_pinyin', 'type', 'creator_id',
      'logo', 'description', 'create_time', 'api_audit'
    ];
  }

  get PROJECT_EXPORT_FIELD() {
    // project exported fields
    return [
      'id', 'creator_id', 'progroup_id', 'type', 'logo',
      'name', 'description', 'tool_key'
    ];
  }

  get PINYIN() {
    return ['tag', 'name', 'status'];
  }

  get TOOLSPEC() {
    // tool spec web names
    return ['toolSpecWeb', 'toolSpecAos', 'toolSpecIos', 'toolSpecTest'];
  }

  get _RDS() {
    return {
      [db.RES_TYP_INTERFACE]: dt.RDS_INTERFACE,
      [db.RES_TYP_RPC]: dt.RDS_RPC,
      [db.RES_TYP_DATATYPE]: dt.RDS_DATATYPE,
      [db.RES_TYP_TEMPLATE]: dt.RDS_TEMPLATE,
      [db.RES_TYP_BISGROUP]: dt.RDS_BISGROUP,
      [db.RES_TYP_CONSTRAINT]: dt.RDS_CONSTRAINT,
      [db.RES_TYP_WORD]: dt.RDS_WORD,
      [db.RES_TYP_WORD_OVERWRITE]: dt.RDS_WORD_OVERWRITE
    };
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
   * get model name for dao
   *
   * @return {String} model name
   */
  getModelName() {
    return this._Model.name;
  }

  /**
   * get user join condition
   *
   * @protected
   * @return {Array} user join conditions
   */
  _getUserJoins(isDetail = false) {
    let ret = [];
    let userExport = isDetail ? this.USER_DETAIL_EXPORT_FIELD : this.USER_EXPORT_FIELD;
    if (this._Model.getField('respoId')) {
      ret.push({
        table: 'user',
        alias: 'respo',
        fkmap: {id: 'respo_id'},
        field: userExport
      });
    }
    if (this._Model.getField('creatorId')) {
      ret.push({
        table: 'user',
        alias: 'creator',
        fkmap: {id: 'creator_id'},
        field: userExport
      });
    }
    if (this._Model.getField('testerId')) {
      // tester is not compulsory for testcase.
      ret.push({
        table: 'user',
        alias: 'tester',
        fkmap: {id: 'tester_id'},
        type: 'LEFT',
        field: userExport
      });
    }
    if (this._Model.getField('groupId')) {
      ret.push({
        table: 'bisgroup',
        alias: 'group',
        fkmap: {id: 'group_id'},
        field: this.BISGROUP_EXPORT_FIELD
      });
    }
    if (this._Model.getField('userId')) {
      let alias = 'user';
      if (this._Model === require('../model/db/ProgroupVerification')) {
        alias = 'applicant';
      }
      if (this._Model === require('../model/db/ProgroupVerificationOp')) {
        alias = 'verifier';
      }
      ret.push({
        table: 'user',
        alias,
        fkmap: {id: 'user_id'},
        field: userExport
      });
    }
    return ret;
  }

  /**
   * get status join condition
   *
   * @protected
   * @return {Array} user join conditions
   */
  _getStatusJoins() {
    let ret = [];
    if (this._Model.getField('statusId')) {
      ret.push({
        table: 'status',
        alias: 'status',
        fkmap: {id: 'status_id'},
        field: ['id', 'name', 'name_pinyin']
      });
    }
    return ret;
  }

  /**
   * get project join condition
   *
   * @protected
   * @return {Array} project join conditions
   */
  _getProjectJoins() {
    let ret = [];
    if (this._Model.getField('projectId')) {
      ret.push({
        table: 'project',
        alias: 'project',
        fkmap: {id: 'project_id'},
        field: ['id', 'name', 'name_pinyin']
      });
    }
    return ret;
  }

  /**
   * get progroup join conditions
   *
   * @protected
   * @param  {Number} uid - user id
   * @return {Array} progroup_user join conditions
   */
  _getProGroupJoins(uid) {
    let ret = [],
      field = 'progroup_id';
    // for progroup model
    if (!this._Model.getField('progroupId')) {
      field = 'id';
    }
    ret.push({
      table: 'progroup_user',
      alias: 'pguser',
      fkmap: {progroup_id: field},
      conds: {user_id: uid},
      field: this.PROGROUP_USER_EXPORT_FIELD
    });
    return ret;
  }

  /**
   * get user and progroup join condition
   *
   * @protected
   * @param  {Number} uid - user id
   * @return {Array} user and project group join conditions
   */
  _getUserProGroupJoins(uid) {
    let ret = this._getUserJoins();
    let arr = this._getProGroupJoins(uid);
    return [...ret, ...arr];
  }

  /**
   * do something with cache
   * @protected
   * @param {String} ckey - cache key
   * @param {GeneratorFunction} func - do something
   * @param {args} rest args to pass into func
   * @return {Variable} result
   */
  * _doWithCache(ckey, func, ...args) {
    // check from cache
    let cret = yield this._cache.get(ckey);
    if (cret != null) {
      return cret;
    }
    // get from database
    cret = yield func.apply(this, args);
    //save to cache
    if (cret != null) {
      cret = _._unwrap(cret);
      yield this._cache.set(ckey, cret);
    }
    return cret;
  }

  /**
   * search result with sql and args
   * @private
   * @param  {String} sql  - sql statement
   * @param  {Array}  args - sql parameters placeholder
   * @return {Array}  search result
   */
  * _search(sql, args) {
    // illegal search call
    if (!sql) {
      log.warn(
        '[%s.search] no sql statement found for search %s model list',
        this.constructor.name, this._Model.name
      );
      return;
    }
    // search from database
    let rec = yield this._database.exec(
      sql, args
    );

    // generate result
    let ret = rec.map((it) => {
      return this.wrap(it);
    });

    return ret;
  }

  /**
   * search with conditions
   *
   * ```sql
   * SELECT
   *      `table1`.`field1` AS `table1.field1`, `table2`.`field1` AS `table2.field1`
   * FROM
   *      `table1`,`table2`
   * WHERE
   *      `table1`.`field3`=`table2`.`field4` AND `table1`.`field5`=?
   * ```
   *
   * @param  {Object} options - conditions config
   * @param  {Object} options.sfields - select fields, e.g. [field1, field2]
   * @param  {Object} options.field - table field config, e.g.  {field1:'DISTINCT'}
   * @param  {Object} options.conds - conditions for table, e.g. {field1:{op:'=',value:id},field2:ids}
   * @param  {Array Object} options.joins - table join config, e.g. [{table:table1,alias:alias1,fkmap:{f1:'f2'},conds:{f1:{op:'=',value:id}}}]
   * @return {Array}  model list
   */
  * search(options) {
    let ret = this._Model.toSearchSQL(options);
    return yield this._search(ret.sql, ret.args);
  }

  /**
   * get model by id
   *
   * @param {Number} id - model id
   * @param {Object} [options] - find options
   * @param {Array Object} [options.joins] - whether to join other table
   * @return {model/db/Model} model object to find
   */
  * find(id, options) {
    return (yield this.findBatch([id], options))[0];
  }

  /**
   * get multiple models by ids
   *
   * @param  {Array} ids - id list
   * @param {Object} [options] - find options
   * @param {Array Object} [options.joins] - whether to join other table
   *
   * @return {model/db/Model} model list
   */
  * findBatch(ids, options) {
    let opt = {
      conds: {id: ids}
    };
    if (options && options.joins) {
      opt.joins = options.joins;
    }
    if (options && options.sfields) {
      opt.sfields = options.sfields;
    }

    let rec = yield this.search(opt);
    return rec;
  }

  /**
   * create a model record
   *
   * @param  {model/db/Model/Object} model - model object
   * @return {model/db/Model/Object} model object to be inserted
   */
  * create(model) {
    let rec = yield this.createBatch([model]);
    return rec[0];
  }

  /**
   * create model batch
   *
   * @param  {Array} models - model list
   * @return {Array} model created in database
   */
  * createBatch(models) {
    models = this.toModels(models);

    // generate sql and args
    let sqls = [], args = [];
    models.forEach((it) => {
      let ret = it.toInsertSQL();
      sqls.push(ret.sql);
      args.push(...ret.args);
    });
    // execute sql
    let rec = yield this._database.exec(
      sqls.join(''), args
    );
    if (!Array.isArray(rec)) {
      rec = [rec];
    }
    // dump created ids
    let ids = [];
    rec.forEach((it) => {
      if (it.insertId) {
        ids.push(it.insertId);
      }
    });
    if (!ids.length) {
      //没有自增主键
      return models;
    }
    log.debug(
      '[%s.createBatch] %s model ids created are %j',
      this.constructor.name, this._Model.name, ids
    );
    // check insert model type
    if (this._Model !== models[0].constructor) {
      return ids;
    }
    return yield this.findBatch(ids, {joins: this._getUserJoins()});
  }

  /**
   * update a model record
   *
   * @param {model/db/Model} model - model object
   * @param {Object} [cond] - update condition. use id if not provided
   * @return {model/db/Model} model object to be updated
   */
  * update(model, cond) {
    let ret = yield this.updateBatch(model, cond ? cond : [model.id]);
    return ret[0];
  }

  /**
   * update multiple models
   *
   * @param  {model/db/Model} model - model object
   * @param  {Array|Object} ids  - ids or update condition
   * @return {Array} model list of updated
   */
  * updateBatch(model, idsOrCond) {
    log.debug(
      '[%s.updateBatch] update multiple %s model with ids %j',
      this.constructor.name, this._Model.name, idsOrCond
    );
    model = (this.toModels(model))[0];
    let conds = {id: idsOrCond};
    if (!Array.isArray(idsOrCond)) {
      conds = idsOrCond;
    }
    let ret = model.toUpdateSQL(conds);
    yield this._database.exec(
      ret.sql, ret.args
    );
    // check insert model type
    if (this._Model !== model.constructor) {
      return idsOrCond;
    }
    return yield this.search(Object.assign(
      {conds},
      this.constructor.__updateJoins
        ? {joins: this.constructor.__updateJoins}
        : {}
    ));
  }

  /**
   * update batch models
   *
   * @param  {Array} models - model list
   * @return {Void}
   */
  * updateBatchModels(models) {
    log.debug(
      '[%s.updateBatchModels] update multiple %s models',
      this.constructor.name, this._Model.name
    );
    let condsArr = models.map(model => {
      return model._conds;
    });
    models = this.toModels(models);
    // generate sql and args
    let sqls = [], args = [];
    let ids = models.map(model => model.id);
    models.forEach(function (it, index) {
      let ret = it.toUpdateSQL(condsArr[index]);
      sqls.push(ret.sql);
      args.push(...ret.args);
    });
    // execute sql
    yield this._database.exec(
      sqls.join(''), args
    );

    if (ids.some(id => id == null)) {
      return;
    }

    return yield this.findBatch(ids);
  }

  /**
   *  a model record
   * @param  {Number} id - model id
   * @return {model/db/Model} model object removed
   */
  * remove(id) {
    return (yield this.removeBatch([id]))[0];
  }

  /**
   * remove multiple models
   *
   * @param  {Array|Object} idsOrCond - id list to be removed or conditions
   * @return {Array} model list removed
   */
  * removeBatch(idsOrCond) {
    log.debug(
      '[%s.removeBatch] remove multiple %s model with ids %j',
      this.constructor.name, this._Model.name, idsOrCond
    );
    let conds = {id: idsOrCond};
    if (!Array.isArray(idsOrCond)) {
      conds = idsOrCond;
    }
    let models = yield this.search({conds});
    let ret = this._Model.toDeleteSQL(conds);
    yield this._database.exec(
      ret.sql, ret.args
    );
    return models;
  }

  /**
   * wrap a json to a Model if it's not alrady a Model
   *
   * @param  {Array Object} data, a Model or not a Model
   * @return {Array model/db/Model}
   */
  toModels(models) {
    if (!Array.isArray(models)) {
      models = [models];
    }
    models.forEach((model, index, ctx) => {
      if (!(model instanceof dbModel)) {
        ctx[index] = this.wrap(model);
      }
    });
    return models;
  }

  /**
   * check whether all ids exist
   *
   * @param  {Array Number} model ids
   * @return {Array model/db/Model}
   */
  * checkIds(ids) {
    let models = yield this.findBatch(ids);
    if (!models || models.length !== ids.length) {
      throw new IllegalRequest('存在id不存在的情况', {id: ids});
    }
    return models;
  }

  /**
   * wrap a json to a Model.
   * This will convert field name to camel case and bundle non-self fields to ext attribute
   * @param  {Object} data - json data
   * @return {model/db/Model} model object the dao binds to
   */
  wrap(data) {
    if (Array.isArray(data)) {
      let ret = data.map((it) => {
        return this.wrap(it);
      });
      return ret;
    }

    _.addPinyin(data, this._Model, this.PINYIN);

    if (data instanceof this._Model) {
      return data;
    }
    return new this._Model(data);
  }
}

module.exports = NDao;
