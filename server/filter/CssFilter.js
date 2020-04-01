const fs = require('fs');
const log = require('../util/log');
const path = require('path');
const _ = require('../util/utility');
const NFilter = require('../arch/NFilter');

class CssFilter extends NFilter {
  * doFilter() {
    log.debug(
      '[%s] do css filter',
      this.constructor.name
    );

    let url = this._context.request.url;
    var queryIndex = url.indexOf('?');
    if (queryIndex > -1) {
      url = url.substring(0, queryIndex);
    }
    let basePath = path.join(process.appConfig.appRoot, process.appConfig.webRoot || '/webapp');
    let cssfile = path.join(basePath, url);
    let basename = path.basename(cssfile, '.css');
    if (basename.startsWith('_')) {
      return;
    }
    let mcssfile = path.join(path.dirname(cssfile), `${basename}.mcss`);
    try {
      let nocss;
      try {
        fs.accessSync(cssfile);
      } catch (ex) {
        nocss = true;
      }
      fs.accessSync(mcssfile);
      if (nocss) {
        let text = yield _.translateMcss(mcssfile);
        this._context.response.set('Content-type', 'text/css');
        this._context.model = text;
      } else {
        let cssstat = fs.statSync(cssfile);
        let mcssstat = fs.statSync(mcssfile);
        if (cssstat.mtime < mcssstat.mtime) {
          let text = yield _.translateMcss(mcssfile);
          this._context.model = text;
          this._context.response.set('Content-type', 'text/css');
        }
      }
    } catch (ex) {
      return;
    }

    return yield super.chain();
  }
}

module.exports = CssFilter;
