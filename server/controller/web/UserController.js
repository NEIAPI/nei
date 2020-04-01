const log = require('../../util/log');
const path = require('path');
const NController = require('../../arch/NController');

class UserController extends NController {
  constructor(context, next) {
    super(context, next);
  }

  * login() {
    log.debug(
      '[WEB.%s.login] visit login page',
      this.constructor.name
    );
    let returnUrl = '/dashboard';
    if (this._query.url && this._query.url.startsWith('/')) {
      returnUrl = path.normalize(this._query.url);
    }
    if (this._session.user) {
      return this.redirect(decodeURIComponent(returnUrl));
    }
    yield this.next();
  }

  * register() {
    log.debug(
      '[WEB.%s.register] visit register page',
      this.constructor.name
    );
    yield this.next();
  }
}

module.exports = UserController;
