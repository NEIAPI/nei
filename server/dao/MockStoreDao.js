const NObject = require('../NObject');
const MongoDB = require('./db/MongoDB');

class MockStoreDao extends NObject {
  constructor() {
    super();
    this.mongodb = new MongoDB();
  }

  static getInterfaceCollectionName(projectId) {
    // mongo 里面的接口集合名，每个项目都有一个集合
    return `mockdata_interface_project_${projectId}`;
  }

  static getDatatypeCollectionName(projectId) {
    // mongo 里面的数据模型集合名，每个项目都有一个集合
    return `mockdata_datatype_project_${projectId}`;
  }

  * findInterface({projectId, interfaceId}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    const docs = yield this.mongodb.findInterfaces({
      collectionName,
      interfaceIds: [interfaceId],
    });
    return docs[0];
  }

  * findInterfaces({projectId, interfaceIds}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    return yield this.mongodb.findInterfaces({
      collectionName,
      interfaceIds,
    });
  }

  * createInterface({projectId, data}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    const result = yield this.mongodb.createInterfaces({
      collectionName,
      data: [data],
    });
    return result[0];
  }

  * createInterfaces({projectId, data}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    return yield this.mongodb.createInterfaces({
      collectionName,
      data,
    });
  }

  * updateInterface({projectId, interfaceId, data}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    return yield this.mongodb.updateInterface({
      collectionName,
      interfaceId,
      data: {
        interfaceId,
        data,
      },
    });
  }

  * updateInterfaces({projectId, updatingDocs}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    return yield this.mongodb.updateInterfaces({
      collectionName,
      updatingDocs,
    });
  }

  * createOrUpdateInterface({projectId, interfaceId, data}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    // 创建或者更新
    const docs = yield this.mongodb.findInterfaces({
      collectionName,
      interfaceIds: [interfaceId],
    });
    if (!docs[0]) {
      // 创建
      const result = yield this.createInterface({
        projectId,
        data: {
          interfaceId,
          data,
        },
      });
      return result;
    } else {
      // 更新
      const result = yield this.updateInterface({
        projectId,
        interfaceId,
        data,
      });
      return result;
    }
  }

  * removeInterface({projectId, interfaceId}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    const docs = yield this.mongodb.removeInterfaces({
      collectionName,
      interfaceIds: [interfaceId],
    });
    return docs[0];
  }

  * removeInterfaces({projectId, interfaceIds}) {
    const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
    return yield this.mongodb.removeInterfaces({
      collectionName,
      interfaceIds,
    });
  }

  /** 从不同的项目中查找所有的数据模型列表
   * @param  {Object}
   * @attribute  {Array|Number} projectIds - 项目id列表
   * @return  {Object} 项目id和数据模型的映射
   */
  * findInterfacesFromProjects({projectIds}) {
    const collectionNames = projectIds.map(MockStoreDao.getInterfaceCollectionName);
    const result = yield this.mongodb.findByCollections(collectionNames);
    const projectIdWithDocMap = {};
    collectionNames.forEach((collectionName, idx) => {
      // 肯定是按顺序返回的，可以直接使用 dix 序号
      projectIdWithDocMap[projectIds[idx]] = result[collectionName];
    });
    return projectIdWithDocMap;
  }

  /** 更新不同项目中的指定的接口mock数据
   * @param  {Object} projectIdWithUpdatingDocsMap - 项目id和要更新的docs映射
   * @return  {Object} 项目id和数据模型的映射
   */
  * updateInterfacesOfProjects({projectIdWithUpdatingDocsMap}) {
    const projectIds = Object.keys(projectIdWithUpdatingDocsMap);
    const collectionNames = [];
    const collectionNameWithUpdatingDocsMap = {};
    projectIds.forEach(projectId => {
      const collectionName = MockStoreDao.getInterfaceCollectionName(projectId);
      collectionNames.push(collectionName);
      collectionNameWithUpdatingDocsMap[collectionName] = projectIdWithUpdatingDocsMap[projectId];
    });
    const result = yield this.mongodb.updateInterfacesByCollections({
      collectionNames,
      collectionNameWithUpdatingDocsMap
    });
    const projectIdWithDocMap = {};
    collectionNames.forEach((collectionName, idx) => {
      // 肯定是按顺序返回的，可以直接使用 dix 序号
      projectIdWithDocMap[projectIds[idx]] = result[collectionName];
    });
    return projectIdWithDocMap;
  }

