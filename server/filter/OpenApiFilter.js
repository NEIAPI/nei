/**
 * OpenApi Filter Class
 */
const log = require('../util/log');
const NFilter = require('../arch/NFilter');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const sqlOpt = {noTransaction: true};

class OpenApiFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do open api filter',
      this.constructor.name
    );
    const token = this._context.query.private_token || this._context.req.headers.private_token;
    if (!token) {
      throw new IllegalRequestError(
        `can't find private access token`
      );
    }
    const patDAO = new (require('../dao/PatDao'))(sqlOpt);
    const pat = yield patDAO.getByToken(token);
    if (!pat || pat.revoked) {
      throw new IllegalRequestError(
        `private access token not exist`
      );
    }
    if (Date.now() > parseInt(pat.expire, 10)) {
      throw new IllegalRequestError(
        `private access token is expired`
      );
    }
    this._context.pat = pat;
    yield super.chain();
  }
}

module.exports = OpenApiFilter;
