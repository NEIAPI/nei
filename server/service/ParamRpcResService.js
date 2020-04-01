/**
 * Rpc Response Parameter Service Class
 */
const db = require('../../common/config/db.json');
const resourceUtil = require('../util/resource_util');
const MockStoreService = require('./MockStoreService');
const RpcService = require('./RpcService');
const DataTypeService = require('./DataTypeService');

class ParamRpcResService extends require('./ParamRpcService') {
  constructor(uid, context) {
    super(uid, context, '../dao/ParamRpcResDao');
  }

  /**
   * 修改响应参数后，需要更新 Mongodb 的 Redis 中的 Mock 数据，也需要更新测试用例的状态
   *
   * @param {Number} parentId - 接口id
   * @param {Object} newParam - 更新后的参数数据
   * @param {Object} oldParam - 更新前的参数数据
   */
  * _afterUpdate({parentId, newParam, oldParam}) {
    const interfaceId = parentId;
    const isNameUpdated = newParam.name !== oldParam.name;
    const isTypeUpdated = newParam.type !== oldParam.type || newParam.isArray !== oldParam.isArray;
    const isIgnoredUpdated = newParam.ignored !== oldParam.ignored;
    const isDefaultValueUpdated = newParam.defaultValue !== oldParam.defaultValue;
    const isGenExpressionUpdated = newParam.genExpression !== oldParam.genExpression;

    if (isNameUpdated || isTypeUpdated) {
      const rpcService = new RpcService(this._uid, this._context);
      const itf = yield rpcService.findDetailById(interfaceId);
      const mockStoreService = new MockStoreService(this._uid, this._context);
      // 传参要求请看 mockStoreService.updateParamNameOrTypeByKeysPathsForInterface 方法的注释说明
      const keysPath = [];
      if (itf.resFormat === db.MDL_FMT_ARRAY) {
        keysPath.push({isArray: true});
      } else {
        keysPath.push(oldParam.name);
      }
      // 切换成新的自定义类型时，需要算mock数据
      let datatypes = [];
      let constraints = [];
      if (itf.resFormat === db.MDL_FMT_HASHMAP) {
        yield mockStoreService.refreshInterface({interfaceId: interfaceId});
      } else {
        if (isNameUpdated) {
          yield mockStoreService.updateParamNameOrTypeByKeysPathsForInterfaces({
            itfArr: [itf],
            keysPathsMap: {[itf.id]: [keysPath]},
            datatypes,
            constraints,
            options: {
              isUpdatingParamName: true,
              newName: newParam.name,
            }
          });
        } else {
          if (newParam.isArray) {
            keysPath.push({isArray: true});
          }
          if (resourceUtil.isCustomDatatype(newParam.type)) {
            const rpcService = new RpcService(this._uid, this._context);
            const datatypeService = new DataTypeService(this._uid, this._context);

            datatypes = yield datatypeService.getListInProject(itf.projectId);
            constraints = yield rpcService.getConstraints({projectIds: itf.projectId});
          }
          yield mockStoreService.updateParamNameOrTypeByKeysPathsForInterfaces({
            itfArr: [itf],
            keysPathsMap: {[itf.id]: [keysPath]},
            datatypes,
            constraints,
            options: {
              isUpdatingParamType: true,
              newType: newParam.type,
            }
          });
        }
      }
    } else if (isDefaultValueUpdated || isGenExpressionUpdated) {
      const rpcService = new RpcService(this._uid, this._context);
      const itf = yield rpcService.findDetailById(interfaceId);
      if (itf.resFormat === db.MDL_FMT_HASHMAP) {
        const mockStoreService = new MockStoreService(this._uid, this._context);
        yield mockStoreService.refreshInterface({interfaceId: interfaceId});
      }
    } else if (isIgnoredUpdated) {
      // 更新的是导入的数据模型的字段的显示或隐藏
      if (newParam.ignored) {
        // 隐藏字段，对于Mock数据来说，相当于删除字段
        yield this._afterRemove({parentId, removedParams: [newParam]});
      } else {
        // 显示字段，对于Mock数据来说，相当于增加字段
        yield this._afterCreate({parentId, createdParams: [newParam]});
      }
    }
  }

  /**
   * 添加响应参数后，需要更新 Mongodb 的 Redis 中的 Mock 数据
   * @param {Number} parentId - 接口id
   * @param {Array<Object>} createdParams - 更新后的参数数据
   */
  * _afterCreate({parentId, createdParams}) {
    if (!createdParams.length) {
      return;
    }
    const interfaceId = parentId;
    const rpcService = new RpcService(this._uid, this._context);
    const itf = yield rpcService.findDetailById(interfaceId);
    const keysPath = [];
    if (itf.resFormat !== db.MDL_FMT_HASH) {
      return;
    }
    const mockStoreService = new MockStoreService(this._uid, this._context);
    const datatypeService = new DataTypeService(this._uid, this._context);

    const datatypes = yield datatypeService.getListInProject(itf.projectId);
    const constraints = yield rpcService.getConstraints({projectIds: itf.projectId});
    yield mockStoreService.addOrRemoveParamsByKeysPathsForInterfaces({
      itfArr: [itf],
      keysPathsMap: {[itf.id]: [keysPath]},
      datatypes,
      constraints,
      optionsMap: {
        [itf.id]: {
          format: itf.resFormat,
          isAddingParam: true,
          createdParams,
        }
      }
    });
  }

  /**
   * 删除响应参数后，需要更新 Mongodb 的 Redis 中的 Mock 数据
   * @param {Number} parentId - 接口id
   * @param {Boolean} clearAll - 为true时表示是在删除接口
   * @param {Array<Object>} removedParams - 删除的普通字段
   * @param {Array<Object>} removedImports - 删除的导入数据模型
   */
  * _afterRemove({parentId, removedParams = [], removedImports = [], clearAll = false}) {
    if (!removedParams.length && !removedImports.length) {
      return;
    }
    const interfaceId = parentId;
    const mockStoreService = new MockStoreService(this._uid, this._context);
    const rpcService = new RpcService(this._uid, this._context);

    const itf = yield rpcService.findDetailById(interfaceId);
    if (clearAll) {
      yield mockStoreService.removeInterface({
        interfaceId: itf.id
      });
      return;
    }
    const keysPath = [];
    if (itf.resFormat !== db.MDL_FMT_HASH) {
      return;
    }
    const datatypeService = new DataTypeService(this._uid, this._context);

    const datatypes = yield datatypeService.getListInProject(itf.projectId);
    // 删除的情况，不会用到用来生成mock数据的生成规则
    const constraints = [];
    yield mockStoreService.addOrRemoveParamsByKeysPathsForInterfaces({
      itfArr: [itf],
      keysPathsMap: {[itf.id]: [keysPath]},
      datatypes,
      constraints,
      optionsMap: {
        [itf.id]: {
          isRemovingParam: true,
          removedParams,
          removedImports,
        }
      }
    });
  }
}

module.exports = ParamRpcResService;
