/**
 * MockStore Service Class
 */
const db = require('../../common/config/db.json');
const log = require('../util/log');
const resourceUtil = require('../util/resource_util');
const IllegalRequestError = require('../error/fe/IllegalRequestError');
const NObject = require('../NObject');
const MockStoreDao = require('../dao/MockStoreDao');
const ProjectDao = require('../dao/ProjectDao');
const InterfaceService = require('./InterfaceService');
const RpcService = require('./RpcService');
const DataTypeService = require('./DataTypeService');
const ConstraintService = require('./ConstraintService');
const mockDataWork = require('../util/mock_data_worker');

const MAX_MOCKDATA_SIZE_KB = 500; // mock数据最大为500KB
const MAX_MOCKDATA_SIZE = 1024 * MAX_MOCKDATA_SIZE_KB; // mock数据最大为500KB
const MAX_MOCKDATA_ITEM_NUM = 1000; // mock数据最多支持创建1000条

class MockStoreService extends NObject {
  constructor(uid, context) {
    super();
    this.dao = new MockStoreDao();
    this.uid = uid;
    this.context = context;
    this.interfaceService = new InterfaceService(uid, context);
    this.rpcService = new RpcService(uid, context);
    this.datatypeService = new DataTypeService(uid, context);
    this.constraintService = new ConstraintService(uid, context);
  }

  // 约定：只有接口的响应结果为哈希或者数组时，才能持久化mock数据
  static canInterfaceSaveMockdata(itf) {
    const resFormat = itf.resFormat;
    return resFormat === db.MDL_FMT_HASH || resFormat === db.MDL_FMT_ARRAY || resFormat === db.MDL_FMT_HASHMAP;
  }

  /**
   * 根据接口获取接口的响应信息的mock数据
   * @param  {Object} itf - 接口对象
   * @return  {Object|Array} Mock数据
   */
  * getByInterfaceObj(itf) {
    let result = yield this.dao.findInterface({
      projectId: itf.projectId,
      interfaceId: itf.id,
    });
    // 如果在mongo里面不存在，就生成一份mock数据，保存到mongo中，再返回新生成的数据
    if (!result) {
      const randomMockdata = yield this.generateMockdata({itf});
      // 保存到mongo中
      result = yield this.dao.createInterface({
        projectId: itf.projectId,
        data: {
          interfaceId: itf.id,
          data: randomMockdata.data,
        },
      });
    }
    // 有些数据 mongo 无法保存，比如键里面有点号的，这里就再生成一份随机的数据返回吧
    if (
      (itf.resFormat === db.MDL_FMT_HASH || itf.resFormat === db.MDL_FMT_HASHMAP)
      && resourceUtil.isNotOrEmptyJsonObject(result.data)
      || itf.resFormat === db.MDL_FMT_ARRAY && !Array.isArray(result.data)
    ) {
      if (resourceUtil.isNotOrEmptyJsonObject(result.data)) {
        const randomMockdata = yield this.generateMockdata({itf});
        return randomMockdata.data;
      }
    }
    return result.data;
  }

  /**
   * 根据接口id获取接口元数据
   * @param  {Number} interfaceId - http接口id
   * @param  {Number} rpcId - rpc接口id
   * @return  {Object} 接口元数据
   */

  * _getItf({interfaceId, rpcId}) {
    // 查找接口详情，该方法会判断权限
    let itf;
    if (interfaceId) {
      itf = yield this.interfaceService.findDetailById(interfaceId);
    } else {
      itf = yield this.rpcService.findDetailById(rpcId);
    }
    return itf;
  }

  /**
   * 根据接口id获取接口的响应信息的mock数据
   * @param  {Number} interfaceId - http接口id
   * @param  {Number} rpcId - rpc接口id
   * @return  {Object|Array} Mock数据
   */
  * getInterface({interfaceId, rpcId}) {
    // 查找接口详情，该方法会判断权限
    const itf = yield this._getItf({interfaceId, rpcId});
    return yield this.getByInterfaceObj(itf);
  }

  /**
   * 生成Mock数据
   * @param  {Object} itf - 接口对象
   * @param  {String} mockdata - 要保存或者是更新的 Mock 数据
   * @return  {Object} Mock数据
   */
  * generateMockdata({itf}) {
    let result = null;
    let paramResService = null;
    if (itf.type === db.INTERFACE_TYP_HTTP) {
      paramResService = new (require('./ParamInterfaceResService'))(this.uid, this.context);
    } else if (itf.type === db.INTERFACE_TYP_RPC) {
      paramResService = new (require('./ParamRpcResService'))(this.uid, this.context);
    }
    const parameters = yield paramResService.getList(itf.id);
    if (parameters.length) {
      // 查找规则函数
      const constraints = yield this.constraintService.getListInProject(itf.projectId);
      // 查找数据模型
      const datatypes = yield this.datatypeService.getListInProject(itf.projectId);
      // 生成mock数据
      const mockdata = mockDataWork.getParameterMockData(constraints, itf.resFormat, parameters, datatypes);
      if (mockdata.error.length) {
        result = {
          data: {
            _nei_apimock_error: mockdata.error
          }
        };
      } else {
        if (JSON.stringify(mockdata.json).length > MAX_MOCKDATA_SIZE) {
          // mock 数据大于 500KB，不保存
          result = {
            data: {
              _nei_apimock_error: `Mock 数据大于 ${MAX_MOCKDATA_SIZE_KB}KB 了，您这是故意的吧，如果真有需求，请使用本地构建工具`
            }
          };
        } else {
          result = {
            data: mockdata.json,
          };
        }
      }
    } else {
      result = {data: {}};
    }
    return result;
  }

