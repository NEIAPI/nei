const log = require('../../util/log');
const util = require('../../util/utility');
const NController = require('../../arch/NController');
const PatService = require('../../service/PatService');

class PatController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new PatService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );

    const rule = {
      name: {required: true},
      privilege: {required: true},
      description: {},
      expire: {}
    };
    let data = this.validate(rule, 'body');
    // 生成唯一 token
    data.token = util.randString(20);
    // 提前算好过期时间
    if (data.expire) {
      const expireTime = new Date(data.expire).getTime();
      if (expireTime) {
        data.expire = String(expireTime + 86400000 - 1);
      } else {
        delete data.expire;
      }
    }

    let ret = yield this._service.create(data);
    this.setModel(ret);

    yield this.next();
  }

  * getList() {
    log.debug(
      '[API.%s.getList] get list',
      this.constructor.name
    );

    const ret = yield this._service.getPatListForUser();
    this.setModel(ret);

    yield this.next();
  }

  * revoke() {
    log.debug(
      '[API.%s.revoke] revoke token',
      this.constructor.name
    );
    util.translateParams(this._query, ['ids']);
    const ret = yield this._service.revoke(this._query.ids);
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = PatController;
