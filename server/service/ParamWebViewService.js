/**
 * Web View Parameter Service Class
 */

class ParamWebViewService extends require('./AttributeService') {
  constructor(uid, context) {
    super(
      uid, context, '../dao/ViewDao',
      '../dao/ParamWebViewDao'
    );
  }
}

module.exports = ParamWebViewService;
