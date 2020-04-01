/**
 * 资源操作工具方法集，需要兼容浏览器和 Node.js
 */
const crypto = require('crypto');
const db = require('../../common/config/db.json');
const util = {
  /**
   * 判断 mock 数据是否符合定义
   *
   * @param  {Object}
   * @attribute  {Number} resFormat - 接口响应数据的类别
   * @attribute  {Object|Array} data - mock 数据 或者是 真实数据
   * @attribute  {Array} resOutputs - 响应字段列表
   * @attribute  {Array} datatypes - 数据模型列表
   * @attribute  {Boolean} resParamRequiredIsChecked - 响应参数是否可以为非必需 的选项是否已经打开
   * @return  {Boolean|Object} 符合就返回true，不符合就返回包括错误之处的详细信息
   */
  compareDataWithDefinition: function ({resFormat, data, resOutputs, datatypes, resParamRequiredIsChecked}) {
    const hasOwnPropertyFunc = Object.prototype.hasOwnProperty;
    const errorDetail = [];
    let result = true;

    const formatToSysTypeMap = {
      [db.MDL_FMT_STRING]: db.MDL_SYS_STRING,
      [db.MDL_FMT_NUMBER]: db.MDL_SYS_NUMBER,
      [db.MDL_FMT_BOOLEAN]: db.MDL_SYS_BOOLEAN,
    };

    const formatToSysTypeNameMap = {
      [db.MDL_FMT_STRING]: 'string',
      [db.MDL_FMT_NUMBER]: 'number',
      [db.MDL_FMT_BOOLEAN]: 'boolean',
      [db.MDL_FMT_HASH]: 'object',
      [db.MDL_FMT_ARRAY]: 'array',
    };

    function isSysTypeMatch(value, type) {
      switch (type) {
        case db.MDL_SYS_STRING:
          return typeof value === 'string';
        case db.MDL_SYS_NUMBER:
          return typeof value === 'number';
        case db.MDL_SYS_BOOLEAN:
          return typeof value === 'boolean';
        case db.MDL_SYS_VARIABLE:
          return true;
      }
      return false;
    }

    function getWalkParamsPath(walkParams, paramName, suffix) {
      const walkParamsPath = walkParams.map(function (walkParam) {
        return walkParam.name;
      }).join(' -> ');
      const computedPath = walkParamsPath + ((walkParamsPath && paramName) ? ' -> ' : '') + (paramName || '');
      if (suffix === false) {
        return computedPath;
      }
      return computedPath ? computedPath + '，' : '';
    }

    function checkParamsRequiredAndTypeMatched(format, data, params, walkParams, tipPrefix) {
      if (data === null) {
        return;
      }
      switch (format) {
        case db.MDL_FMT_STRING:
        case db.MDL_FMT_NUMBER:
        case db.MDL_FMT_BOOLEAN:
          if (!isSysTypeMatch(data, formatToSysTypeMap[format])) {
            result = false;
            errorDetail.push(
              `${tipPrefix}类型不匹配：${getWalkParamsPath(walkParams)} 应该是 ${formatToSysTypeNameMap[format]}，实际是 ${typeof data}`
            );
          }
          return;
        case db.MDL_FMT_ENUM:
          // 如果是枚举，我们假设所有的值的类型都是一样的，并且枚举类型只支持字符串、数值、布尔三种类型，但可以是自定义的持字符串、数值、布尔
          const enumType = params[0].type;
          const datatype = datatypes.find(function (dt) {
            return dt.id === enumType;
          });
          switch (datatype.format) {
            case db.MDL_FMT_STRING:
            case db.MDL_FMT_NUMBER:
            case db.MDL_FMT_BOOLEAN:
              checkParamsRequiredAndTypeMatched(datatype.format, data, datatype.params, walkParams, tipPrefix);
              break;
            default:
              result = false;
              errorDetail.push(
                `${tipPrefix}枚举类型只能是字符串、数值或者布尔三种类型，实际是 ${typeof data}`
              );
          }
          return;
        case db.MDL_FMT_ARRAY:
          if (Array.isArray(data)) {
            // 如果数组类别为数组，则可以包含不同类型的元素，只要匹配其中一个元素的类型即可
            if (params.length === 1) {
              // 只有一个类型的情况应该是大多数情况，逻辑保持不变，提示更精确
              const elementType = params[0].type;
              const datatype = datatypes.find(function (dt) {
                return dt.id === elementType;
              });
              data.forEach(function (item, idx) {
                checkParamsRequiredAndTypeMatched(datatype.format, item, datatype.params, walkParams, `${tipPrefix}数组第 ${idx} 项`);
              });
            } else {
              data.forEach(function (item, idx) {
                let arrayCheckResult = false;
                for (let i = 0; i < params.length; i++) {
                  const elementType = params[i].type;
                  const datatype = datatypes.find(function (dt) {
                    return dt.id === elementType;
                  });
                  const prevErrorDetailLength = errorDetail.length;
                  const prevResult = result;
                  checkParamsRequiredAndTypeMatched(datatype.format, item, datatype.params, walkParams, `${tipPrefix}数组第 ${idx} 项`);
                  if (errorDetail.length === prevErrorDetailLength) {
                    // 如果没有错误，则说明匹配到了，就可以停止了
                    arrayCheckResult = true;
                    break;
                  } else {
                    // 还原
                    errorDetail.length = prevErrorDetailLength;
                    result = prevResult;
                  }
                }
                if (arrayCheckResult === false) {
                  // 说明和数组定义的所有类型都不一致
                  result = false;
                  errorDetail.push(
                    `数组第${idx}项 ${tipPrefix} 找不到匹配的数组元素类型：${getWalkParamsPath(walkParams, '', false)} ${JSON.stringify(item)}`
                  );
                }
              });
            }
          } else {
            result = false;
            errorDetail.push(
              `${tipPrefix}类型不匹配：${getWalkParamsPath(walkParams)}应该是 array，实际是 ${typeof data}`
            );
          }
          return;
        case db.MDL_FMT_HASH:
          if (data === null || Array.isArray(data) || typeof data !== 'object') {
            result = false;
            errorDetail.push(
              `${tipPrefix}类型不匹配：${getWalkParamsPath(walkParams)}应该是 ${formatToSysTypeNameMap[format]}，实际是 ${typeof data}`
            );
            return;
          }
          params.forEach(function (param) {
            // 先检查字段是否存在
            if (!hasOwnPropertyFunc.call(data, param.name)) {
              // 如果参数没有被忽略，就继续判断
              if (param.ignored !== db.CMN_BOL_YES) {
                // 如果已经开启了选项，则要看参数本身是否是必需的
                if (resParamRequiredIsChecked) {
                  if (param.required) {
                    result = false;
                    errorDetail.push(
                      `${tipPrefix}缺少字段: ${getWalkParamsPath(walkParams, param.name, false)}`
                    );
                  }
                } else {
                  // 如果没有开启选项，则不管参数本身的 是否必须 是什么值（因为有可能是之前选择过的），都是当必需来对待
                  result = false;
                  errorDetail.push(
                    `${tipPrefix}缺少字段: ${getWalkParamsPath(walkParams, param.name, false)}`
                  );
                }
              }
            } else {
              function checkParam(item, tipPrefix) {
                if (item === null) {
                  return;
                }
                if (!isSysTypeMatch(item, param.type)) {
                  if (param.type > db.MDL_SYS_BOOLEAN) {
                    // 检查是否为匿名类型
                    // 因为要考虑菜单类型的树型数据，一般最后一层都会设置为 null
                    if (item === null) {
                      // 先判断是否是树型结构
                      const foundDatatype = walkParams.find(function (walkParam) {
                        return walkParam.typeName === param.typeName;
                      });
                      if (!foundDatatype) {
                        result = false;
                        // 普通匿名类型
                        errorDetail.push(`${tipPrefix}值为 null，不符合定义：${getWalkParamsPath(walkParams, param.name, false)}`);
                      }
                      return;
                    }
                    const datatype = datatypes.find(function (datatype) {
                      return datatype.id === param.type;
                    });
                    // 默认生成的循环引用的 mock 数据，比如 {
                    //  "user": "<User>"
                    // }
                    if (item === '<' + datatype.name + '>') {
                      return;
                    }
                    const walkParamsPrevLength = walkParams.length;
                    walkParams.push(param);
                    checkParamsRequiredAndTypeMatched(datatype.format, item, datatype.params, walkParams, tipPrefix);
                    walkParams.length = walkParamsPrevLength;
                  } else {
                    result = false;
                    if (param.type === db.MDL_SYS_FILE) {
                      errorDetail.push(
                        `${tipPrefix}暂不支持保存文件类别的数据`
                      );
                    } else {
                      let shouldBeParamType = param.typeName.toLowerCase();
                      let actualParamType = typeof item;
                      errorDetail.push(
                        `${tipPrefix}类型不匹配：${getWalkParamsPath(walkParams, param.name)}类型应该是 ${shouldBeParamType}，实际是 ${actualParamType}`
                      );
                    }
                  }
                }
              }

              if (param.isArray) {
                // 因为要考虑菜单类型的树型数据，最后一层如果是 null 也是符合要求的
                if (data[param.name] === null) {
                  // 先判断是否是树型结构
                  const foundDatatype = walkParams.find(function (walkParam) {
                    return walkParam.typeName === param.typeName;
                  });
                  if (!foundDatatype) {
                    result = false;
                    // 普通匿名类型
                    errorDetail.push(`${tipPrefix}值为 null，不符合定义：${getWalkParamsPath(walkParams, param.name, false)}`);
                  }
                  return;
                }
                // 数组的每一项都要符合
                if (Array.isArray(data[param.name])) {
                  data[param.name].forEach(function (item, idx) {
                    checkParam(item, `数组第 ${idx} 项`);
                  });
                } else {
                  result = false;
                  let shouldBeParamType = `${param.typeName.toLowerCase()}`;
                  let actualParamType = typeof data[param.name];
                  errorDetail.push(
                    `${tipPrefix}类型不匹配：${getWalkParamsPath(walkParams, param.name)}类型应该是 ${shouldBeParamType}，实际是 ${actualParamType}`
                  );
                }
              } else {
                checkParam(data[param.name], tipPrefix);
              }
            }
          });
          return;
      }
    }

    function checkUnnecessaryData(format, data, params, walkParams, tipPrefix) {
      switch (format) {
        case db.MDL_FMT_STRING:
        case db.MDL_FMT_NUMBER:
        case db.MDL_FMT_BOOLEAN:
        case db.MDL_FMT_ENUM:
          return;
        case db.MDL_FMT_ARRAY:
          // 数组已经可以指定多个不同类型的元素，如果指定了多个不同的元素，情况就复杂了，校验规则不好制定，就不考虑params.length>1的情况了
          if (Array.isArray(data) && data.length && params.length === 1) {
            const elementType = params[0].type;
            const datatype = datatypes.find(function (dt) {
              return dt.id === elementType;
            });
            data.forEach(function (item, idx) {
              checkUnnecessaryData(datatype.format, item, datatype.params, walkParams, `${tipPrefix}数组第 ${idx} 项`);
            });
          }
          return;
        case db.MDL_FMT_HASH:
          if (data === null || Array.isArray(data) || typeof data !== 'object') {
            return;
          }
          Object.keys(data).forEach(function (key) {
            const foundParam = params.find(function (param) {
              // 需要考虑被忽略的情况
              return param.name === key && param.ignored !== 1;
            });
            if (foundParam) {
              function checkParam(value, tipPrefix) {
                if (value !== null && typeof value === 'object') {
                  const datatype = datatypes.find(function (datatype) {
                    return datatype.id === foundParam.type;
                  });
                  const walkParamsPrevLength = walkParams.length;
                  walkParams.push(foundParam);
                  checkUnnecessaryData(datatype.format, value, datatype.params, walkParams, tipPrefix);
                  walkParams.length = walkParamsPrevLength;
                }
              }

              const value = data[key];
              if (foundParam.isArray) {
                if (Array.isArray(value) && value.length) {
                  value.forEach(function (item, idx) {
                    checkParam(item, `数组第 ${idx} 项`);
                  });
                }
              } else {
                checkParam(value, tipPrefix);
              }
            } else {
              result = false;
              errorDetail.push(
                `${tipPrefix}多余字段：${getWalkParamsPath(walkParams, key, false)}`
              );
            }
          });
          return;
      }
    }

    // 检查字段缺失、类型不匹配的情况
    checkParamsRequiredAndTypeMatched(resFormat, data, resOutputs, [], '');
    // 检查字段多余的情况
    checkUnnecessaryData(resFormat, data, resOutputs, [], '');

    return result || errorDetail;
  },

  /**
   * 根据参数列表，获取对应的数据，需要过滤掉多余的数据，参数也可以少，要检查类型匹配的问题，枚举类型的值要在定义范围内
   * @param  {Object}
   * @attribute  {Object} data - 实际数据，肯定是一个哈希
   * @attribute  {Array|Object} params - 数据模型的属性列表
   * @attribute  {Array|Object} datatypes - 目标项目中的所有数据模型列表
   * @return  {Object} data 是过滤后的数据，如果有错误，则放在 error 数组中
   */
  fetchDataByParams({data, params, datatypes}) {
    if (this.isNotOrEmptyJsonObject(data)) {
      return null;
    }
    params = params.filter(param => param.name !== 'id');
    if (!params.length) {
      return null;
    }
    const systemFormatToTypeNameMap = {
      [db.MDL_FMT_STRING]: 'string',
      [db.MDL_FMT_NUMBER]: 'number',
      [db.MDL_FMT_BOOLEAN]: 'boolean',
      [db.MDL_FMT_HASH]: 'object',
    };

    function getWalkParamsPath(walkParams, paramName, suffix) {
      const walkParamsPath = walkParams.map(function (walkParam) {
        return walkParam.name;
      }).join(' -> ');
      const computedPath = walkParamsPath + ((walkParamsPath && paramName) ? ' -> ' : '') + (paramName || '');
      if (suffix === false) {
        return computedPath;
      }
      return computedPath ? computedPath + '，' : '';
    }

    function convertValueByFormat(value, format) {
      switch (format) {
        case db.MDL_FMT_STRING:
          return String(value);
        case db.MDL_FMT_NUMBER:
          return Number(value);
        case db.MDL_FMT_BOOLEAN:
          return value !== 'false';
      }
    }

    const result = {};
    const error = [];

    function getDataByParam(value, param, walkParams, tipPrefix = '') {
      const datatype = datatypes.find(dt => dt.id === param.type);
      const actualType = typeof value;
      const shouldBeType = systemFormatToTypeNameMap[datatype.format];
      switch (datatype.format) {
        case db.MDL_FMT_STRING:
        case db.MDL_FMT_NUMBER:
        case db.MDL_FMT_BOOLEAN:
        case db.MDL_FMT_HASH:
          if (Array.isArray(value)) {
            error.push(
              `${tipPrefix}类型错误，${getWalkParamsPath(walkParams)}应该是 ${shouldBeType}，实际是数组`
            );
          } else if (actualType !== shouldBeType) {
            error.push(
              `${tipPrefix}类型错误，${getWalkParamsPath(walkParams)}应该是 ${shouldBeType}，实际是 ${actualType}`
            );
          } else {
            if (datatype.format === db.MDL_FMT_HASH) {
              // 自定义哈希类型
              const tempResult = {};
              const tempWalkParamsLen = walkParams.length;
              walk(datatype.params, value, walkParams, tempResult, tipPrefix);
              walkParams.length = tempWalkParamsLen;
              return tempResult;
            } else {
              // 基本类型
              return value;
            }
          }
          break;
        case db.MDL_FMT_ARRAY:
          if (Array.isArray(value)) {
            const tempResult = [];
            value.forEach((item, idx) => {
              // 所有数组元素的类型都一样
              const result = getDataByParam(item, datatype.params[0], walkParams, `数组第 ${idx} 项`);
              if (result !== undefined) {
                tempResult.push(result);
              }
            });
            return tempResult;
          } else {
            error.push(
              `${tipPrefix}类型错误，${getWalkParamsPath(walkParams)}应该是数组，实际是 ${actualType}`
            );
          }
          break;
        case db.MDL_FMT_ENUM:
          // 假设所有枚举值的类型是一样的，取第一个参数的类型
          const enumElementType = datatype.params[0].type;
          const enumElementDatatype = datatypes.find(dt => dt.id === enumElementType);
          // 枚举类型的值只能是字符串、数值或者布尔，其他值不考虑
          switch (enumElementDatatype.format) {
            case db.MDL_FMT_STRING:
            case db.MDL_FMT_NUMBER:
            case db.MDL_FMT_BOOLEAN:
              // 查找所有可能的枚举值
              const allEnumValues = datatype.params.map(param => {
                return convertValueByFormat(param.defaultValue, enumElementDatatype.format);
              });
              if (allEnumValues.includes(value)) {
                return value;
              } else {
                error.push(
                  `${tipPrefix}枚举值不在定义范围内，${getWalkParamsPath(walkParams)}，可能值是 ${allEnumValues.join('、')}，实际值是 ${JSON.stringify(value)}`
                );
              }
              break;
          }
          break;
      }
    }

    const hasOwnPropertyFunc = Object.prototype.hasOwnProperty;

    function walk(params, data, walkParams, result, tipPrefix) {
      params.forEach(param => {
        if (hasOwnPropertyFunc.call(data, param.name)) {
          const walkParamsLen = walkParams.length;
          const value = data[param.name];
          if (param.isArray) {
            if (Array.isArray(value)) {
              // 检查数组的每一项
              result[param.name] = [];
              value.forEach((item, idxx) => {
                const tempResult = getDataByParam(item, param, walkParams, `${tipPrefix}数组第 ${idxx} 项`);
                if (tempResult !== undefined) {
                  result[param.name].push(tempResult);
                }
              });
            } else {
              error.push(
                `${getWalkParamsPath(walkParams, param.name)}应该是数组`
              );
            }
          } else {
            walkParams.push(param);
            const tempResult = getDataByParam(value, param, walkParams, tipPrefix);
            if (tempResult !== undefined) {
              result[param.name] = tempResult;
            }
          }
          walkParams.length = walkParamsLen;
        }
      });
    }

    walk(params, data, [], result);

    return {
      data: result,
      error,
    };
  },

  /**
   * 根据持久化的mock数据、数据库操作结果、接口响应结果的定义、后置业务逻辑脚本等四个条件，计算最终结果
   * @param  {Object}
   * @attribute  {Object} apiMockdata - 已经持久化的 Mock 数据
   * @attribute  {Array|Object} dbOperationResult - 数据库操作结果
   * @attribute  {Object} itf - 接口对象
   * @attribute  {Object} connectedDatatype - 关联的数据模型
   * @attribute  {Array|Object} datatypes - 项目中的数据模型列表
   * @return  {Object}，肯定是一个json 对象
   */
  computeResponseOfConnect({apiMockdata, dbOperationResult, itf, connectedDatatype, datatypes}) {
    // 获取关联数据模型的所在路径，可以有多条路径
    // 比如创建用户的接口，最常见的返回值为 {code: <Number>, message: <String>, result: <User>}，
    // 但返回值也可以是任意的，比如:
    // * {code: <Number>, message: <String>, result: {data: <User>}}
    // * {code: <Number>, message: <String>, result: {data: <XUser>}}，其中 XUser 是一个扩展后的 User 对象，也就是它导入了 User。
    // * {code: <Number>, message: <String>, result: <Array|User>。
    // * {data: <User>, data1: <User>, result: <User>。
    // 总之，要把所有出现 User 的地方全部替换为 dbOperationResult
    const keysPathsOfConnect = this.getKeysPaths({
      params: itf.params.outputs,
      targetDatatypeId: connectedDatatype.id,
      datatypes,
      resFormat: itf.resFormat
    });
    // 填充数据
    this.fillDataByKeysPaths({keysPaths: keysPathsOfConnect, apiMockdata, dbOperationResult});
    return apiMockdata;
  },

  /** 根据路径填充数据
   * @param  {Object}
   * @attribute  {Array<Array>} keysPaths - 需要填充的路径，二维数组，比如 [ [ 'data', { isArray: true } ] ]
   * @attribute  {Object} apiMockdata - 已经存在的mock数据
   * @attribute  {Object} dbOperationResult - 数据库操作结果
   * @return  {Undefined}，不需要返回，直接修改 apiMockdata 对象
   */
  fillDataByKeysPaths({keysPaths, apiMockdata, dbOperationResult}) {
    function fillDataByKeysPath(data, keysPath) {
      let pointer = data;
      while (keysPath.length > 1) {
        if (keysPath[0].isArray) {
          pointer.forEach(item => {
            const clonedKeysPath = keysPath.concat();
            clonedKeysPath.shift();
            fillDataByKeysPath(item, clonedKeysPath);
          });
          // 接下来不用再往下走了，因为上面会递归到最后一层
          return;
        } else {
          pointer = pointer[keysPath[0]];
          keysPath.shift();
        }
      }
      if (keysPath[0].isArray) {
        // 先把mock数据中的数据清空，再放入数据库数据
        pointer.length = 0;
        pointer.push(...dbOperationResult);
      } else if (keysPath[0].isImport) {
        if (keysPath[0].key) {
          keysPath[0].params.forEach(paramName => {
            pointer[keysPath[0].key][paramName] = dbOperationResult[paramName];
          });
        } else {
          // 如果没有key，则是在第一层直接导入了数据模型
          keysPath[0].params.forEach(paramName => {
            pointer[paramName] = dbOperationResult[paramName];
          });
        }
      } else {
        pointer[keysPath[0]] = dbOperationResult;
      }
    }

    keysPaths.forEach(keysPath => {
      fillDataByKeysPath(apiMockdata, keysPath);
    });
  },

  /** 查找目标数据模型的遍历路径
   * @param  {Object}
   * @attribute  {Object} params - 接口的响应结果参数列表或者数据模型的属性列表
   * @attribute  {Object} targetDatatypeId - 目标数据模型
   * @attribute  {Array|Object} datatypes - 项目中的数据模型列表
   * @attribute  {Number} resFormat - 接口的响应结果的类型，只可能是哈希或者数组
   * @return  {Array<Array>}，二维数组，数组每一项是一条路径
   */
  getKeysPaths({params, targetDatatypeId, datatypes, resFormat, interfaceId}) {
    const keysPaths = [];

    function walk(params, paths = [], datatypeFormat = db.MDL_FMT_HASH) {
      let hasImportFound = false;
      params.forEach(param => {
        const prePathLen = paths.length;
        if (param.type === targetDatatypeId) {
          // 直接引用了目标数据模型
          if (datatypeFormat === db.MDL_FMT_ARRAY) {
            paths.push({isArray: true});
          } else {
            paths.push(param.name);
          }
          if (param.isArray) {
            paths.push({isArray: true});
          }
          // 找到目标了
          keysPaths.push(paths.concat());
        } else if (param.datatypeId === targetDatatypeId) {
          // 导入的数据模型，只要记录一条路径即可
          if (!hasImportFound) {
            hasImportFound = true;
            const key = paths.pop();
            const importedParams = params.filter(param => {
              return !param.ignored && param.datatypeId === targetDatatypeId;
            }).map(param => param.name);
            paths.push({isImport: true, key, params: importedParams});
            // 找到目标了
            keysPaths.push(paths.concat());
          }
        } else if (param.type > db.MDL_SYS_BOOLEAN) {
          // 自定义数据模型
          const datatype = datatypes.find(dt => dt.id === param.type);
          if (paths.includes(param.name)) {
            // 循环引用
            return;
          }
          paths.push(param.name);
          if (param.isArray) {
            paths.push({isArray: true});
          }
          walk(datatype.params, paths, datatype.format);
        }
        paths.length = prePathLen;
      });
    }

    walk(params, []);
    if (resFormat === db.MDL_FMT_ARRAY) {
      // 如果响应参数是数组，则第一层追加一条路径信息
      keysPaths.forEach(keysPath => {
        keysPath.unshift({
          isArray: true
        });
      });
    }
    return keysPaths;
  },

  /** 分别从 路径参数、query、body 中获取字段名称为 `key` 的值
   * @param  {Object}
   * @attribute  {String} key - 要查找的字段名称
   * @attribute  {Object} reqQuery - 请求的查询参数
   * @attribute  {Object} reqBody - 请求体
   * @attribute  {Object} apiPathVars - 请求的路径参数，事先已经计算好，是一个哈希对象
   * @attribute  {Object} idParam - id 参数定义
   * @attribute  {Boolean} convertStringIdsToArray - 是否要将字符串形式的 ids 转换为数组
   * @return  {String|Number|Array|Object}
   */
  getReqFieldValueByKey({key, reqQuery, reqBody, apiPathVars, idParam, convertStringIdsToArray = false}) {
    const type = idParam.type;
    let value = null;
    const hasOwnPropertyFunc = Object.prototype.hasOwnProperty;
    // 先查
    if (apiPathVars && hasOwnPropertyFunc.call(apiPathVars, key)) {
      value = apiPathVars[key];
    } else if (reqQuery && hasOwnPropertyFunc.call(reqQuery, key)) {
      value = reqQuery[key];
    } else if (reqBody && hasOwnPropertyFunc.call(reqBody, key)) {
      value = reqBody[key];
    }
    if (value === null) {
      return value;
    }
    value = String(value).trim();
    if (key === 'ids' && convertStringIdsToArray && !Array.isArray(value)) {
      return value.split(',').map(id => {
        return type === db.MDL_SYS_NUMBER ? Number(id.trim()) : String(id.trim());
      });
    }
    if (type === db.MDL_SYS_NUMBER) {
      return Number(value);
    }
    return value;
  },

  /**
   * 检查一个数据模型是否是能被接口关联的数据模型
   *  @param {Object} datatype 要检查的数据模型
   *  @param {Array|Object} datatypes 所有的数据模型列表
   *  @param {Boolean|String} 如果返回的是 true，表示有效，否则返回具体的错误信息
   */
  isDatatypeValidForConnect(datatype, datatypes) {
    if (!datatype) {
      // 和不是当前项目中的数据模型或者是不存在的数据模型进行关联
      return '数据模型不存在，请确认';
    }
    if (datatype.format !== db.MDL_FMT_HASH) {
      // 和不存在的数据模型进行关联
      return '只能和哈希类别的数据模型进行关联';
    }
    // 检查被关联的数据模型的参数，是否为哈希并且一个id字段并且id字段的类型为String或者Number
    const idParam = datatype.params.find(param => param.name === 'id');
    if (!idParam) {
      return '要关联的数据模型没有 id 字段';
    }
    if (idParam.isArray) {
      return '要关联的数据模型的 id 字段不能是数组';
    }
    const idParamCorrespondingDatatype = datatypes.find(dt => dt.id === idParam.type);
    if (idParamCorrespondingDatatype.format !== db.MDL_FMT_STRING && idParamCorrespondingDatatype.format !== db.MDL_FMT_NUMBER) {
      return '要关联的数据模型的 id 字段，它的类型不是 String 或者 Number';
    }
    return true;
  },

  /**
   * 判断数据模型是否为自定义类型
   *  @return {Boolean}
   */
  isCustomDatatype(type) {
    return type > db.MDL_SYS_BOOLEAN;
  },

  /**
   * 从数据模型或者接口列表中提取出项目id
   *  @return {Array}
   */
  getProjectIds(datatypesOrInterfaces) {
    const projectIdsSet = new Set();
    datatypesOrInterfaces.forEach(item => {
      if (item.projectId !== 10000) {
        projectIdsSet.add(item.projectId);
      }
    });
    return Array.from(projectIdsSet);
  },

  /** 生成唯一的数据模型id
   * 这个方法虽然理论上存在冲突，但实现成本是比较小的
   * @param  {Number} [idNum] - 要生成的id个数，默认是1
   * @param  {Number} [type] - 要生成的id的类型，默认是字符串
   * @return  {Object} 数据模型对象
   */
  genDatatypeIds({idNum = 1, type = db.MDL_SYS_STRING}) {
    function uuid() {
      const id = crypto.randomBytes(16).toString('hex');
      // 转换成整数，可以排除前面出现 0 的字符串
      return parseInt(id.replace(/[a-z]/g, '').substr(0, 15));
    }

    let result = [];
    while (idNum) {
      result.push(uuid());
      idNum--;
    }
    result = result.map(id => {
      if (type === db.MDL_SYS_STRING) {
        return String(id);
      }
      return id;
    });
    return result;
  },

  isNotOrEmptyJsonObject(obj) {
    return Object.prototype.toString.call(obj) !== '[object Object]' || Object.keys(obj).length === 0;
  }
};

module.exports = util;