  /**
   * 更新或者保存Mock数据
   * @param  {Number} interfaceId - http接口id
   * @param  {Number} rpcId - rpc接口id
   * @param  {String} mockdata - 要保存或者是更新的 Mock 数据
   * @return  {Object} Mock数据
   */
  * saveInterface({interfaceId, rpcId, mockdata}) {
    let data = null;
    if (mockdata > MAX_MOCKDATA_SIZE) {
      // mock 数据大于 500KB，不保存
      throw new IllegalRequestError(`Mock 数据大于 ${MAX_MOCKDATA_SIZE_KB}KB 了，您这是故意的吧，如果真有需求，请使用本地构建工具`);
    }
    // 查找接口详情，该方法会判断权限
    const itf = yield this._getItf({interfaceId, rpcId});
    if (MockStoreService.canInterfaceSaveMockdata(itf)) {
      try {
        data = JSON.parse(mockdata);
      } catch (e) {
        const errMessage = `Mock 数据不是一个有效的 JSON`;
        log.debug(
          `[MockStoreService.${this.constructor.name}.save] ${errMessage}: ${mockdata}`
        );
        throw new IllegalRequestError(errMessage);
      }
    } else {
      throw new IllegalRequestError(`目前只支持保存哈希或者数组类型的 Mock 数据，其他类型暂不支持，可以选择使用默认值的功能`);
    }
    const datatypes = yield this.datatypeService.getListInProject(itf.projectId);
    const projectService = new ProjectDao({context: this._context});
    const project = yield projectService.find(itf.projectId);
    // 检查 mock 数据是否符合定义，不符合的不让保存
    const compareResult = resourceUtil.compareDataWithDefinition({
      resFormat: itf.resFormat,
      data,
      resOutputs: itf.params.outputs,
      datatypes,
      resParamRequiredIsChecked: project.resParamRequired
    });
    if (compareResult !== true) {
      throw new IllegalRequestError(compareResult.join('; '));
    }
    try {
      const result = yield this.dao.createOrUpdateInterface({
        projectId: itf.projectId,
        interfaceId: itf.id,
        data,
      });
      return result.data;
    } catch (e) {
      return {
        _nei_apimock_error: e.message
      };
    }
  }

  /**
   * 刷新Mock数据
   * @param  {Number} interfaceId - 接口id
   * @return  {Object}刷新后的mock数据
   */
  * refreshInterface({interfaceId, rpcId}) {
    // 查找接口详情，该方法会判断权限
    const itf = yield this._getItf({interfaceId, rpcId});
    if (!MockStoreService.canInterfaceSaveMockdata(itf)) {
      throw new IllegalRequestError(`目前只支持保存哈希或者数组类型的 Mock 数据，其他类型暂不支持，可以选择使用默认值的功能`);
    }
    const mockdata = yield this.generateMockdata({itf});
    // 有异常
    if (mockdata.data._nei_apimock_error) {
      return mockdata.data;
    }
    // 删除mock数据
    yield this.dao.removeInterface({
      projectId: itf.projectId,
      interfaceId: itf.id,
    });
    try {
      const result = yield this.dao.createInterface({
        projectId: itf.projectId,
        data: {
          interfaceId: itf.id,
          data: mockdata.data,
        },
      });
      return result.data;
    } catch (e) {
      return {
        _nei_apimock_error: e.message
      };
    }
  }

  /**
   * 删除Mock数据
   * @param  {Number} interfaceId - http接口id
   * @param  {Number} rpc - rpc接口id
   * @return  {Boolean} true 删除成功，false Mock数据不存在
   */
  * removeInterface({interfaceId, rpcId}) {
    // 查找接口详情，该方法会判断权限
    const itf = yield this._getItf({interfaceId, rpcId});
    const result = yield this.dao.removeInterface({
      projectId: itf.projectId,
      interfaceId: itf.id,
    });
    return result !== null;
  }

  /**
   * 移动Mock数据
   * @param  {Number} oldProjectId - 接口原来的项目id
   * @param  {Number} projectId - 接口新的项目id
   * @param  {Array|Number} ids - 移动的接口id列表
   */
  * moveInterface({oldProjectId, projectId, ids}) {
    const docs = yield this.dao.findInterfaces({
      projectId: oldProjectId,
      interfaceIds: ids,
    });
    // 接口没有mock数据
    if (!docs.length) {
      return;
    }
    // 先从旧项目删除
    yield this.dao.removeInterfaces({
      projectId: oldProjectId,
      interfaceIds: ids,
    });
    try {
      // 再添加到新项目
      return yield this.dao.createInterfaces({
        projectId,
        data: docs,
      });
    } catch (e) {
      return {
        _nei_apimock_error: e.message
      };
    }
  }

  /**
   * 根据路径，更新接口Mock数据中的字段的名称或者类型
   * @param  {Array|Object} itfArr - 接口对象列表
   * @param  {Object} keysPathsMap - keysPaths 和 接口id 关联映射 - keysPaths 是键的路径，是一个二维数组。如果要更新的数据是数组，则用 {isArray: true} 来表示
   * @param  {Object} options - 选项
   * @attribute  {Boolean} options.isUpdatingParamName - 更新名称
   * @attribute  {Boolean} options.isUpdatingParamType - 更新类型
   * @attribute  {String} options.newName - 新名称
   * @attribute  {String} options.newType - 新类型
   *    比如，将对象 {a: [{aa: 11}, {aa: 22}]} 中的 a 属性数组的每一项中的 aa 属性名称更改为 bb，则：
   *      keysPaths 为 [ ['a', {isArray: true}, 'aa'] ]
   *      options 为 {isUpdatingParamName: true, newName: 'bb'}
   * @param {Array|Object} datatypes - 数据模型列表
   * @param {Array|Object} constraints - 规则函数列表
   * @return  {Boolean} true 更新成功，false Mock数据不存在，或者传入参数有误
   */
  * updateParamNameOrTypeByKeysPathsForInterfaces({itfArr, keysPathsMap, options, datatypes, constraints, datatype}) {
    // 接口响应参数的类别不是哈希或者数组，也就无法保存 Mock 数据
    const itfs = itfArr.filter(MockStoreService.canInterfaceSaveMockdata);
    if (!itfs.length) {
      return false;
    }
    // 如果更新的是公共资源库中的数据模型，那引用这个数据模型的接口可以分散在不同的项目中，这里按项目进行分组更新，实际情况应该比较少见
    // 如果更新了公共资源库中的数据模型，同时这个数据模型又被很多接口引用，此时性能就比较差了
    const projectIds = resourceUtil.getProjectIds(itfs);
    const projectIdWithDocsMap = yield this.dao.findInterfacesFromProjects({projectIds});
    // 项目id和要更新的文档集映射
    const projectIdWithUpdatingDocsMap = {};
    projectIds.forEach(projectId => {
      const allDocs = projectIdWithDocsMap[projectId];
      const interfaceIds = itfArr.filter(itf => itf.projectId === projectId).map(itf => itf.id);
      const docs = allDocs.filter(doc => interfaceIds.includes(doc.interfaceId));
      if (Array.isArray(docs) && docs.length) {
        projectIdWithUpdatingDocsMap[projectId] = docs.map(doc => {
          return {
            interfaceId: doc.interfaceId,
            data: this._updateParamNameOrTypeByKeysPathsForData({
              data: doc.data,
              keysPaths: keysPathsMap[doc.interfaceId],
              options,
              datatypes,
              constraints,
              datatype
            }),
          };
        });
      }
    });
    return yield this.dao.updateInterfacesOfProjects({projectIdWithUpdatingDocsMap});
  }

