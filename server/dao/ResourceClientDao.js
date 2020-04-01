let dbMap = require('../../common').db;
const NDao = require('./NDao');

class ResourceClientDao extends NDao {
  constructor(sqlOpt) {
    super(sqlOpt);
    this._Model = require('../model/db/ResourceClient');
  }

  /**
   * 根据projectId找到该项目所有的客户端
   * @param projectId
   * @return {*}
   */
  * getListInProject(projectId) {
    return yield this.search({
      conds: {projectId: projectId}
    });
  }


  /**
   * 根据id和projectIds找到引用该客户端的资源ID
   * @param ids
   * @param projectIds
   * @return {*}
   */
  * getQuotesById(ids, projectIds) {
    return yield this.search({
      sfields: ['res_id'],
      conds: {clientId: ids, projectId: projectIds}
    });
  }
}

ResourceClientDao['__history'] = {
  delText: '将 %s 请出项目组 %s ( %s)',
  updateText: '指派 %s 为项目组 %s 的 %s',
  resType: dbMap.RES_TYP_,
};

module.exports = ResourceClientDao;
