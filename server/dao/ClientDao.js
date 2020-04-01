const db = require('../../common/config/db.json');
const ResourceDao = require('./ResourceDao');

class ClientDao extends ResourceDao {
  constructor(sqlOpt) {
    super({
      type: db.RES_TYP_CLIENT
    }, sqlOpt);
    this._Model = require('../model/db/Clients');
  }

  /**
   * search client by resource ids and type
   * @param {Array} ids
   */
  * getListByResource(ids, resType) {
    return yield this.search({
      joins: [{table: 'resource_client', conds: {res_id: ids, res_type: resType}, fkmap: {client_id: 'id'}}]
    });
  }
}

ClientDao['__history'] = {
  addText: '新建客户端 %s',
  delText: '删除客户端 %s',
  updateText: {
    name: {
      text: '更新客户端 %s 名称为 %s，旧值是 %s'
    },
    downloadLink: {
      text: '更新客户端 %s 下载链接为 %s，旧值是 %s'
    },
    groupId: {
      text: '将客户端 %s 所在的业务分组调整为 %s，旧值是 %s'
    },
    respoId: {
      text: '修改客户端 %s 负责人为 %s，旧值是 %s'
    },
    description: {
      text: '更新客户端 %s 描述为 %s，旧值是 %s'
    },
    version: {
      text: '更新客户端 %s 的版本为 %s，旧值是 %s'
    },
    launchDate: {
      text: '更新客户端 %s 的上线日期为 %s，旧值是 %s'
    },
    closeDate: {
      text: '更新客户端 %s 的下线日期为 %s，旧值是 %s'
    },
    tag: {
      text: '更新客户端 %s 标签为 %s，旧值是 %s'
    },
  },
  resType: db.RES_TYP_CLIENT,
};

module.exports = ClientDao;