  /**
   * 根据路径，更新数据模型Mock数据中的字段的名称或者类型
   * @param{Object} datatypeArr 需要被更新字段名称或者字段类型的数据模型列表
   * @param{Array|Object} datatypes 同 updateParamNameOrTypeByKeysPathsForInterface
   * @param{Array|Object} constraints 同 updateParamNameOrTypeByKeysPathsForInterface
   * @param{Object} keysPathsMap 同 updateParamNameOrTypeByKeysPathsForInterface
   * @param{Object} options 同 updateParamNameOrTypeByKeysPathsForInterface
   */
  * updateParamNameOrTypeByKeysPathsForDatatypes({datatypeArr, datatypes, constraints, keysPathsMap, options, datatype}) {
    // 如果更新的是公共资源库中的数据模型，那引用这个数据模型的接口可以分散在不同的项目中，还要考虑这个数据模型又被很多接口引用的情况
    const projectIds = resourceUtil.getProjectIds(datatypeArr);
    if (!projectIds.length) {
      return;
    }
    const projectIdWithDocsMap = yield this.dao.findDatatypesFromProjects({projectIds});
    // 项目id和要更新的文档集映射
    const projectIdWithUpdatingDocsMap = {};
    projectIds.forEach(projectId => {
      const allDocs = projectIdWithDocsMap[projectId];
      const datatypeIds = datatypeArr.filter(dt => dt.projectId === projectId).map(dt => dt.id);
      const docs = allDocs.filter(doc => datatypeIds.includes(doc.datatypeId));
      if (Array.isArray(docs) && docs.length) {
        projectIdWithUpdatingDocsMap[projectId] = docs.map(doc => {
          return {
            datatypeId: doc.datatypeId,
            data: this._updateParamNameOrTypeByKeysPathsForData({
              data: doc.data,
              keysPaths: keysPathsMap[doc.datatypeId],
              options,
              datatypes,
              constraints,
              datatype
            }),
          };
        });
      }
    });
    return yield this.dao.updateDatatypesOfProjects({projectIdWithUpdatingDocsMap});
  }

  /**
   * @private
   */
  _updateParamNameOrTypeByKeysPathsForData({data, keysPaths, options, datatypes, constraints, datatype}) {
    let valueParam;
    if (datatype && datatype.format === db.MDL_FMT_HASHMAP) {
      keysPaths = keysPaths.map(keysPath => keysPath.slice(0, keysPath.length - 1));
      valueParam = datatype.params.find(p => p.name === '值');
    }

    function convertToType(value) {
      switch (options.newType) {
        case db.MDL_SYS_STRING:
        case db.MDL_SYS_VARIABLE:
          return JSON.stringify(value);
        case db.MDL_SYS_NUMBER:
          return Number(value);
        case db.MDL_SYS_BOOLEAN:
          return value !== 'false';
      }
      // 换成了自定义类型，生成mock数据
      if (options.newType > db.MDL_SYS_BOOLEAN) {
        const mockResult = mockDataWork.getDataTypeMockData(constraints, options.newType, datatypes);
        if (mockResult.error.length) {
          return mockResult.json || mockResult.error.join('');
        } else {
          return mockResult.json;
        }
      }
    }

    function walk({data, keysPath}) {
      if (keysPath.length === 1) {
        if (keysPath[0].isArray) {
          if (Array.isArray(data)) {
            data.forEach((item, idx) => {
              if (options.isUpdatingParamName) {
                data[options.newName] = data[idx];
                delete data[idx];
              } else if (options.isUpdatingParamType) {
                data[idx] = convertToType(item);
              }
            });
          } else {
            data = [convertToType(data)];
          }
        } else {
          if (options.isUpdatingParamName) {
            data[options.newName] = data[keysPath[0]];
            delete data[keysPath[0]];
          } else if (options.isUpdatingParamType) {
            const value = convertToType(data[keysPath[0]]);
            if (options.isArray && !(datatype && datatype.format === db.MDL_FMT_HASHMAP)) {
              data[keysPath[0]] = [value];
            } else {
              if (valueParam && datatype && datatype.format === db.MDL_FMT_HASHMAP) {
                // 计算新的集合值数据
                // 并插入至现存的集合键中
                const keys = Object.keys(data[keysPath[0]]);
                for (let i = 0; i < keys.length; i++) {
                  if (options.newType <= db.MDL_SYS_BOOLEAN) {
                    // 系统类型转换
                    // 保留前值
                    const prevValue = convertToType(data[keysPath[0]][keys[i]]);
                    data[keysPath[0]][keys[i]] = valueParam.isArray ? [prevValue] : prevValue;
                  } else {
                    // 非系统类型，不保留前值
                    // 生成mock新值
                    const mock = mockDataWork.getDataTypeMockData(constraints, valueParam.type, datatypes);
                    const mockResult = mock.error.length ? (mock.json || mock.error.join('')) : mock.json;
                    data[keysPath[0]][keys[i]] = valueParam.isArray ? [mockResult] : mockResult;
                  }
                }
              } else {
                data[keysPath[0]] = value;
              }
            }
          }
        }
      } else {
        const clonedKeysPath = keysPath.concat();
        const keyPath = clonedKeysPath.shift();
        if (keyPath.isArray) {
          // data 肯定也是 array
          if (Array.isArray(data)) {
            data.forEach((item, idx) => {
              data[idx] = walk({data: data[idx], keysPath: clonedKeysPath});
            });
          }
        } else if (keyPath.isImport) {
          // 有key就取下一级，没有仍旧是 data 本身
          if (keyPath.key) {
            if (keyPath.key.isArray) {
              data.forEach(item => {
                walk({data: item, keysPath: clonedKeysPath});
              });
            } else {
              walk({data: data[keyPath.key], keysPath: clonedKeysPath});
            }
          } else {
            walk({data, keysPath: clonedKeysPath});
          }
        } else {
          data[keyPath] = walk({data: data[keyPath], keysPath: clonedKeysPath});
        }
      }
      return data;
    }

    keysPaths.forEach(keysPath => {
      data = walk({data, keysPath});
    });
    return data;
  }

