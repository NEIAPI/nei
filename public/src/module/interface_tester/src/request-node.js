const request = require('request');

class RequestBuilder {
  sendRequest(options, callback, errorCallback) {
    var defaultHeader = {
      'content-type': 'application/json'
    };
    var headers = {};
    Object.keys(options.headers || {}).forEach(function (key) {
      headers[key.toLowerCase()] = options.headers[key];
    });
    var opts = {
      url: options.url,
      method: options.method,
      headers: Object.assign(defaultHeader, headers)
    };
    if (options.data.reqData) {
      opts.body = JSON.stringify(options.data.reqData);
    } else {
      opts.body = '';
    }
    request(opts, (err, res, body) => {
      if (err) {
        errorCallback && typeof errorCallback === 'function' && errorCallback.call(this, err);
        return;
      }
      var data = {
        reqData: res.request.body,
        resData: body,
        response: {
          statusCode: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers
        }
      };
      if (callback && typeof callback === 'function') {
        try {
          callback.call(this, data);
        } catch (ex) {
          errorCallback && typeof errorCallback === 'function' && errorCallback.call(this, ex);
        }
      }
    });
  }
}

module.exports = {
  RequestBuilder
};
