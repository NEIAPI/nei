const log = require('../util/log');
const mailService = require('./MailService');
const _ = require('../util/utility');
const dbMap = require('../../common').db;
const NotFoundError = require('../error/fe/NotFoundError');
const IllegalRequest = require('../error/fe/IllegalRequestError');

const _filter = (function () {
  const SENSITIVE_FIELDS = ['password', 'passwordSalt'];

  return function (user) {
    for (let field of SENSITIVE_FIELDS) {
      delete user[field];
    }
    return user;
  };
})();

class UserService extends require('./NService') {
  constructor(context) {
    super(context);
    this._dao = new (require('../dao/UserDao'))({context});
    this._cache = new (require('../dao/cache/Redis'))();
    this._puDAO = new (require('../dao/ProGroupUserDao'))({context});
  }

  * create(user) {
    return yield this._dao.create(user);
  }

  * getUserByEmail(email) {
    return yield this._dao.getUserByEmail(email);
  }

  * getUserById(id) {
    return yield this._dao.find(id);
  }

  * getUserByUserName(username, from) {
    return yield this._dao.getUserByUserName(username, from);
  }

  * getAllUsers() {
    return yield this._dao.getAllUsers();
  }

  * login(data) {
    log.debug(
      '[%s.login] user %s login with password %s',
      this.constructor.name, data.username, data.password
    );
    let user = yield this._dao.getUserByUserName(data.username, dbMap.USR_FRM_SITE);
    if (!user) {
      throw new NotFoundError(
        `can't find user with username ${data.username}`
      );
    }

    let password = _.encryptPwd(data.password, user.passwordSalt, user.username);
    if (user.password !== password) {
      throw new IllegalRequest(
        'password is incorrect'
      );
    }

    return _filter(user);
  }

  * register(data) {
    log.debug(
      '[%s.register] register with username %s',
      this.constructor.name, data.username
    );

    let user = yield this.create(data);
    return _filter(user);
  }

  /**
   * stick progroup
   * @param  {Object} obj - stick data
   * @param  {Number} obj.progroupId - id of the progroup to be operated
   * @param  {Boolean} obj.isTop - stick or unstick
   * @param  {Number} obj.uid - user id
   * @return {Array} progroup order list
   */
  * stickProg({progroupId, isTop, uid}) {
    log.debug(
      '[%s.stickProg] stick progroup',
      this.constructor.name
    );

    // the user should have access to the progroup
    let user = yield this._dao.search({
      sfields: ['progroupTopList'],
      conds: {'id': uid},
      joins: [{
        table: 'progroup_user',
        fkmap: {'user_id': 'id'},
        conds: {
          'progroup_id': progroupId
        }
      }]
    });
    if (!user.length) {
      throw new IllegalRequest('找不到用户', {id: uid});
    }

    let progTopList = (user[0].progroupTopList || '').replace(/\s/g, '') || '';
    if (isTop) {
      progTopList = _.strPad(progTopList, progroupId, 'add');
    } else {
      progTopList = _.strPad(progTopList, progroupId); //remove from top list
    }

    yield this._dao.update({
      id: uid,
      progroupTopList: progTopList
    });
    user = yield this.getById(uid);
    this._context.session.user = user;

    let proGroupUsers = yield this._puDAO.search({
      field: {progroup_id: 'DISTINCT'},
      conds: {user_id: uid}
    }) || [];

    let ret = proGroupUsers.map((pgUser) => {
      let pgid = pgUser.progroupId;
      return {
        id: pgid,
        isTop: new RegExp(`.*${pgid}.*`).test(progTopList)
      };
    });
    ret = _.sortWithOrderList(ret, [user.progroupTopList, user.progroupOrderList]);

    return ret;
  }