  /**
   * 根据路径，添加或者删除接口mock数据中的字段
   * @param  {Object} itf - 接口对象
   * @param  {Object} keysPathsMap - keysPaths 和 接口id的映射， - keysPaths是键的路径，是一个二维数组。如果要更新的数据是数组，则用 {isArray: true} 来表示
   * @param  {Object} optionsMap - options 和接口id的映射，值为下面描述的 options，它有以下字段：
   * @attribute  {Boolean} options.isAddingParam - 添加字段
   * @attribute  {Boolean} options.isDeletingParam - 删除字段
   * @attribute  {String} options.createdParams - 添加的字段
   * @attribute  {String} options.format - 接口响应结果的类别
   * @attribute  {Array<Object>} options.removedParams - 删除的参数列表
   * @attribute  {Array<Number>} options.removedImports - 删除的导入参数列表，数组元素是导入的数据模型的id
   * @param {Array|Object} datatypes - 数据模型列表
   * @param {Array|Object} constraints - 规则函数列表
   * @return  {Boolean} true 更新成功，false Mock数据不存在，或者传入参数有误
   */
  * addOrRemoveParamsByKeysPathsForInterfaces({itfArr, keysPathsMap, datatypes, constraints, optionsMap}) {
    // 接口响应参数的类别不是哈希或者数组，也就无法保存 Mock 数据
    const itfs = itfArr.filter(MockStoreService.canInterfaceSaveMockdata);
    if (!itfs.length) {
      return false;
    }
    // 如果更新的是公共资源库中的数据模型，那引用这个数据模型的接口可以分散在不同的项目中，这里按项目进行分组更新，实际情况应该比较少见
    // 如果更新了公共资源库中的数据模型，同时这个数据模型又被很多接口引用，此时性能就比较差了
    const projectIds = resourceUtil.getProjectIds(itfs);
    const projectIdWithDocsMap = yield this.dao.findInterfacesFromProjects({projectIds});
    // 项目id和要更新的文档集映射
    const projectIdWithUpdatingDocsMap = {};
    projectIds.forEach(projectId => {
      const allDocs = projectIdWithDocsMap[projectId];
      const interfaceIds = itfArr.filter(itf => itf.projectId === projectId).map(itf => itf.id);
      const docs = allDocs.filter(doc => interfaceIds.includes(doc.interfaceId));
      if (Array.isArray(docs) && docs.length) {
        projectIdWithUpdatingDocsMap[projectId] = docs.map(doc => {
          return {
            interfaceId: doc.interfaceId,
            data: this._addOrRemoveParamsByKeysPathsForData({
              data: doc.data,
              keysPaths: keysPathsMap[doc.interfaceId],
              options: optionsMap[doc.interfaceId],
              datatypes,
              constraints,
            }),
          };
        });
      }
    });
    try {
      return yield this.dao.updateInterfacesOfProjects({projectIdWithUpdatingDocsMap});
    } catch (e) {
      // mongodb 异常，比如key里面有点号的数据就无法保存
    }
  }

  /**
   * 根据路径，添加或者删除数据模型mock数据中的字段
   * 根据路径，更新数据模型Mock数据中的字段的名称或者类型
   * @param{Object} updatingDatatype 被更新字段名称或者字段类型的数据模型
   * @param{Array|Object} datatypes 同 addOrRemoveParamsByKeysPathsForInterface
   * @param{Array|Object} constraints 同 addOrRemoveParamsByKeysPathsForInterface
   * @param{Object} keysPathsMap 和数据模型id的映射，类同 addOrRemoveParamsByKeysPathsForInterface
   * @param{Object} options 同 addOrRemoveParamsByKeysPathsForInterface
   */
  * addOrRemoveParamsByKeysPathsForDatatypes({datatypeArr, datatypes, constraints, keysPathsMap, options}) {
    // 如果更新的是公共资源库中的数据模型，那引用这个数据模型的接口可以分散在不同的项目中，还要考虑这个数据模型又被很多接口引用的情况
    const projectIds = resourceUtil.getProjectIds(datatypeArr);
    if (!projectIds.length) {
      return;
    }
    const projectIdWithDocsMap = yield this.dao.findDatatypesFromProjects({projectIds});
    // 项目id和要更新的文档集映射
    const projectIdWithUpdatingDocsMap = {};
    projectIds.forEach(projectId => {
      const allDocs = projectIdWithDocsMap[projectId];
      const datatypeIds = datatypeArr.filter(dt => dt.projectId === projectId).map(dt => dt.id);
      const docs = allDocs.filter(doc => datatypeIds.includes(doc.datatypeId));
      if (Array.isArray(docs) && docs.length) {
        projectIdWithUpdatingDocsMap[projectId] = docs.map(doc => {
          return {
            datatypeId: doc.datatypeId,
            data: this._addOrRemoveParamsByKeysPathsForData({
              data: doc.data,
              keysPaths: keysPathsMap[doc.datatypeId],
              options,
              datatypes,
              constraints,
            }),
          };
        });
      }
    });
    return yield this.dao.updateDatatypesOfProjects({projectIdWithUpdatingDocsMap});
  }

