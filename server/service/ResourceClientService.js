/**
 * Resource Client Service Class
 */
const log = require('../util/log');
const ClientDao = require('../dao/ClientDao');
const ResourceClientDao = require('../dao/ResourceClientDao');
const ResourceService = require('./ResourceService');


class ResourceClientService extends ResourceService {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._dao = new ResourceClientDao({context});
    this._clidao = new ClientDao({context});
  }

  /**
   * set clients for a single resource
   */
  * setClients({
    res_id: resId,
    client_ids: clientIds,
    project_id: projectId,
    progroup_id: progroupId,
    res_type: resType
  }) {
    log.debug('[ResourceClientService.setClients] - set clients for resource:%s, type: %d', resId, resType);

    // delete all clients bind by the resource
    yield this._dao.removeBatch({
      res_type: resType,
      res_id: resId
    });
    if (clientIds.length == 0) {
      return [];
    }
    let models = clientIds.map(clientId => {
      return {
        res_id: resId,
        client_id: clientId,
        project_id: projectId,
        progroup_id: progroupId,
        res_type: resType
      };
    });
    let createClients = yield this._dao.createBatch(models);
    let createIds = createClients.map(it => it.resId);
    return yield this.getListBatch(createIds, resType);

  }


  * setClientsBatch({
    res_id: resIds,
    client_ids: clientIds,
    project_id: projectId,
    res_type: resType
  }) {
    log.debug('[ResourceClientService.setClients] - set clients for resource:%s, type: %d', resIds, resType);
    let r = yield this._checkCreatePermission(projectId);
    let progroupId = r.progroupId;

    let models = [];

    clientIds.forEach(clientId => {
      models.concat(resIds.map(resId => {
        return {
          res_id: resId,
          client_id: clientId,
          project_id: projectId,
          progroup_id: progroupId,
          res_type: resType
        };
      }));
    });
    return yield this._dao.createBatch(models);
  }

  /**
   *
   * @param {Array} res_ids
   * @param res_type
   * @return {Object}
   */
  * getListBatch(res_ids, res_type) {
    return yield this._clidao.search({
      sfields: this._dao.CLIENT_EXPORT_FIELD,
      joins: [
        {
          table: 'resource_client',
          field: ['res_id'],
          fkmap: {client_id: 'id'},
          conds: {resId: res_ids, resType: res_type},
        }
        , ...this._clidao._getUserJoins()]
    });
  }

}

module.exports = ResourceClientService;
