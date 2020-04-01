const NObject = require('../NObject');
const codemap = require('../../common').codeMap;
const _ = require('../util/utility');
const log = require('../util/log');

class NController extends NObject {
  /**
   * Create a Controller
   * @param  {KoaContext} context - koa context object
   * @param  {GeneratorFunction} next - next process
   */
  constructor(context, next) {
    super();
    this.model = {};
    this._next = next;
    this._context = context;
    Object.assign(context, {
      '_neiSql': {}
    });
    this._uid = context.session.user && context.session.user.id;
  }

  get _body() {
    return this._context.body;
  }

  get _query() {
    let query = this._context.query;
    query.hasOwnProperty = query.hasOwnProperty || function (att) {
        return Object.prototype.hasOwnProperty.call(query, att);
      };
    return query;
  }

  get _rmethod() {
    return this._context.request.method.toUpperCase();
  }

  get _fields() {
    return this._context.request.fields;
  }

  get _session() {
    return this._context.session;
  }

  /**
   * do next process
   * @return {Void}
   */
  * next() {
    if (this._next) {
      yield this._next;
    }
  }

  /**
   * redirect to url
   * @param  {String} url - redirect destination
   * @return {Void}
   */
  redirect(url) {
    if (this._context) {
      this._context.response.redirect(url);
    }
  }

  /**
   * set cookie
   * @param {String} key - cookie key
   * @param {String} value - cookie value
   * @param {options} options
   * @return {Void}
   */
  setCookie(key, value, options) {
    if (this._context && this._context.cookies && this._context.cookies.set) {
      this._context.cookies.set(key, value, options || {});
    }
  }

  /**
   * get cookie
   * @param {String} key - cookie key
   * @return {Object}
   */
  getCookie(key) {
    if (this._context && this._context.cookies && this._context.cookies.get) {
      return this._context.cookies.get(key);
    }
  }

  /**
   * wrap return response
   * @param {Object} response - json response from service
   * @param {Object} it
   * @return {Object} - json response with status code and message
   */
  wrapRet(response, it = {}) {
    return Object.assign(it, {
      code: codemap.REQUEST_SUCCESS.code,
      msg: codemap.REQUEST_SUCCESS.msg,
      result: response
    });
  }

  /**
   * set model to koa context which is used to render response
   * @param {Object} model
   * @param {Object} it
   * @return {Void}
   */
  setModel(model, it = {}) {
    model = _._unwrap(model);
    this._context.model = this.wrapRet(model, it);
  }

  /**
   * get resource by id
   * @param {Object} [options] - config options
   * @param {String} [options.service] - service name
   * @param {String} [options.method] - service method name
   * @return {Void}
   */
  * getById(options) {
    let id = this._context._id;

    let service = options && options.service || '_service';
    let method = options && options.method || 'getById';

    if (this[service] && typeof this[service][method] === 'function') {
      let result = yield this[service][method](id);
      this._context.model = this.wrapRet(result);
    }
  }

  /**
   * validate the data from http request
   * @param {Object} rule - validation rule
   * @param {String} src - data source. can be 'query' or post 'body'
   * @return {Object}
   */
  validate(rule, src = 'query') {
    let data = this._context[src];
    return _.validate(data, rule);
  }

  * search() {
    log.debug(
      '[API.%s.search] search',
      this.constructor.name
    );
    let rule = {
      v: {required: true},
      offset: {required: true, isNumber: true},
      limit: {required: true, isNumber: true},
      total: {isBoolean: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.search(data);
    this.setModel(ret.list, data.total ? {total: ret.total} : {});

    yield this.next();
  }
}

module.exports = NController;
