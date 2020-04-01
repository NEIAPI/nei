/**
 * TestcaseCollection Service Class
 */
const _ = require('../util/utility');
const Forbidden = require('../error/fe/ForbiddenError');

class TestcaseCollectionService extends require('./ResourceService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ProjectDao');
    this._dao = new (require('../dao/TestcaseCollectionDao'))({context});
    this._iDao = new (require('../dao/InterfaceDao'))({context});
    this._citDao = new (require('../dao/CollectionInterfaceTestcaseDao'))({context});
    this._tDao = new (require('../dao/TestcaseDao'))({context});
  }

  /**
   * Create a testCase collection
   * @param {Object} model - testcase collection object
   * @return {model/db/TestCaseCollection} testcase host object to be inserted
   */
  * create(model) {
    let ret = yield this._checkCreatePermission(model.projectId);
    model.progroupId = ret.progroupId;
    return yield super.create(model);
  }

  * _afterRemove(ids) {
    yield this._citDao.removeBatch({
      collectionId: ids
    });
  }

  /**
   * update testCase collection
   * @param {model/db/TestcaseCollection} model - testCase collection
   * @return {model/db/TestcaseCollection} testCase collection
   */
  * update(model) {
    if (model.data) {
      //重新组装order list
      let collection = yield this._dao.find(model.id);
      if (collection.type === 0) {
        _.translateParams(model, ['data']);
        let data = model.data;
        _.translateParams(collection, ['data']);
        let olddata = collection.data;
        data = data.filter(id => {
          return olddata.indexOf(id) > -1;
        });
        for (let interfaceId of olddata) {
          if (data.indexOf(interfaceId) == -1) {
            data.push(interfaceId);
          }
        }
        data = yield this._checkData(data);
        model.data = data.join(',');
      } else {
        let data;
        let olddata;
        try {
          data = JSON.parse(model.data);
          olddata = collection.data ? JSON.parse(collection.data) : [];
        } catch (e) {
          throw new Forbidden(`请求参数有误！`);
        }
        let infIds = [];
        let collIds = [];
        data.forEach(l => {
          if (l.type === 'INTERFACE') {
            l.data.forEach(i => {
              infIds.push(i);
            });
          }
        });
        olddata.forEach(l => {
          if (l.type === 'INTERFACE') {
            l.data.forEach(i => {
              collIds.push(i);
            });
          }
        });
        let duplicate = infIds.filter((id, index) => {
          return infIds.indexOf(id) !== index;
        });
        if (duplicate.length) {
          throw new Forbidden(`包含重复的接口！`);
        }
        let delInfs = [];
        let addInfs = [];
        let fullSet = infIds.concat(collIds).filter((i, idx, arr) => arr.indexOf(i) === idx);
        fullSet.forEach(id => {
          if (infIds.includes(id) && !collIds.includes(id)) {
            addInfs.push(id);
          }
          if (collIds.includes(id) && !infIds.includes(id)) {
            delInfs.push(id);
          }
        });
        if (delInfs.length) {
          yield this.delInterfaces(model.id, delInfs);
        }
        if (addInfs.length) {
          yield this.addInterfaces(model.id, addInfs);
        }
      }
    }
    let ret = yield super.update(model);
    return yield this.findDetailById(model.id);
  }

  * findDetailById(id) {
    yield this._checkSearchPermission(id);
    let ret = yield this._dao.find(id, {joins: this._dao._getUserJoins()});
    let ckeck = {data: ret.data};
    if (ret.type === 0) {
      _.translateParams(ckeck, ['data']);
      let data = ckeck.data;
      ret.interfaces = [];
      if (data.length) {
        let interfaces = yield this._iDao.findBatch(data);
        ret.interfaces = _.sortWithOrderList(interfaces, ret.data);
      }
    }
    return ret;
  }

  * getListInProject(pid) {
    let ret = yield super.getListInProject(pid);
    for (let item of ret) {
      let ckeck = {data: item.data};
      if (item.type === 0) {
        _.translateParams(ckeck, ['data']);
        let data = ckeck.data;
        item.interfaces = [];
        if (data.length) {
          let interfaces = yield this._iDao.findBatch(data, {
            joins: [
              ...this._iDao._getUserJoins(),
              ...this._iDao._getStatusJoins()
            ]
          });
          item.interfaces = interfaces;
        }
      }
    }

    return ret;
  }

  * addTestcases(id, interfaceId, caseIds) {
    let ret = yield this._checkUpdatePermission(id);

    let collection = yield this._dao.find(id);
    if (collection.type === 0) {
      _.translateParams(collection, ['data']);
      let data = collection.data;
      if (data.indexOf(interfaceId) == -1) {
        throw new Forbidden(`您选择的接口不存在 id：${interfaceId}`);
      }
    } else {
      let data;
      try {
        data = JSON.parse(collection.data);
      } catch (e) {
        throw new Forbidden(`JSON错误！`);
      }
      let infIds = [];
      data.forEach(l => {
        if (l.type === 'INTERFACE') {
          l.data.forEach(i => {
            infIds.push(i);
          });
        }
      });
      if (infIds.indexOf(interfaceId) === -1) {
        throw new Forbidden(`您选择的接口不存在 id：${interfaceId}`);
      }
    }
    let testcases = yield this._tDao.search({conds: {id: caseIds, interfaceId}});
    if (testcases.length !== caseIds.length) {
      throw new Forbidden(`您选择的测试用例不存在或没有权限 id：${caseIds}`);
    }

    let relations = yield this._citDao.search({conds: {collectionId: id, testcaseId: caseIds, interfaceId}});
    if (relations.length) {
      throw new Forbidden(`不能重复添加测试用例 id：${caseIds}`);
    }

    let addObjs = [];
    caseIds.forEach(caseId => {
      addObjs.push({
        collectionId: id,
        interfaceId,
        testcaseId: caseId
      });
    });
    yield this._citDao.createBatch(addObjs);
    return testcases;
  }

  * delTestcases(id, interfaceId, caseIds, userId) {
    let ret = yield this._checkUpdatePermission(id);

    let collection = yield this._dao.find(id);
    if (collection.type === 0) {
      _.translateParams(collection, ['data']);
      let data = collection.data;
      if (data.indexOf(interfaceId) == -1) {
        throw new Forbidden(`您选择的接口不存在 id：${interfaceId}`);
      }
    } else {
      let data;
      try {
        data = JSON.parse(collection.data);
      } catch (e) {
        throw new Forbidden(`JSON错误！`);
      }
      let infIds = [];
      data.forEach(l => {
        if (l.type === 'INTERFACE') {
          l.data.forEach(i => {
            infIds.push(i);
          });
        }
      });
      if (infIds.indexOf(interfaceId) === -1) {
        throw new Forbidden(`您选择的接口不存在 id：${interfaceId}`);
      }
    }
    yield this._citDao.removeBatch({collectionId: id, testcaseId: caseIds, interfaceId});
    return caseIds;
  }

  * addInterfaces(id, interfacesIds) {
    let ret = yield this._checkUpdatePermission(id);

    let collection = yield this._dao.find(id);
    let projectIds = yield this._getSearchPids(collection.projectId);
    let interfaces = yield this._iDao.search({conds: {id: interfacesIds, projectId: projectIds}});
    if (interfaces.length != interfacesIds.length) {
      throw new Forbidden(`您选择的接口不存在或没有权限 id：${interfacesIds}`);
    }
    let data;
    if (collection.type === 0) {
      _.translateParams(collection, ['data']);
      data = collection.data;
      for (let interfaceId of interfacesIds) {
        if (data.indexOf(interfaceId) == -1) {
          data.push(interfaceId);
        }
      }
      data = yield this._checkData(data);
    }
    //查找所有测试用例
    let testcases = yield this._tDao.search({conds: {interfaceId: interfacesIds}});
    let addRelationObjs = [];
    testcases.forEach(item => {
      addRelationObjs.push({
        collectionId: id,
        interfaceId: item.interfaceId,
        testcaseId: item.id
      });
    });

    yield this._beginTransaction();
    if (collection.type === 0) {
      yield this._dao.update({id, data: data.join(',')});
    }
    if (addRelationObjs.length) {
      yield this._citDao.createBatch(addRelationObjs);
    }
    yield this._endTransaction();

    return yield this.findDetailById(id);
  }

  * delInterfaces(id, interfacesIds) {
    let ret = yield this._checkUpdatePermission(id);

    let collection = yield this._dao.find(id);
    let newdata;
    if (collection.type === 0) {
      _.translateParams(collection, ['data']);
      let data = collection.data;
      newdata = [];
      for (let interfaceId of data) {
        if (interfacesIds.indexOf(interfaceId) == -1) {
          newdata.push(interfaceId);
        }
      }
      newdata = yield this._checkData(newdata);
    }
    yield this._beginTransaction();
    if (collection.type === 0) {
      yield this._dao.update({id, data: newdata.join(',')});
    }
    yield this._citDao.removeBatch({collectionId: id, interfaceId: interfacesIds});
    yield this._endTransaction();

    return yield this.findDetailById(id);
  }

  * _checkData(data) {
    let interfaces = yield this._iDao.search({conds: {id: data}});
    let tmp = interfaces.map(item => {
      return item.id;
    });
    return data.filter(id => {
      return tmp.includes(id);
    });
  }
}

module.exports = TestcaseCollectionService;