  /**
   * @private
   */
  _addOrRemoveParamsByKeysPathsForData({data, keysPaths, options, datatypes, constraints}) {
    function getParameterMockData(params) {
      const mockResult = mockDataWork.getParameterMockData(constraints, options.format, params, datatypes);
      if (mockResult.error.length) {
        return '';
      } else {
        return mockResult.json;
      }
    }

    function walk({data, keysPath}) {
      if (keysPath.length === 0) {
        if (options.isAddingParam) {
          // 添加字段，值使用 mock 值
          const mockdata = getParameterMockData(options.createdParams);
          Object.assign(data, mockdata);
        } else if (options.isRemovingParam) {
          // 删除普通字段
          options.removedParams.forEach(param => {
            delete data[param.name];
          });
          // 删除导入的数据模型的字段
          options.removedImports.forEach(importedDatatypeId => {
            const datatype = datatypes.find(dt => dt.id === importedDatatypeId);
            datatype.params.forEach(param => {
              delete data[param.name];
            });
          });
        }
      } else {
        const clonedKeysPath = keysPath.concat();
        const keyPath = clonedKeysPath.shift();
        if (keyPath.isArray) {
          // data 肯定也是 array
          if (Array.isArray(data)) {
            data.forEach((item, idx) => {
              data[idx] = walk({data: data[idx], keysPath: clonedKeysPath});
            });
          }
        } else if (keyPath.isImport) {
          // 有key就取下一级，没有仍旧是 data 本身
          if (keyPath.key) {
            if (keyPath.key.isArray) {
              data.forEach(item => {
                walk({data: item, keysPath: clonedKeysPath});
              });
            } else {
              walk({data: data[keyPath.key], keysPath: clonedKeysPath});
            }
          } else {
            walk({data, keysPath: clonedKeysPath});
          }
        } else {
          if (keyPath) {
            data[keyPath] = walk({data: data[keyPath], keysPath: clonedKeysPath});
          } else {
            // 匿名数据模型
            walk({data, keysPath: clonedKeysPath});
          }
        }
      }
      return data;
    }

    // todo: 存在循环引用时貌似会有异常
    try {
      // keysPaths 长度为 0 时，表示就是在操作第一层的字段
      if (!keysPaths.length) {
        data = walk({data, keysPath: []});
      } else {
        keysPaths.forEach(keysPath => {
          data = walk({data, keysPath});
        });
      }
    } catch (e) {

    }
    return data;
  }

