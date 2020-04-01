const log = require('../../util/log');
const db = require('../../../common').db;
const NController = require('../../arch/NController');
const ProjectService = require('../../service/ProjectService');
const ProGroupService = require('../../service/ProGroupService');

class ProjectController extends NController {
  constructor(context, next) {
    super(context, next);
    this._service = new ProjectService(this._uid, context);
    this._progroupService = new ProGroupService(this._uid, context);
  }

  * create() {
    log.debug(
      '[API.%s.create] create',
      this.constructor.name
    );

    let rule = {
      name: {required: true},
      progroupId: {required: true, isNumber: true},
      description: {},
      lob: {}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.create(data);
    this.setModel(ret);

    yield this.next();
  }

  * clone() {
    log.debug(
      '[API.%s.clone] clone',
      this.constructor.name
    );

    let rule = {
      name: {required: true},
      description: {},
      lob: {},
      projectId: {required: true, isNumber: true},
      progroupId: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.clone(data);
    this.setModel(ret);

    yield this.next();
  }

  * findRecent() {
    log.debug(
      '[API.%s.findRecent] findRecent',
      this.constructor.name
    );

    let ret = yield this._service.findRecent();
    this.setModel(ret);

    yield this.next();
  }

  /**
   * get project by id
   * @return {Void}
   */
  * getProjectById() {
    log.debug(
      '[API.%s.getProjectById] get project by id %s',
      this.constructor.name, this._context._id
    );
    // use as an example
    yield super.getById();
  }

  * update() {
    log.debug(
      '[API.%s.update] update',
      this.constructor.name
    );
    let id = this._context._id;

    let rule = {
      logo: {},
      hostId: {isNumber: true},
      toolSpecWeb: {isNumber: true},
      toolSpecAos: {isNumber: true},
      toolSpecIos: {isNumber: true},
      toolSpecTest: {isNumber: true},
      name: {},
      lob: {},
      description: {},
      authType: {isNumber: true},
      resParamRequired: {isNumber: true},
      useWordStock: {isNumber: true},
    };
    let data = this.validate(rule, 'body');
    data.id = id;
    let ret;
    if ((Object.keys(data).length === 2) && ('hostId' in data)) {
      ret = yield this._service.update(data, {field: 'hostId'});
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
    let ret = yield this._progroupService.stickProject({projectId: id, isTop: data.v});
    this.setModel(ret);

    yield this.next();
  }

  * changeCreator() {
    log.debug(
      '[API.%s.changeCreator] changeCreator',
      this.constructor.name
    );
    let id = this._context._id;
    let rule = {
      toId: {required: true, isNumber: true}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._service.changeCreator({id, toId: data.toId});
    this.setModel(ret);

    yield this.next();
  }

  * rtk() {
    log.debug(
      '[API.%s.rtk] rtk',
      this.constructor.name
    );
    let id = this._context._id;
    let ret = yield this._service.rtk(id);
    this.setModel(ret);

    yield this.next();
  }

  * sort() {
    log.debug(
      '[API.%s.sort] sort',
      this.constructor.name
    );
    let rule = {
      pgId: {required: true, isNumber: true},
      ids: {required: true, isArray: true, value: /^\d+$/},
      type: {required: true, isNumber: true, value: /^[0-6]$/}
    };
    let data = this.validate(rule, 'body');
    let ret = yield this._progroupService.sortProject(data);
    this.setModel(ret);

    yield this.next();
  }

  * getAllDetailForTool() {
    log.debug(
      '[API.%s.getAllDetailForTool] getAllDetailForTool',
      this.constructor.name
    );
    let rule = {
      spectype: {isNumber: true},
      key: {},
      pid: {isNumber: true}
    };
    let data = this.validate(rule);
    data.fromTool = true;
    if (data.key) {
      this._service = new ProjectService(db.USR_ADMIN_ID, this._context);
    }
    let ret = yield this._service.getAllDetailForDoc(data);
    this.setModel(ret);
    yield this.next();
  }

  * getAllDetailForDoc() {
    log.debug(
      '[API.%s.getAllDetailForDoc] getAllDetailForDoc',
      this.constructor.name
    );
    let id = this._context._id;
    let ret = yield this._service.getAllDetailForDoc({pid: id, userId: this._uid});
    this.setModel(ret);

    yield this.next();
  }

  * updateTestcase() {
    log.debug(
      '[API.%s.updateTestcase] updateTestcase',
      this.constructor.name
    );

    let testcaseRule = {
      id: {required: true, isNumber: true},
      state: {},
      name: {},
      host: {},
      description: {},
      testerId: {},
      testBegTime: {isNumber: true, value: /^\d{13}$/},
      testEndTime: {isNumber: true, value: /^\d{13}$/},
      reqHeader: {},
      reqData: {},
      resHeader: {},
      resExpect: {},
      resExpectHeader: {},
      resData: {},
      report: {}
    };
    let rule = {
      key: {required: true},
      testcases: {isArray: true, rule: testcaseRule}
    };
    let data = this.validate(rule, 'body');

    let ret = yield this._service.updateTestcase(data);
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

module.exports = ProjectController;
