/**
 * Header Service Class
 */

class HeaderResService extends require('./HeaderService') {
  constructor(uid, context) {
    super(uid, context, '../dao/InterfaceHeaderResDao');
  }
}

module.exports = HeaderResService;
