/**
 * MongoDB Connection Class
 * 只用于保存 Mock 数据
 */
const MongoClient = require('mongodb').MongoClient;
const NObject = require('../../NObject');
const dbConfig = process.appConfig.mongodb;
const Redis = require('../cache/Redis');

class MongoDB extends NObject {
  constructor() {
    super();
    this.dbName = dbConfig.name;
    this.redis = new Redis();
  }

  /************* COMMON *****************/

  static * connect() {
    return yield MongoClient.connect(dbConfig.url, dbConfig.options);
  }

  static getCollectionName(collectionName) {
    return dbConfig.key + collectionName;
  }

  * find(collectionName, query) {
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(MongoDB.getCollectionName(collectionName));
    const result = yield collection.find(query).toArray();
    client.close();
    return result;
  }

  * findByCollection(collectionName) {
    // 先查 redis
    let result = yield this.redis.get(collectionName);
    if (!result) {
      const client = yield MongoDB.connect();
      const db = client.db(this.dbName);
      const collection = db.collection(MongoDB.getCollectionName(collectionName));
      result = yield collection.find({}).toArray();
      client.close();
      // 保存到 redis 中
      yield this.redis.set(collectionName, result);
    }
    return result;
  }

  * findByCollections(collectionNames) {
    const result = {};
    let client;
    let db;
    let collection;
    for (let i = 0, l = collectionNames.length; i < l; i++) {
      let collectionName = collectionNames[i];
      // 先查 redis
      let tempResult = yield this.redis.get(collectionName);
      if (!tempResult) {
        if (!client) {
          client = yield MongoDB.connect();
          db = client.db(this.dbName);
        }
        collection = db.collection(MongoDB.getCollectionName(collectionName));
        tempResult = yield collection.find({}).toArray();
        // 保存到 redis 中
        yield this.redis.set(collectionName, tempResult);
        result[collectionName] = tempResult;
      } else {
        result[collectionName] = tempResult;
      }
    }
    client && client.close();
    return result;
  }

  * insert({collectionName, data}) {
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(MongoDB.getCollectionName(collectionName));
    const result = yield collection.insert(data);
    client.close();
    return result;
  }

  * insertMany({collectionName, data}) {
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(MongoDB.getCollectionName(collectionName));
    const result = yield collection.insertMany(data);
    client.close();
    return result;
  }

  * findOneAndUpdate({collectionName, query, data, options}) {
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(MongoDB.getCollectionName(collectionName));
    const result = yield collection.findOneAndUpdate(query, {
      $set: data
    }, options);
    client.close();
    return result;
  }

  * findAndDelete({collectionName, queries}) {
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(MongoDB.getCollectionName(collectionName));
    const docs = [];
    for (let i = 0; i < queries.length; i++) {
      const result = yield collection.findOneAndDelete(queries[i]);
      docs.push(result.value);
    }
    client.close();
    return docs;
  }

  * deleteMany({collectionName, query}) {
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(MongoDB.getCollectionName(collectionName));
    const result = yield collection.deleteMany(query);
    client.close();
    return result;
  }

  /************* INTERFACE *****************/

