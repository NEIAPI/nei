const db = require('../../common').db;

class ViewTemplateDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ViewTemplate');
  }
}

ViewTemplateDao['__history'] = {
  addText: '添加模板 %s 到页面 %s',
  delText: '从页面 %s 移除模板 %s',
  _rel: {
    parent: {
      dao: 'ViewDao',
    },
    child: {
      dao: 'TemplateDao'
    }
  },
  resType: db.RES_TYP_WEBVIEW,
};


module.exports = ViewTemplateDao;
