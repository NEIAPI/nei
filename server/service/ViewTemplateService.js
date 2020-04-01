/**
 * ViewTemplate Service Class
 */

class ViewTemplateService extends require('./NService') {
  constructor(context) {
    super(context);
    this._dao = new (require('../dao/ViewTemplateDao'))({context});
  }
}

module.exports = ViewTemplateService;
