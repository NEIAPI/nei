/**
 * 项目文档cache
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  'util/cache/abstract',
  'util/ajax/xdr',
  'pro/common/util',
  'pro/notify/notify'
], function (_k, _u, _v, _ev, _c, _x, util, notify, _p, pro) {
  _p._$$CacheDoc = _k._$klass();
  pro = _p._$$CacheDoc._$extend(_c._$$CacheListAbstract);
  _p._$cacheKey = 'doc';
  _p._$store = {};

  pro.__init = function (options) {
    this.__super(options);
    //自定义事件
    _ev._$$CustomEvent._$allocate({
      element: window,
      event: [
        'customDocChanged'
      ]
    });
  };

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
    // _p._$store = {};
    //各类数据键值
    this.__types = {
      'pages': 'pages',
      'templates': 'templates',
      'contraints': 'constraints',
      'datatypes': 'datatypes',
      'interfaces': 'interfaces',
      'rpcs': 'rpcs',
      'groups': 'groups',
      'project': 'project',
      'customDocInfo': 'customDocInfo'
    };
  };


  /**
   * 发送请求
   * @param {String} url
   * @param {Object} [options]
   * @property {method} [options.method] -提交方式
   * @property {Object} [options.data] - 提交到后端的数据
   * @property {success} [options.success] - 成功的回调
   * @property {error} [options.data] - 失败的回调
   */
  pro.__sendRequest = function (options) {
    options.headers = _u._$merge(
      {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      options.headers
    );
    options = _u._$merge(
      {
        type: 'json',
        timeout: 30000,
        method: 'GET'
      },
      options
    );
    var url = options.url;
    delete options.url;
    if (options.headers['Content-Type'] === 'multipart/form-data') {
      var fd = new FormData();
      Object.keys(options.data).forEach(function (key) {
        fd.append(key, options.data[key]);
      });
      options.data = fd;
    } else if (/^(post|put|patch)$/i.test(options.method)) {
      options.data = JSON.stringify(options.data);
    } else if (options.data && /^(get|head|delete)$/i.test(options.method)) {
      Object.keys(options.data).forEach(function (key) {
        if (url.indexOf('?') === -1) {
          url += '?';
        } else {
          url += '&';
        }
        url += key + '=' + options.data[key];
      });
      delete options.data;
    }

    return new Promise(function (resolve, reject) {
      options.onload = function (data) {
        var result = null;
        if (!data) {
          return onerror(data);
        }
        var code = data.code;
        if (code === 401) {
          window.location.href = '/login';
        } else if (code === 403) {
          window.location.href = '/dashboard';
        } else if (code === 404) {
          window.location.href = '/404';
        }
        if (code >= 200 && code < 300) {
          if (!/^get$/i.test(options.method)) {
            notify.show(data.msg, 'success');
          }
          resolve({data: data.result, code: data.code, msg: data.msg});
        } else {
          if (!/^(get)$/i.test(options.method)) {
            notify.show(data.msg, 'error');
          }
          reject({data: data, code: data.code, msg: data.msg});
        }
      };
      _x._$request(url, options);
    });

  };

  /**
   * @method _$getDocInfo(proId) 获取项目文档信息，包括自定义文档
   * @public
   * @param {int}  proId  - 项目id
   * @return {promise}
   */
  pro._$getDocInfo = function (proId) {
    return Promise.all([this.__getDocInfoExcludeCustom(proId), this.__getDocInfoIncludeCustom(proId)]).then(function (res) {
      res[0]['data']['customDocInfo'] = res[1]['data'];
      _p._$store = res[0]['data'];
      return res[0]['data'];
    });
  };

  /**
   * @method __getDocInfoExcludeCustom(proId) 获取项目文档信息，不包括自定义文档
   * @private
   * @param {int}  proId  - 项目id
   * @return {promise}
   */
  pro.__getDocInfoExcludeCustom = function (proId) {
    var url = '/api/projectdoc/' + proId;
    return this.__sendRequest({
      url: url
    });
  };

  /**
   * @method __getDocInfoIncludeCustom(proId) 获取用户自定义文档信息
   * @private
   * @param {int}  proId  - 项目id
   * @return {promise}
   */
  pro.__getDocInfoIncludeCustom = function (proId) {
    var url = '/api/document/';
    return this.__sendRequest({
      url: url,
      data: {
        pid: proId
      }
    });
  };


  pro._$getCustomDocInfo = function (proId) {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store[this.__types.customDocInfo]);
  };

  pro.__checkStoreEmpty = function () {
    for (var key in _p._$store) {
      return false;
    }
    ;
    throw new Error('store is empty');
  };

  /**
   * @method _$getMenuData() 获取菜单数据
   * @public
   * @return {array}
   */
  pro._$getMenuData = function () {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store);
  };

  pro._$getInterfaceData = function () {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store[this.__types.interfaces]);
  };

  pro._$getRpcData = function () {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store[this.__types.rpcs]);
  };

  pro._$getDatatypeData = function () {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store[this.__types.datatypes]);
  };

  pro._$getConstraintData = function () {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store[this.__types.contraints]);
  };

  pro._$getTemplateData = function () {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store[this.__types.templates]);
  };

  pro._$getPageData = function () {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store[this.__types.pages]);
  };

  pro._$getProjectInfo = function () {
    this.__checkStoreEmpty();
    return util._$clone(_p._$store[this.__types.project]);
  };

  pro._$getInterfaceListByProId = function (proid) {
    return this.__sendRequest({
      url: '/api/interfaces/',
      data: {pid: proid}
    });
  };

  /**
   * @method __addCustomDoc(options) 新增自定义文档
   * @private
   * @param {object}  options
   * @param {string} options.name -文档标题
   * @param {string} options.content -文档内容
   * @param {int} options.projectId -项目id
   * @return {promise}
   */
  pro.__addCustomDoc = function (options) {
    var that = this;
    return this.__sendRequest({
      url: '/api/document',
      method: 'POST',
      data: {
        name: options.name,
        content: options.content,
        projectId: options.projectId
      }
    }).then(function (res) {
      //对缓存进行处理
      var customDocInfo = _p._$store[that.__types.customDocInfo];
      var newDocInfo = {
        id: res.data.id,
        name: options.name,
        content: options.content
      };
      customDocInfo.push(newDocInfo);
      _v._$dispatchEvent(window, 'customDocChanged', {data: customDocInfo, action: 'add'});
      return res;
    });
  };

  /**
   * @method __updateCustomDoc(options) 编辑自定义文档
   * @private
   * @param {object} options
   * @param {int}    options.id                -文档id
   * @param {string} options.name    -文档标题
   * @param {string} options.content -文档内容
   * @param {int} options.projectId -项目id
   * @return {promise}
   */

  pro.__updateCustomDoc = function (options) {
    var that = this;
    return this.__sendRequest({
      url: '/api/document/' + options.id,
      method: 'PATCH',
      data: {
        name: options.name,
        content: options.content,
        projectId: options.projectId
      }
    }).then(function (res) {

      var customDocInfo = _p._$store[that.__types.customDocInfo];
      var newDocInfo = {
        id: res.data.id,
        name: res.data.name,
        content: res.data.content
      };
      console.log(newDocInfo);

      for (var i = 0; i < customDocInfo.length; i++) {
        if (customDocInfo[i]['id'] == newDocInfo.id) {
          customDocInfo.splice(i, 1, newDocInfo);
          break;
        }
      }
      _v._$dispatchEvent(window, 'customDocChanged', {data: customDocInfo, action: 'update'});
      return res;
    });
  };

  /**
   * @method _$saveCustomDoc(options) 编辑自定义文档
   * @public
   * @param {object} options
   * @param {int}    options.id      -文档id
   * @param {string} options.name    -文档标题
   * @param {string} options.content -文档内容
   * @param {int} options.projectId -项目id
   * @return {promise}
   */

  pro._$saveCustomDoc = function (options) {
    if (options.id != 0) {
      //编辑
      return this.__updateCustomDoc(options);
    } else {
      //新增
      return this.__addCustomDoc(options);
    }
  };

  /**
   * @method _$delCustomDoc(ids) 编辑自定义文档
   * @public
   * @param {array|string} ids  -文档id
   * @return {promise}
   */

  pro._$delCustomDoc = function (ids) {
    var that = this;
    //封装ids为数组
    if (Object.prototype.toString.call(ids) != '[object Array]') {
      ids = [ids];
    }
    return this.__sendRequest({
      url: '/api/document',
      method: 'DELETE',
      data: {
        ids: ids
      }
    }).then(function (res) {

      var customDocInfo = _p._$store[that.__types.customDocInfo];
      var currentDocIndex = 0;
      for (var i = 0; i < customDocInfo.length; i++) {
        for (var j = 0; j < ids.length; j++) {
          if (ids[j] == customDocInfo[i]['id']) {
            currentDocIndex = i;
            break;
          }
        }
      }
      customDocInfo.splice(currentDocIndex, 1);
      _v._$dispatchEvent(window, 'customDocChanged', {data: customDocInfo, action: 'del'});
    });
  };


  /**
   * @method _$getCustomDocById(options) 根据文档id获取自定义文档信息
   * @public
   * @param {object} options
   * @param {int}    options.id                -文档id
   * @param {int} options.projectId -项目id
   * @return {promise}
   */
  pro._$getCustomDocById = function (options) {
    return this.__sendRequest({
      url: '/api/document/' + options.id,
      data: {
        projectId: options.projectId
      }
    });
  };


});