  * updateRedisOfInterfaces({docs, collectionName}) {
    // 更新 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      docs.forEach(doc => {
        let foundDoc = cache.find(item => {
          return item.interfaceId === doc.interfaceId;
        });
        if (foundDoc) {
          foundDoc.data = doc.data;
        }
      });
      yield this.redis.set(collectionName, cache);
    }
  }

  * findInterfaces({collectionName, interfaceIds}) {
    const collection = yield this.findByCollection(collectionName);
    return collection.filter(item => interfaceIds.includes(item.interfaceId));
  }

  * createInterfaces({collectionName, data}) {
    let result = yield this.insertMany({collectionName, data});
    result = result.ops;
    // 更新 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      cache.push(...result);
      yield this.redis.set(collectionName, cache);
    }
    return result;
  }

  * updateManyInterfaces({collectionName, docs, options = {returnOriginal: false}}) {
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    const collection = db.collection(MongoDB.getCollectionName(collectionName));
    const result = yield docs.map((doc) => {
      return collection.findOneAndUpdate({
        interfaceId: doc.interfaceId,
      }, {
        $set: {
          data: doc.data
        }
      }, options);
    });
    client.close();
    return result;
  }

  * updateInterfaces({collectionName, updatingDocs}) {
    const result = yield this.updateManyInterfaces({collectionName, docs: updatingDocs});
    const docs = result.map(item => item.value);
    // 更新redis
    yield this.updateRedisOfInterfaces({docs, collectionName});
    return docs;
  }

  * updateInterface({collectionName, interfaceId, data, options = {returnOriginal: false}}) {
    const result = yield this.findOneAndUpdate({
      collectionName,
      query: {
        interfaceId,
      },
      data,
      options,
    });
    // 更新 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      const doc = cache.find(item => item.interfaceId === interfaceId);
      doc.data = data.data;
      yield this.redis.set(collectionName, cache);
    }
    return result.value;
  }

  * updateInterfacesByCollections({collectionNames, collectionNameWithUpdatingDocsMap, options = {returnOriginal: false}}) {
    const result = {};
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    for (let i = 0, l = collectionNames.length; i < l; i++) {
      const collectionName = collectionNames[i];
      // 先查 redis
      const collection = db.collection(MongoDB.getCollectionName(collectionName));
      const tempResult = yield collectionNameWithUpdatingDocsMap[collectionName].map(doc => {
        return collection.findOneAndUpdate({
          interfaceId: doc.interfaceId,
        }, {
          $set: {
            data: doc.data
          }
        }, options);
      });
      const docs = tempResult.map(item => item.value);
      // 更新 redis
      yield this.updateRedisOfInterfaces({docs, collectionName});
      result[collectionName] = docs;
    }
    client && client.close();
    return result;
  }

  * removeInterfaces({collectionName, interfaceIds}) {
    const docs = yield this.findAndDelete({
      collectionName,
      queries: interfaceIds.map(interfaceId => {
        return {interfaceId};
      })
    });
    // 更新 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      for (let i = cache.length - 1; i >= 0; i--) {
        if (interfaceIds.includes(cache[i].interfaceId)) {
          cache.splice(i, 1);
        }
      }
      yield this.redis.set(collectionName, cache);
    }
    return docs;
  }

  /************* DATATYPE *****************/

  * updateRedisOfDatatypes({docs, collectionName}) {
    // 更新 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      docs.forEach(doc => {
        let foundCacheDoc = cache.find(item => {
          // 注意，因为id的类型是可以在字符串和数值之间转换的，所以不能直接使用 === 来比较，因为可能正好是在更新id的类型。这里统一转成字符串来比较
          return item.datatypeId === doc.datatypeId && String(item.data.id) === String(doc.data.id);
        });
        if (foundCacheDoc) {
          foundCacheDoc.data = doc.data;
        }
      });
      yield this.redis.set(collectionName, cache);
    }
  }

  * findDatatypes({collectionName, query}) {
    // 先查 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      if (query['data.id']) {
        if (query['data.id'].$in) {
          return cache.filter(item => item.datatypeId === query.datatypeId && query['data.id'].$in.includes(item.data.id));
        } else {
          return cache.filter(item => item.datatypeId === query.datatypeId && query['data.id'] === item.data.id);
        }
      } else {
        return cache.filter(item => item.datatypeId === query.datatypeId);
      }
    } else {
      const result = yield this.find(collectionName, query);
      yield this.redis.set(collectionName, result);
      return result;
    }
  }

  * createDatatypes({collectionName, data}) {
    let result = yield this.insertMany({collectionName, data});
    result = result.ops;
    // 这里要考虑并发请求的情况，简单起见就每次从mongo里面重新查找，不然redis中的数据会和mongo不同步
    const datatypes = yield this.find(collectionName);
    yield this.redis.set(collectionName, datatypes);
    return result;
  }

  * updateDatatype({collectionName, datatypeId, queryId, data, options = {returnOriginal: false}}) {
    // 因为可以部分更新，所有需要先把原来的数据查出来
    const query = {
      datatypeId,
      'data.id': queryId,
    };
    const oldDocs = yield this.findDatatypes({collectionName, query});
    if (!oldDocs || !oldDocs.length) {
      return null;
    }
    const updatingData = Object.assign({}, oldDocs[0].data, data);
    const result = yield this.findOneAndUpdate({
      collectionName,
      query,
      data: {
        data: updatingData,
      },
      options,
    });
    // 更新 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      const doc = cache.find(item => item.datatypeId === datatypeId && item.data.id === queryId);
      // 有可能要更新的文档并不存在，客户端传错了
      if (doc) {
        doc.data = updatingData;
        yield this.redis.set(collectionName, cache);
      }
    }
    return result.value;
  }

  * updateManyDatatypes({collectionName, docs}) {
    const result = yield this.updateDatatypesByCollections({
      collectionNames: [collectionName],
      collectionNameWithUpdatingDocsMap: {
        [collectionName]: docs
      }
    });
    return result[collectionName];
  }

  * updateDatatypes({collectionName, updatingDocs}) {
    const docs = yield this.updateManyDatatypes({
      collectionName,
      docs: updatingDocs,
    });
    yield this.updateRedisOfDatatypes({docs, collectionName});
    return docs;
  }

  * updateDatatypesByCollections({collectionNames, collectionNameWithUpdatingDocsMap, options = {returnOriginal: false}}) {
    const result = {};
    const client = yield MongoDB.connect();
    const db = client.db(this.dbName);
    for (let i = 0, l = collectionNames.length; i < l; i++) {
      const collectionName = collectionNames[i];
      // 先查 redis
      const collection = db.collection(MongoDB.getCollectionName(collectionName));
      const tempResult = yield collectionNameWithUpdatingDocsMap[collectionName].map(doc => {
        return collection.findOneAndUpdate({
          datatypeId: doc.datatypeId,
          // 注意，因为id的类型是可以在字符串和数值之间转换的，如果正好是在更新id的类型，则 `'data.id': doc.data.id` 是匹配不成功的
          // 考虑到id只能是字符串或者数值，它是唯一的值，并且字符串也是数值形式的字符串，所以这里就匹配两种类型的id
          'data.id': {
            $in: [String(doc.data.id), Number(doc.data.id)]
          },
        }, {
          $set: {
            data: doc.data
          }
        }, options);
      });
      const docs = tempResult.map(item => item.value);
      // 更新 redis
      yield this.updateRedisOfDatatypes({docs, collectionName});
      result[collectionName] = docs;
    }
    client && client.close();
    return result;
  }

  * updateAllDatatypes({collectionName, datatypeId, data}) {
    // 因为可以部分更新，所有需要先把原来的数据查出来
    const query = {
      datatypeId,
    };
    const oldDocs = yield this.findDatatypes({collectionName, query});
    if (!oldDocs || !oldDocs.length) {
      return null;
    }
    oldDocs.forEach(doc => {
      Object.assign(doc.data, data);
    });
    return yield this.updateDatatypes({
      collectionName,
      updatingDocs: oldDocs,
    });
  }

  * removeDatatypes({collectionName, queries}) {
    const result = yield this.findAndDelete({collectionName, queries});
    // 删除不成功的时候，比如删除的数据不存在，返回的是 null，下面更新 redis 的 for 中要注意判断
    // 更新 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      for (let i = cache.length - 1; i >= 0; i--) {
        if (result.find(item => item && (item.data.id === cache[i].data.id))) {
          cache.splice(i, 1);
        }
      }
      yield this.redis.set(collectionName, cache);
    }
    return result;
  }

  * removeAllDatatypes({collectionName, datatypeId}) {
    const result = yield this.deleteMany({collectionName, query: {datatypeId}});
    // 更新 redis
    const cache = yield this.redis.get(collectionName);
    if (cache && Array.isArray(cache)) {
      for (let i = cache.length - 1; i >= 0; i--) {
        if (cache[i].datatypeId === datatypeId) {
          cache.splice(i, 1);
        }
      }
      yield this.redis.set(collectionName, cache);
    }
    return result;
  }
}

module.exports = MongoDB;
