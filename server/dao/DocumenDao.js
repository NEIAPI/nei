const db = require('../../common/config/db.json');
const ResourceDao = require('./ResourceDao');

class DocumenDao extends ResourceDao {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_DOCUMENT
    }, sqlOpt);
    this._Model = require('../model/db/Document');
  }

  * __$getListInProjects(pids) {
    return yield this.search({
      sfields: ['id', 'name', 'project_id'],
      conds: Object.assign({
        project_id: pids
      }, this._getResTypeFilter()),
      joins: this._getUserJoins()
    });
  }
}

DocumenDao['__history'] = {
  addText: '新建文档%s',
  delText: '删除文档%s',
  updateText: '更新文档信息',
  resType: db.RES_TYP_DOCUMENT,
};

module.exports = DocumenDao;