  /**
   * 开放的获取mock数据的接口调用，要考虑connect的情况
   * @param  {Object}
   * @attribute  {Object} itf - 接口对象
   * @attribute  {Object} req - 请求对象
   * @attribute  {Object} req.query - 请求的查询参数
   * @attribute  {Object} req.body - 请求体
   * @attribute  {Object} req.apiPathVars - 请求的路径参数，事先已经计算好，是一个哈希对象
   * @return  {Object} apimock 接口的最终响应数据
   */
  * crudInterface({itf, req}) {
    const reqQuery = req.query;
    const reqBody = req.body;
    const apiPathVars = req.apiPathVars;
    // 处理前置业务逻辑脚本
    const constraints = yield this.interfaceService.getConstraints({projectIds: itf.projectId});
    // 查这个api的持久化mock数据
    const apiMockdata = yield this.getByInterfaceObj(itf);
    if (!itf.connectId || !itf.connectType) {
      // 如果接口没有关联的数据模型，此时也要考虑前置和后置业务逻辑脚本
      const businessLogicBeforeScriptExecResult = MockStoreService.getBusinessLogicBeforeScriptExecResult({
        constraints,
        itf,
        options: {
          req
        }
      });
      if (businessLogicBeforeScriptExecResult !== undefined && businessLogicBeforeScriptExecResult._nei_apimock_error) {
        return businessLogicBeforeScriptExecResult;
      }
      const businessLogicAfterScriptExecResult = MockStoreService.getBusinessLogicAfterScriptExecResult({
        constraints,
        itf,
        options: {
          req,
          resData: apiMockdata
        }
      });
      if (businessLogicAfterScriptExecResult !== undefined && businessLogicAfterScriptExecResult._nei_apimock_error) {
        return businessLogicAfterScriptExecResult;
      }
      return businessLogicAfterScriptExecResult ? (businessLogicAfterScriptExecResult.data || apiMockdata) : apiMockdata;
    }
    const datatypes = yield this.datatypeService.getListInProject(itf.projectId);
    const connectedDatatype = datatypes.find(dt => dt.id === itf.connectId);
    // 关联的数据模型，是否合法，这里就不用检查了，因为在设置关联数据模型时，后端已经做了强验证，不可能是不合法的
    const idParam = connectedDatatype.params.find(param => param.name === 'id');

    // 在执行自定义脚本时，可能会需要用到当前的模型列表以及整个项目中的所有模型列表
    // 如果接口关联的是公共资源库的数据模型，此时还要获取公共资源库的数据模型mock数据
    const projectIds = resourceUtil.getProjectIds(datatypes);
    let allModels = yield this.dao.findAllModelsInProjects({projectIds});
    // 当前模型数据列表
    const models = allModels[itf.connectId] || [];
    // 很多重复的数据可能性比较大，这里就把当前所操作的数据模型列表删除吧
    delete allModels[itf.connectId];
    // allModels 的 key 是数据模型的 id，不方便，这里转换为数据模型的名称
    const convertedAllModels = {};
    Object.keys(allModels).forEach(datatypeId => {
      const datatype = datatypes.find(dt => String(dt.id) === datatypeId);
      convertedAllModels[datatype.name.toLowerCase()] = allModels[datatypeId];
    });
    allModels = convertedAllModels;
    const businessLogicBeforeScriptExecResult = MockStoreService.getBusinessLogicBeforeScriptExecResult({
      constraints,
      itf,
      options: {
        req,
        models,
        allModels,
      }
    });
    if (businessLogicBeforeScriptExecResult !== undefined && businessLogicBeforeScriptExecResult._nei_apimock_error) {
      return businessLogicBeforeScriptExecResult;
    }
    const dataReturnedByBlbScript = businessLogicBeforeScriptExecResult ? businessLogicBeforeScriptExecResult.data : null;
    // 接口和数据模型有关联，和接口的返回数据，两者并没有关系。最终返回的数据，还是要看接口的响应结果定义。
    const interfaces = yield this.interfaceService.findDetailWithOutputsByIds([itf.id]);
    // 数据库操作返回的数据
    let dbOperationResult = {};
    // 有关联的数据模型，并且也设置了关联类型
    // 根据持久化的mock数据、数据库操作结果、接口响应结果的定义、后置业务逻辑脚本等四个条件，计算最终结果
    // 以下操作，不要使用接口的id，而要使用被关联的数据模型的id。因为接口关联的数据模型有可能是公共资源库的，此时两者id并不相同
    const projectId = connectedDatatype.projectId;
    const datatypeId = connectedDatatype.id;
    switch (itf.connectType) {
      case db.CONNECT_TYPE_GET: {
        const queryId = resourceUtil.getReqFieldValueByKey({key: 'id', reqQuery, reqBody, apiPathVars, idParam});
        if (queryId === null) {
          dbOperationResult = {
            _nei_apimock_error: `没找到 id 参数，请确认`
          };
          break;
        }
        dbOperationResult = yield this.dao.findDatatype({
          projectId,
          datatypeId,
          queryId,
        });
        // 参数有误，没找到数据
        if (dbOperationResult === null) {
          dbOperationResult = {
            _nei_apimock_error: `您要查找的数据不存在，查询 id 为 ${queryId}，请查检参数是否正确`
          };
        }
        break;
      }
      case db.CONNECT_TYPE_GET_ALL: {
        dbOperationResult = yield this.dao.findAllDatatypes({
          projectId,
          datatypeId,
        });
        break;
      }
      case db.CONNECT_TYPE_GET_LIST: {
        let queryIds = resourceUtil.getReqFieldValueByKey({
          key: 'ids',
          reqQuery,
          reqBody,
          apiPathVars,
          idParam,
          convertStringIdsToArray: true
        });
        if (queryIds === null || queryIds === '' || Array.isArray(queryIds) && !queryIds.length) {
          dbOperationResult = {
            _nei_apimock_error: `没找到 ids 参数或者 ids 参数的值为空，请确认`
          };
          break;
        }
        dbOperationResult = yield this.dao.findDatatypes({
          projectId,
          datatypeId,
          queryIds,
        });
        break;
      }
      case db.CONNECT_TYPE_CREATE: {
        if (models.length + 1 > MAX_MOCKDATA_ITEM_NUM) {
          dbOperationResult = {
            _nei_apimock_error: `同学，最多只支持创建 ${MAX_MOCKDATA_ITEM_NUM} 条数据~`
          };
          break;
        }
        const reqData = dataReturnedByBlbScript || reqBody.data || reqBody;
        if (resourceUtil.isNotOrEmptyJsonObject(reqData)) {
          dbOperationResult = {
            _nei_apimock_error: '您未发送数据或者发送的不是 JSON 数据，请确认'
          };
          break;
        }
        const result = resourceUtil.fetchDataByParams({
          data: reqData,
          params: connectedDatatype.params,
          datatypes,
        });
        if (result === null) {
          // 发送的数据不符合定义
          dbOperationResult = {
            _nei_apimock_error: '没有发送数据，请确认'
          };
          break;
        }
        if (result.error.length) {
          // 发送的数据不符合定义
          dbOperationResult = {
            _nei_apimock_error: result.error
          };
          break;
        }
        if (JSON.stringify(result.data).length > MAX_MOCKDATA_SIZE) {
          // mock 数据大于 500KB，不保存
          dbOperationResult = {
            _nei_apimock_error: `同学，Mock 数据大于 ${MAX_MOCKDATA_SIZE_KB}KB 了~`
          };
          break;
        }
        // 获取一个新生成的数据模型id，并添加到要保存的数据中
        const datatypeIds = resourceUtil.genDatatypeIds({type: idParam.type});
        result.data.id = datatypeIds[0];
        // 按照数据库操作，通常认为需要返回的数据
        dbOperationResult = yield this.dao.createDatatype({
          projectId,
          datatypeId,
          data: result.data,
        });
        break;
      }
      case db.CONNECT_TYPE_CREATE_LIST: {
        // 可以发送数组或者是放在items或者data字段中
        let listData = dataReturnedByBlbScript || reqBody.data || reqBody.items || reqBody;
        if (!listData || !Array.isArray(listData) || !listData.length) {
          dbOperationResult = {
            _nei_apimock_error: '未找到发送数据，请将要批量创建的数组数据放在请求体中，也可以放在请求体的 data 或者 items 字段中'
          };
          break;
        }
        let errors = [];
        listData = listData.map(data => {
          const tempResult = resourceUtil.fetchDataByParams({
            data,
            params: connectedDatatype.params,
            datatypes,
          });
          if (tempResult === null) {
            errors.push('没有发送数据，请确认');
          } else if (tempResult.error.length) {
            errors.push(tempResult.error);
          } else {
            return tempResult.data;
          }
        });
        if (errors.length) {
          // 发送的数据不符合定义
          dbOperationResult = {
            _nei_apimock_error: errors
          };
          break;
        }
        if (models.length + listData.length > MAX_MOCKDATA_ITEM_NUM) {
          dbOperationResult = {
            _nei_apimock_error: `同学，最多只支持创建 ${MAX_MOCKDATA_ITEM_NUM} 条数据~`
          };
          break;
        }
        if (JSON.stringify(listData).length > MAX_MOCKDATA_SIZE * listData.length) {
          // 单条 mock 数据大于 500KB，不保存
          dbOperationResult = {
            _nei_apimock_error: `同学，Mock 数据不能大于 ${MAX_MOCKDATA_SIZE_KB}KB~`
          };
          break;
        }
        // 获取一批新生成的数据模型id，并添加到要保存的数据中
        let datatypeIds = resourceUtil.genDatatypeIds({idNum: listData.length, type: idParam.type});
        listData.forEach((data, idx) => {
          data.id = datatypeIds[idx];
        });
        // 按照数据库操作，通常认为需要返回的数据
        dbOperationResult = yield this.dao.createDatatypes({
          projectId,
          datatypeId,
          listData,
        });
        break;
      }
      case db.CONNECT_TYPE_UPDATE: {
        const queryId = resourceUtil.getReqFieldValueByKey({key: 'id', reqQuery, reqBody, apiPathVars, idParam});
        if (queryId === null) {
          dbOperationResult = {
            _nei_apimock_error: `没找到 id 参数，请确认`
          };
          break;
        }
        const originalReqData = dataReturnedByBlbScript || reqBody.data || reqBody;
        if (resourceUtil.isNotOrEmptyJsonObject(originalReqData)) {
          dbOperationResult = {
            _nei_apimock_error: `未找到数据，请将数据放在请求体中，也可以放在请求体的data字段中，请确认`
          };
          break;
        }
        const result = resourceUtil.fetchDataByParams({
          data: originalReqData,
          params: connectedDatatype.params,
          datatypes,
        });
        if (result === null) {
          // 发送的数据不符合定义
          dbOperationResult = {
            _nei_apimock_error: '没有发送数据，请确认'
          };
          break;
        }
        if (result.error.length) {
          // 发送的数据不符合定义
          dbOperationResult = {
            _nei_apimock_error: result.error
          };
          break;
        }
        const reqData = result.data;
        // id 字段不能更新
        delete reqData.id;
        if (resourceUtil.isNotOrEmptyJsonObject(reqData)) {
          dbOperationResult = {
            _nei_apimock_error: `未找到需要更新的字段，请确认：${JSON.stringify(originalReqData)}`
          };
          break;
        }
        if (JSON.stringify(reqData).length > MAX_MOCKDATA_SIZE) {
          // 单条 mock 数据大于 500KB，不保存
          dbOperationResult = {
            _nei_apimock_error: `同学，Mock 数据不能大于 ${MAX_MOCKDATA_SIZE_KB}KB~`
          };
          break;
        }
        dbOperationResult = yield this.dao.updateDatatype({
          projectId,
          datatypeId,
          queryId,
          data: reqData,
        });
        // 参数有误，没找到数据
        if (dbOperationResult === null) {
          dbOperationResult = {
            _nei_apimock_error: `更新失败，您要更新的数据可能不存在，查询 id 为 ${queryId}。另外请查检参数名称是否正确：${JSON.stringify(originalReqData)}`
          };
        }
        break;
      }
      case db.CONNECT_TYPE_UPDATE_ALL: {
        const originalReqData = dataReturnedByBlbScript || reqBody.data || reqBody;
        if (resourceUtil.isNotOrEmptyJsonObject(originalReqData)) {
          dbOperationResult = {
            _nei_apimock_error: `未找到数据，请将数据放在请求体中，也可以放在请求体的 data 字段中，请确认`
          };
          break;
        }
        const result = resourceUtil.fetchDataByParams({
          data: originalReqData,
          params: connectedDatatype.params,
          datatypes,
        });
        if (result === null) {
          // 发送的数据不符合定义
          dbOperationResult = {
            _nei_apimock_error: '没有发送数据，请确认'
          };
          break;
        }
        if (result.error.length) {
          // 发送的数据不符合定义
          dbOperationResult = {
            _nei_apimock_error: result.error
          };
          break;
        }
        const reqData = result.data;
        if (resourceUtil.isNotOrEmptyJsonObject(reqData)) {
          dbOperationResult = {
            _nei_apimock_error: `未找到需要更新的字段，请确认：${JSON.stringify(originalReqData)}`
          };
          break;
        }
        if (JSON.stringify(reqData).length > MAX_MOCKDATA_SIZE) {
          // 单条 mock 数据大于 500KB，不保存
          dbOperationResult = {
            _nei_apimock_error: `同学，Mock 数据不能大于 ${MAX_MOCKDATA_SIZE_KB}KB~`
          };
          break;
        }
        dbOperationResult = yield this.dao.updateAllDatatypes({
          projectId,
          datatypeId,
          data: reqData,
        });
        // 参数有误，没找到数据
        if (dbOperationResult === null) {
          dbOperationResult = {
            _nei_apimock_error: `您要更新的数据不存在，请确认，请检查参数是否正确：${JSON.stringify(originalReqData)}`
          };
        }
        break;
      }
      case db.CONNECT_TYPE_UPDATE_LIST: {
        let listData = dataReturnedByBlbScript || reqBody.data || reqBody.items || reqBody;
        if (!listData || !Array.isArray(listData)) {
          dbOperationResult = {
            _nei_apimock_error: `未找到数据，请将数据放在请求体中，也可以放在请求体的 data 字段中，请确认`
          };
          break;
        }
        // 先查找要更新的数据是否都存在
        const queryIds = [];
        listData.forEach(item => {
          // 考虑有重复的情况，排除
          if (!queryIds.includes(item.id)) {
            queryIds.push(item.id);
          }
        });
        if (queryIds.length !== listData.length) {
          // 说明有的条目没有id
          dbOperationResult = {
            _nei_apimock_error: `发送的数据项中，有的没有 id 字段或者 id 字段值有重复的，请确认`
          };
          break;
        }
        const docs = yield this.dao.findDatatypes({
          projectId,
          datatypeId,
          queryIds
        });
        if (docs.length !== queryIds.length) {
          const notExistIds = queryIds.filter(id => {
            return !docs.find(doc => doc.id === id);
          });
          // 没有找到的id列表
          dbOperationResult = {
            _nei_apimock_error: `发送的数据项中，以下 id 对应的数据不存在，请确认：${JSON.stringify(notExistIds.join(','))}`
          };
          break;
        }
        let errors = [];
        listData = listData.map(data => {
          const id = data.id;
          const tempResult = resourceUtil.fetchDataByParams({
            data,
            params: connectedDatatype.params,
            datatypes,
          });
          if (tempResult === null) {
            errors.push('没有发送数据，请确认');
          } else {
            if (tempResult.error.length) {
              errors.push(tempResult.error);
            } else {
              tempResult.data.id = id;
              return tempResult.data;
            }
          }
        });
        if (errors.length) {
          // 发送的数据不符合定义
          dbOperationResult = {
            _nei_apimock_error: errors
          };
          break;
        }
        listData.map(item => {
          const doc = docs.find(doc => doc.id === item.id);
          Object.assign(doc, item);
        });
        if (JSON.stringify(docs).length > MAX_MOCKDATA_SIZE * docs.length) {
          // 单条 mock 数据大于 500KB，不保存
          dbOperationResult = {
            _nei_apimock_error: `同学，Mock 数据不能大于 ${MAX_MOCKDATA_SIZE_KB}KB~`
          };
          break;
        }
        dbOperationResult = yield this.dao.updateDatatypes({
          projectId,
          datatypeId,
          updatingDocs: docs,
        });
        break;
      }
      case db.CONNECT_TYPE_DELETE: {
        const queryId = resourceUtil.getReqFieldValueByKey({key: 'id', reqQuery, reqBody, apiPathVars, idParam});
        if (queryId === null) {
          dbOperationResult = {
            _nei_apimock_error: `没找到 id 参数，请确认`
          };
          break;
        }
        dbOperationResult = yield this.dao.removeDatatype({
          projectId,
          datatypeId,
          queryId,
        });
        // 参数有误，没找到数据
        if (dbOperationResult === null) {
          dbOperationResult = {
            _nei_apimock_error: `您要删除的数据不存在，删除的 id 为 ${queryId}，请查检参数是否正确`
          };
        }
        break;
      }
      case db.CONNECT_TYPE_DELETE_ALL: {
        dbOperationResult = yield this.dao.removeAllDatatypes({
          projectId,
          datatypeId,
        });
        break;
      }
      case db.CONNECT_TYPE_DELETE_LIST: {
        let queryIds = resourceUtil.getReqFieldValueByKey({
          key: 'ids',
          reqQuery,
          reqBody,
          apiPathVars,
          idParam,
          convertStringIdsToArray: true
        });
        if (queryIds === null || queryIds === '' || Array.isArray(queryIds) && !queryIds.length) {
          dbOperationResult = {
            _nei_apimock_error: `没找到 ids 参数，请确认`
          };
          break;
        }
        dbOperationResult = yield this.dao.removeDatatypes({
          projectId,
          datatypeId,
          queryIds,
        });
        // 参数有误，没找到数据
        if (dbOperationResult.failDeletedIds) {
          dbOperationResult = {
            _nei_apimock_error: `以下 id 对应的数据不存在：${JSON.stringify(dbOperationResult.failDeletedIds)}，请确认`,
            deletedSuccess: dbOperationResult.successDeletedDocs
          };
        }
        break;
      }
      default:
        break;
    }
    if (dbOperationResult._nei_apimock_error) {
      return dbOperationResult;
    }
    const resData = resourceUtil.computeResponseOfConnect({
      apiMockdata,
      dbOperationResult,
      itf: interfaces[0],
      connectedDatatype,
      datatypes,
    });
    // 后置业务逻辑脚本
    const businessLogicAfterScriptExecResult = MockStoreService.getBusinessLogicAfterScriptExecResult({
      constraints,
      itf,
      options: {
        req,
        resData,
        models,
        allModels,
      }
    });
    if (businessLogicAfterScriptExecResult !== undefined && businessLogicAfterScriptExecResult._nei_apimock_error) {
      return businessLogicAfterScriptExecResult;
    }
    return businessLogicAfterScriptExecResult ? (businessLogicAfterScriptExecResult.data || resData) : resData;
  }

