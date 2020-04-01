NEJ.define(['pro/common/util'], function (util, _p) {
  'use strict';
  _p.RequestBuilder = function RequestBuilder() {
    var self = this;

    function init() {
      if (!(self instanceof RequestBuilder)) {
        return new RequestBuilder();
      }
      self._CHECK_STATUS = {
        NOT_CHECK: -1,
        NOT_INSTALLED: 0,
        INSTALLED: 1
      };
      self._checkXhrptStatus = self._CHECK_STATUS.NOT_CHECK;
      return self;
    }

    RequestBuilder.prototype.checkXhrpt = function (callback) {
      if (this._checkXhrptStatus !== this._CHECK_STATUS.NOT_CHECK) {
        return;
      }
      var sendId = util._$uuid();
      document.addEventListener('check-xhrpt-ext-res', function (e) {
        if (this._checkXhrptStatus !== this._CHECK_STATUS.NOT_CHECK) {
          return;
        }
        if (!e.detail || !e.detail.reqData || e.detail.reqData.sendId !== sendId) {
          this._checkXhrptStatus = this._CHECK_STATUS.NOT_INSTALLED;
        } else {
          this._checkXhrptStatus = this._CHECK_STATUS.INSTALLED;
          callback.apply(this);
        }
      }.bind(this), false);
      var event = new CustomEvent('check-xhrpt-ext', {
        detail: {
          sendId: sendId
        }
      });
      document.dispatchEvent(event);
    };
    RequestBuilder.prototype._send = function (options, callback, errorCallback) {
      var sendId = util._$uuid();
      var defaultHeader = {
        'content-type': 'application/json'
      };
      var headers = {};
      Object.keys(options.data.reqHeader || {}).forEach(function (key) {
        headers[key.toLowerCase().trim()] = options.data.reqHeader[key];
      });
      var data = {
        sendId: sendId,
        url: options.url,
        method: options.method,
        headers: Object.assign(defaultHeader, headers)
      };
      data.data = options.data.reqData || {};
      var reqData = data.data;
      Object.keys(reqData).forEach(function (key) {
        var val = reqData[key];
        if (val instanceof File) {
          reqData[key] = {
            blobUrl: URL.createObjectURL(val),
            __isFile__: true,
            filename: val.name
          };
        }
      });

      console.log('发送数据: ', data);
      var event = new CustomEvent('sendto-xhrpt-ext', {detail: data});
      document.addEventListener('sendto-xhrpt-ext-res', function _receive(e) {
        if (!e.detail || !e.detail.reqData || e.detail.reqData.sendId !== sendId) {
          return;
        }
        if (callback && typeof (callback) === 'function') {
          try {
            console.timeEnd('响应时间');
            console.log('响应: ', e);
            var data = {
              reqData: e.detail.reqData,
              resData: e.detail.resData,
              response: {
                statusCode: e.detail.xhr.status,
                statusText: e.detail.xhr.statusText,
                headers: e.detail.xhr.responseHeaders
              }
            };
            callback.call(this, data);
          } catch (ex) {
            console.error(ex.message);
            console.error(ex.stack);
            errorCallback && typeof errorCallback === 'function' && errorCallback.call(this, ex);
          }
        }
        document.removeEventListener('sendto-xhrpt-ext-res', _receive, false);
      }.bind(this), false);
      console.time('响应时间');
      document.dispatchEvent(event);
    };
    RequestBuilder.prototype.sendRequest = function (options, callback, errorCallback) {
      if (this._checkXhrptStatus === this._CHECK_STATUS.NOT_CHECK) {
        this.checkXhrpt(this._send.bind(this, options, callback, errorCallback));
      } else if (this._checkXhrptStatus === this._CHECK_STATUS.NOT_INSTALLED) {
        var msg = 'You have not installed XHR Proxy Tool yet.';
        console.error(msg);
        return {
          success: false,
          msg: msg,
          code: -1
        };
      } else {
        this._send(options, callback, errorCallback);
      }
    };
    return init();
  };
});
