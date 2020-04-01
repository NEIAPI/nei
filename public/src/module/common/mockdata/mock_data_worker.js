/**
 * datatype worker 根据规则生成mock数据
 */

onmessage = function (event) {
  postMessage(JSON.stringify({startTiming: true}));
  var sizeLimit = function (json) {
    var size = JSON.stringify(json).length;
    if (size > 1024 * 50) {
      return '生成的 mock 数据过大, 可以使用<a href="https://github.com/x-orpheus/nei-toolkit" target="_blank">构建工具</a>生成 mock 数据';
    }
    return null;
  };
  var data = JSON.parse(event.data);
  if (data[0] == 0) {
    //获得数据模型mock data
    var id = data[1];
    var ds = data[2];

    var dt = ds.find(function (item) {
      return item.id === id;
    });

    if (dt) {
      var ret = NEI.get(id, ds);
      var check = sizeLimit(ret.json);
      postMessage(JSON.stringify({checkError: check, json: ret.json, error: ret.error, finished: true}));
    }
  } else if (data[0] == 1) {
    //获得参数mock data
    var format = data[1];
    var params = data[2];
    var ds = data[3];

    var ret = NEI.getParams(format, params, ds);
    var check = sizeLimit(ret.json);
    postMessage(JSON.stringify({checkError: check, json: ret.json, error: ret.error, finished: true}));
  } else if (data[0] == 2) {
    //获得文档mock data
    var nodeParams = data[1];
    var ds = data[2];
    nodeParams.forEach(function (nodeParam, index) {
      var type = nodeParam.type;
      if (type == 'datatypes') {
        var id = nodeParam.id;
        var dt = ds.find(function (item) {
          return item.id === id;
        });
        if (dt) {
          var ret = NEI.get(id, ds);
          var check = sizeLimit(ret.json);
          postMessage(JSON.stringify({
            checkError: check,
            json: ret.json,
            error: ret.error,
            index: index,
            finished: index === nodeParams.length - 1
          }));
        }
      } else {
        var format = nodeParam.format;
        var params = nodeParam.params;
        var ret = NEI.getParams(format, params, ds);
        var check = sizeLimit(ret.json);
        postMessage(JSON.stringify({
          checkError: check,
          json: ret.json,
          error: ret.error,
          index: index,
          finished: index === nodeParams.length - 1
        }));
      }
    });
  } else {
    postMessage(JSON.stringify(['类型错误', []]));
  }

};
