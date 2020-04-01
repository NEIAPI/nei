/**
 * mock_data worker 根据规则生成mock数据
 */
'use strict';

var vm = require('vm');
var fs = require('fs');
var mockjs = require('mockjs');

/**
 * 生成constraint函数方便注入
 * @param constraints
 * @returns {Array}
 */
function getConstraintsFunction(constraints) {
  var s = [];
  constraints.forEach(function (item) {
    if (item.type !== 1) { //1为系统类型，这里需要过滤出系统内置类型，只返回用户定义的规则函数
      // 在函数体直接调用系统预置的方法, 在最前面追加两个参数, 值都为 null
      // var body = item.function.replace(/NEI\.(id|str|chinese|email|url|num|bool|var|repeat|loop)\((.*?)\)/g, function ($0, $1, $2) {
      //   return 'NEI.' + $1 + '(param,ds' + ($2 ? ',' + $2 : '') + ')';
      // });
      s.push('var ' + item.name + ' = function(){' + item.function + '};');
    }
  });
  return s;
}

var mockWorker = {
  getWorker: function (constraints) {
    var constraintFuncs = getConstraintsFunction(constraints);
    // result: 占位符, 保存结果
    // NEI: 系统自带辅助函数
    var sandbox = Object.create(null);
    //result为返回数据, Mock 导入Mockjs包
    sandbox.result = null;
    sandbox.Mock = mockjs;
    sandbox = new vm.createContext(sandbox);

    constraintFuncs.forEach(function (constraintFunc) {
      try {
        vm.runInContext(constraintFunc, sandbox, {
          timeout: 1000
        }); // 向沙盒导入约束函数
      } catch (e) {
        // catch 到错误,这里直接退出
        // todo 可以一个一个constraint加入到沙盒中
        // console.error("约束函数有错:");
        // console.error(e.name, e.message);
      }
    });

    var path = require('path');
    var mockPath = path.join(__dirname, 'mockdata/mock_data.js');

    var mockData = fs.readFileSync(mockPath, 'utf-8');

    vm.runInContext(mockData, sandbox, {
      timeout: 1000
    });
    return sandbox;
  },
  getDataTypeMockData: function (constraints, id, ds) {
    var sandbox = this.getWorker(constraints); //获取注入constraint函数的运行沙盒
    sandbox.id = id;
    sandbox.ds = ds;
    const script = `result =  NEI.get(id,ds);`;
    vm.runInContext(script, sandbox, {
      timeout: 1000
    });
    return {json: sandbox.result.json, error: sandbox.result.error};
  },
  getParameterMockData: function (constraints, format, params, ds) {
    var sandbox = this.getWorker(constraints); //获取注入constraint函数的运行沙盒
    sandbox.format = format;
    sandbox.params = params;
    sandbox.ds = ds;
    const script = `result =  NEI.getParams(format,params,ds);`;
    // const script = `result = hehe()`
    try {
      vm.runInNewContext(script, sandbox, {
        timeout: 1000
      });
    } catch (e) {
      return {
        error: [e.message]
      };
    }

    return {json: sandbox.result.json, error: sandbox.result.error};
  },
  getScriptExecResult: function ({constraints, options, itf, scriptName}) {
    const result = {
      options,
      error: null,
      data: null
    };
    // 没有对应的 script, 返回原始 mock 数据
    if (!itf[scriptName]) {
      return result;
    }
    const sandbox = this.getWorker(constraints);
    sandbox.options = options;
    let script = itf[scriptName].replace(/\(/g, function () {
      const next = itf[scriptName][arguments[1] + 1];
      return '(options' + (next == ')' ? '' : ',');
    });
    script = `result = ${script}`;
    try {
      vm.runInNewContext(script, sandbox, {
        timeout: 1000
      });
      if (sandbox.result) {
        if (sandbox.result.hasOwnProperty('data')) {
          if (typeof sandbox.result.data === 'function') {
            result.data = {};
          } else {
            result.data = sandbox.result.data;
          }
        }
        if (sandbox.result.hasOwnProperty('error')) {
          result.error = sandbox.result.error;
        }
      }
    } catch (e) {
      result.error = [e.message];
    }
    return result;
  }
};

module.exports = mockWorker;
