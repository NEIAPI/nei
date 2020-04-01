const db = require('../../common').db;
const ResourceDao = require('./ResourceDao');

class TestcaseDao extends ResourceDao {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_TESTCASE,
      owner: 'interfaceId',
      defOwner: db.API_SYS_HIDDEN
    }, sqlOpt);
    this._Model = require('../model/db/InterfaceTestcase');
  }

  * getListWithProjectId(pids) {
    let ret = this._getUserJoins();
    ret.push({
      table: 'interface',
      fkmap: {id: 'interface_id'},
      conds: {project_id: pids}
    });
    return yield this.search({
      joins: ret
    });
  };
}

module.exports = TestcaseDao;
