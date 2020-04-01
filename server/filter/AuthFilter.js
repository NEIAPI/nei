const log = require('../util/log');
const AuthError = require('../error/fe/AuthError');
const NFilter = require('../arch/NFilter');

class AuthFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do auth filter',
      this.constructor.name
    );

    const session = this._context.session;
    if (!session || !session.user || !session.user.id) {
      // not login
      let url = this._context.request.url;
      if (/^\/api/.test(url)) {
        throw new AuthError('not loggined in');
      } else {
        let query = '';
        if (this._context.request.originalUrl) {
          query = `?url=${encodeURIComponent(this._context.request.originalUrl)}`;
        }
        return this.redirect(`/login${query}`);
      }
    }
    return yield super.chain();
  }
}

module.exports = AuthFilter;
