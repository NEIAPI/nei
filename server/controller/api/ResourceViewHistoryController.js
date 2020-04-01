const log = require('../../util/log');
const NController = require('../../arch/NController');
const ResourceViewHistoryService = require('../../service/ResourceViewHistoryService');

class ResourceViewHistoryController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new ResourceViewHistoryService(this._uid, context);
  }

  * getList() {
    log.debug(
      '[API.%s.getList] getList',
      this.constructor.name
    );

    let ret = yield this._service.getListForUser(this._uid);

    this.setModel(ret);
    yield this.next();
  }
}

module.exports = ResourceViewHistoryController;
