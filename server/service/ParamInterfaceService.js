/**
 * Interface Parameter Service Class
 */

class ParamInterfaceService extends require('./AttributeService') {
  constructor(uid, context, dao) {
    super(uid, context, '../dao/InterfaceDao', dao);
  }
}

module.exports = ParamInterfaceService;