  /************* DATATYPE *****************/

  /** 查项目中的所有数据模型列表
   * @return  {Object} 数据模型列表
   */
  * findAllModelsInProjects({projectIds}) {
    const collectionNames = projectIds.map(MockStoreDao.getDatatypeCollectionName);
    const result = yield this.mongodb.findByCollections(collectionNames);
    const models = {};
    Object.keys(result).forEach(collection => {
      const datatypes = result[collection];
      if (Array.isArray(datatypes) && datatypes.length) {
        datatypes.forEach(item => {
          if (!models[item.datatypeId]) {
            models[item.datatypeId] = [];
          }
          models[item.datatypeId].push(item.data);
        });
      }
    });
    return models;
  }

  /** 根据id查单个数据模型
   * @param  {Object}
   * @attribute  {Number} projectId - 项目id
   * @attribute  {Number} datatypeId - 数据模型在NEI平台上面的id
   * @attribute  {String|Number} queryId - 要查找的在Mongo中的数据模型（用户创建的数据模型）id
   * @return  {Object} 数据模型对象
   */
  * findDatatype({projectId, datatypeId, queryId}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const result = yield this.mongodb.findDatatypes({
      collectionName,
      query: {
        datatypeId,
        'data.id': queryId
      }
    });
    return result[0] ? result[0].data : null;
  }

  /** 根据id列表查单个数据模型
   * @param  {Object}
   * @attribute  {Number} projectId - 项目id
   * @attribute  {Object} datatypeId - 数据模型在NEI平台上面的id
   * @attribute  {Array} queryIds - 要查找的在Mongo中的数据模型（用户创建的数据模型）id列表
   * @return  {Array|Object} 数据模型对象
   */
  * findDatatypes({projectId, datatypeId, queryIds}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const result = yield this.mongodb.findDatatypes({
      collectionName,
      query: {
        datatypeId,
        'data.id': {
          $in: queryIds
        }
      }
    });
    return result.map(item => item.data);
  }

  /** 查指定id的所有数据模型
   * @param  {Object}
   * @attribute  {Number} projectId - 项目id
   * @attribute  {Object} datatypeId - 数据模型在NEI平台上面的id
   * @return  {Array|Object} 数据模型对象
   */
  * findAllDatatypes({projectId, datatypeId}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const result = yield this.mongodb.findDatatypes({
      collectionName,
      query: {
        datatypeId,
      }
    });
    return result.map(item => item.data);
  }

  * createDatatype({projectId, datatypeId, data}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const result = yield this.mongodb.createDatatypes({
      collectionName,
      data: [{
        datatypeId,
        data,
      }],
    });
    // 始终返回发送过来的数据
    return result[0].data;
  }

  * createDatatypes({projectId, datatypeId, listData}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const data = listData.map(item => {
      return {
        datatypeId,
        data: item,
      };
    });
    const result = yield this.mongodb.createDatatypes({
      collectionName,
      data: data,
    });
    // 始终返回发送过来的数据
    return result.map(item => item.data);
  }

  * updateDatatype({projectId, datatypeId, queryId, data}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const doc = yield this.mongodb.updateDatatype({
      collectionName,
      datatypeId,
      queryId,
      data,
    });
    return doc ? doc.data : null;
  }

  * updateAllDatatypes({projectId, datatypeId, data}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const docs = yield this.mongodb.updateAllDatatypes({
      collectionName,
      datatypeId,
      data,
    });
    return docs.map(doc => doc.data);
  }

  * updateDatatypes({projectId, datatypeId, updatingDocs}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const docs = yield this.mongodb.updateDatatypes({
      collectionName,
      datatypeId,
      updatingDocs: updatingDocs.map(doc => {
        return {
          datatypeId,
          data: doc,
        };
      }),
    });
    return docs.map(doc => doc.data);
  }

