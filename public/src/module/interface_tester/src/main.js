/**
 * @desc 前后端通用接口测试请求
 */

;(function () {

  function Exporter(rb, db, workerUtil, util) {
    var ERROR_TYPE = {
      JSON_ERROR: 0,
      TYPE_ERROR: 1,
      EXPECT_ERROR: 2,
      MISS_ERROR: 3,
      NOT_SUPPORT_ERROR: 4,
      UNNECESSARY_ERROR: 5,
      BEFORE_SCRIPT_ERROR: 6,
      AFTER_SCRIPT_ERROR: 7,
      REQUEST_FAILED: 8
    }

    function compareDataWithDefinition(resFormat, mockdata, outputs, datatypes, checkUnnecessaryField, checkRequiredParam) {
      var errors = [];
      var result = true;

      var formatToSysTypeMap = {};
      formatToSysTypeMap[db.MDL_FMT_STRING] = db.MDL_SYS_STRING;
      formatToSysTypeMap[db.MDL_FMT_NUMBER] = db.MDL_SYS_NUMBER;
      formatToSysTypeMap[db.MDL_SYS_BOOLEAN] = db.MDL_SYS_BOOLEAN;

      var formatToSysTypeNameMap = {};

      formatToSysTypeNameMap[db.MDL_FMT_STRING] = 'string';
      formatToSysTypeNameMap[db.MDL_FMT_NUMBER] = 'number';
      formatToSysTypeNameMap[db.MDL_FMT_BOOLEAN] = 'boolean';
      formatToSysTypeNameMap[db.MDL_FMT_HASH] = 'object';
      formatToSysTypeNameMap[db.MDL_FMT_ARRAY] = 'array';

      var sysTypeToTypeNameMap = {};
      sysTypeToTypeNameMap[db.MDL_SYS_STRING] = 'string';
      sysTypeToTypeNameMap[db.MDL_SYS_NUMBER] = 'number';
      sysTypeToTypeNameMap[db.MDL_SYS_BOOLEAN] = 'boolean';

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
        var walkParamsPath = walkParams.map(function (walkParam) {
          return walkParam.name;
        }).join(' -> ');
        var computedPath = walkParamsPath + ((walkParamsPath && paramName) ? ' -> ' : '') + (paramName || '');
        if (suffix === false) {
          return computedPath;
        }
        return computedPath ? computedPath + '，' : '';
      }

      function checkParamsRequiredAndTypeMatched(format, data, params, walkParams, tipPrefix) {
        if (data === null) {
          return;
        }
        var mapName = function (item) {
          return item.name;
        };
        switch (format) {
          case db.MDL_FMT_STRING:
          case db.MDL_FMT_NUMBER:
          case db.MDL_FMT_BOOLEAN:
            if (!isSysTypeMatch(data, formatToSysTypeMap[format])) {
              result = false;
              errors.push({
                type: ERROR_TYPE.TYPE_ERROR,
                data: typeof data,
                expect: formatToSysTypeNameMap[format],
                message: tipPrefix + '类型不匹配',
                keys: walkParams.map(mapName)
              });
            }
            return;
          case db.MDL_FMT_ENUM:
            // 如果是枚举，我们假设所有的值的类型都是一样的，并且枚举类型只支持字符串、数值、布尔三种类型，但可以是自定义的持字符串、数值、布尔
            var enumType = params[0].type;
            var datatype = datatypes.find(function (dt) {
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
                errors.push({
                  type: ERROR_TYPE.TYPE_ERROR,
                  data: typeof data,
                  expect: 'string, number, boolean',
                  message: tipPrefix + '枚举类型只能是字符串、数值或者布尔三种类型',
                  keys: walkParams.map(mapName)
                });
            }
            return;
          case db.MDL_FMT_ARRAY:
            if (Array.isArray(data)) {
              // 我们假设所有数组元素的类型都是一样的，所以取第一个元素的类型即可
              var elementType = params[0].type;
              var datatype = datatypes.find(function (dt) {
                return dt.id === elementType;
              });
              data.forEach(function (item, idx) {
                checkParamsRequiredAndTypeMatched(datatype.format, item, datatype.params, walkParams, tipPrefix + '数组第 ' + idx + ' 项');
              });
            } else {
              result = false;
              errors.push({
                type: ERROR_TYPE.TYPE_ERROR,
                data: typeof data,
                expect: 'array',
                message: tipPrefix + '类型不匹配',
                keys: walkParams.map(mapName)
              });
            }
            return;
          case db.MDL_FMT_HASH:
            if (data === null || Array.isArray(data) || typeof data !== 'object') {
              result = false;
              errors.push({
                type: ERROR_TYPE.TYPE_ERROR,
                data: typeof data,
                expect: 'array',
                message: tipPrefix + '类型不匹配',
                keys: walkParams.map(mapName)
              });
              return;
            }
            params.forEach(function (param) {
              // 先检查字段是否存在
              if ((checkRequiredParam && !data.hasOwnProperty(param.name))|| (!checkRequiredParam && param.required === 1 && !data.hasOwnProperty(param.name))) {
                result = false;
                errors.push({
                  type: ERROR_TYPE.MISS_ERROR,
                  message: tipPrefix + '缺少字段',
                  keys: walkParams.map(mapName).concat([param.name])
                });
              } else if (data.hasOwnProperty(param.name)) {
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
                        var foundDatatype = walkParams.find(function (walkParam) {
                          return walkParam.typeName === param.typeName;
                        });
                        if (!foundDatatype) {
                          result = false;
                          // 普通匿名类型
                          errors.push({
                            type: ERROR_TYPE.TYPE_ERROR,
                            message: tipPrefix + '值为 null，不符合定义',
                            keys: walkParams.map(mapName).concat([param.name])
                          });
                        }
                        return;
                      }
                      var datatype = datatypes.find(function (datatype) {
                        return datatype.id === param.type;
                      });
                      var walkParamsPrevLength = walkParams.length;
                      walkParams.push(param)
                      checkParamsRequiredAndTypeMatched(datatype.format, item, datatype.params, walkParams, tipPrefix);
                      walkParams.length = walkParamsPrevLength;
                    } else {
                      result = false;
                      if (param.type === db.MDL_SYS_FILE) {
                        errors.push({
                          type: ERROR_TYPE.NOT_SUPPORT_ERROR,
                          message: tipPrefix + '暂不支持保存文件类别的数据',
                          keys: walkParams.map(mapName)
                        });
                      } else {
                        var shouldBeParamType = param.typeName.toLowerCase();
                        var actualParamType = typeof item;
                        errors.push({
                          type: ERROR_TYPE.TYPE_ERROR,
                          data: actualParamType,
                          expect: shouldBeParamType,
                          message: tipPrefix + '类型不匹配',
                          keys: walkParams.map(mapName).concat([param.name])
                        });
                      }
                    }
                  }
                }

                if (param.isArray) {
                  // 数组的每一项都要符合
                  if (Array.isArray(data[param.name])) {
                    data[param.name].forEach(function (item, idx) {
                      checkParam(item, '数组第 ' + idx + ' 项');
                    });
                  } else {
                    result = false;
                    var shouldBeParamType = param.typeName.toLowerCase();
                    var actualParamType = typeof data[param.name];
                    errors.push({
                      type: ERROR_TYPE.TYPE_ERROR,
                      data: actualParamType,
                      expect: shouldBeParamType,
                      message: tipPrefix + '类型不匹配',
                      keys: walkParams.map(mapName).concat([param.name])
                    });
                  }
                } else {
                  checkParam(data[param.name], tipPrefix);
                }
              }
            });
            return;
          case db.MDL_FMT_HASHMAP:
            if (data === null || Array.isArray(data) || typeof data !== 'object') {
              result = false;
              errors.push({
                type: ERROR_TYPE.TYPE_ERROR,
                data: typeof data,
                expect: 'array',
                message: tipPrefix + '类型不匹配',
                keys: walkParams.map(mapName)
              });
              return;
            }
            params.forEach(function (param) {
              // 先检查字段是否存在
              var keys = Object.keys(data);
              if (keys.length < 1) {
                result = false;
                errors.push({
                  type: ERROR_TYPE.MISS_ERROR,
                  message: tipPrefix + '缺少字段',
                  keys: walkParams.map(mapName).concat([param.name])
                });
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
                        var foundDatatype = walkParams.find(function (walkParam) {
                          return walkParam.typeName === param.typeName;
                        });
                        if (!foundDatatype) {
                          result = false;
                          // 普通匿名类型
                          errors.push({
                            type: ERROR_TYPE.TYPE_ERROR,
                            message: tipPrefix + '值为 null，不符合定义',
                            keys: walkParams.map(mapName).concat([param.name])
                          });
                        }
                        return;
                      }
                      var datatype = datatypes.find(function (datatype) {
                        return datatype.id === param.type;
                      });
                      var walkParamsPrevLength = walkParams.length;
                      walkParams.push(param)
                      checkParamsRequiredAndTypeMatched(datatype.format, item, datatype.params, walkParams, tipPrefix);
                      walkParams.length = walkParamsPrevLength;
                    } else {
                      result = false;
                      if (param.type === db.MDL_SYS_FILE) {
                        errors.push({
                          type: ERROR_TYPE.NOT_SUPPORT_ERROR,
                          message: tipPrefix + '暂不支持保存文件类别的数据',
                          keys: walkParams.map(mapName)
                        });
                      } else {
                        var shouldBeParamType = param.typeName.toLowerCase();
                        var actualParamType = typeof item;
                        errors.push({
                          type: ERROR_TYPE.TYPE_ERROR,
                          data: actualParamType,
                          expect: shouldBeParamType,
                          message: tipPrefix + '类型不匹配',
                          keys: walkParams.map(mapName).concat([param.name])
                        });
                      }
                    }
                  }
                }
                if (param.name === '键') {
                  for (var i = 0 ; i < keys.length ; i++) {
                    console.log('check 键', keys[i]);
                    checkParam(keys[i], tipPrefix);
                  }
                } else if (param.name === '值') {
                  for (var i = 0 ; i < keys.length ; i++) {
                    console.log('check 值', data[keys[i]]);
                    if (param.isArray) {
                      console.log('param.isArray', param.isArray);
                      // 数组的每一项都要符合
                      if (Array.isArray(data[keys[i]])) {
                        data[keys[i]].forEach(function (item, idx) {
                          checkParam(item, '数组第 ' + idx + ' 项');
                        });
                      } else {
                        result = false;
                        var shouldBeParamType = param.typeName.toLowerCase();
                        var actualParamType = typeof data[keys[i]];
                        errors.push({
                          type: ERROR_TYPE.TYPE_ERROR,
                          data: actualParamType,
                          expect: shouldBeParamType,
                          message: tipPrefix + '类型不匹配',
                          keys: walkParams.map(mapName).concat([param.name])
                        });
                      }
                    } else {
                      checkParam(data[keys[i]], tipPrefix);
                    }
                  }
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
            if (Array.isArray(data) && data.length) {
              var elementType = params[0].type;
              var datatype = datatypes.find(function (dt) {
                return dt.id === elementType;
              });
              data.forEach(function (item, idx) {
                checkUnnecessaryData(datatype.format, item, datatype.params, walkParams, tipPrefix + '数组第 ' + idx + ' 项');
              });
            }
            return;
          case db.MDL_FMT_HASH:
            if (data === null || Array.isArray(data) || typeof data !== 'object') {
              return;
            }
            Object.keys(data).forEach(function (key) {
              var foundParam = params.find(function (param) {
                return param.name === key;
              });
              if (foundParam) {
                function checkParam(value, tipPrefix) {
                  if (value !== null && typeof value === 'object') {
                    var datatype = datatypes.find(function (datatype) {
                      return datatype.id === foundParam.type;
                    });
                    var walkParamsPrevLength = walkParams.length;
                    walkParams.push(foundParam)
                    checkUnnecessaryData(datatype.format, value, datatype.params, walkParams, tipPrefix);
                    walkParams.length = walkParamsPrevLength;
                  }
                }

                var value = data[key];
                if (foundParam.isArray) {
                  if (Array.isArray(value) && value.length) {
                    value.forEach(function (item, idx) {
                      checkParam(item, '数组第 ' + idx + ' 项');
                    });
                  }
                } else {
                  checkParam(value, tipPrefix);
                }
              } else {
                result = false;
                errors.push({
                  type: ERROR_TYPE.UNNECESSARY_ERROR,
                  message: tipPrefix + '多余字段',
                  keys: walkParams.map(function (item) {
                    return item.name;
                  }).concat([key])
                });
              }
            });
            return;
          case db.MDL_FMT_HASHMAP:
            if (data === null || Array.isArray(data) || typeof data !== 'object') {
              return;
            }
            Object.keys(data).forEach(function (key) {
              var foundParam = params.find(function (param) {
                return param.name === '值';
              });
              if (foundParam) {
                function checkParam(value, tipPrefix) {
                  if (value !== null && typeof value === 'object') {
                    var datatype = datatypes.find(function (datatype) {
                      return datatype.id === foundParam.type;
                    });
                    var walkParamsPrevLength = walkParams.length;
                    walkParams.push(foundParam)
                    checkUnnecessaryData(datatype.format, value, datatype.params, walkParams, tipPrefix);
                    walkParams.length = walkParamsPrevLength;
                  }
                }
                var objKeys = Object.keys(data);
                for (var i = 0 ; i < objKeys.length ; i++) {
                  var value = data[objKeys[i]];
                  if (foundParam.isArray) {
                    if (Array.isArray(value) && value.length) {
                      value.forEach(function (item, idx) {
                        checkParam(item, '数组第 ' + idx + ' 项');
                      });
                    }
                  } else {
                    checkParam(value, tipPrefix);
                  }
                }
              } else {
                result = false;
                errors.push({
                  type: ERROR_TYPE.UNNECESSARY_ERROR,
                  message: tipPrefix + '多余字段',
                  keys: walkParams.map(function (item) {
                    return item.name;
                  }).concat([key])
                });
              }
            });
            return;
        }
      }

      switch (resFormat) {
        case db.MDL_FMT_HASHMAP:
          // 检查字段缺失、类型不匹配的情况
          checkParamsRequiredAndTypeMatched(resFormat, mockdata, outputs, [], '');
          if (checkUnnecessaryField !== false) {
            // 检查字段多余的情况
            checkUnnecessaryData(resFormat, mockdata, outputs, [], '');
          }
          break;
        case db.MDL_FMT_HASH:
          // 检查字段缺失、类型不匹配的情况
          checkParamsRequiredAndTypeMatched(resFormat, mockdata, outputs, [], '');
          if (checkUnnecessaryField !== false) {
            // 检查字段多余的情况
            checkUnnecessaryData(resFormat, mockdata, outputs, [], '');
          }
          break;
        case db.MDL_FMT_ARRAY:
          // 数组类型，需要检查每个元素，空数组是可以保存的
          if (Array.isArray(mockdata) && mockdata.length) {
            // 我们假设所有数组元素的类型都是一样的，所以取第一个元素的类型即可
            var elementType = outputs[0].type;
            if (elementType <= db.MDL_SYS_BOOLEAN) {
              // 基本类型
              mockdata.forEach(function (item, idx) {
                if (!isSysTypeMatch(item, elementType)) {
                  result = false;
                  errors.push({
                    type: ERROR_TYPE.TYPE_ERROR,
                    data: typeof item + '<' + item + '>',
                    expect: sysTypeToTypeNameMap[elementType],
                    message: '数组第 ' + idx + ' 项类型不匹配',
                    keys: [idx]
                  });
                }
              });
            } else {
              var datatype = datatypes.find(function (dt) {
                return dt.id === elementType;
              });
              // 自定义类型
              mockdata.forEach(function (item, idx) {
                // 检查字段缺失、类型不匹配的情况
                checkParamsRequiredAndTypeMatched(datatype.format, item, datatype.params, [], '数组第 ' + idx + ' 项');
                if (checkUnnecessaryField !== false) {
                  // 检查字段多余的情况
                  checkUnnecessaryData(datatype.format, item, datatype.params, [], '数组第 ' + idx + ' 项');
                }
              });
            }
          } else {
            result = false;
            errors.push({
              type: ERROR_TYPE.TYPE_ERROR,
              data: typeof mockdata,
              expect: 'array',
              message: '类型错误',
              keys: [0]
            });
          }
          break;
      }
      return result || errors;
    }

    function compareHeader(headers, expectHeaders) {
      var result = [];
      Object.keys(expectHeaders).forEach(function (key) {
        var lowerKey = key.toLowerCase().trim();
        var headerKey = Object.keys(headers).filter(function (item) {
          return item.toLowerCase().trim() === lowerKey;
        })[0];
        if (!headerKey) {
          result.push({
            type: ERROR_TYPE.MISS_ERROR,
            keys: [headerKey],
            message: '缺少响应头'
          });
        } else {
          var header = headers[headerKey];
          var expectHeader = expectHeaders[key];
          var fields = header.split(';').map(function (item) {
            return item.trim();
          }).filter(function (item) {
            return item !== '';
          });
          var expectFields = expectHeader.value.split(';').map(function (item) {
            return item.trim();
          }).filter(function (item) {
            return item !== '';
          });
          expectFields.forEach(function (item) {
            if (fields.indexOf(item) === -1) {
              result.push({
                type: ERROR_TYPE.EXPECT_ERROR,
                keys: [headerKey],
                message: '响应头期望值不匹配',
                expect: expectHeader.value,
                data: header
              });
              return;
            }
          });
        }
      });
      return result.length === 0 ? true : result;
    }

    function compareDataExpect(data, expectData, outputs, checkRequiredParam, format) {
      var result = [];
      if (!data || !expectData) {
        return true;
      }
      if (typeof data === 'object') {
        if (format === db.MDL_FMT_HASHMAP) {
          var k = Object.keys(expectData);
          for (var i = 0 ; i < k.length ; i++) {
            if (k[i] === '键') {
              if (
                Object.keys(data).length !== 1 ||
                (
                  expectData[k[i]].value
                  && JSON.stringify(Object.keys(data)[0]) !== JSON.stringify(expectData[k[i]].value)
                )
              ) {
                result.push({
                  type: ERROR_TYPE.EXPECT_ERROR,
                  data: JSON.stringify(Object.keys(data)[0]),
                  keys: [i],
                  message: expectData[k[i]].error || '响应结果期望值不匹配',
                  expect: JSON.stringify(expectData[k[i]].value)
                });
              }
            } else if (k[i] === '值') {
              var dataKeys = Object.keys(data);
              for (var keyIndex = 0 ; keyIndex < dataKeys.length ; keyIndex++) {
                if (
                  expectData[k[i]].value
                  &&  JSON.stringify(data[dataKeys[keyIndex]]) !== JSON.stringify(expectData[k[i]].value)
                ) {
                  result.push({
                    type: ERROR_TYPE.EXPECT_ERROR,
                    data: JSON.stringify(data[dataKeys[keyIndex]]),
                    keys: [i],
                    message: expectData[k[i]].error || '响应结果期望值不匹配',
                    expect: JSON.stringify(expectData[k[i]].value)
                  });
                }
              }
            }
          }
        } else {
          for (var i in expectData) {
            var param = outputs.find(function(output) {
              return output.name === i;
            });
            if (checkRequiredParam || (!checkRequiredParam && param && param.required === 1)) {
              if (expectData[i].value && JSON.stringify(data[i]) !== JSON.stringify(expectData[i].value)) {
                result.push({
                  type: ERROR_TYPE.EXPECT_ERROR,
                  data: JSON.stringify(data[i]),
                  keys: [i],
                  message: expectData[i].error || '响应结果期望值不匹配',
                  expect: JSON.stringify(expectData[i].value)
                });
              }
            }
          }
        }
      } else if (expectData.value && JSON.stringify(data) !== JSON.stringify(expectData.value)) {
        result.push({
          type: ERROR_TYPE.EXPECT_ERROR,
          data: JSON.stringify(data),
          message: expectData.error || '响应结果期望值不匹配',
          expect: JSON.stringify(expectData.value)
        });
      }
      return result.length ? result : true;
    }

    function parseJSON(json, params) {
      // 应对修改了接口之后直接在列表中开始测试的情况，如果删除了接口字段，则在用例中也清除。关于修改了接口还不进测试详情就直接开始测试这么傲娇的用户我也不知道怎么服务更多了。
      var obj = null;
      var keys = '';
      var paramname;
      try {
        obj = JSON.parse(json);
        params.forEach(function (param) {
          paramname = param.name.trim();
          // 用于找出已删除的字段
          paramname && (keys += paramname + ',');
        });
        if (keys && obj.reqParams.toString() === '[object Object]') {
          // 删除测试用例中存在而接口定义中已删除的字段
          Object.keys(obj.reqParams).forEach(function(key) {
            if (keys.indexOf(key) < 0) {
              delete obj.reqParams[key];
            }
          });
        }
      } catch (ex) {
        // ignore
      }
      return obj;
    };

    function getTestData(test, interface, oldtest, reqData, isTransformData) {
      var _reqdata = parseJSON(test.reqData, interface.params.inputs);
      reqdata = isTransformData ? (reqData.reqData || (_reqdata ? _reqdata.reqParams : '')) : (reqData || (_reqdata ? _reqdata.reqParams : ''));
      var reqheader = parseJSON(test.reqHeader, interface.params.reqHeaders);
      var data = {
        name: test.name,
        state: test.state,
        id: test.id || oldtest.id,
        iid: interface.id,
        pgid: interface.progroupId,
        method: interface.method,
        env: test.env,
        urlOpt: {
          format: interface.reqFormat,
          host: test.env ? test.env.value : test.host,
          path: interface.path,
          method: interface.method,
          params: isTransformData && reqData.reqPathVars ? reqData.reqPathVars : (_reqdata ? _reqdata.pathParams : ''),
          reqdata: interface.method.toLowerCase() !== 'get' ? '' : reqdata
        },
        data: {
          reqHeader: isTransformData && reqData.reqHeaders ? reqData.reqHeaders : reqheader,
          reqData: interface.method.toLowerCase() === 'get' ? '' : reqdata
        },
        updatedata: {
          id: test.id || oldtest.id,
          data: {
            state: db.API_TST_PASS,
            host: test.host,
            name: test.name,
            description: test.description,
            report: '',
            reqHeader: isTransformData && reqData.reqHeaders ? JSON.stringify(reqData.reqHeaders) : (reqheader ? JSON.stringify(reqheader) : ''),
            reqData: isTransformData && reqdata ? JSON.stringify(reqdata) : (_reqdata ? JSON.stringify(_reqdata) : ''),
            resHeader: '',
            resData: '',
            resExpect: test.resExpect,
            resExpectHeader: test.resExpectHeader
          }
        },
        resparams: {
          outputs: interface.params.outputs,
          resHeaders: interface.params.resHeaders
        },
        resformat: interface.resFormat,
        resExpect: test.resExpect,
        resExpectHeader: test.resExpectHeader,
        beforeScript: interface.beforeScript,
        afterScript: interface.afterScript
      };
      oldtest = oldtest || test;
      // 不传未改动的字段
      Object.keys(data.updatedata.data).forEach(function (key) {
        var item = data.updatedata.data[key];
        if (item === oldtest[key]) {
          delete data.updatedata.data[key];
        }
      });
      return data;
    }

    if (!rb) {
      return {};
    }
    var requestBuilder = new rb.RequestBuilder();

    function InterfaceTester(options) {
      var self = this;
      var wrk = typeof module !== 'undefined' ? require('../../../../../server/util/mock_data_worker') : undefined;
      var vm = typeof module !== 'undefined' ? require('vm') : undefined;
      var defaultOptions = {
        MAX_TEST_NUM: 2
      };

      /**
       * 以下四个队列必传，否则当cache reset的时候，原有队列丢失
       * @param {Array} options.MAX_TEST_NUM 最大同时测试用例数
       * @param {Array} options.testQueue 待测试队列
       * @param {Array} options.testingQueue 测试中队列
       * @param {Array} options.testedQueue 已测试队列
       * @param {Array} options.allTestList 全部测试列表
       */
      function init(options) {
        if (!(self instanceof InterfaceTester)) {
          return new InterfaceTester();
        }
        self.options = Object.assign(defaultOptions, options || {});
        self._testQueue = self.options.testQueue || [];
        self._testingQueue = self.options.testingQueue || [];
        self._testedQueue = self.options.testedQueue || [];
        self._allTestList = self.options.allTestList || [];
        self.TEST_STATUS = {
          TEST_NOT_BEGIN: 0,
          TEST_NOT_FINISHED: 1,
          TEST_SUCCESS: 2,
          TEST_FAILED: 3
        }
        self.ENV = {
          FRONT: 0,
          BACK: 1
        }
        self.ERROR_TYPE = ERROR_TYPE;
        self._env = (function () {
          if (typeof NEJ !== 'undefined') {
            return self.ENV.FRONT;
          } else if (typeof module !== 'undefined') {
            return self.ENV.BACK;
          }
        })();
        return self;
      }

      InterfaceTester.prototype.startTests = function (testSet) {
        if (testSet == null) {
          return;
        }
        var self = this;
        var env = testSet.env;
        var data = testSet.data;
        var current = -1;
        var emptyFunc = function () {
        };
        ['onStatusChange', 'onInterfaceFinished', 'onTestFinished', 'onError'].forEach(function (item) {
          if (!testSet[item]) {
            testSet[item] = emptyFunc;
          }
        });
        data.forEach(function (item) {
          item.testcases.forEach(function (testcase) {
            // 用来获取全部用例数量
            testcase.testcase.state = 4;
            this._allTestList.push(testcase);
          }, this);
        }, this);
        var checkInterfaceFinished = function (statusMap) {
          return Object.keys(statusMap).filter(function (key) {
            return statusMap[key] !== self.TEST_STATUS.TEST_SUCCESS && statusMap[key] !== self.TEST_STATUS.TEST_FAILED;
          }).length === 0;
        };
        var doNextInterfaceTestcase = function (lastTestcase, error) {
          if (current < data.length) {
            if (current >= 0) {
              if (!error) {
                testSet.onInterfaceFinished(data[current]);
              }
            }
            current++;
            while (current < data.length && (data[current].testcases.length === 0 || (self._env === self.ENV.BACK && this.checkFileParam(data[current].interface, testSet.datatypes)))) {
              current++;
            }
            if (current < data.length) {
              var statusMap = {};
              data[current].testcases.forEach(function (item) {
                var testcase = item.testcase = getTestData(item.testcase, data[current].interface, item.oldTest, item.reqData);
                testcase.statusMap = statusMap;
                statusMap[testcase.id] = this.TEST_STATUS.TEST_NOT_BEGIN;
                testcase.env = env;
                testcase.checkRunCallback = checkInterfaceFinished;
                testcase.cb = doNextInterfaceTestcase;
                testcase.pid = data[current].interface.projectId;
                testcase.constraints = testSet.constraints;
                testcase.datatypes = testSet.datatypes;
                testcase.state = db.API_TST_TODO;
                testcase.paramsDefine = data[current].interface.params;
                testcase.onStatusChange = testSet.onStatusChange;
                testcase.onError = testSet.onError;
                testcase.checkRequiredParam = testSet.checkRequiredParam;
                this._testQueue.push(testcase);
              }, self);
              self.continueTests();
            } else {
              doFinishTest();
            }
          } else {
            doFinishTest();
          }
        }.bind(this)
        var doFinishTest = function () {
          testSet.onTestFinished();
        }
        doNextInterfaceTestcase();
      };
      InterfaceTester.prototype.continueTests = function () {
        while (this._testingQueue.length < this.options.MAX_TEST_NUM && this._testQueue.length) {
          this._testingQueue.push(this._testQueue.shift());
        }
        this._testingQueue.forEach(function (item) {
          if (item.statusMap[item.id] === this.TEST_STATUS.TEST_NOT_BEGIN) {
            item.statusMap[item.id] = this.TEST_STATUS.TEST_NOT_FINISHED;
            item.onStatusChange(item);
            this.doTest(item);
          }
        }, this);
      };
      InterfaceTester.prototype.clearFields = function (testcase) {
        ['env', 'cb', 'constraints', 'datatypes', 'paramsDefine', 'onStatusChange', 'onError'].forEach(function (item) {
          delete testcase[item];
        });
      };
      InterfaceTester.prototype.doTest = function (testcase) {
        var updatedata = {
          testBegTime: Date.now()
        }
        var self = this;
        var handleResult = function (result) {
          var index = this._testingQueue.indexOf(testcase);
          if (index !== -1) {
            this._testingQueue.splice(index, 1);
            this._testedQueue.push(testcase);
          }
          if (!result.runningError) {
            updatedata.testEndTime = Date.now();
            Object.keys(result).forEach(function (key) {
              if (['resData', 'resHeader', 'report', 'state', 'error'].indexOf(key) !== -1) {
                updatedata[key] = result[key];
              }
            });
            testcase.updatedata.data = Object.assign(testcase.updatedata.data, updatedata);
            var onStatusChange = testcase.onStatusChange;
            if (testcase.checkRunCallback(testcase.statusMap)) {
              var cb = testcase.cb;
              self.clearFields(testcase);
              onStatusChange(testcase);
              cb && cb(testcase);
            } else {
              self.clearFields(testcase);
              onStatusChange(testcase);
              self.continueTests();
            }
          } else {
            var onError = testcase.onError;
            var cb = testcase.cb;
            self.clearFields(testcase);
            result.testcase = testcase;
            delete result.runningError;
            onError && onError(result);
            if (testcase.checkRunCallback(testcase.statusMap)) {
              cb && cb(testcase);
            } else {
              self.continueTests();
            }
          }
        }.bind(self);
        var parseUrl = function (options) {
          var host = options.host.replace(/\/$/, '');
          var pathIndex = options.path.indexOf('?');
          var reqPath = options.path;
          var queryStr = '';
          if (pathIndex > -1) {
            reqPath = options.path.substring(0, pathIndex);
            queryStr = options.path.substring(pathIndex);
          }
          Object.keys(options.params).forEach(function (key) {
            reqPath = reqPath.replace('/:' + key, '/' + options.params[key]);
          });
          var url = host + reqPath + queryStr;
          if (options.method.toLowerCase() === 'get' && options.format == db.MDL_FMT_HASH) {
            var query = [];
            Object.keys(options.reqdata || {}).forEach(function (key) {
              var val = options.reqdata[key];
              if (val !== '') {
                query.push(key + '=' + encodeURIComponent(typeof val === 'object' ? JSON.stringify(val) : val));
              }
            });
            if (query.length) {
              url = url + (queryStr ? '&' : '?') + query.join('&');
            }
          }
          return url;
        };
        var sendRequest = function (sendOpt) {
          var header;
          header = testcase.env.header ? JSON.parse(testcase.env.header) : [];
          Array.isArray(header) && header.forEach(function (item) {
            !sendOpt.data.reqHeader && (sendOpt.data.reqHeader = {});
            !sendOpt.data.reqHeader[item.name] && (sendOpt.data.reqHeader[item.name] = item.defaultValue);
          });
          requestBuilder.sendRequest(sendOpt, function (result) {
            result = parseResult(result);
            if (result[0]) {
              result = result[1];
              if (testcase.afterScript) {
                self.runScript({
                  code: testcase.afterScript,
                  params: {
                    host: testcase.urlOpt.host,
                    path: testcase.urlOpt.path,
                    method: result.reqData.method,
                    headers: JSON.parse(result.resHeader),
                    data: JSON.parse(result.resData)
                  },
                  constraints: testcase.constraints,
                  onmessage: function (event) {
                    testcase.statusMap[testcase.id] = this.TEST_STATUS.TEST_SUCCESS;
                    result.state = db.API_TST_PASS;
                    var scriptResult = JSON.parse(event.data);
                    var error = this.check({
                      format: testcase.resformat,
                      resData: scriptResult.data ? JSON.stringify(scriptResult.data) : '',
                      resHeader: scriptResult.headers ? JSON.stringify(scriptResult.headers) : '',
                      resDefine: testcase.paramsDefine.outputs,
                      datatypes: testcase.datatypes,
                      resExpect: testcase.resExpect,
                      resHeaderExpect: testcase.resExpectHeader,
                      checkRequiredParam: testcase.checkRequiredParam
                    });
                    if (error !== true) {
                      testcase.statusMap[testcase.id] = this.TEST_STATUS.TEST_FAILED;
                      result.state = db.API_TST_FAILED;
                      result.error = error;
                    }
                    handleResult.call(this, result);
                  }.bind(this),
                  onerror: function (error) {
                    // 错误情况
                    result.runningError = true;
                    result.state = db.API_TST_FAILED;
                    result.error = [{
                      type: ERROR_TYPE.AFTER_SCRIPT_ERROR,
                      message: '接收规则执行失败！',
                      error: error
                    }];
                    handleResult.call(this, result);
                  }.bind(this)
                });
              } else {
                testcase.statusMap[testcase.id] = this.TEST_STATUS.TEST_SUCCESS;
                result.state = db.API_TST_PASS;
                var error = this.check({
                  format: testcase.resformat,
                  resData: result.resData,
                  resHeader: result.resHeader,
                  resDefine: testcase.paramsDefine.outputs,
                  datatypes: testcase.datatypes,
                  resExpect: testcase.resExpect,
                  resHeaderExpect: testcase.resExpectHeader,
                  checkRequiredParam: testcase.checkRequiredParam
                });
                if (error !== true) {
                  testcase.statusMap[testcase.id] = this.TEST_STATUS.TEST_FAILED;
                  result.state = db.API_TST_FAILED;
                  result.error = error;
                }

                handleResult.call(this, result);
              }
            } else {
              testcase.statusMap[testcase.id] = self.TEST_STATUS.TEST_FAILED;
              result[1].state = db.API_TST_FAILED;
              handleResult.call(this, result[1]);
            }
          }.bind(self), function(err) {
            var result = {}
            result.runningError = true;
            result.state = db.API_TST_FAILED;
            result.error = [{
              type: ERROR_TYPE.REQUEST_FAILED,
              message: '请求发送错误！',
              error: err
            }];
            handleResult.call(this, result);
          });
        };
        var parseResult = function (result) {
          var data = {reqData: result.reqData, resData: result.resData};
          var isLegal = self.checkJSON(result.resData).result;
          // 在跨域插件返回的xhr中抓出响应头并解析为object
          if (result.response.headers) {
            var _resheader = typeof result.response.headers === 'string' ?
              self.parseHeader(result.response.headers) :
              result.response.headers;
            data.resHeader = JSON.stringify(_resheader);
          } else {
            data.resHeader = JSON.stringify({});
          }
          if (result.response.statusCode != '200') {
            isLegal = false;
            data.report = result.response.statusText ? result.response.statusCode + ':' + result.response.statusText : '无响应';
          } else {
            // 防止重测时显示之前的结果
            data.report = '';
          }
          return [isLegal, data];
        };
        var filterEmpty = function (data) {
          if (Object.prototype.toString.call(data) !== '[object Object]') {
            return data;
          }
          var res = {};
          data = data || {};
          Object.keys(data).forEach(function (key) {
            var val = data[key];
            if (typeof val === 'string') {
              if (val) {
                if (val === '""') {
                  res[key] = '';
                } else {
                  res[key] = val.replace(/(\\\\)|(\\")/g, function (m) {
                    if (m === '\\\\') {
                      return '\\';
                    } else {
                      return '"';
                    }
                  });
                }
              } else {
                res[key] = '';
              }
            } else {
              res[key] = val;
            }
          });
          return res;
        }
        testcase.urlOpt.host = testcase.env.value;
        var reqInfo = {
          url: parseUrl(testcase.urlOpt),
          method: testcase.method,
          data: testcase.data
        };
        reqInfo.data.reqData = filterEmpty(reqInfo.data.reqData);
        reqInfo.data.reqHeader = filterEmpty(reqInfo.data.reqHeader || {});
        if (testcase.beforeScript) {
          this.runScript({
            code: testcase.beforeScript,
            params: {
              host: testcase.urlOpt.host,
              path: testcase.urlOpt.path,
              method: testcase.method,
              headers: testcase.data.reqHeader,
              data: reqInfo.data.reqData
            },
            constraints: testcase.constraints,
            onmessage: function (event) {
              // 发送规则可能影响URL成分，所以重新生成一把URL
              var scriptResult = JSON.parse(event.data);
              Object.keys(testcase.urlOpt).forEach(function (key) {
                if (scriptResult[key]) {
                  testcase.urlOpt[key] = scriptResult[key];
                }
              });
              var reqInfo = {
                url: parseUrl(testcase.urlOpt),
                method: scriptResult.method || testcase.method,
                data: {
                  reqHeader: scriptResult.headers || testcase.data.reqHeader,
                  reqData: scriptResult.data || testcase.data.reqData
                }
              };
              console.log('接口用例-请求信息(发送规则执行后): %o', reqInfo);
              sendRequest.call(this, reqInfo);
            }.bind(this),
            onerror: function (error) {
              // 错误情况
              var result = {}
              result.runningError = true;
              result.state = db.API_TST_FAILED;
              result.error = [{
                type: ERROR_TYPE.BEFORE_SCRIPT_ERROR,
                message: '发送规则执行失败',
                error: error
              }];
              handleResult.call(this, result);
            }.bind(this)
          });
        } else {
          sendRequest.call(this, reqInfo);
        }
      };
      // 前后端的runScript 不同
      if (typeof module !== 'undefined') {
        InterfaceTester.prototype.runScript = function(options) {
          var code = options.code;
          if (!code || !code.replace(/\s/g, '')) {
            if (options.onerror && typeof options.onerror === 'function') {
              options.onerror(new Error('Script is not a function!'));
            }
            return;
          }
          var sandbox = wrk.getWorker(options.constraints);
          sandbox.error = null;
          sandbox.data = options.params;
          code = 'result=' + code.replace(/\((.*)\)/, function ($0, $1) {
            return '(data' + ($1 ? ',' + $1 : '') + ')';
          });
          code = 'try{' + code + '}catch(err){error = err;}';
          try {
            vm.runInNewContext(code, sandbox, {
              timeout: 1000
            });
            if (sandbox.error) {
              options.onerror && options.onerror(sandbox.error);
            } else {
              options.onmessage && options.onmessage({data: JSON.stringify(sandbox.data)});
            }
          } catch (e) {
            options.onerror && options.onerror(e);
          }
        };
      } else {
        InterfaceTester.prototype.runScript = function (options) {
          var code = options.code;
          if (!code || !code.replace(/\s/g, '')) {
            if (options.onerror && typeof options.onerror === 'function') {
              options.onerror(new Error('Script is not a function!'));
            }
            return;
          }
          var s = [];
          s.push('importScripts(\'' + window.location.origin + '/src/lib/fb-modules/lib/mockjs/dist/mock.js\');');
          s.push('importScripts(\'' + window.location.origin + '/src/lib/fb-modules/util/mock_data.js\');');
          options.constraints.forEach(function (item) {
            if (item.type != 1) {
              var body = item.function.replace(/NEI\.(id|str|chinese|email|url|num|bool|var|repeat|loop)\((.*?)\)/g, function ($0, $1, $2) {
                return $1 + '(null,null' + ($2 ? ',' + $2 : '') + ')';
              });
              s.push('var ' + item.name + ' = function(){' + body + '};');
            }
          });
          code = 'var result=' + code.replace(/\((.*)\)/, function ($0, $1) {
            return '(JSON.parse(event.data)' + ($1 ? ',' + $1 : '') + ')';
          });
          !~code.indexOf('(JSON.parse(event.data)') && (code += ';(JSON.parse(event.data))');
          s.push('var onmessage=function(event){{' + code + '};postMessage(JSON.stringify(result, null, "\t"));}');

          var getIframe = function(postData, rootPath, callerId, onmessage, onerror) {
            var postToIframe = function(iframe, postData) {
              iframe.contentWindow.postMessage(postData, '*');
            }
            var elem = document.getElementById('iframe-worker');
            if (!elem) {
              var iframe = document.createElement('iframe');
              iframe.id = 'iframe-worker';
              iframe.sandbox = 'allow-scripts';
              iframe.style.display = 'none';
              iframe.src = rootPath + '/src/module/common/worker_iframe/worker_iframe.html';
              workerUtil.workerOnMessage[callerId] = onmessage;
              workerUtil.workerOnError[callerId] = onerror;
              window.addEventListener('message', function(event) {
                var data = JSON.parse(event.data);
                if (workerUtil.workerOnMessage[data.callerId]) {
                  if (data.error) {
                    workerUtil.workerOnError[data.callerId](data.error);
                  } else if (data.data) {
                    workerUtil.workerOnMessage[data.callerId](data.data);
                  } else {
                    workerUtil.workerOnError[data.callerId]('Script didn\'t return anything!');
                  }
                  delete workerUtil.workerOnError[data.callerId];
                  delete workerUtil.workerOnMessage[data.callerId];
                }
              });
              document.body.appendChild(iframe);
              iframe.onload = function() {
                postToIframe(iframe, postData);
              }
            } else {
              workerUtil.workerOnMessage[callerId] = onmessage;
              workerUtil.workerOnError[callerId] = onerror;
              postToIframe(elem, postData);
            }
          };
          var callerId = util._$uuid();
          getIframe(JSON.stringify({
            code: s.join('\n'),
            data: JSON.stringify(options.params),
            callerId: callerId
          }), window.location.origin, callerId, options.onmessage, function(event) {
            options.onerror && options.onerror([event]);
          });
        };
      }
      InterfaceTester.prototype.checkJSON = function (value) {
        var isLegal = true;
        try {
          value = JSON.parse(value);
        } catch (err) {
          isLegal = false;
        }
        return {
          result: isLegal,
          value: value
        };
      };
      InterfaceTester.prototype.parseHeader = function (headerStr) {
        var headerArr = headerStr.split('\n');
        var result = {};
        headerArr.forEach(function (item) {
          var index = item.indexOf(':');
          index !== -1 && (result[item.slice(0, index)] = item.slice(index + 1).trim());
        });
        return result;
      };

      /**
       * 根据传入的参数检验错误信息，若正确返回true，否则返回错误列表
       * @param {Array} options.datatypes 数据模型列表
       * @param {Number} options.format 响应结果的数据类型
       * @param {String} options.resExpect 响应结果的期望值，JSON格式字符串
       * @param {String} options.resHeaderExpect 响应头的期望值，JSON格式字符串
       * @param {String} options.resData 响应结果
       * @param {String} options.resHeader 响应头
       * @param {Array} options.resDefine 响应结果的参数定义
       */
      InterfaceTester.prototype.check = function (options) {
        var dataCheckResult = false;
        if (options.resData) {
          var resData = JSON.parse(options.resData);
          dataCheckResult = compareDataWithDefinition(options.format, resData, options.resDefine, options.datatypes, null, options.checkRequiredParam);
        }
        if (dataCheckResult === true) {
          var dataExpect = JSON.parse(options.resExpect);
          dataCheckResult = compareDataExpect(resData, dataExpect, options.resDefine, options.checkRequiredParam);
        }
        if (options.resHeader) {
          var resHeader = JSON.parse(options.resHeader);
          var expectHeader = JSON.parse(options.resHeaderExpect);
          var headerCheckResult = compareHeader(resHeader, expectHeader);
        }
        if (dataCheckResult !== true || headerCheckResult !== true) {
          return (dataCheckResult === true ? [[]] : [dataCheckResult]).concat((headerCheckResult === true ? [[]] : [headerCheckResult]));
        }
        return true;
      }
      InterfaceTester.prototype.getTestQueue = function () {
        return this._testedQueue.concat(this._testingQueue.concat(this._testQueue));
      }
      InterfaceTester.prototype.getAllTestList = function () {
        return this._allTestList;
      }
      InterfaceTester.prototype.checkFileParam = function(interface, datatypes) {
        // 检查接口是否为文件类型或含文件类型参数，后端忽略测此接口
        if (interface.reqFormat === db.MDL_FMT_FILE) {
          return true;
        }
        if (interface.reqFormat === db.MDL_FMT_HASH) {
          return interface.params.inputs.some(function (param) {
            var dt = datatypes.filter(function (item) {
              return item.id === param.type;
            })[0];
            if (dt && dt.format === db.MDL_FMT_FILE) {
              return true;
            }
            return false;
          });
        }
        return false;
      }
      InterfaceTester.prototype.getDependencyTestPath = function(path) {
        var sum = '';
        var getPath = function(arr) {
          var index = -1;
          var layer = '';
          arr.forEach(function(tcs, idx) {
            if (Array.isArray(tcs)) {
              index = idx;
            } else {
              layer && (layer += ',');
              layer += tcs.name;
            }
          });
          if (index >= 0) {
            if (sum) {
              sum = layer + ' -> ' + sum;
            } else {
              sum = layer;
            }
            getPath(arr[index]);
          } else {
            sum = layer + ' -> ' + sum;
          }
        }
        getPath(path);
        return sum;
      };
      InterfaceTester.prototype.startDependencyTests = function(options) {
        if (options == null) {
          return;
        }
        var self = this;
        var env = options.env;
        var data = options.data;
        var emptyFunc = function() {};
        ['onStatusChange', 'onAllTestFinished', 'onError', 'onSingleTestFinished'].forEach(function (item) {
          if (!options[item]) {
            options[item] = emptyFunc;
          }
        });
        var errorType = {
          RUN_RULE: 'RUN_RULE',
          RUN_INTERFACE: 'RUN_INTERFACE'
        }
        var runRule = function(inputs, rule, callback) {
          this.runScript({
            code: rule,
            params: {
              inputs: inputs
            },
            constraints: options.constraints,
            onmessage: function (event) {
              callback && callback(null, event);
            }.bind(this),
            onerror: function (error) {
              callback && callback(error);
            }.bind(this)
          })
        }.bind(this)

        var lastLayerOutput = [];
        var lastLayerOutputPath = []; // 对应与layer保存path
        var result = [];
        var index = 0;
        var checkLayerFinished = function(statusMap) {
          return Object.keys(statusMap).filter(function (key) {
            return statusMap[key] !== self.TEST_STATUS.TEST_SUCCESS && statusMap[key] !== self.TEST_STATUS.TEST_FAILED;
          }).length === 0;
        };
        var doFinishTest = function() {
          options.onAllTestFinished(result);
        };
        var onStatusChange = function(testcase) {
          if (testcase.statusMap[testcase.id] === this.TEST_STATUS.TEST_FAILED) {
            // 通知 结束
            var report = {
              path: testcase.path,
              type: errorType.RUN_INTERFACE,
              status: 0,
              testcase: testcase
            };
            result.push(report);
            testcase.layer.sumTotalCount++;
            options.onSingleTestFinished(report);
            if (index < data.length) {
              var decreaseNum = testcase.layer.data.reduce(function(mul, inf, idx) {
                if (idx === testcase.index) {
                  return mul;
                } else {
                  return mul * inf.testcases.length;
                }
              }, 1);
              testcase.layer.total -= decreaseNum;
              if (testcase.layer.count && testcase.layer.count >= testcase.layer.total && testcase.layer.sumTotalCount >= testcase.layer.sumTotal) {
                index++;
                doNextLayerTest();
              } else if (testcase.layer.total === 0) {
                doFinishTest();
              }
            } else {
              if (testcase.layer.sumTotalCount >= testcase.layer.sumTotal) {
                doFinishTest();
              }
            }
          } else if (testcase.statusMap[testcase.id] === this.TEST_STATUS.TEST_SUCCESS) {
            testcase.receiveStatus[testcase.index] = true;
            testcase.layer.sumTotalCount++;
            testcase.receiveData[testcase.index].push(testcase);
            var status = testcase.receiveStatus.every(function(i) {
              return i;
            });
            if ((index === data.length && testcase.index === data[index - 1].fromRuleIndex) || (index === data.length && index === 1)) {
              // 产生报告
              var report = {
                path: testcase.path,
                status: 1,
                testcase: testcase
              };
              testcase.layer.count++;
              result.push(report);
              options.onSingleTestFinished(report);
              if (testcase.layer.sumTotalCount >= testcase.layer.sumTotal) {
                doFinishTest();
              }
            }
            if (status && index < data.length) {
              var generateInputs = function(idx, stack) {
                if (idx === testcase.receiveData.length) {
                  // runscript 带上路径和回调
                  var path = stack.reduce(function(arr, item) {
                    return arr.concat(item.path);
                  }, []);
                  var inputs = stack.map(function(tc) {
                    return tc.updatedata.data;
                  });
                  var rule = data[index].data;
                  runRule(inputs, rule, function(err, evt) {
                    if (err) {
                      var report = {
                        path: path,
                        status: 0,
                        type: errorType.RUN_RULE,
                        index: index,
                        err: err
                      };
                      result.push(report);
                      options.onSingleTestFinished(report);
                    }
                    if (testcase.layer.count === 0) {
                      lastLayerOutput.length = 0;
                      lastLayerOutputPath.length = 0;
                    }
                    testcase.layer.count++;
                    if (!err) {
                      try {
                        var evtData = JSON.parse(evt.data);
                        lastLayerOutput.push(evtData);
                        lastLayerOutputPath.push(path);
                      } catch(e) {
                        var report = {
                          path: path,
                          status: 0,
                          type: errorType.RUN_RULE,
                          index: index,
                          err: new Error('不是合法的JSON对象！')
                        };
                        result.push(report);
                        options.onSingleTestFinished(report);
                      }
                    }
                    if (testcase.layer.count >= testcase.layer.total) {
                      if (lastLayerOutput.length) {
                        index++;
                        doNextLayerTest();
                      } else {
                        doFinishTest();
                      }
                    }
                  }.bind(this));
                } else {
                  if (idx === testcase.index) {
                    stack.push(testcase);
                    generateInputs(idx + 1, stack);
                    stack.pop();
                  } else {
                    testcase.receiveData[idx].forEach(function(item) {
                      stack.push(item);
                      generateInputs(idx + 1, stack);
                      stack.pop();
                    }, this);
                  }
                }
              }
              generateInputs(0, []);
            }
          }
        }.bind(this)
        options.onStatusChange = onStatusChange;
        var doNextLayerTest = function() {
          if (index < data.length) {
            var layer = data[index];
            index++;
            // 只跑INTERFACE,RULE是异步的，新数据到达就跑
            if (layer.type === 'INTERFACE') {
              var total = layer.data.reduce(function(sum, inf, idx) {
                if (idx === layer.fromRuleIndex) {
                  return sum + lastLayerOutput.length * inf.testcases.length;
                } else {
                  return sum + inf.testcases.length;
                }
              }, 0);
              var mulTotal = layer.data.reduce(function(mul, inf, idx) {
                if (idx === layer.fromRuleIndex) {
                  return mul * lastLayerOutput.length * inf.testcases.length;
                } else {
                  return mul * inf.testcases.length;
                }
              }, 1);
              var count = 0;
              var points = Array(layer.data.length).fill(0);
              var pPoint = 0;
              var statusMap = {};
              var receiveData = [];
              var receiveStatus = [];
              var lastLayerOutputIndex = 0;
              layer.total = mulTotal;
              layer.count = 0;
              layer.sumTotal = total;
              layer.sumTotalCount = 0;
              while (count < total) {
                if (points[pPoint] < layer.data[pPoint].testcases.length) {
                  var item = layer.data[pPoint].testcases[points[pPoint]] || {};
                  var testcase = item.testcase = getTestData(item.testcase, layer.data[pPoint].interface, item.oldTest,
                      pPoint === layer.fromRuleIndex ? lastLayerOutput[lastLayerOutputIndex++] : item.reqData,
                      pPoint === layer.fromRuleIndex ? true : false);
                  testcase.env = env;
                  if (!receiveData[pPoint]) {
                    receiveData[pPoint] = [];
                  }
                  if (receiveStatus[pPoint] === undefined) {
                    receiveStatus[pPoint] = false;
                  }
                  if (pPoint != layer.fromRuleIndex) {
                    // 说明是外部来的初始path为自身
                    testcase.path = [testcase];
                  } else {
                    if (/f/.test(testcase.id)) {
                      testcase.id = testcase.id.replace(/f-(\d+)-(\d+)/, 'f-$1-' + (lastLayerOutputIndex - 1));
                    } else {
                      testcase.id = 'f-' + testcase.id + '-' + (lastLayerOutputIndex - 1);
                    }
                    // 否则是上一次rule转换规则的结果，根据points来取，用另外的对象来存
                    testcase.path = [lastLayerOutputPath[lastLayerOutputIndex - 1], testcase];
                  }
                  statusMap[testcase.id] = this.TEST_STATUS.TEST_NOT_BEGIN;
                  testcase.checkRunCallback = checkLayerFinished;
                  testcase.cb = emptyFunc;
                  testcase.receiveData = receiveData;
                  testcase.receiveStatus = receiveStatus;
                  testcase.layer = layer;
                  testcase.index = pPoint;
                  testcase.statusMap = statusMap;
                  testcase.pid = layer.data[pPoint].interface.projectId;
                  testcase.constraints = options.constraints;
                  testcase.datatypes = options.datatypes;
                  testcase.paramsDefine = layer.data[pPoint].interface.params;
                  testcase.state = db.API_TST_TODO;
                  testcase.onStatusChange = options.onStatusChange;
                  testcase.onError = options.onError;
                  testcase.checkRequiredParam = options.checkRequiredParam;
                  this._testQueue.push(testcase);
                  count++;
                  if (pPoint != layer.fromRuleIndex) {
                    points[pPoint]++;
                  }
                  if (lastLayerOutput.length && lastLayerOutputIndex >= lastLayerOutput.length) {
                    lastLayerOutputIndex = 0;
                    points[pPoint]++;
                  }
                }
                pPoint++;
                if (pPoint >= layer.data.length) {
                  pPoint = 0;
                }
              }
              this.continueTests();
            }
          } else {
            doFinishTest();
          }
        }.bind(this);
        doNextLayerTest(index);
      }
      init(options);
    }

    return {
      InterfaceTester: InterfaceTester
    }
  }

  if (typeof NEJ !== 'undefined') {
    NEJ.define(['./request-extension.js', 'json!3rd/fb-modules/config/db.json', 'pro/common/mockdata/mock_data_worker_util', 'pro/common/util'], Exporter);
  } else if (typeof(module) !== 'undefined') {
    module.exports = Exporter(require('./request-node'), require('../../../lib/fb-modules/config/db.json'));
  } else {
    return Exporter();
  }
})();
