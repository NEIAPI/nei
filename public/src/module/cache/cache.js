/*
 * 项目缓存基类
 */
NEJ.define([
  'base/klass',
  'util/cache/abstract',
  'util/ajax/xdr',
  'util/event/event',
  'base/util',
  'base/event',
  'pro/notify/notify',
  'json!3rd/fb-modules/config/db.json'
], function (k, d, j, c, u, v, notify, dbConst, p, pro) {
  p._$$Cache = k._$klass();
  pro = p._$$Cache._$extend(d._$$CacheListAbstract);

  /**
   * 初始化
   */
  pro.__init = function (options) {
    this.__super(options);
    this._dbConst = dbConst;
    // 全局事件, 方便模块间通信
    if (!this.constructor.__eventAdded) {
      // 类可能会被多次实例化, 但事件不能添加多次, 不然在回收事件的时候会失败
      this.constructor.__eventAdded = true;
      c._$$CustomEvent._$allocate({
        element: this.constructor,
        event: [
          'add', 'delete', 'update',
          'listchange', 'itemsadded', 'itemsdeleted', 'versioncreated',
          'error'
        ]
      });
    }
  };

  /**
   * 新增一条数据
   * @param {Object} options - 参数对象
   * @success dispatch event: onitemadd, listchange
   */
  pro.__doAddItem = function (options) {
    options.key = options.key || this.__cacheKey;
    var _sendOptions = {
      data: options.data,
      ext: options.ext,
      method: 'POST',
      onload: function (item) {
        options.onload(item);
        v._$dispatchEvent(
          this.constructor, 'listchange', {
            data: item,
            action: 'add',
            key: options.key,
            ext: options.ext
          }
        );
        // 触发全局的 add 事件
        v._$dispatchEvent(
          this.constructor, 'add', {
            data: item,
            action: 'add',
            key: options.key,
            ext: options.ext
          }
        );
      }.bind(this)
    };
    var url = this.__getUrl(options);
    this.__sendRequest(url, _sendOptions);
  };

  /**
   * 删除一条数据
   * @param {Object} options - 参数对象
   * @success dispatch event: onitemdelete, listchange
   */
  pro.__doDeleteItem = function (options) {
    options.key = options.key || this.__cacheKey;
    var _sendOptions = {
      method: 'DELETE',
      ext: options.ext,
      onload: function (item) {
        options.onload(item);
        // 从缓存中删除这项
        this.__doRemoveItemFromList(options.key, item[this.__key]);
        v._$dispatchEvent(
          this.constructor, 'listchange', {
            data: item,
            action: 'delete',
            ext: options.ext
          }
        );
        // 触发全局的 delete 事件
        v._$dispatchEvent(
          this.constructor, 'delete', {
            data: item,
            action: 'delete',
            key: options.key,
            ext: options.ext
          }
        );
      }.bind(this)
    };
    var url = this.__getUrl({
      key: this.__cacheKey,
      id: options.id
    });
    this.__sendRequest(url, _sendOptions);
  };

  /**
   * 更新一条数据
   * @param {Object} options - 参数对象
   * @success dispatch event: onitemupdate
   */
  pro.__doUpdateItem = function (options) {
    options.key = options.key || this.__cacheKey;
    var _sendOptions = {
      method: 'PATCH',
      data: options.data,
      ext: options.ext,
      actionMsg: options.actionMsg,
      onload: function (item) {
        options.onload(item);
        v._$dispatchEvent(
          this.constructor, 'update', {
            data: item,
            action: 'update',
            options: options,
            ext: options.ext
          }
        );
      }.bind(this)
    };
    var url = this.__getUrl({
      key: this.__cacheKey,
      id: options.id
    });
    this.__sendRequest(url, _sendOptions);
  };

  /**
   * 加载某一项
   * @param {Object} [options] - 参数对象
   * @property {Number} options.id - 要加载资源的id
   * @property {String} options.key - 这个 key 主要用于获取相应的 url
   * @success dispatch event: onloaditem
   */
  pro.__doLoadItem = function (options) {
    options.key = options.key || this.__cacheKey;
    var _sendOptions = {
      onload: options.onload
    };
    var url = this.__getUrl({
      key: this.__cacheKey,
      id: options.id,
      ext: options.ext
    });
    this.__sendRequest(url, _sendOptions);
  };

  /**
   * 加载列表
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.offset] - 列表缓存列表起始位置
   * @property {Number} [options.limit] - 列表缓存列表当前查询条数
   * @property {Number} [options.total] - 是否有总数信息
   * @success dispatch event: onlistload
   */
  pro.__doLoadList = function (options) {
    // 在缓存命中计算时(module:util/cache/cache._$$CacheAbstract#__hasFragment), 需要考虑 offset 和 limit 的信息
    // 将 limit 设置为较大的值后, 在一定程度上保证了可以全部加载列表数据
    options.limit = 100000;
    var url = this.__getUrl(options);
    this.__sendRequest(url, options);
  };

  /**
   * 发送请求参数构造
   * @param {Object} options - 参数对象
   */
  pro.__doAction = function (options) {
    options.key = options.key || this.__cacheKey;
    var sendOptions = {
      data: options.data,
      ext: options.ext,
      action: options.action,
      method: options.method,
      headers: options.headers,
      actionMsg: options.actionMsg,
      onload: function (data) {
        var event = {
          key: options.key,
          data: data,
          action: options.action,
          ext: options.ext
        };
        var list;
        // 更新单条数据或者更新列表
        if (options.updateItem) {
          list = this._$getListInCache(options.key);
          // 更新单条数据
          var oldItem = list.find(function (item) {
            return item.id === data.id;
          });
          u._$merge(oldItem, data);
        } else if (options.updateList) {
          // 更新列表, 比如导入列表或者清空
          list = data;
          this._$setListInCache(options.key, data);
        } else if (options.updateListOrder) {
          // 更新列表, 比如后端排序等操作, 此时data是id数组列表
          list = this._$getListInCache(options.key);
          data.forEach(function (item) {
            var index = null;
            list.find(function (itm, idx) {
              if (itm.id == item.id) {
                index = idx;
                return true;
              }
            });
            list.push(list.splice(index, 1)[0]);
          });
        }
        if (u._$isString(options.onload)) {
          this._$dispatchEvent(options.onload, event);
        } else if (u._$isFunction(options.onload)) {
          options.onload(event);
        }
        // 触发 listchange 事件
        if (options.triggerListchange) {
          v._$dispatchEvent(
            this.constructor, 'listchange', {
              data: list,
              action: event.action,
              ext: options.ext
            }
          );
        }
      }.bind(this)
    };
    var url = this.__getUrl({
      key: this.__cacheKey,
      action: options.action,
      id: options.id
    });
    this.__sendRequest(url, sendOptions);
  };

  /**
   * 发送请求
   * @param {String} url
   * @param {Object} [options]
   */
  pro.__sendRequest = function (url, options) {
    options.headers = u._$merge({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      options.headers
    );
    options = u._$merge({
        type: 'json',
        timeout: 1000000,
        method: 'GET'
      },
      options
    );
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
    var onload = options.onload;
    var onerror = function (data) {
      notify.show(data.msg || data.message, 'error', 5000);
      var evt = {
        options: options,
        type: 'error',
        data: data
      };
      this._$dispatchEvent('onerror', evt);
      v._$dispatchEvent(
        this.constructor, 'error', evt
      );
    }.bind(this);
    options.onload = function (data) {
      var result = null;
      if (!data) {
        return onerror(data);
      }
      var code = data.code ? data.code.toString() : '';
      if (code === '401') {
        window.location.href = '/login';
      } else if (code === '404') {
        window.location.href = '/404';
      } else if (code.charAt(0) === '2') {
        // 分页列表
        if (data.hasOwnProperty('total')) {
          result = {
            result: data.result,
            total: data.total
          };
        } else {
          result = data.result;
        }
        // 是否有格式化数据的方法
        if (this.__doFormatItems) {
          this.__doFormatItems(result, options);
        }
        // 统一提示信息
        if (options.actionMsg || options.actionMsg == null) {
          switch (options.method) {
            case 'POST':
              var tip = options.actionMsg || '创建成功';
              if (code === '210') {
                // 210 code 表示创建成功，但有其他问题，比如相同请求方式和路径的接口已存在
                tip += '，' + data.msg;
              }
              notify.show(tip, 'success', 3000);
              break;
            case 'DELETE':
              notify.show(options.actionMsg || '删除成功', 'success', 3000);
              break;
            case 'PUT':
            case 'PATCH':
              notify.show(options.actionMsg || '更新成功', 'success', 3000);
              break;
            default:
              break;
          }
        }
        onload(result);
      } else {
        onerror(data);
      }
    }.bind(this);
    j._$request(url, options);
  };

  /**
   * 批量添加
   * @param {Object} options - 参数对象
   * @property {Number} options.items- 要添加的对象列表
   * @success dispatch event: onitemsadd
   */
  pro._$addItems = function (options) {
    this.__doAction({
      headers: options.headers || {},
      data: options.data,
      ext: options.ext,
      key: options.key,
      method: 'POST',
      triggerListchange: true,
      onload: function (event) {
        var addedList = event.data;
        if (!Array.isArray(addedList)) {
          addedList = [addedList];
        }
        var list = this._$getListInCache(options.key);
        addedList.forEach(function (item) {
          item = this.__doSaveItemToCache(item, options.key);
          item && list.push(item);
        }, this);
        // 有些缓存还需要处理额外的逻辑, 比如参数缓存, 添加项后还需要更新相应缓存(比如数组模型缓存)中的数据
        if (options.onload) {
          options.onload(event);
        }
        this._$dispatchEvent('onitemsadd', event);
        // 批量添加后需要触发的事件
        v._$dispatchEvent(
          this.constructor, 'itemsadded', {
            data: addedList,
            action: options.action,
            ext: options.ext
          }
        );
      }.bind(this)
    });
  };

  /**
   * 批量删除
   * @param {Object} options - 参数对象
   * @property {Number} options.ids- 要删除的 id 列表
   * @success dispatch event: onitemsdelete, listchange
   */
  pro._$deleteItems = function (options) {
    this.__doAction({
      data: options.data,
      ext: options.ext,
      key: options.key,
      method: 'DELETE',
      triggerListchange: true,
      onload: function (event) {
        var deletedList = event.data;
        // 从缓存中删除列表
        this.__doRemoveItemFromList(options.key, deletedList);
        // 有些缓存还需要处理额外的逻辑, 比如参数缓存, 删除项后还需要更新相应缓存(比如数组模型缓存)中的数据
        if (options.onload) {
          options.onload(event);
        }
        this._$dispatchEvent('onitemsdelete', event);
        // 批量删除后需要触发的事件
        v._$dispatchEvent(
          this.constructor, 'itemsdeleted', {
            data: deletedList,
            action: options.action,
            ext: options.ext
          }
        );
      }.bind(this)
    });
  };

  /**
   * 根据 key 值获取相应列表中的 tag 列表
   * @param {String} listKey - 列表的key
   * @return {Array} - tag 列表
   */
  pro._$getTagList = function (listKey) {
    var list = this._$getListInCache(listKey);
    var pinYinlist = {};
    list.map(function (item) {
      if (!item.tag) return;
      var tags = item.tag.split(',');
      var tagPinyins = item.tagPinyin.split(',');
      tags.forEach(function (tag, idx) {
        // 会有空字符串 NEI-277
        if (tag) {
          pinYinlist[tag] = tagPinyins[idx];
        }
      });
    });
    var tags = Object.keys(pinYinlist).map(function (tag) {
      return {
        id: tag,
        name: tag,
        value: tag,
        /*stripedlist 头部标签会用到这个属性*/
        namePinyin: pinYinlist[tag]
      };
    });
    tags.sort(function (a, b) {
      return a.name.localeCompare(b.name, 'zh-CN');
    });
    return tags;
  };

  /**
   * 根据 key 值获取相应列表中的状态(status)列表
   * @param {String} listKey - 列表的key
   * @param {Boolean} addDefault - 是否要加上内置的3个状态: 未开始、进行中、已完成
   * @return {Array} - status 列表
   */
  pro._$getStatusList = function (listKey, addDefault) {
    var list = this._$getListInCache(listKey);
    var statusList = {};
    list.map(function (item) {
      if (!item.status || item.status == '审核中' || item.status == '审核失败') return;
      statusList[item.status] = item.statusPinyin;
    });
    if (addDefault) {
      statusList['未开始'] = 'wei\'kai\'shi';
      statusList['进行中'] = 'jin\'xing\'zhong';
      statusList['已完成'] = 'yi\'wan\'cheng';
      statusList['已废弃'] = 'yi\'fei\'qi';
    }
    var status = Object.keys(statusList).map(function (st) {
      return {
        id: st,
        name: st,
        value: st,
        /*stripedlist 头部标签会用到这个属性*/
        namePinyin: statusList[st]
      };
    });
    status.sort(function (a, b) {
      return a.name.localeCompare(b.name, 'zh-CN');
    });
    return status;
  };

  /**
   * 根据 key 值获取相应列表中的"业务分组"列表
   * @param {String} listKey - 列表的key
   * @return {Array} - 业务分组列表
   */
  pro._$getGroupList = function (listKey) {
    var list = this._$getListInCache(listKey);
    var xlist = {};
    var groups = [];
    list.map(function (item) {
      if (!xlist[item.group.id]) {
        xlist[item.group.id] = 1;
        groups.push({
          name: item.group.name,
          namePinyin: item.group.namePinyin,
          value: item.group.id,
          title: item.group.description ? item.group.name + '(' + item.group.description + ')' : item.name
        });
      }
    });
    groups.sort(function (groupA, groupB) {
      return groupA.name.localeCompare(groupB.name, 'zh-CN');
    });
    return groups;
  };

  /**
   * 根据 key 值获取相应列表中的"接口类名"列表
   * @param {String} listKey - 列表的key
   * @return {Array} - 业务分组列表
   */
  pro._$getClassNameListByListKey = function (listKey) {
    var list = this._$getListInCache(listKey);
    var xlist = {};
    var groups = [];
    list.map(function (item) {
      if (!xlist[item.className]) {
        xlist[item.className] = 1;
        groups.push({
          name: item.className,
          value: item.className,
          title: item.className
        });
      }
    });
    groups.sort(function (groupA, groupB) {
      return groupA.name.localeCompare(groupB.name, 'zh-CN');
    });
    return groups;
  };

  /**
   * 根据 key 值获取相应列表中的"负责人"列表
   * @param {String} listKey - 列表的key
   * @return {Array} - 负责人列表
   */
  pro._$getRespoList = function (listKey) {
    return this.__getUserList('respo', listKey);
  };

  /**
   * 根据 key 值获取相应列表中的"创建者"列表
   * @param {String} listKey - 列表的key
   * @return {Array} - 创建者列表
   */
  pro._$getCreatorList = function (listKey) {
    return this.__getUserList('creator', listKey);
  };

  /**
   * 根据类型, 获取用户列表
   * @param {String} userType - 用户类型
   * @param {String} listKey - 列表的key
   * @return {Array} - 用户列表
   */
  pro.__getUserList = function (userType, listKey) {
    var list = this._$getListInCache(listKey);
    var xlist = {};
    var users = [];
    list.map(function (item) {
      // 需要排除已经被删除的项
      if (!item.__dirty__ && !xlist[item[userType].id]) {
        xlist[item[userType].id] = 1;
        users.push({
          name: item[userType].realname || item[userType].username || '',
          namePinyin: item[userType].realnamePinyin,
          value: item[userType].id,
          title: item[userType].realname ? (item[userType].realname + '(' + item[userType].username + ')') : item[userType].username
        });
      }
    });
    users.sort(function (itemA, itemB) {
      return itemA.name.localeCompare(itemB.name, 'zh-CN');
    });
    return users;
  };

  /**
   * 根据key值, 从缓存中获取数据
   * @property {String} cacheKey - 缓存 key
   * @return {Object} - 缓存数据
   */
  pro._$getDataInCache = function (cacheKey) {
    return this.__getDataInCache(cacheKey);
  };

  /**
   * 获取列表 key, 这里主要是统一规则
   * @param {Number} id - 资源(项目、项目组或者规范)的id
   * @param {String} [type] - 资源类型(项目、项目组、规范), 可选
   * @return {String} - 列表 key
   */
  pro._$getListKey = function (id, type) {
    return this.__cacheKey + '-' + id + (type ? ('-' + type) : '');
  };

  /**
   * 从服务器获取某个资源的引用列表
   * @param {String} refKey - 引用的key
   * @param {Object} caches - 缓存集对象
   * @param {Object} options - 参数对象
   * @success dispatch event: onreflistload
   */
  pro.__getRefList = function (refKey, caches, options) {
    options.onload = function (evt) {
      var result = evt.data;
      if (result.datatypes && caches.dc) {
        caches.dc._$setListInCache(refKey, result.datatypes);
        caches.dc._$recycle();
      }
      if (result.interfaces && caches.ic) {
        caches.ic._$setListInCache(refKey, result.interfaces);
        caches.ic._$recycle();
      }
      if (result.pages && caches.pc) {
        caches.pc._$setListInCache(refKey, result.pages);
        caches.pc._$recycle();
      }
      if (result.templates && caches.tc) {
        caches.tc._$setListInCache(refKey, result.templates);
        caches.tc._$recycle();
      }
      if (result.constraints && caches.cc) {
        caches.cc._$setListInCache(refKey, result.constraints);
        caches.cc._$recycle();
      }
      if (result.projects && caches.proc) {
        caches.proc._$setListInCache(refKey, result.projects);
        caches.proc._$recycle();
      }
      if (result.progroups && caches.progc) {
        caches.progc._$setListInCache(refKey, result.progroups);
        caches.progc._$recycle();
      }
      if (result.clients && caches.clic) {
        caches.clic._$setListInCache(refKey, result.clients);
        caches.clic._$recycle();
      }
      this._$dispatchEvent('onreflistload', evt);
    }.bind(this);
    this.__doAction(options);
  };
  /**
   * 获取上传文件到 NOS 时所需要的 token
   * @param {Object} [options] - 参数对象
   * @property {Number} n - 要获取的token数量, 后端默认返回一个
   * @success dispatch event: ontokensload
   */
  pro._$getTokens = function (options) {
    var key = options.key;
    var callback = this._$dispatchEvent._$bind(
      this, 'ontokensload', {
        key: key,
        ext: options.ext
      }
    );
    var url = '/api/specdocs/?token';
    this.__sendRequest(url, {
      data: {
        n: options.n || 1
      },
      onload: function (_data) {
        // 缓存数据
        this.__setDataInCache(key, _data);
        callback();
      }._$bind(this)
    });
  };
  /**
   * 根据id列表获取资源列表
   * @param {Array} ids - id列表
   * @return {Array} 资源列表
   */
  pro._$getResListByIds = function (ids) {
    if (!ids instanceof Array) {
      ids = [ids];
    }
    var xlist = [];
    ids.forEach(function (id) {
      var item = this._$getItemInCache(id);
      item && xlist.push(item);
    }.bind(this));
    return xlist;
  };
  /**
   * 判断列表中是否有共享数据
   * @param {Array} list - 资源列表
   * @return {Object} 共享资源（没有的话返回undefined）
   */
  pro.__hasSharedRes = function (list) {
    return list.find(function (item) {
      return item.__isShare;
    });
  };

  /**
   * 资源关注
   * @param {Object} options - 参数对象
   * @property {string} options.rtype - 资源类型，interfacesHTTP 接口，constraints约束函数，templates模板，pages页面，datatypes数据模型
   * @property {number} [options.id] - 资源id
   * @property {number} [options.watch] - 是否关注，1关注，0取消关注
   * @success dispatch event: onwatch
   */

  pro._$watchOrCancleWatch = function (options) {
    var _rtypes = {
      'interfaces': 'HTTP 接口',
      'constraints': '约束函数',
      'templates': '模板',
      'pages': '页面',
      'datatypes': '数据模型',
      'words': '参数字典'
    };
    if (_rtypes.hasOwnProperty(options.rtype)) {
      this.__doAction({
        data: {
          v: options.watch
        },
        onload: function (event) {
          //更新前端缓存
          var _cacheData = this._$getItemInCache(options.id);
          _cacheData['watchList'] = event.data.watchList;
          _cacheData['isWatched'] = event.data.isWatched;
          options.onload(event);
        }._$bind(this),
        method: 'PUT',
        id: options.id,
        action: 'watch'
      });
    }
  };

  /**
   * 资源关注
   * @param {Object} options - 参数对象
   * @property {string} [options.ids] - 资源id数组
   * @property {number} [options.watch] - 是否关注，1关注，0取消关注
   * @success dispatch event: onwatch
   */

  pro._$patchWatch = function (options) {
    this.__doAction({
      data: {
        v: options.watch,
        ids: options.ids
      },
      onload: function (event) {
        notify.show('批量关注成功', 'success', 3000);
        options.onload(event);
      }._$bind(this),
      method: 'POST',
      action: 'watch'
    });

  };


  /**
   * 发送消息
   * @param {Object} options - 资源
   * @property {number} [options.id] - 资源id
   * @property {string} [options.msg] - 消息内容
   * @success dispatch event: onwatch
   */
  pro._$sendMessage = function (options) {
    this.__doAction({
      data: {
        msg: options.msg
      },
      actionMsg: '发送成功',
      onload: options.onload,
      method: 'POST',
      id: options.id,
      action: 'send2watch'
    });
  };
});
