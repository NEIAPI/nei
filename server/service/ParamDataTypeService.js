/**
 * Data Type Parameter Service Class
 */
const db = require('../../common/config/db.json');
const resourceUtil = require('../util/resource_util');
const MockStoreService = require('./MockStoreService');
const InterfaceService = require('./InterfaceService');
const RpcService = require('./RpcService');
const DataTypeService = require('./DataTypeService');

class ParamDataTypeService extends require('./AttributeService') {
  constructor(uid, context) {
    super(
      uid, context, '../dao/DataTypeDao',
      '../dao/ParamDataTypeDao'
    );
  }

  /**
   * get data type attribute list
   *
   * @param  {Number} id - data type id
   * @return {Array}  parameters list for data type
   */
  * getList(id) {
    // check visit permission
    let ret = yield this._dataTypeService.findDetailById(id);
    let {projectId, progroupId} = ret;
    ret = ((ret || {}).params) || [];
    ret.progroupId = progroupId;
    ret.projectId = projectId;
    return ret;
  }

  /**
   * 修改响应参数后，需要更新 Mongodb 的 Redis 中的 Mock 数据，只需要考虑修改 name 和 type 的情况
   * @param {Number} parentId - 数据模型的id
   * @param {Number} parentType - 引用数据模型的资源类型
   * @param {Object} newParam - 更新后的参数数据
   * @param {Object} oldParam - 更新前的参数数据
   * @param {Array|Object} datatypeListUsedByDatatype - 引用了该数据模型的数据模型列表
   */
  * _afterUpdate({parentId, parentType, newParam, oldParam, datatypeListUsedByDatatype}) {
    const isNameUpdated = newParam.name !== oldParam.name;
    const isTypeUpdated = newParam.type !== oldParam.type || newParam.isArray !== oldParam.isArray;
    const isIgnoredUpdated = newParam.ignored !== oldParam.ignored;
    if (isNameUpdated || isTypeUpdated) {
      const result = yield this.findInterfacesAndRpcsAndDatatypes({parentId, parentType, datatypeListUsedByDatatype});
      if (!result) {
        return;
      }
      // 方便起见，http 接口和 rpc 接口都当作接口来处理，对于 mockStore 是同种资源
      const interfaces = result.interfaces.concat(result.rpcs);
      const datatypes = result.datatypes;
      const mockStoreService = new MockStoreService(this._uid, this._context);
      const options = {
        isUpdatingParamName: isNameUpdated,
        isUpdatingParamType: isTypeUpdated,
        newType: newParam.type,
        isArray: newParam.isArray,
        newName: newParam.name,
      };
      // 当前正在操作的数据模型
      const datatype = datatypes.find(dt => dt.id === parentId);
      let constraints = [];
      // 切换成新的自定义类型时，需要算mock数据
      if (resourceUtil.isCustomDatatype(options.newType)) {
        const interfaceService = new InterfaceService(this._uid, this._context);
        // 一个项目中的规则函数是共用的，所以用 interfaceService 或者 rpcService 去取，结果是一样的
        constraints = yield interfaceService.getConstraints({projectIds: datatype.projectId});
      }
      // 更新接口中的mock数据
      const itfArr = [];
      const keysPathsMapForInterface = {};
      for (let i = 0; i < interfaces.length; i++) {
        const itf = interfaces[i];
        if (itf.resFormat === db.MDL_FMT_HASHMAP) {
          yield mockStoreService.refreshInterface({interfaceId: itf.id});
        } else {
          const keysPaths = resourceUtil.getKeysPaths({
            params: itf.params.outputs,
            targetDatatypeId: parentId,
            datatypes,
            resFormat: itf.resFormat
          });
          if (!keysPaths.length) {
            keysPaths.push([oldParam.name]);
          } else {
            keysPaths.forEach(keysPath => {
              keysPath.push(oldParam.name);
            });
          }
          itfArr.push(itf);
          keysPathsMapForInterface[itf.id] = keysPaths;
        }
      }
      yield mockStoreService.updateParamNameOrTypeByKeysPathsForInterfaces({
        itfArr,
        keysPathsMap: keysPathsMapForInterface,
        options,
        datatypes,
        constraints,
        datatype
      });
      // 更新数据模型本身的mock数据，此时说明该数据模型已经和接口进行了关联
      // 还有一种情况是，另外一个数据模型引用了当前被更新的这个数据模型，而且另外这个数据模型也和接口进行了关联，此时也需要更新另外这个数据模型
      const datatypeArr = [];
      const keysPathsMapForDatatype = {};
      for (let i = 0; i < datatypeListUsedByDatatype.length; i++) {
        const datatype = datatypeListUsedByDatatype[i];
        const checkValidResult = resourceUtil.isDatatypeValidForConnect(datatype, datatypes);
        if (checkValidResult === true) {
          const keysPaths = resourceUtil.getKeysPaths({
            params: datatype.params,
            targetDatatypeId: datatype.id,
            datatypes
          });
          if (!keysPaths.length) {
            keysPaths.push([oldParam.name]);
          } else {
            keysPaths.forEach(keysPath => {
              keysPath.push(oldParam.name);
            });
          }
          datatypeArr.push(datatype);
          keysPathsMapForDatatype[datatype.id] = keysPaths;
        }
      }
      yield mockStoreService.updateParamNameOrTypeByKeysPathsForDatatypes({
        datatypeArr,
        datatypes,
        constraints,
        keysPathsMap: keysPathsMapForDatatype,
        options,
        datatype
      });
    } else if (isIgnoredUpdated) {
      // 更新的是导入的数据模型的字段的显示或隐藏
      if (newParam.ignored) {
        // 隐藏字段，对于Mock数据来说，相当于删除字段
        yield this._afterRemove({parentId, parentType, removedParams: [newParam], datatypeListUsedByDatatype});
      } else {
        // 显示字段，对于Mock数据来说，相当于增加字段
        yield this._afterCreate({parentId, parentType, createdParams: [newParam], datatypeListUsedByDatatype});
      }
    }
  }