  /**
   * sort progroups
   * @param  {Object} obj - sort data
   * @param  {Object} obj.ids - ordered id list
   * @param  {Object} obj.type - order type
   * @param  {Object} obj.uid - user id
   * @return {Array} progroup order list
   */
  * sortProg({ids, type: progroupOrder, uid}) {
    log.debug('[UserService.sortProgroup] - sort progroups :%s', {ids, progroupOrder, uid});

    let data = {
      id: uid,
      progroupOrder,
      progroupOrderList: ids.join(',')
    };

    let progroupUser = yield this._puDAO.search({
      conds: {user_id: uid, progroup_id: ids}
    }) || [];

    if (!_.isArraySameValues(
        progroupUser.map(item => item.progroupId), ids)) {
      throw new IllegalRequest(
        '参数和项目组长度或者内容不匹配', {
          id: ids
        }
      );
    }

    yield this._dao.update(data);
    return ids.map(item => {
      return {id: item};
    });
  }

  /**
   * search users
   * openid can search openid users. non openid can only search non-openid users
   * @param  {String} v - search criteria
   * @param  {Number} uid - user id
   * @return {Array db/model/User} users list
   */
  * search(v, uid) {
    let user = yield this._dao.find(uid);
    let opt = {
      conds: {
        id: {
          op: '!=',
          value: dbMap.USR_ADMIN_ID
        },
        username: {
          op: 'like',
          value: `%${v}%`
        }
      },
      sfields: this._dao.USER_DETAIL_EXPORT_FIELD
    };

    if (user.from === dbMap.USR_FRM_OPENID) {
      Object.assign(opt.conds, {'from': dbMap.USR_FRM_OPENID});
    } else {
      // for non-openid, return the top fives of the matching
      Object.assign(opt.conds, {
        'from': {op: '!=', value: dbMap.USR_FRM_OPENID}
      });
    }
    opt.pages = {
      offset: 0,
      limit: 5
    };
    return yield this._dao.search(opt);
  }

  /**
   * bind email or phone. Do email for now
   * @param  {Number} uid - user id
   * @param  {Object} options
   * @param  {String} options.email - email address
   * @param  {String} options.captcha - captcha
   * @return
   */
  * bind(uid, {email, captcha}) {
    log.debug('[UserService.bind] - bind email', {uid, email, captcha});

    let user = yield this._dao.find(uid);

    if (user.emailState === dbMap.CMN_FLG_ON) {
      // already in bind state
      throw new IllegalRequest('当前用户已绑定邮箱');
    }

    let bindUsers = yield this._dao.search({
      conds: {
        email,
        emailState: dbMap.CMN_FLG_ON
      }
    });

    if (!!bindUsers.length) {
      throw new IllegalRequest('当前邮箱已被绑定');
    }

    yield mailService.send('绑定邮箱密码找回验证码', [email], {
      title: 'NEI验证码',
      type: 'captcha-bind',
      name: user.realname || user.username,
      captcha
    });
    return [];
  }

  /**
   * unbind email or phone. Do email for now
   * @param  {Number} uid - user id
   * @param  {Object} options
   * @param  {String} options.email - email address
   * @param  {String} options.captcha - captcha
   * @return
   */
  * unbind(uid, {email, captcha}) {
    log.debug('[UserService.unbind] - unbind email', {uid, email, captcha});

    let user = yield this._dao.find(uid);

    yield mailService.send('解绑邮箱验证码', [email], {
      title: 'NEI验证码',
      type: 'captcha-unbind',
      name: user.realname || user.username,
      captcha
    });
    return [];
  }

  /**
   * verify captcha for binding email
   * @param  {Number} uid - user id
   * @param  {Object} options
   * @param  {String} options.isBind - true for bind and false for unbind
   * @param  {String} options.captcha - captcha
   * @param  {String} options._captcha - captcha stored in session at bind stage
   * @param  {String} options._email - email stored in session at bind stage
   */
  * verifyCaptcha(uid, {
    isBind = false,
    captcha,
    _captcha: captchaInSession,
    _email: email
  }) {
    log.debug('[UserService.verifyCaptcha] - verify captcha', {uid, email, captcha});

    if (!captcha || !captchaInSession || String(captcha) !== captchaInSession) {
      throw new IllegalRequest('验证码错误');
    }

    if (!!isBind) {
      if (!!email) {
        yield super.update({id: uid, email, emailState: dbMap.CMN_FLG_ON});
      }
    } else {
      yield this._dao.update({id: uid, emailState: dbMap.CMN_FLG_OFF});
    }

    let user = yield this._dao.find(uid);
    return _filter(user);
  }
}

module.exports = UserService;
