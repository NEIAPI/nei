const log = require('../../util/log');
const NController = require('../../arch/NController');
const ProGroupService = require('../../service/ProGroupService');
const ProGroupUserService = require('../../service/ProGroupUserService');
const ProGroupApiSpecService = require('../../service/ProGroupApiSpecService');
const UserService = require('../../service/UserService');

class ProgroupController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new ProGroupService(this._uid, context);
    this._progroupUserService = new ProGroupUserService(this._uid, context);
    this._progroupApiSpecService = new ProGroupApiSpecService(this._uid, context);
    this._userService = new UserService(context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );
    let rule = {
      name: {required: true},
      description: {}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
    this.setModel(ret);

    yield this.next();
  }

  * getList() {
    log.debug(
      '[API.%s.getList] getList',
      this.constructor.name
    );

    let ret = yield this._service.getProgroupsForUser();
    this.setModel(ret);

    yield this.next();
  }

  /**
   * get progroup by id
   * @return {Void}
   */
  * getProgroupById() {
    log.debug(
      '[API.%s.getProgroupById] get progroup by id %s',
      this.constructor.name, this._context._id
    );

    let id = this._context._id;
    let ret = yield this._service.getProgroupDetailById(id);
    this.setModel(ret);

    yield this.next();
  }

  * update() {
    log.debug(
      '[API.%s.update] update',
      this.constructor.name
    );
    const id = this._context._id;
    const httpSpecRule = {
      path: {},
      pathDescription: {},
      param: {},
      paramDescription: {},
      paramdesc: {},
      paramdescDescription: {},
      method: {},
      methodDescription: {},
      tag: {},
      tagDescription: {},
      resSchema: {},
      resSchemaDescription: {},
      interfaceSchema: {},
      interfaceSchemaDescription: {}
    };
    const rule = {
      name: {},
      type: {isNumber: true},
      logo: {},
      toolSpecWeb: {isNumber: true},
      toolSpecAos: {isNumber: true},
      toolSpecIos: {isNumber: true},
      toolSpecTest: {isNumber: true},
      verificationRole: {isNumber: true},
      verification: {isNumber: true},
      projectOrderList: {},
      projectOrder: {isNumber: true},
      description: {},
      creatorId: {isNumber: true},
      apiAudit: {isNumber: true},
      apiUpdateControl: {isNumber: true},
      showPublicList: {isNumber: true},
      httpSpec: {rule: httpSpecRule},
      useWordStock: {isNumber: true},
    };
    const data = this.validate(rule, 'body');
    data.id = id;

    let ret = {};
    if (data.httpSpec) {
      // 更新或者创建 http 接口规范
      ret = yield this._progroupApiSpecService.updateOrCreateHttpSpec(data);
    } else {
      ret = yield this._service.update(data);
    }

    this.setModel(ret);
    yield this.next();
  }

  * remove() {
    log.debug(
      '[API.%s.remove] remove',
      this.constructor.name
    );
    let id = this._context._id;

    let ret = yield this._service.remove(id);
    this.setModel(ret);

    yield this.next();
  }

  * stick() {
    log.debug(
      '[API.%s.stick] stick',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      v: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._userService.stickProg({progroupId: id, isTop: data.v, uid: this._uid});
    this.setModel(ret);

    yield this.next();
  }

  * lock() {
    log.debug(
      '[API.%s.lock] lock',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      v: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.update({id, isLock: data.v});
    this.setModel(ret);

    yield this.next();
  }

  * quit() {
    log.debug(
      '[API.%s.quit] quit',
      this.constructor.name
    );
    let id = this._context._id;
    let ret = yield this._progroupUserService.quitProg(id);
    this.setModel(ret);

    yield this.next();
  }

  * changeCreator() {
    log.debug(
      '[API.%s.changeCreator] change creator',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      toId: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._progroupUserService.changeProgCreator(id, data.toId);
    this.setModel(ret);

    yield this.next();
  }

  * setMembers() {
    log.debug(
      '[API.%s.setMembers] set members',
      this.constructor.name
    );
    let id = this._context._id;
    let userRule = {
      action: {required: true},
      id: {required: true, isNumber: true},
      role: {required: true, isNumber: true}
    };
    let rule = {
      users: {isArray: true, rule: userRule}
    };
    let data = this.validate(rule, 'body');
    data.id = id;
    let ret = yield this._progroupUserService.setUserForProg(data);
    this.setModel(ret);

    yield this.next();
  }

  * sort() {
    log.debug(
      '[API.%s.sort] sort',
      this.constructor.name
    );
    let rule = {
      ids: {required: true, isArray: true, value: /^\d+$/},
      type: {required: true, isNumber: true, value: /^[0-6]$/}
    };
    let data = this.validate(rule, 'body');
    data.uid = this._uid;
    let ret = yield this._userService.sortProg(data);
    this.setModel(ret);

    yield this.next();
  }

  * search() {
    log.debug(
      '[API.%s.search] search',
      this.constructor.name
    );
    let rule = {
      v: {required: true},
      offset: {required: true, isNumber: true},
      limit: {required: true, isNumber: true},
      total: {isBoolean: true}
    };
    let data = this.validate(rule);
    let ret = yield this._service.search(data);
    ret.list = ret.list.map(item => {
      return {
        id: item.id,
        name: item.name,
        namePinyin: item.namePinyin,
        creator: {
          realname: item.ext.creator.realname,
          realnamePinyin: item.ext.creator.realnamePinyin,
        }
      };
    });
    this.setModel(ret.list, data.total ? {total: ret.total} : {});

    yield this.next();
  }
}

module.exports = ProgroupController;
