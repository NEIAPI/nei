const log = require('../../util/log');
const NController = require('../../arch/NController');
const ResourceWatchService = require('../../service/ResourceWatchService');

class ResourceWatchController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new ResourceWatchService(this._uid, context);
  }

  /**
   * 获取当前登录用户的关注资源列表
   */
  * getList() {
    log.debug(`[API.${this.constructor.name}.getList] getList`);

    let ret = yield this._service.getList();
    this.setModel(ret);

    yield this.next();
  }
}

module.exports = ResourceWatchController;
