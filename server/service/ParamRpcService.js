/**
 * Rpc Parameter Service Class
 */

class ParamRpcService extends require('./AttributeService') {
  constructor(uid, context, dao) {
    super(uid, context, '../dao/RpcDao', dao);
  }
}

module.exports = ParamRpcService;
