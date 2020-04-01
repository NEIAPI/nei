/**
 * Template Parameter Service Class
 */

class ParamTemplateService extends require('./AttributeService') {
  constructor(uid, context) {
    super(
      uid, context, '../dao/TemplateDao',
      '../dao/ParamTemplateDao'
    );
  }
}

module.exports = ParamTemplateService;
