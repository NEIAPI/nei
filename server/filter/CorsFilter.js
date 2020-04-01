const log = require('../util/log');
const NFilter = require('../arch/NFilter');

class CorsFilter extends NFilter {
  * doFilter() {
    // 主要参考了 koa-cor 库: https://github.com/koajs/cors/blob/master/index.js
    log.debug(
      '[%s] do api mock filter',
      this.constructor.name
    );
    const requestOrigin = this._context.get('Origin');
    const ctx = this._context;
    ctx.vary('Origin');
    if (ctx.method === 'OPTIONS') {
      if (!ctx.get('Access-Control-Request-Method')) {
        // this not preflight request, ignore it
        return yield super.chain();
      }
      ctx.status = 204;
    }
    const resHeaders = {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, HEAD, PUT, POST, DELETE, PATCH'
    };
    const allowHeaders = ctx.get('Access-Control-Request-Headers');
    if (allowHeaders) {
      resHeaders['Access-Control-Allow-Headers'] = allowHeaders;
    }
    ctx.response.set(resHeaders);
    yield super.chain();
  }
}

module.exports = CorsFilter;
