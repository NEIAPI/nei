/**
 * Header Service Class
 */

class HeaderReqService extends require('./HeaderService') {
  constructor(uid, context) {
    super(uid, context, '../dao/InterfaceHeaderReqDao');
  }
}

module.exports = HeaderReqService;
