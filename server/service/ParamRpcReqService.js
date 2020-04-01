/**
 * Rpc request Parameter Service Class
 */

class ParamRpcReqService extends require('./ParamRpcService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ParamRpcReqDao');
  }
}

module.exports = ParamRpcReqService;
