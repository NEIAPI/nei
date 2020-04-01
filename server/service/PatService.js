const db = require('../../common/config/db.json');
const dt = require('../dao/config/const.json');
const log = require('../util/log');
const _ = require('../util/utility');
const Forbidden = require('../error/fe/ForbiddenError');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const NService = require('./NService');

const filterPat = (pat) => {
    delete pat.token;
    delete pat.revoked;
    return pat;
};

class PatService extends NService {
  constructor(uid, context) {
    super(context);
    this._uid = uid;
    this._dao = new (require('../dao/PatDao'))({context});
  }

  * create(model) {
    yield this._beginTransaction();
    model.creatorId = this._uid;
    const pat = yield super.create(model);
    yield this._endTransaction();
    // 新创建的时候，需要返回 token 值
    delete pat.revoked;
    return pat;
  }

  * getPatListForUser() {
    log.debug('[PatService.getPatsForUser] - get user pats :%s', this._uid);
    const pats = yield this._dao.getPatListForUser(this._uid);
    return pats.map(filterPat);
  }

  * revoke(id) {
    const pat = yield this._dao.find(id);
    pat.revoked = 1;
    const updatedPat = yield this.update(pat);
    return filterPat(updatedPat);
  }
}

module.exports = PatService;
