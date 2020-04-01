const path = require('path');
const log = require('../../util/log');
const _ = require('../../util/utility');
const db = require('../../../common').db;
const Mysql = require('../../dao/db/Mysql');
const NController = require('../../arch/NController');
const UserService = require('../../service/UserService');
const UserLoginService = require('../../service/UserLoginService');
const ProjectDao = require('../../dao/ProjectDao');
const BisGroupDao = require('../../dao/BisGroupDao');
const ProGroupDao = require('../../dao/ProGroupDao');
const NotificationSettingDao = require('../../dao/NotificationSettingDao');
const IllegalRequestError = require('../../error/fe/IllegalRequestError');

class UserController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new UserService(context);
    this._userLoginService = new UserLoginService(context);
    this._userService = new UserService(context);
    this._projectDAO = new ProjectDao({context});
    this._bisgroupDAO = new BisGroupDao({context});
    this._progroupDAO = new ProGroupDao({context});
    this._notificaitonDAO = new NotificationSettingDao({context});
  }

  * getList() {
    log.debug(
      '[API.%s.getList] getList',
      this.constructor.name
    );
    let rule = {
      v: {required: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.search(data.v, this._uid);
    this.setModel(ret);

    yield this.next();
  }

  * registerFromSite() {
    let postData = this._context.body;

    log.debug(
      '[API.%s.register] user register',
      this.constructor.name, postData
    );

    let rule = {
      username: {required: true, value: /[a-zA-Z][a-zA-Z0-9_]{5,15}/},
      password: {required: true},
      realname: {required: true},
      company: {required: true, value: /.+/},
      role: {required: true, isNumber: true}
    };
    let userData = _.validate(postData, rule);

    userData.realnamePinyin = _.toPinyin(userData.realname);
    userData.passwordSalt = _.randString(20);
    userData.password = _.encryptPwd(userData.password, userData.passwordSalt, userData.username);

    let user = yield this._userService.register(userData);
    if (user) {
      yield this.initUserDefaultProgroup(user);
      this._context.model = this.wrapRet(user);
    }
    yield super.next();
  }

  * initUserDefaultProgroup(user) {
    yield Mysql.beginTransaction(this._context);
    let uid = user.id;
    // 添加默认项目分组
    let pgret = yield this._progroupDAO.create({
      type: db.PRG_TYP_DEFAULT,
      name: '默认项目组',
      namePinyin: _.toPinyin('默认项目组'),
      creatorId: uid,
      toolKey: _.md5(_.randString(32, false, true))
    });

    yield this._progroupDAO.update({
      toolKey: _.getToolKey(pgret.id, true),
      id: pgret.id
    });

    let pjret = yield this._projectDAO.create({
      type: db.PRO_TYP_COMMON,
      name: '公共资源库',
      namePinyin: _.toPinyin('公共资源库'),
      creatorId: uid,
      progroupId: pgret.id,
      toolKey: _.md5(_.randString(32, false, true))
    });

    yield this._projectDAO.update({
      toolKey: _.getToolKey(pjret.id),
      id: pjret.id
    });

    yield this._bisgroupDAO.create({
      type: db.PRO_TYP_COMMON,
      name: '默认分组',
      namePinyin: _.toPinyin('默认分组'),
      creatorId: uid,
      respoId: uid,
      progroupId: pgret.id,
      projectId: pjret.id,
    });

    yield this._notificaitonDAO.create({
      userId: uid,
      flag: 1,
      methodEmail: 1,
      methodPaopao: 1
    });

    yield Mysql.endTransaction(this._context);
    return user;
  }

  * bind() {
    log.debug(
      '[API.%s.bind] bind',
      this.constructor.name
    );
    let body = this._context.body;
    let email = body.email;
    let phone = body.phone;

    if (!((email && !phone) || (!email && phone))) {
      throw helper.buildError('BAD_REQUEST', 'TypeError');
    }

    let captcha = _.randString(6, true); // 生成验证码
    let ret = yield this._service.bind(this._uid, {email, captcha});
    this.setModel(ret);

    this._session.user._captcha = captcha;
    this._session.user._email = email;
    this._session.user._phone = phone;
    this._session.user.isBind = true;

    yield this.next();
  }

  * verify() {
    log.debug(
      '[API.%s.verify] verify',
      this.constructor.name
    );
    let rule = {
      code: {required: true}
    };
    let data = this.validate(rule, 'body');
    let captcha = data.code;

    let obj = Object.assign({}, this._context.session.user);
    obj.captcha = captcha;
    let ret = yield this._service.verifyCaptcha(this._uid, obj);
    this.setModel(ret);

    //验证完成 清楚标记
    delete this._session.user._isEmail;
    delete this._session.user._isUnbind;
    this._session.user = ret; // 修改了user

    yield this.next();
  }

  * unbind() {
    log.debug(
      '[API.%s.unbind] unbind',
      this.constructor.name
    );
    let rule = {
      isEmail: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');

    let captcha = _.randString(6, true); // 生成验证码
    data.captcha = captcha;
    data.email = this._session.user.email;
    data.phone = this._session.user.phone;
    let ret = yield this._service.unbind(this._uid, data);
    this.setModel(ret);

    this._session.user._captcha = captcha;
    this._session.user._isEmail = data.isEmail;

    yield this.next();
  }

  * update() {
    let userId = this._session.user.id;
    let rule = {
      email: {},
      phone: {},
      realname: {},
      portrait: {},
      company: {},
      role: {isNumber: true, value: /^[0-8]$/},
      blog: {},
      github: {},
      weixin: {},
      yixin: {},
      paopao: {},
      qq: {},
      jobTime: {isNumber: true}
    };

    let data = this.validate(rule, 'body');
    data.id = userId;
    if (data.hasOwnProperty('realname')) {
      data['realname_pinyin'] = _.toPinyin(data.realname);
    }
    let ret = yield this._service.update(data);
    this._session.user = ret;
    this.setModel(ret);
  }

  * loginFromSite() {
    log.debug(
      '[API.%s.loginFromSite] user login from site',
      this.constructor.name
    );

    let rule = {
      username: {required: true, value: /[a-zA-Z]\w{5,15}/},
      password: {required: true}
    };

    let data = this.validate(rule, 'body');
    let user = yield this._userService.login(data);
    yield this.login(user, db.USR_FRM_SITE);
  }

  * login(user, frm) {
    if (!user) {
      throw new IllegalRequestError('invalid user');
    }
    yield this._userLoginService.create({
      userId: user.id,
      loginFrom: frm
    });
    this._session.user = user;
    let returnUrl = '/dashboard';
    if (this._query && this._query['url'] && this._query['url'].startsWith('/')) {
      returnUrl = path.normalize(this._query.url);
    }
    returnUrl = decodeURIComponent(returnUrl);
    this.setModel({url: returnUrl});
    yield this.next();
  }

  * logout() {
    log.debug(
      '[API.%s.logout] logout',
      this.constructor.name
    );

    let ctx = this._context;
    let session = ctx.session;
    delete session.user;

    return this.redirect('/login');
  }
}

module.exports = UserController;
