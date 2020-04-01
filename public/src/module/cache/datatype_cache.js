/*
 * 数据模型缓存对象
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/event',
  'util/event/event',
  './cache.js',
  './interface_cache.js',
  './page_cache.js',
  './template_cache.js',
  './pg_cache.js',
  './pro_cache.js',
  './group_cache.js'
], function (_k, _u, _v, _c, _d, interfaceCache, pageCache, templateCache, pgCache, proCache, groupCache, _p, pro) {
  _p._$$CacheDatatype = _k._$klass();
  pro = _p._$$CacheDatatype._$extend(_d._$$Cache);
  _p._$cacheKey = 'datatype';
  _p._$cacheKeyRef = 'datatype-ref-';

  /**
   * 初始化
   */
  pro.__reset = function (options) {
    this.__super(options);
    this.__cacheKey = _p._$cacheKey;
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
    var onload = options.onload;
    options.onload = function (result) {
      this.__setShareTagOnItems(result);
      result = this._filterAnon(result);
      onload(result);
    }.bind(this);
    this.__super(options);
  };

  pro._filterAnon = function (items) {
    return items.filter(function (item) {
      this._setAnon(item);
      // 过滤掉"未知类型"
      return item.id >= 9999;
    }, this);
  };

  /**
   * 如果是匿名类型, 列表中不需要显示, 这里加个自定义属性
   * @param {Object} item - 模型对象
   */
  pro._setAnon = function (item) {
    if (item.type === this._dbConst.MDL_TYP_HIDDEN && item.id > 10003) {
      item.__isAnon = true;
    }
  };

  /**
   * 新建
   * @param {Object} options - 参数对象
   * @property {Number} options.projectId - 所在项目的id
   * @property {String} options.name - 名称
   * @property {String} options.format - 数据模型的类型
   * @property {String} options.type - 数据模型形式
   * @property {String} [options.tag=''] - 标签
   * @property {String} [options.description=''] - 描述信息
   * @property {String} [options.groupId=''] - 所在业务分组id
   * @success dispatch event: onitemadd
   */
  pro.__doAddItem = function (options) {
    options.data.name = options.data.name.trim();
    if (!_u._$isString(options.data.name)) {
      // console.error('请输入有效的名称');
      return;
    }
    options.onload = function (data) {
      var items = [];
      if (data.hasOwnProperty('hiddenDts')) { //这里数据模型可能包含匿名数据模型
        items = data.hiddenDts.splice(0);
        delete data.hiddenDts;
      }
      items.push(data);
      // 如果是在公共资源库添加了数据模型, 则需要更新所有项目组中的所有项目的数据模型列表
      var _proCache = proCache._$$CachePro._$allocate();
      items.forEach(function (item) {
        this._setAnon(item);
        if (_proCache._$isPublic(item.projectId)) {
          // 是公共资源库
          item.__isShare = true; // 设置共享标记
          var allProjects = _proCache.__getHash();
          Object.keys(allProjects).forEach(function (projectId) {
            var project = allProjects[projectId];
            if (project.progroupId === item.progroupId && project.id !== item.projectId) {
              // 在当前公共资源库所属项目组的项目列表中, 并且不是当前项目
              this.__doUnshiftToList(this._$getListKey(project.id), item);
            }
          }, this);
        }
        this.__doUnshiftToList(options.key, item);
      }.bind(this));
      _proCache._$recycle();
      this._$dispatchEvent('onitemadd', _u._$merge(options, {data: data}));
    }.bind(this);
    this.__super(options);
  };

  /**
   * 更新
   * @param {Object} options - 参数对象
   * @property {Number} options.id - 资源 id
   * 支持更新的字段有:
   * @property {String} [options.name] - 名称
   * @property {String} [options.tag] - 标签
   * @property {String} [options.description] - 描述
   * @property {Array} [options.groupId] - 业务分组id
   * @success dispatch event: onitemupdate
   */
  pro.__doUpdateItem = function (options) {
    var onload = options.onload;
    options.onload = function (result) {
      // 如果更新分组id，则需要将数据中的group更新
      if (options.data.hasOwnProperty('groupId')) {
        var _groupCache = groupCache._$$CacheGroup._$allocate();
        result.group = _groupCache._$getItemInCache(result.groupId);
        _groupCache._$recycle();
      }
      // 如果更新的是数据模型名称, 则更新完成后, 还需要更新引用了它的数据模型、HTTP 接口、页面模板
      // 后端返回的是所有需要更新的数据模型列表, 包括当前被修改的数据模型
      if (options.data.hasOwnProperty('name')) {
        this._updateResources(result, options);
      }
      onload(result);
    }.bind(this);
    this.__super(options);
  };

  /**
   * 根据分组id返回该分组下的数据模型列表
   * @param {Number} groupId - 分组id
   * @return {Array} 数据模型列表
   */
  pro._$getListByGroupId = function (groupId) {
    var list = this._$getListInCache(this.__cacheKey);
    return list.filter(function (item) {
      return item.group.id === groupId;
    });
  };

  /**
   * 根据参数, 获取请求 url
   * @param {Object} options - 参数对象
   * @return {String} request url
   */
  pro.__getUrl = function (options) {
    var url;
    if (options.key.indexOf(_p._$cacheKey) > -1) {
      url = '/api/datatypes/' + (options.id || '');
      if (options.action) {
        url += '?' + options.action;
      }
    }
    return url;
  };

  /**
   * 设置 __isShare 属性
   * @param  {Array} items - 列表项
   */
  pro.__setShareTagOnItems = function (items) {
    var _proCache = proCache._$$CachePro._$allocate();
    items.forEach(function (item) {
      // 资源共享与否, 就看它所属的项目是否为公共资源库
      // 设置 __isShare 字段
      item.__isShare = item.id > 10003 && _proCache._$isPublic(item.projectId);
    });
    _proCache._$recycle();
  };

  /**
   * 验证项缓存中的项是否有效，子类可重写
   *
   * @protected
   * @method module:util/cache/list._$$CacheList#__doCheckItemValidity
   * @param  {Object}  _item - 数据项
   * @param  {String}  _lkey - 列表标识
   * @return {Boolean}        是否有效
   */
  pro.__doCheckItemValidity = function (_item, _lkey) {
    // 如果没有 params 属性, 则在调用 $getItem 方法时需要重新获取数据
    return _item.params;
  };

  /**
   * 批量删除
   * @param {Object} options - 参数对象
   * @property {Number} options.ids- 要删除的 id 列表
   * @success dispatch event: onitemsdelete, listchange
   */
  pro._$deleteItems = function (options) {
    options.onload = function (event) {
      // 如果删除的是公共资源库中的数据模型, 则其他项目(同个项目组)中对应的数据模型也删除
      var _proCache = proCache._$$CachePro._$allocate();
      var deletedList = event.data;
      deletedList.forEach(function (item) {
        if (_proCache._$isPublic(item.projectId)) {
          // 是公共资源库
          var allProjects = _proCache.__getHash();
          Object.keys(allProjects).forEach(function (projectId) {
            var project = allProjects[projectId];
            if (project.progroupId === item.progroupId && project.id !== item.projectId) {
              // 在当前公共资源库所属项目组的项目列表中, 并且不是当前项目
              this.__doRemoveItemFromList(this._$getListKey(project.id), item);
            }
          }, this);
        }
        var allDatatypes = this.__getHash();
        Object.keys(allDatatypes).forEach(function (did) {
          var datatype = allDatatypes[did];
          if (datatype.versions && datatype.versions.length) {
            datatype.versions = datatype.versions.filter(function (it) {
              return it.id !== item.id;
            });
          }
        });
      }, this);
      _proCache._$recycle();
    }.bind(this);
    this.__super(options);
  };

  /**
   * 共享
   * @param {Object} options - 参数对象
   * @property {id} options.id - 数据模型id
   * @success dispatch event: onshare
   */
  pro._$share = function (options) {
    this.__doAction({
      data: {
        isShare: 1
      },
      id: options.id,
      method: 'PUT',
      action: 'share',
      onload: function (evt) {
        this._$setSharedItems(evt.data, options.ext.cacheKey);
        this._$dispatchEvent('onshare', evt);
      }.bind(this)
    });
  };

  /**
   * 设置共享属性
   * @param {Array} items - 被共享的数据模型列表
   * @param {String} cacheKey - 当前项目中的存储数据模型列表的缓存key
   */
  pro._$setSharedItems = function (items, cacheKey) {
    var list = this._$getListInCache(cacheKey);
    if (!list.length) {
      // 该方法在共享HTTP 接口的时候也会调用, 有可能还未加载过数据模型列表
      return;
    }
    var _pgCache = pgCache._$$CacheProGroup._$allocate();
    // 分享时, 被它引用的数据模型也会被分享, 此时后端返回的是一个数组, 数组里面的每一项都是被分享的
    // 更新所有被分享的数据模型的 __isShare 字段
    items.forEach(function (dt) {
      var sharedItem = list.find(function (item) {
        return item.id === dt.id;
      });
      // 设置分享字段
      sharedItem.__isShare = true;
      // 分享的资源, 需要添加到该项目组下的所有项目的数据模型中
      var progroup = _pgCache._$getItemInCache(sharedItem.progroupId);
      progroup.projects.forEach(function (project) {
        var listKey = this._$getListKey(project.id);
        var dtList = this._$getListInCache(listKey);
        var found = dtList.find(function (it) {
          return it.id == sharedItem.id;
        });
        if (!found) {
          // __doUnshiftToList 方法并没有判断是否已经存在
          this.__doUnshiftToList(listKey, sharedItem);
        }
      }.bind(this));
    }, this);

    _pgCache._$recycle();
  };

  /**
   * 根据 java 数据模型, 返回 nei 中真实的数据模型
   * @param {String} name - 类型名
   * @param {Number} pid - 项目id
   * @return {Object} - 数据模型
   *
   * 说明:
   * java 基本类型 vs   包装类型
   *      String  --   java.lang.String
   *      byte    --   java.lang.Byte
   *      char    --   java.lang.Character
   *      short   --   java.lang.Short
   *      int     --   java.lang.Integer
   *      long    --   java.lang.Long
   *      float   --   java.lang.Float
   *      double  --   java.lang.Double
   *      boolean --   java.lang.Boolean
   */
  pro._$getByJavaDataType = function (name, pid) {
    var map = [{
      reg: /^(String|byte|Byte|char|Character|)$/,
      name: 'String'
    }, {
      reg: /^(short|Short|int|Integer|long|Long|float|Float|double|Double|BigDecimal)$/,
      name: 'Number'
    }, {
      reg: /^(boolean|Boolean)$/,
      name: 'Boolean'
    }];
    var opt = map.find(function (item) { //系统类型，替换name
      return item.reg.test(name);
    });
    opt && (name = opt.name);
    var dataTypes = this._$getListInCache(this._$getListKey(pid));

    var foundDataType = dataTypes.find(function (dataType) { //根据名称找到对应的数据模型
      return dataType.name === name;
    });
    if (!foundDataType) {
      //如果没有匹配，默认返回VARIABLE类型
      foundDataType = dataTypes.find(function (dataType) {
        return dataType.id === 10000;
      });
    }
    return foundDataType;
  };

  /**
   * 根据数据模型的id, 返回它的默认值
   * @param {Number} id - 数据模型的id
   * @return {String} - 默认值
   *
   * 说明: 字符、数值、布尔类型可能有默认值
   */
  pro._$getDefaultValue = function (id) {
    var defaultValue = '';
    var dataType = this._$getItemInCache(id);
    if (!dataType) {
      return defaultValue;
    }
    switch (dataType.format) {
      case this._dbConst.MDL_FMT_STRING:
      case this._dbConst.MDL_FMT_NUMBER:
      case this._dbConst.MDL_FMT_BOOLEAN:
        defaultValue = dataType.params[0] && dataType.params[0].defaultValue;
        break;
      default:
        break;
    }
    return defaultValue;
  };

  /**
   * 从服务器获取引用某个数据模型的资源列表
   * @param {Object} options - 参数
   * @property {Number} options.id - 数据模型的id
   * @success dispatch event: onreflistload
   */
  pro._$getRefList = function (options) {
    var refKey = _p._$cacheKeyRef + options.id;
    this.__getRefList(
      refKey,
      {
        dc: _p._$$CacheDatatype._$allocate(),
        ic: interfaceCache._$$CacheInterface._$allocate(),
        pc: pageCache._$$CachePage._$allocate(),
        tc: templateCache._$$CacheTemplate._$allocate()
      },
      options
    );
  };

  /**
   * 更新数据模型的名称, 更新引用了该数据模型的 HTTP 接口、页面模板、页面
   * @param {Object} dataType - 数据模型
   * @param {Object} options - 操作参数
   */
  pro._updateResources = function (dataType, options) {
    // 从某个参数数组中查找是否引用了当前被更新的数据模型 或者以数组的形式引用数据模型
    var updateParams = function (params) {
      params && params.forEach(function (param) {
        if (param.datatypeId === dataType.id) {
          param.datatypeName = dataType.name;
        } else if (param.type === dataType.id) { //数组类型
          param.typeName = dataType.name;
        }
      });
    }.bind(this);
    // 数据模型、页面模板、页面
    var updateByCache = function (cache, recycle) {
      var list = cache.__getHash();
      Object.keys(list).forEach(function (key) {
        var item = list[key];
        if (!item.hasOwnProperty('params')) {
          return;
        }
        updateParams(item.params);
      });
      if (recycle) {
        cache._$recycle();
      }
    };
    // HTTP 接口
    var updateByItfCache = function (cache, recycle) {
      var list = cache.__getHash();
      Object.keys(list).forEach(function (key) {
        var item = list[key];
        if (!item.hasOwnProperty('params')) {
          return;
        }
        updateParams(item.params.inputs);
        updateParams(item.params.outputs);
        updateParams(item.params.reqHeaders);
        updateParams(item.params.resHeaders);
      });
      if (recycle) {
        cache._$recycle();
      }
    };
    // 更新数据模型列表
    updateByCache(this);
    // 查找HTTP 接口, 如果HTTP 接口引用了这个数据模型, 则把它的 params 属性删除, 这样下次访问接口详情时会重新获取
    var _interCache = interfaceCache._$$CacheInterface._$allocate();
    // 因为有可能更改的是公共资源, 所以简便起见, 更新缓存中的所有数据, 而不是只更新当前项目的数据
    updateByItfCache(_interCache, true);
    // 查找页面模板, 如果页面模板引用了这个数据模型, 则把它的 params 属性删除, 这样下次访问接口详情时会重新获取
    var _tplCache = templateCache._$$CacheTemplate._$allocate();
    updateByCache(_tplCache, true);
    // 查找页面, 如果页面的请求参数引用了这个数据模型, 则把它的 params 属性删除, 这样下次访问页面详情时会重新获取
    var _pageCache = pageCache._$$CachePage._$allocate();
    updateByCache(_pageCache, true);
  };
  /**
   * 批量新建数据模型
   * @param {Object} 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.projectId 项目id
   * @property {Number} options.data.groupId 分组id
   * @property {Array} options.data.items 导入的数据类型数据
   * @success dispatch event: onbatch
   */
  pro._$batch = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'bat',
      actionMsg: options.actionMsg,
      onload: function (evt) {
        var key = options.key;
        evt.data.forEach(function (item) {
          var obj = this._$getItemInCache(item.id);
          if (obj) {
            this.__doRemoveItemFromList(key, item.id);
          }
        }.bind(this));
        evt.data.forEach(this._setAnon, this);
        this.__doUnshiftToList(key, evt.data);
        this._$dispatchEvent('onbatch', evt);
      }.bind(this)
    });
  };
  /**
   * 复制数据模型
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.copys 复制的数据模型数据
   * @property {String} options.data.tags 标签
   */
  pro._$clone = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'clone',
      actionMsg: options.actionMsg,
      onload: function () {
        //清空复制到的项目的datatype cache
        this._$clearListInCache(options.key);
        this._$dispatchEvent('onclone', {pid: options.data.pid, ext: options.ext});
      }.bind(this)
    });
  };
  /**
   * 批量增删标签
   * @param options 配置参数
   * @property {Array} options.data.ids 批量资源id
   * @property {Array} options.data.tags 标签
   */
  pro._$tag = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'tag',
      actionMsg: options.actionMsg,
      onload: function (result) {
        options.data.ids.forEach(function (id) {
          var originalRes;
          if (options.ext && options.ext.id) {
            originalRes = this._$getItemInCache(options.ext.id);
          }
          var res = this._$getItemInCache(id);
          if (!res && options.ext.id) {
            res = originalRes.versions.find(function (ver) {
              return ver.id === id;
            });
          }
          var target = result.data.filter(function (res) {
            return res.id === id;
          })[0];
          if (res) {
            res.tag = target.tag;
            res.tagPinyin = target.tagPinyin;
          }
          if (originalRes) {
            var version = originalRes.versions.find(function (ver) {
              return ver.id === id;
            });
            if (version) {
              version.tag = target.tag;
              version.tagPinyin = target.tagPinyin;
            }
          }
        }, this);
        this._$dispatchEvent('ontag');
      }.bind(this)
    });
  };
  /**
   * 移动数据模型
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Number} options.data.pid 项目id
   * @property {Number} options.data.gid 分组id
   * @property {Array} options.data.moves 移动的数据模型数据
   * @property {String} options.data.tags 标签
   */
  pro._$move = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'move',
      actionMsg: options.actionMsg,
      onload: function () {
        var _proCache = proCache._$$CachePro._$allocate();
        if (options.ext.isPublic || _proCache._$isPublic(options.ext.originPid)) { // 对于移动到公共资源库，需要将该项目下的所有项目的cache清空
          var group = _proCache._$getProgroupByProId(options.ext.originPid);
          group.projects.forEach(function (item) {
            this._$clearListInCache(this._$getListKey(item.id));
          }.bind(this));
        } else {
          // 从当前项目和目标项目清除cache数据
          this._$clearListInCache(this._$getListKey(options.ext.originPid));
          this._$clearListInCache(options.key);
        }
        this._$dispatchEvent('onmove', {pid: options.data.pid, ext: options.ext});
      }.bind(this)
    });
  };
  /**
   * 批量设置分组
   * @param options 配置参数
   * @property {String} options.key cache所需的key
   * @property {Array} options.data.ids 批量资源id
   * @property {Number} options.data.groupId 分组id
   */
  pro._$setGroup = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'bisgroup',
      actionMsg: options.actionMsg,
      onload: function () {
        //修改所选数据模型的分组
        var _groupCache = groupCache._$$CacheGroup._$allocate();
        var groupId = options.data.groupId, group = _groupCache._$getItemInCache(groupId);
        var dtHash = this.__getHash();
        options.data.ids.forEach(function (id) {
          Object.keys(dtHash).forEach(function (did) {
            var datatype = dtHash[did];
            if (datatype.id === id) {
              datatype.groupId = groupId;
              datatype.group = group;
            }
            (datatype.versions || []).forEach(function (subversion) {
              if (subversion.id === id) {
                subversion.groupId = groupId;
                subversion.group = group;
              }
            });
          });
        }.bind(this));
        this._$dispatchEvent('onsetgroup');
        _groupCache._$recycle();
      }.bind(this)
    });
  };

  /**
   * 根据 json 获取相应的数据模型
   * @param {Object} json - json 数据
   * @param {Number} pid - 项目id
   * @return {Object|Datatype} - 返回类型
   */
  pro._$getTypeByJson = function (json, pid) {
    var dbConst = this._dbConst;
    var dataTypes = this._$getListInCache(this._$getListKey(pid));
    var typesMap = {
      string: dbConst.MDL_SYS_STRING,
      boolean: dbConst.MDL_SYS_BOOLEAN,
      number: dbConst.MDL_SYS_NUMBER
    };
    var getType = function (json, skipAnonymous) {
      var foundType = null;
      if (json === null || json === undefined) {
        foundType = typesMap.string;
      } else if (Array.isArray(json)) {
        dataTypes.forEach(function (dt) {
          // 查找所有数组类型，并根据 skipAnonymous 的值是否需要排除匿名类型
          if (
            !foundType
            && (skipAnonymous ? dt.name : true)
            && dt.format === dbConst.MDL_FMT_ARRAY
            && dt.params.length > 0
          ) {
            // 假设数组的所有元素类型都是一样的，检查数组的第一个元素即可
            if (dt.params[0].type === getType(json[0], false)) {
              foundType = dt.params[0].type;
            }
          }
        });
      } else {
        var jsonType = typeof json;
        if (jsonType === 'object') {
          // 严格检查对象的每个属性
          dataTypes.forEach(function (dt) {
            // 查找所有哈希类型，并根据 skipAnonymous 的值是否需要排除匿名类型
            if (!foundType && (skipAnonymous ? dt.name : true) && dt.format === dbConst.MDL_FMT_HASH) {
              if (dt.params.length === Object.keys(json).length) {
                // 所有字段的名称和类型都完全匹配
                var allMatch = true;
                dt.params.forEach(function (param) {
                  if (!json.hasOwnProperty(param.name) || param.type !== getType(json[param.name], false)) {
                    allMatch = false;
                  }
                });
                if (allMatch) {
                  // 找到
                  foundType = dt.id;
                }
              }
            }
          });
        } else {
          foundType = typesMap[jsonType];
        }
      }
      return foundType;
    };
    return getType(json, true);
  };

  /**
   * 获取数据模型的参数，按真实顺序排列，只找第一层参数
   * @param {Number} pid - 数据模型所属项目的id
   * @param {Number} id - 数据模型id
   * @return {Array|Param|Object} - 返回参数数组
   */
  pro._$getParamsByPosition = function (pid, id) {
    var datatypes = this._$getListInCache(this._$getListKey(pid));
    var datatype = datatypes.find(function (dt) {
      return dt.id === id;
    });
    // 因为数据模型本身也可能导入了其他数据模型
    var result = datatype.params.map(function (param) {
      // 参数是导入数据模型的字段
      if (param.datatypeId) {
        var importedDatatype = datatypes.find(function (dt) {
          return dt.id === param.datatypeId;
        });
        var importedDatatypeParams = importedDatatype.params.concat();
        importedDatatypeParams.sort(function (a, b) {
          return a.position - b.position;
        });
        var importedDatatypeParamIndex = 0;
        importedDatatypeParams.find(function (p, idx) {
          if (param.id === p.id) {
            importedDatatypeParamIndex = idx;
          }
        });
        // todo: 这种算position的方法其实并不完全正确，
        // 但考虑到相邻参数的 position 相差值不会很小，用索引值来微调也是可行的
        return {
          position: importedDatatypeParamIndex + param.position,
          name: param.name,
          id: param.id
        };
      } else {
        return {
          position: param.position,
          name: param.name,
          id: param.id
        };
      }
    });
    return result;
  };

  pro._$createVersion = function (options) {
    this.__doAction({
      data: options.data,
      method: 'POST',
      action: 'newversion',
      actionMsg: options.actionMsg,
      onload: function (result) {
        var dt = result.data;
        var hash = this.__getHash();
        Object.keys(hash).forEach(function (did) {
          var datatype = hash[did];
          if ((datatype.version &&
            datatype.version.origin &&
            datatype.version.origin === dt.version.origin)
            || datatype.id === dt.version.origin) {
            datatype.versions = datatype.versions || [];
            datatype.versions.unshift(dt);
          }

          if (datatype.id === dt.version.origin && !datatype.version) {
            datatype.version = {
              parent: parseInt(did),
              origin: parseInt(did),
              name: '初始版本'
            };
          }
        });

        // add the item to list
        this.__doUnshiftToList(this._$getListKey(dt.projectId), dt);

        this._$dispatchEvent('onversioncreated', {
          dt: dt
        });

        _v._$dispatchEvent(
          this.constructor, 'versioncreated', {
            dt: dt
          }
        );
      }.bind(this)
    });
  };

  /**
   * 发送变更消息
   */
  pro._$sendChangeMessage = function (options) {
    this.__doAction({
      data: {
        content: options.content
      },
      actionMsg: '发送成功',
      onload: options.onload,
      method: 'POST',
      id: options.id,
      action: 'sendChangeMsgToWatch'
    });
  };

});