  /** 根据id删单条数据模型
   * @param  {Object}
   * @attribute  {Number} projectId - 项目id
   * @attribute  {Object} datatypeId - 数据模型在NEI平台上面的id
   * @attribute  {String|Number} queryId - 要查找的在Mongo中的数据模型（用户创建的数据模型）id
   * @return  {Object} 数据模型对象
   */
  * removeDatatype({projectId, datatypeId, queryId}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const result = yield this.mongodb.removeDatatypes({
      collectionName,
      queries: [{
        datatypeId,
        'data.id': queryId
      }]
    });
    return result[0] ? result[0].data : null;
  }

  /** 根据id列表删单条数据模型
   * @param  {Object}
   * @attribute  {Number} projectId - 项目id
   * @attribute  {Object} datatypeId - 数据模型在NEI平台上面的id
   * @attribute  {Array|<String|Number>} queryIds - 要查找的在Mongo中的数据模型（用户创建的数据模型）id列表
   * @return  {Object} 数据模型对象
   */
  * removeDatatypes({projectId, datatypeId, queryIds}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const result = yield this.mongodb.removeDatatypes({
      collectionName,
      queries: queryIds.map(id => {
        return {
          datatypeId,
          'data.id': id
        };
      }),
    });
    let successDeletedDocs = result.filter(doc => {
      return doc;
    });
    successDeletedDocs = successDeletedDocs.map(doc => doc.data);
    const failDeletedIds = [];
    if (successDeletedDocs.length !== queryIds.length) {
      queryIds.forEach(id => {
        if (!successDeletedDocs.find(doc => doc.id === id)) {
          failDeletedIds.push(id);
        }
      });
    }
    if (failDeletedIds.length) {
      return {
        successDeletedDocs,
        failDeletedIds
      };
    }
    return successDeletedDocs;
  }

  /** 删除指定id的所有数据模型
   * @param  {Object}
   * @attribute  {Number} projectId - 项目id
   * @attribute  {Object} datatypeId - 数据模型在NEI平台上面的id
   * @return  {Array|Object} 数据模型对象
   */
  * removeAllDatatypes({projectId, datatypeId}) {
    const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
    const docs = yield this.mongodb.findDatatypes({collectionName, query: {datatypeId}});
    yield this.mongodb.removeAllDatatypes({
      collectionName,
      datatypeId,
    });
    return docs.map(doc => doc.data);
  }

  /** 从不同的项目中查找所有的数据模型列表
   * @param  {Object}
   * @attribute  {Array|Number} projectIds - 项目id列表
   * @return  {Object} 项目id和数据模型的映射
   */
  * findDatatypesFromProjects({projectIds}) {
    const collectionNames = projectIds.map(MockStoreDao.getDatatypeCollectionName);
    const result = yield this.mongodb.findByCollections(collectionNames);
    const projectIdWithDocMap = {};
    collectionNames.forEach((collectionName, idx) => {
      // 肯定是按顺序返回的，可以直接使用 dix 序号
      projectIdWithDocMap[projectIds[idx]] = result[collectionName];
    });
    return projectIdWithDocMap;
  }

  /** 更新不同项目中的指定的数据模型列表
   * @param  {Object} projectIdWithUpdatingDocsMap - 项目id和要更新的docs映射
   * @return  {Object} 项目id和数据模型的映射
   */
  * updateDatatypesOfProjects({projectIdWithUpdatingDocsMap}) {
    const projectIds = Object.keys(projectIdWithUpdatingDocsMap);
    const collectionNames = [];
    const collectionNameWithUpdatingDocsMap = {};
    projectIds.forEach(projectId => {
      const collectionName = MockStoreDao.getDatatypeCollectionName(projectId);
      collectionNames.push(collectionName);
      collectionNameWithUpdatingDocsMap[collectionName] = projectIdWithUpdatingDocsMap[projectId];
    });
    const result = yield this.mongodb.updateDatatypesByCollections({
      collectionNames,
      collectionNameWithUpdatingDocsMap
    });
    const projectIdWithDocMap = {};
    collectionNames.forEach((collectionName, idx) => {
      // 肯定是按顺序返回的，可以直接使用 dix 序号
      projectIdWithDocMap[projectIds[idx]] = result[collectionName];
    });
    return projectIdWithDocMap;
  }
}

module.exports = MockStoreDao;
