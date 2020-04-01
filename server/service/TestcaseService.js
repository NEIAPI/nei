/**
 * Testcase Service Class
 */
const log = require('../util/log');
const db = require('../../common/config/db.json');
const _ = require('../util/utility');
const IllegalRequest = require('../error/fe/IllegalRequestError');

class TestcaseService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/InterfaceDao');
    this._dao = new (require('../dao/TestcaseDao'))({context});
    this._testcaseCollectionService = new (require('./TestcaseCollectionService'))(this._uid, this._context);
    this._interfaceService = new (require('./InterfaceService'))(this._uid, this._context);
  }

  * createBatch(models, notCheckInSameInterface) {
    let iids = _.uniq(models.map((it) => it.interfaceId));
    if (!notCheckInSameInterface) {
      if (iids.length > 1) {
        throw new IllegalRequest('not in the same interface', pgids);
      }
      let iid = iids[0];
      let ret = yield this._checkCreatePermission(iid);
      models.forEach(item => {
        item.progroupId = ret.progroupId;
        item.testerId = this._uid;
      });
    } else {
      for (let item of models) {
        let itfId = item.interfaceId;
        let ret = yield this._checkCreatePermission(itfId);
        item.progroupId = ret.progroupId;
        item.testerId = this._uid;
      }
    }
    return yield super.createBatch(models);
  }

  * update(model) {
    model.testerId = this._uid;
    return yield super.update(model);
  }

  // 将接口的所有测试用例的状态改成 API_TST_DISABLED
  // 发生在接口的请求或者响应参数有修改的时候
  * disableByInterfaceId(interfaceId) {
    yield this._dao.update(
      {
        state: db.API_TST_DISABLED
      },
      {
        interface_id: interfaceId
      }
    );
  }


  /**
   * get tesecase list by interface id
   * @param  {Number} iid - interface id
   * @return {Array db/model/InterfaceTestCase}
   */
  * getListByInterface(iid) {
    log.debug(
      '[%s.getListByInterface] get testcase list by interface id %d',
      this.constructor.name, iid
    );
    yield this._interfaceService._checkSearchPermission(iid);
    return yield this._dao.search({
      conds: {
        'interface_id': iid
      },
      joins: this._dao._getUserJoins()
    });
  }

  * getListByCollection({collectionId, interfaceId = 0}) {
    log.debug(
      '[%s.getListByCollection] get testcase list by collection id %d',
      this.constructor.name, collectionId
    );
    yield  this._testcaseCollectionService._checkSearchPermission(collectionId);
    let joins = this._dao._getUserJoins();
    let conds = {collection_id: collectionId};
    if (interfaceId) {
      conds.interfaceId = interfaceId;
    }
    joins.push({
      table: 'collection_interface_testcase',
      fkmap: {testcase_id: 'id'},
      conds
    });

    return yield this._dao.search({
      joins
    });
  }

  * findDetailById(id) {
    log.debug(
      '[%s.findDetailById] get testcase by id %d',
      this.constructor.name, id
    );
    yield this._checkSearchPermission(id);
    return yield this._dao.find(id, {joins: this._dao._getUserJoins()});
  }
}

module.exports = TestcaseService;
