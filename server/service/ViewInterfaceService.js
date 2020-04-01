/**
 * ViewInterface Service Class
 */

class ViewInterfaceService extends require('./NService') {
  constructor(context) {
    super(context);
    this._dao = new (require('../dao/ViewInterfaceDao'))({context});
  }
}

module.exports = ViewInterfaceService;