  /**
   * 添加响应参数后，需要更新 Mongodb 的 Redis 中的 Mock 数据
   * @param {Number} parentId - 数据模型的id
   * @param {Number} parentType - 引用数据模型的资源类型
   * @param {Array<Object>} createdParams - 更新后的参数数据
   * @param {Array|Object} datatypeListUsedByDatatype - 引用了该数据模型的数据模型列表
   */
  * _afterCreate({parentId, parentType, createdParams, datatypeListUsedByDatatype}) {
    if (!createdParams.length) {
      return;
    }
    const result = yield this.findInterfacesAndRpcsAndDatatypes({parentId, parentType, datatypeListUsedByDatatype});
    if (!result) {
      return;
    }
    const interfaces = result.interfaces.concat(result.rpcs);
    const datatypes = result.datatypes;
    // 当前正在操作的数据模型
    const datatype = datatypes.find(dt => dt.id === parentId);
    // 切换成新的自定义类型时，需要算mock数据
    const interfaceService = new InterfaceService(this._uid, this._context);
    const constraints = yield interfaceService.getConstraints({projectIds: datatype.projectId});
    const mockStoreService = new MockStoreService(this._uid, this._context);
    const options = {
      format: db.MDL_FMT_HASH,
      isAddingParam: true,
      createdParams,
    };
    yield ParamDataTypeService._addOrRemoveParamsByKeysPathsForInterfaces({
      mockStoreService,
      interfaces,
      constraints,
      parentId,
      datatypes,
      options
    });
    yield ParamDataTypeService._addOrRemoveParamsByKeysPathsForDatatypes({
      datatypeListUsedByDatatype,
      mockStoreService,
      constraints,
      datatypes,
      options
    });
  }

  /**
   * 删除响应参数后，需要更新 Mongodb 的 Redis 中的 Mock 数据
   * @param {Number} parentId - 数据模型的id
   * @param {Number} parentType - 引用数据模型的资源类型
   * @param {Array<Object>} removedParams - 删除的普通字段
   * @param {Array<Object>} removedImports - 删除的导入数据模型
   * @param {Array|Object} datatypeListUsedByDatatype - 引用了该数据模型的数据模型列表
   */
  * _afterRemove({parentId, parentType, removedParams, removedImports = [], datatypeListUsedByDatatype}) {
    if (!removedParams.length && !removedImports.length) {
      return;
    }
    const result = yield this.findInterfacesAndRpcsAndDatatypes({parentId, parentType, datatypeListUsedByDatatype});
    if (!result) {
      return;
    }
    const interfaces = result.interfaces.concat(result.rpcs);
    const datatypes = result.datatypes;
    // 删除的情况，不会用到用来生成mock数据的生成规则
    let constraints = [];
    const mockStoreService = new MockStoreService(this._uid, this._context);
    const options = {
      isRemovingParam: true,
      removedParams,
      removedImports,
    };
    yield ParamDataTypeService._addOrRemoveParamsByKeysPathsForInterfaces({
      mockStoreService,
      interfaces,
      constraints,
      parentId,
      datatypes,
      options
    });
    yield ParamDataTypeService._addOrRemoveParamsByKeysPathsForDatatypes({
      datatypeListUsedByDatatype,
      mockStoreService,
      constraints,
      datatypes,
      options
    });
  }

