/**
 * mock_data all_in_one worker 根据规则生成mock数据
 */
'use strict';

(function () {

  function mockWorkerFunc(util) { //浏览器端

    var mockWorker = {
      workerOnMessage: {},
      workerOnError: {},
      getWorkerCode: function (rootPath, constraints) {
        var s = [];
        s.push('importScripts(\'' + rootPath + '/src/lib/fb-modules/lib/mockjs/dist/mock.js\');');
        s.push('importScripts(\'' + rootPath + '/src/module/common/mockdata/mock_data_worker.js\');');
        s.push('importScripts(\'' + rootPath + '/src/lib/fb-modules/util/mock_data.js\');');
        constraints.forEach(function (item) {
          if (item.type != 1) {
            var body = (item.function || '').replace(/NEI\.(id|str|chinese|email|url|num|bool|var|repeat|loop)\(([^()]*)\)/g, function ($0, $1, $2) {
              return 'NEI.' + $1 + '(null, null' + ($2 ? ',' + $2 : '') + ')';
            });
            s.push('var ' + item.name + ' = function(){' + body + '};');
          }
        });
        return s.join('\n');
      },
      /**
       *
       * @param {String} postData 要传给iframe worker的字符串
       * @param {String} rootPath 地址，用以请求一些必要的脚本
       * @param {String} callerId 调用者Id，用来标识iframe worker的调用，以便接收到worker时能正确找到对应调用者的回调
       * @param {Function} onmessage 成功调用的回调
       * @param {Function} onerror 失败调用的回调
       */
      getIframe: function (postData, rootPath, callerId, onmessage, onerror) {
        var postToIframe = function (iframe, postData) {
          iframe.contentWindow.postMessage(postData, '*');
        };
        var elem = document.getElementById('iframe-worker');
        if (!elem) {
          var iframe = document.createElement('iframe');
          iframe.id = 'iframe-worker';
          iframe.sandbox = 'allow-scripts';
          iframe.style.display = 'none';
          iframe.src = rootPath + '/src/module/common/worker_iframe/worker_iframe.html';
          mockWorker.workerOnMessage[callerId] = onmessage;
          mockWorker.workerOnError[callerId] = onerror;
          window.addEventListener('message', function (event) {
            if (event.source === iframe.contentWindow) {
              var data = JSON.parse(event.data);
              if (mockWorker.workerOnMessage[data.callerId]) {
                if (data.error) {
                  mockWorker.workerOnError[data.callerId](data.error);
                } else if (data.data) {
                  mockWorker.workerOnMessage[data.callerId](data.data);
                } else {
                  mockWorker.workerOnError[data.callerId]('Script didn\'t return anything!');
                }
                if (data.finished) {
                  delete mockWorker.workerOnError[data.callerId];
                  delete mockWorker.workerOnMessage[data.callerId];
                }
              }
            }
          });
          document.body.appendChild(iframe);
          iframe.onload = function () {
            postToIframe(iframe, postData);
          };
        } else {
          mockWorker.workerOnMessage[callerId] = onmessage;
          mockWorker.workerOnError[callerId] = onerror;
          postToIframe(elem, postData);
        }
      },
      /**
       * 获取某个数据模型的 mock 数据
       * * @param {Array} constraints - 所有规则函数列表
       * @param {Number} id - 数据模型的 id
       * @param {Array} ds - 数据模型的数据源, 包括所有数据模型
       * 其他:
       * 环的检测: 在深度遍历的时候, 如果遍历的路径上第二次出现自定义的数据类型, 则说明存在环
       * 每次深度遍历完再进行广度遍历的时候(即遍历上一个结点的兄弟结点), 需要将上一次(同层级的)深度遍历时增加的结点去除
       * 这里使用一个小技巧, 把数组的长度更改为上一次(同层级的)深度遍历时的值就可以
       *
       * 处理逻辑：
       * 直接开启worker: 生成随机数据 -> 根据规则函数生成数据模型的mock数据 -> 合并
       */
      getDataTypeMockData: function (rootPath, constraints, id, ds, callback, errorback) {
        var callerId = util._$uuid();
        var scriptData = mockWorker.getWorkerCode(rootPath, constraints);
        var p = JSON.stringify([0, id, ds]);
        mockWorker.getIframe(JSON.stringify({
          code: scriptData,
          data: p,
          callerId: callerId
        }), rootPath, callerId, function (data) {
          try {
            var data = JSON.parse(data);
            if (data.error.length) {
              errorback(data.error);
            }
            callback(data);
          } catch (err) {
            errorback && errorback([err]);
          }
        }, function (event) {
          errorback([event]);
        });
      },
      getParameterMockData: function (rootPath, constraints, format, params, ds, callback, errorback) {
        var callerId = util._$uuid();
        var scriptData = mockWorker.getWorkerCode(rootPath, constraints);
        var p = JSON.stringify([1, format, params, ds]);
        mockWorker.getIframe(JSON.stringify({
          code: scriptData,
          data: p,
          callerId: callerId
        }), rootPath, callerId, function (data) {
          try {
            var data = JSON.parse(data);
            if (data.error.length) {
              errorback(data.error);
            }
            callback(data);
          } catch (err) {
            errorback && errorback([err]);
          }
        }, function (event) {
          errorback([event]);
        });
      },
      getDocMockData: function (rootPath, constraints, nodeParams, ds, callback, errorback) {
        var callerId = util._$uuid();
        var scriptData = mockWorker.getWorkerCode(rootPath, constraints);
        var p = JSON.stringify([2, nodeParams, ds]);
        mockWorker.getIframe(JSON.stringify({
          code: scriptData,
          data: p,
          callerId: callerId
        }), rootPath, callerId, function (data) {
          try {
            var data = JSON.parse(data);
            if (data.error.length) {
              errorback && errorback(data.error);
            }
            callback && callback(data);
          } catch (err) {
            errorback && errorback([err]);
          }
        }, function (event) {
          errorback && errorback([event]);
        });
      }
    };
    return mockWorker;
  }

  if (typeof NEJ !== 'undefined') {
    NEJ.define(['pro/common/util'], mockWorkerFunc);
  }
})();
