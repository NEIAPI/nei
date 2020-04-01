const log = require('../../util/log');
const _ = require('../../util/utility');
const NController = require('../../arch/NController');

class SiteController extends NController {
  constructor(context, next) {
    super(context, next);
  }

  * index() {
    yield super.next();
  }

  * tutorial() {
    yield super.next();
  }

  * home() {
    log.debug(
      '[API.%s.home] home page',
      this.constructor.name
    );

    let user = {};
    [
      'id',
      'username',
      'email',
      'emailState',
      'phone',
      'phoneState',
      'realname',
      'realnamePinyin',
      'portrait',
      'from',
      'company',
      'role',
      'blog',
      'github',
      'weixin',
      'yixin',
      'paopao',
      'qq',
      'jobTime',
      'createTime',
      'progroupOrder',
      'progroupOrderList',
      'progroupTopList'
    ].forEach(key => {
      user[key] = this._context.session.user[key];
    });
    user = _.escapeHtml(user);

    this._context.model = {
      title: '接口管理平台',
      description: '接口管理平台',
      user,
      nosServer: process.appConfig.nos.server || ''
    };
    let isDebug = process.appConfig.mode === 'develop';
    if (isDebug) {
      this._context.model.isDebug = true;
    }

    yield this.next();
  }
}

module.exports = SiteController;
