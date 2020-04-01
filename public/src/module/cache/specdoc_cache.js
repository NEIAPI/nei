/*
 * 规范文档结点缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './spec_cache.js',
  'json!3rd/fb-modules/config/db.json'
], function (_k, _u, _v, _c, _d, _specCache, db, _p, _pro) {
  _p._$$CacheSpecDoc = _k._$klass();
  _pro = _p._$$CacheSpecDoc._$extend(_d._$$Cache);
  _p._$cacheKey = 'specdocs';
  _p._$cacheKeyToken = 'specdocs-token';

  /**
   * 初始化
   */
  _pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
  };
  /**
   * 根据 key 值获取相应的列表
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.offset] - 列表缓存列表起始位置
   * @property {Number} [options.limit] - 列表缓存列表当前查询条数
   * @property {Number} [options.total] - 是否有总数信息
   * @success dispatch event: onlistload
   */
  _pro.__doLoadList = function (options) {
    // 在缓存命中计算时(module:util/cache/cache._$$CacheAbstract#__hasFragment), 需要考虑 offset 和 limit 的信息
    // 将 limit 设置为较大的值后, 在一定程度上保证了可以全部加载列表数据
    if (options.key.indexOf(this.__cacheKey) > -1) {
      options.limit = 100000;
    }
    this.__super(options);
  };
  /**
   * 根据id查找节点
   * @param {Array} 节点数组
   * @param {Number} 节点id
   * @returns {Object} 所查找的节点
   */
  _pro.__findItem = function (arr, id) {
    for (var i = 0, l = arr.length; i < l; i++) {
      var item = arr[i];
      if (item.id === id) {
        return item;
      } else if (item.children) {
        var result = this.__findItem(item.children, id);
        if (result) return result;
      }
    }
  };
  /**
   * 根据id查找节点在数组中的下标
   * @param {Array} 节点数组
   * @param {Number} 节点id
   * @returns {Number} 节点下标
   */
  _pro.__findItemIndex = function (arr, id) {
    var index = undefined;
    arr.forEach(function (item, i) {
      if (item.id === id) {
        index = i;
        return;
      }
    });
    return index;
  };
  /**
   * 新增一个规范节点，(根据parent将节点添加到指定位置)
   * @param options
   * @private
   */
  _pro.__doAddItem = function (options) {
    options.key = options.key || this.__cacheKey;
    var _sendOptions = {
      data: options.data,
      ext: options.ext,
      action: 'add',
      method: 'POST',
      onload: function (item) {
        var data = this._$getListInCache(options.key);
        if (item.type === db.SPC_NOD_DIR) {
          item.children = [];
        }
        if (item.parent == 0) {
          data.push(item);
        } else {
          var parent = this.__findItem(data, item.parent);
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(item);
        }
        item = _u._$merge({}, item);
        delete item.children;
        this._$dispatchEvent('onitemadd', {
          key: options.key,
          data: item,
          action: 'add',
          ext: options.ext
        });
      }.bind(this)
    };
    var url = this.__getUrl(options);
    this.__sendRequest(url, _sendOptions);
  };
  /**
   * 删除一个规范节点，(根据parent和id查找节点)
   * @param options
   * @private
   */
  _pro.__doDeleteItem = function (options) {
    options.key = options.key || this.__cacheKey;
    var _sendOptions = {
      method: 'DELETE',
      ext: options.ext,
      action: 'delete',
      onload: function (item) {
        var data = this._$getListInCache(options.key);
        var arr, parent;
        if (item.parent == 0) {
          arr = data;
        } else {
          parent = this.__findItem(data, item.parent);
          arr = parent ? parent.children : null; //可能父节点已经被删除
        }
        if (arr) {
          var index = this.__findItemIndex(arr, item.id);
          arr.splice(index, 1);
          if (parent && arr.length === 0) {
            parent.hasChildren = false;
          }

        }
        //触发delete事件
        this._$dispatchEvent('onitemdelete', {
            data: item,
            action: 'delete',
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
   * 批量删除
   * @param {Object} options - 参数对象
   * @property {Number} options.ids- 要删除的 id 列表
   * @success dispatch event: onitemsdelete
   */
  _pro._$deleteItems = function (options) {
    this.__doAction({
      data: {
        ids: options.ids
      },
      ext: options.ext,
      key: options.key,
      method: 'DELETE',
      onload: function (event) {
        var deletedList = event.data;
        var data = this._$getListInCache(options.key);
        //从缓存中删除
        deletedList.forEach(function (item) {
          var arr, parent;
          if (item.parent == 0) {
            arr = data;
          } else {
            parent = this.__findItem(data, item.parent);
            arr = parent ? parent.children : null; //可能父节点已经被删除
          }
          if (arr) {
            var index = this.__findItemIndex(arr, item.id);
            arr.splice(index, 1);
            if (parent && arr.length === 0) {
              parent.hasChildren = false;
            }
          }
        }.bind(this));
        //触发itemsdelete事件
        this._$dispatchEvent('onitemsdelete', {
            data: deletedList,
            key: options.key,
            ext: options.ext
          }
        );
      }.bind(this)
    });
  };
  /**
   * 更新一条数据
   * @param {Object} options - 参数对象
   * @success dispatch event: onitemupdate
   */
  _pro.__doUpdateItem = function (options) {
    options.key = options.key || this.__cacheKey;
    var _sendOptions = {
      method: 'PATCH',
      data: options.data,
      ext: options.ext,
      action: 'update',
      onload: function (item) {
        var data = this._$getListInCache(options.key);
        var old = this.__findItem(data, item.id);
        _u._$merge(old, item);
        this._$dispatchEvent('onitemupdate', {
            data: item,
            action: 'update',
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
   * 从cache中获取一个节点数据
   * @param {Object} 参数对象
   * @private
   */
  _pro._$getItemInCache = function (options) {
    var data = this._$getListInCache(options.key);
    var item = this.__findItem(data, options.id);
    return item;

  };
  /**
   * 获取上传文件到 NOS 时所需要的 token
   * @param {Object} [options] - 参数对象
   * @property {Number} n - 要获取的token数量, 后端默认返回一个
   * @success dispatch event: ontokensload
   */
  _pro._$getTokens = function (options) {
    var key = _p._$cacheKeyToken;
    var callback = this._$dispatchEvent._$bind(
      this, 'ontokensload', {key: key, ext: options.ext}
    );
    var url = this.__getUrl({
      key: key
    });
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
   * 清除目录结构
   * @param {Object} [options] - 参数对象
   * @success dispatch event: onempty
   */
  _pro._$empty = function (options) {
    this.__doAction({
      key: options.key,
      method: 'DELETE',
      action: 'empty',
      data: {
        specId: options.specId
      },
      onload: 'onempty',
      updateList: true
    });
  };

  /**
   * 导入工程模板
   * @param {Object} [options] - 参数对象
   * @property {String} [options.key] - 规范列表的key
   * @property {Number} [options.data.specId] - 结点所属规范的id
   * 以下两个参数二选一
   * @property {Number} [options.data.importSpecId] - 导入的预置规范的id
   * @property {File} [options.data.file] - 要上传的zip包文件
   * @success dispatch event: onimport
   */
  _pro._$import = function (options) {
    this.__doAction({
      key: options.key,
      method: 'POST',
      action: 'import',
      ext: options.ext,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      data: options.data,
      onload: function (event) {
        this._$setListInCache(options.key, event.data.tree);
        var specCache = _specCache._$$CacheSpec._$allocate();
        var spec = specCache._$getItemInCache(options.data.specId);
        _u._$merge(spec, event.data.spec);
        this._$dispatchEvent('onimport', {
          key: options.key,
          data: event.data,
          ext: options.ext
        });
      }.bind(this)

    });
  };
  /**
   * 批量添加文档节点
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.data.specId] - 规范id
   * @property {Number} [options.data.parent] - 添加节点的父节点id
   * @property {Number} [options.data.isUpload] - 是否是上传节点（0,1）
   * @property {Array} [options.data.items] - 要添加的节点数组
   * @success dispatch event: onbatch
   */
  _pro._$batch = function (options) {
    this.__doAction({
      key: options.key,
      method: 'POST',
      action: 'bat',
      data: options.data,
      onload: function (event) {
        var arr = event.data;
        var data = this._$getListInCache(options.key);
        if (options.data.parent === 0) {
          this._$setListInCache(options.key, arr);
        } else {
          var parent = this.__findItem(data, options.data.parent);
          parent.children = arr;
        }
        this._$dispatchEvent('onbatch', {
          key: options.key,
          data: arr,
          action: 'bat',
          ext: options.ext
        });
      }.bind(this)
    });
  };

  /**
   * 移动规范文档节点
   * @param {Object} [options] - 参数对象
   * @success dispatch event: onmove
   */
  _pro._$move = function (options) {
    this.__doAction({
      key: options.key,
      method: 'PUT',
      action: 'move',
      data: options.data,
      onload: function (event) {
        var moves = [];
        var data = this._$getListInCache(options.key);
        var oldArr, oldObj, newArr, oldParents = options.ext.oldParents, newParent = options.ext.newParent;
        if (newParent === 0) {
          newArr = data;
        } else {
          var obj = this.__findItem(data, newParent);
          obj.hasChildren = true;
          newArr = obj.children;
          if (!newArr) {

            newArr = [];
          }
        }
        for (var item in oldParents) { //遍历删除原节点
          item = Number(item);
          if (item === 0) {
            oldArr = data;
          } else {
            oldObj = this.__findItem(data, item);
            oldArr = oldObj.children;
          }
          oldParents[item].forEach(function (childId) {
            var index = this.__findItemIndex(oldArr, childId);
            var oldItem = oldArr.splice(index, 1)[0];
            oldItem = _u._$merge(oldItem, {
              parent: newParent
            });
            if (oldArr.length === 0) {
              oldObj.hasChildren = false;
            }
            newArr.push(oldItem);
            moves.push(oldItem);
          }.bind(this));
        }
        this._$dispatchEvent('onmove', {
          data: moves,
          key: options.key,
          action: 'move',
          ext: options.ext
        });

      }.bind(this)
    });
  };
  /**
   * 获取某节点的孩子节点和孙子节点
   * @param {Object} [options] - 参数对象
   * @property {Number} [options.data.specId] - 规范id
   * @property {Number} [options.data.id] - 当前节点的id
   * @success dispatch event: ongetchildren
   */
  _pro._$getChildren = function (options) {
    this.__doAction({
      key: options.key,
      method: 'GET',
      data: options.data,
      onload: function (event) {
        var children = event.data;
        var data = this._$getListInCache(options.key);
        if (options.ext.parent === 0) {
          this._$setListInCache(options.key, children);
        } else {
          var item = this.__findItem(data, options.ext.parent);
          item.children = children;
        }
        this._$dispatchEvent('ongetchildren', {
          key: options.key,
          data: children,
          action: 'getchildren',
          ext: options.ext
        });
      }.bind(this)
    });
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  _pro.__getUrl = function (options) {
    var url;
    if (options.key === _p._$cacheKeyToken) {
      url = '/api/specdocs/?token';
    } else if (options.key.indexOf(this.__cacheKey) > -1) {
      url = '/api/specdocs/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };
  // /**
  //  * 导出规范结构
  //  * @param {Object} options - 参数对象
  //  * @success dispatch event: onexport
  //  */
  // _pro._$export = function (options) {
  //     this.__doAction({
  //         key: options.key,
  //         method: 'GET',
  //         action: 'export',
  //         data: options.data,
  //         onload: function (evt) {
  //             // this.__setDataInCache(evt.key, evt.data);
  //             // this._$dispatchEvent('onexport', evt);
  //         }.bind(this)
  //     });
  // };

});
