const db = require('../../common').db;

class ViewInterfaceDao extends require('./NDao') {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ViewInterface');
  }
}

ViewInterfaceDao['__history'] = {
  addText: '添加接口 %s 到页面 %s',
  delText: '从页面 %s 移除接口 %s',
  _rel: {
    parent: {
      dao: 'ViewDao',
    },
    child: {
      dao: 'InterfaceDao'
    }
  },
  resType: db.RES_TYP_WEBVIEW,
};

module.exports = ViewInterfaceDao;