  static getBusinessLogicBeforeScriptExecResult({itf, constraints, options}) {
    const businessLogicBeforeScriptExecResult = mockDataWork.getScriptExecResult({
      constraints,
      options,
      itf,
      scriptName: 'blbScript'
    });
    if (businessLogicBeforeScriptExecResult !== undefined) {
      if (businessLogicBeforeScriptExecResult.error) {
        // 返回给用户的错误信息统一使用 `_nei_apimock_error` 字段
        businessLogicBeforeScriptExecResult._nei_apimock_error = `前置业务逻辑脚本 ${itf.blbScript} 执行异常：${JSON.stringify(businessLogicBeforeScriptExecResult.error)}`;
        delete businessLogicBeforeScriptExecResult.error;
        return businessLogicBeforeScriptExecResult;
      } else {
        return businessLogicBeforeScriptExecResult;
      }
    }
  }

  static getBusinessLogicAfterScriptExecResult({itf, constraints, options}) {
    // 后置业务逻辑脚本
    const businessLogicAfterScriptExecResult = mockDataWork.getScriptExecResult({
      constraints,
      options,
      itf,
      scriptName: 'blaScript'
    });
    if (businessLogicAfterScriptExecResult !== undefined) {
      if (businessLogicAfterScriptExecResult.error) {
        // 返回给用户的错误信息统一使用 `_nei_apimock_error` 字段
        businessLogicAfterScriptExecResult._nei_apimock_error = `后置业务逻辑脚本 ${itf.blaScript} 执行异常：${JSON.stringify(businessLogicAfterScriptExecResult.error)}`;
        delete businessLogicAfterScriptExecResult.error;
        // 用户返回了错误或者是脚本执行有误，就返回所有信息
        return businessLogicAfterScriptExecResult;
      } else {
        // 否则，优先考虑用户返回的data
        return businessLogicAfterScriptExecResult;
      }
    }
  }
}

module.exports = MockStoreService;
