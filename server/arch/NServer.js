const path = require('path');
const fs = require('fs');
const koa = require('koa');
const log = require('../util/log');

/**
 * Base Server Class
 *
 * @extends NObject
 */
class NServer extends require('../NObject') {
  /**
   * Create an App Server
   *
   * @param  {Object} [options] - server config object
   * @param  {Number} [options.port]     - server listen port
   * @param  {String} [options.hostname] - server hostname
   * @param  {Object} [options.session]  - session config
   * @param  {Object} [options.view]     - view resolver config
   * @param  {Object} [options.roots]    - root path config
   * @param  {Object} [options.routes]   - router config
   * @param  {Object} [options.filters]  - filter config
   * @param  {Array}  [options.keys]     - koa session secret keys
   */
  constructor(options) {
    super();
    if (!(this instanceof NServer)) {
      return new NServer();
    }
    // save server options
    this._options = [options.port || '80'];
    if (options.hostname) {
      this._options.push(options.hostname);
    }
    this._app = koa();
    this._app.port = this._options;
    // proxy header fields will be trusted
    this._app.proxy = true;
    // error handler
    this._app.on('error', this._handleException.bind(this));
    // overwrite session store
    let sess = Object.assign(
      {
        cookie: {
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        }
      },
      options.session,
      {
        store: new (require('../dao/cache/Redis'))()
      }
    );

    this._app.keys = options.keys || ['NEI_SECRECT'];
    this._app.config = options;

    // add common middleware
    options.view.root = path.join(
      options.roots.appRoot,
      options.roots.viewRoot
    );

    // bodyParser
    let bodyOpt = {
      strict: false,
      jsonLimit: '20mb'
    };
    if (options.roots.uploadRoot) {
      // 存在文件上传的情况
      let uploadDir = path.join(options.roots.appRoot, options.roots.uploadRoot);
      try {
        fs.accessSync(uploadDir);
      } catch (ex) {
        fs.mkdirSync(uploadDir);
      }

      bodyOpt = Object.assign({
        multipart: true,
        uploadDir
      }, bodyOpt);
    }

    this.use([
      require('koa-static')(
        path.join(
          options.roots.appRoot,
          options.roots.webRoot
        ), process.appConfig.static || {}
      ),
      require('koa-better-body')(bodyOpt),
      require('koa-generic-session')(sess),
      require('../middleware/error'),
      require('../middleware/filter')(options),
      require('../middleware/router')(options),
      require('../middleware/view')(options.view)
    ]);
  }

  /**
   * handle error
   * @private
   * @param  {Error} err - error information
   * @return {Void}
   */
  _handleException(err) {
    log.error(err);
  }

  /**
   * support use middleware list
   * @param  {Array|GeneratorFunction} mw - middlewares
   * @return {Void}
   */
  use(mw) {
    if (Array.isArray(mw)) {
      mw.forEach(this.use, this);
      return;
    }
    this._app.use(mw);
  }

  /**
   * startup server
   * @return {Void}
   */
  start() {
    if (!this._server) {
      log.info(
        '[%s.constructor] start server on port %s',
        this.constructor.name, this._options[0]
      );
      this._server = this._app.listen(...(this._options));
    }
  }

  /**
   * stop server
   * @return {Void}
   */
  stop() {
    if (this._server) {
      this._server.close();
      delete this._server;
    }
  }
}

module.exports = NServer;