  static * _addOrRemoveParamsByKeysPathsForInterfaces({mockStoreService, interfaces, constraints, parentId, datatypes, options}) {
    // 更新接口中的mock数据
    const itfArr = [];
    const keysPathsMapForInterface = {};
    const optionsMap = {};
    for (let i = 0; i < interfaces.length; i++) {
      const itf = interfaces[i];
      if (itf.resFormat === db.MDL_FMT_HASHMAP) {
        yield mockStoreService.refreshInterface({interfaceId: itf.id});
      } else {
        itfArr.push(itf);
        keysPathsMapForInterface[itf.id] = resourceUtil.getKeysPaths({
          params: itf.params.outputs,
          targetDatatypeId: parentId,
          datatypes,
          resFormat: itf.resFormat
        });
        optionsMap[itf.id] = Object.assign({}, options, itf.resFormat);
      }
    }
    yield mockStoreService.addOrRemoveParamsByKeysPathsForInterfaces({
      itfArr,
      keysPathsMap: keysPathsMapForInterface,
      datatypes,
      constraints,
      optionsMap,
    });
  }

  static * _addOrRemoveParamsByKeysPathsForDatatypes({datatypeListUsedByDatatype, mockStoreService, constraints, datatypes, options}) {
    // 更新数据模型本身的mock数据，此时说明该数据模型已经和接口进行了关联
    // 还有一种情况是，另外一个数据模型引用了当前被更新的这个数据模型，而且另外这个数据模型也和接口进行了关联，此时也需要更新另外这个数据模型
    const datatypeArr = [];
    const keysPathsMapForDatatype = {};

    for (let i = 0; i < datatypeListUsedByDatatype.length; i++) {
      const datatype = datatypeListUsedByDatatype[i];
      const checkValidResult = resourceUtil.isDatatypeValidForConnect(datatype, datatypes);
      if (checkValidResult === true) {
        datatypeArr.push(datatype);
        keysPathsMapForDatatype[datatype.id] = resourceUtil.getKeysPaths({
          params: datatype.params,
          targetDatatypeId: datatype.id,
          datatypes
        });
      }
    }
    yield mockStoreService.addOrRemoveParamsByKeysPathsForDatatypes({
      datatypeArr,
      datatypes,
      constraints,
      keysPathsMap: keysPathsMapForDatatype,
      options,
    });
  }

  * findInterfacesAndRpcsAndDatatypes({parentId, parentType, datatypeListUsedByDatatype}) {
    // 只有操作数据模型的属性时，才要更新mock数据
    if (parentType !== db.PAM_TYP_ATTRIBUTE) {
      return;
    }
    // 这里要根据数据模型，去查找所有引用了这个数据模型的接口
    const dataTypeService = new DataTypeService(this._uid, this._context);
    const datatype = yield dataTypeService.getById(parentId);
    // 不可能会是除了哈希之外的类型
    if (datatype.format !== db.MDL_FMT_HASH && datatype.format !== db.MDL_FMT_HASHMAP) {
      return;
    }
    // 查找响应参数中引用了这个数据模型的http接口列表
    let interfaces = yield dataTypeService.getQuotesForInterfaceResponse(parentId, datatypeListUsedByDatatype);
    // 查找响应参数中引用了这个数据模型的rpc接口列表
    let rpcs = yield dataTypeService.getQuotesForRpcResponse(parentId, datatypeListUsedByDatatype);
    if (!interfaces.length && !rpcs.length) {
      return;
    }
    const projectIdsSet = new Set();
    interfaces.forEach(itf => projectIdsSet.add(itf.projectId));
    rpcs.forEach(rpc => projectIdsSet.add(rpc.projectId));
    const interfaceIds = interfaces.map(it => it.id);
    const interfaceService = new InterfaceService(this._uid, this._context);
    const rpcIds = rpcs.map(it => it.id);
    const rpcService = new RpcService(this._uid, this._context);
    const datatypesMap = yield dataTypeService.getInProjects(Array.from(projectIdsSet));
    const datatypes = [];
    Object.keys(datatypesMap).forEach(key => {
      datatypes.push(datatypesMap[key]);
    });
    // 只查响应结果参数
    interfaces = yield interfaceService.findDetailWithOutputsByIds(interfaceIds);
    // 只查响应结果参数
    rpcs = yield rpcService.findDetailWithOutputsByIds(rpcIds);
    return {
      interfaces,
      rpcs,
      datatypes
    };
  }
}

module.exports = ParamDataTypeService;
