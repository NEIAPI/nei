/* 规范详情-工程规范
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/select2/select2',
  'pro/modal/modal',
  'pro/notify/notify',
  'pro/cache/user_cache',
  'pro/cache/spec_cache',
  'pro/cache/specdoc_cache',
  'pro/common/regular/regular_base',
  'json!{3rd}/fb-modules/config/db.json',
  'json!{3rd}/fb-modules/config/file_exts.json',
  'text!./catalogtree.html',
  'text!./catalogtree_node.html'
], function (_k, _e, _v, _u, _l, _j, _m, Select2, Modal, Notify, _usrCache, _sCache, _sdCache, Base, db, exts, _html1, _html2, _p, _pro) {
  /**
   * 标签列表模块
   * @class   {wd.m._$$ModuleSpecDetailTemplate}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleSpecDetailTemplate = _k._$klass();
  _pro = _p._$$ModuleSpecDetailTemplate._$extend(_m._$$Module);
  //mime-高亮映射
  var mimeMap = [
    {id: 'text/css', name: 'css', mode: 'ace/mode/css', beautifyType: 'css'},
    {id: 'text/html', name: 'html', mode: 'ace/mode/html', beautifyType: 'html'},
    {id: 'text/x-java-source', name: 'java', mode: 'ace/mode/java', beautifyType: 'js'},
    {id: 'text/javascript', name: 'javascript', mode: 'ace/mode/javascript', beautifyType: 'js'},
    {id: 'text/json', name: 'json', mode: 'ace/mode/javascript', beautifyType: 'js'},
    {id: 'text/x-markdown', name: 'markdown', mode: 'ace/mode/markdown', beautifyType: 'text'},
    {id: 'text/plain', name: 'plain', mode: 'ace/mode/plain_text', beautifyType: 'text'},
    {id: 'text/properties', name: 'properties', mode: 'ace/mode/properties', beautifyType: 'text'},
    {id: 'text/xml', name: 'xml', mode: 'ace/mode/xml', beautifyType: 'html'}
  ];
  //目录标识
  var rootType = [
    {name: '常规目录', id: 'normal'},
    {name: '静态资源根目录', id: 'webRoot'},
    {name: '模板根目录', id: 'viewRoot'},
    {name: '接口MOCK数据根目录', id: 'mockApiRoot'},
    {name: '模板MOCK数据根目录', id: 'mockViewRoot'},
    {name: 'JAR包根目录', id: 'jarRoot'}
  ];
  var dataSource = [
    {name: '常规文件', id: db.SPC_DTS_NONE, key: 'none'},
    {name: '接口列表填充', id: db.SPC_DTS_INTERFACE, key: 'interface'},
    {name: '数据模型列表填充', id: db.SPC_DTS_DATATYPE, key: 'datatype'},
    {name: '模板列表填充', id: db.SPC_DTS_TEMPLATE, key: 'template'},
    {name: '页面视图列表填充', id: db.SPC_DTS_WEBVIEW, key: 'webview'},
    {name: '命令行参数配置文件', id: 'args_config', key: 'args_config'},
    {name: '自定义Handlebars辅助函数', id: db.SPC_DTS_HANDLEBAR, key: 'custom_handlebars'}
  ];
  var handlerTip = '/**\n' + ' * 用户自定义Handlebars辅助函数，该辅助函数的优先级高于nei-toolkit系统定义的辅助函数。\n'
    + ' *\n * 如何定义Handlebars辅助函数请参考:\n'
    + ' * https://github.com/x-orpheus/nei-toolkit/blob/dev/doc/Handlebars%E8%BE%85%E5%8A%A9%E5%87%BD%E6%95%B0%E9%9B%86.md#\n'
    + '**/\n';
  var maxSize = 1024 * 1024;
  var handlers = {}; //事件订阅
  var imageRegex = /^image\/.+$/,
    textRegex = /^(text\/.+)|(application\/json)$/;
  /**
   * 添加事件监听
   * @param {String} 事件类型(多个事件以空格区分)
   * @param {Function} 事件处理
   */
  var listen = function (event, handler) {
    var events = event.split(/\s+/);
    events.forEach(function (item) {
      handlers[item] = handlers[item] || [];
      handlers[item].push(handler);
    });
  };
  /**
   * 事件触发
   * @param {String} 事件类型
   * @param {Object} 事件数据
   */
  var dispatch = function (event, data) {
    if (handlers[event]) {
      handlers[event].forEach(function (handler) {
        handler(data);
      });
    }
  };
  /**
   * 移除事件监听
   * @param {String} 事件类型(多个事件以空格区分)
   * @param {Function} 事件处理
   */
  var removeListen = function (event, handler) {
    var events = event.split(/\s+/);
    events.forEach(function (item) {
      var oldIndex = 0;
      handlers[item].forEach(function (item2, index) {
        if (item2 == handler) {
          oldIndex = index;
          return false;
        }
      });
      handlers[item].splice(oldIndex, 1);
    });
  };
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-detail-template')
    );
    this.treeNode = _e._$getByClassName(this.__body, 'm-sdt-l')[0];
    this.detailNode = _e._$getByClassName(this.__body, 'm-sdt-r')[0];
    this.hiddenNode = _e._$getByClassName(this.__body, 'u-hidden')[0];
    this.CatalogTree = this.__getCatalogTree();
    _l._$parseTemplate('module-spec-detail-dir');
    _l._$parseTemplate('module-spec-detail-file');
    this.isChrome = navigator.userAgent.indexOf('Chrome') != -1;
  };
  /**
   * 显示模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    handlers = {};
    this.sCache = _sCache._$$CacheSpec._$allocate({
      onitemload: function (_r) {
        if (!_r.ext || !_r.ext.quite) {
          this.specId = _r.id;
          this.sdCacheKey = _sdCache._$cacheKey + '-' + this.specId;
          this.sdCache._$getList({
            key: this.sdCacheKey,
            data: {
              specId: this.specId,
              parent: 0
            }
          });
        }
      }.bind(this),
      onitemupdate: function (_r) {
        if (_r.ext.type) {
          switch (_r.ext.type) {
            case 'datasource':
              if (_r.ext.updateSpecDoc) {
                var data = this.sdCache._$getItemInCache({
                  key: this.sdCacheKey,
                  id: this.specDocId
                });
                data.dataSource = db.SPC_DTS_NONE;
              }
              this.dataSourceSelect && this.dataSourceSelect.$select(_r.ext.newValue);
              break;
            case 'dirType':
              this.dirTypeSelect && this.dirTypeSelect.$select(_r.ext.newValue);
              break;
            default:
              break;
          }
        }
      }.bind(this)
    });
    this.sdCache = _sdCache._$$CacheSpecDoc._$allocate({
      onlistload: function () {
        var data = this.sCache._$getItemInCache(this.specId);
        var usr = _usrCache._$$CacheUser._$allocate({})._$getUserInCache();
        this.isTest = data.type == db.CMN_TYP_TEST;
        this.specType = data.type;
        this.isMySpec = true; //是否是用户的规范
        if (!usr || usr.id != data.creatorId) {
          this.isMySpec = false;
        }
        var data2 = this.sdCache._$getListInCache(this.sdCacheKey);
        this.catalogTree && this.catalogTree.destroy();
        data2 = this.__copyArray(data2);//复制数据
        this.__sortByName(data2, true); //对节点进行排序
        var root = { //根节点
          id: 0,
          name: '全部文件',
          type: db.SPC_NOD_DIR,
          selected: true,
          children: data2,
          opened: true,
          hasChildren: data2.length > 0
        };
        this.catalogTree = new this.CatalogTree({
          data: {
            textRegex: textRegex,
            isTest: this.isTest,
            isChrome: this.isChrome,
            isMySpec: this.isMySpec,
            isLock: data.isLock,
            language: data.language,
            source: root,
            specId: this.specId
          }
        }).$inject(this.treeNode)
          .$on('updateDirType', this.__updateDirType.bind(this))
          .$on('updateDataSource', this.__updateDataSource.bind(this));
      }.bind(this),
      onitemadd: function (result) {
        dispatch('updateNode', result);
      }.bind(this),
      onitemdelete: function (result) {
        dispatch('updateNode', result);
        dispatch('clearDetail');
      },
      onitemsdelete: function (result) {
        dispatch('updateNode', result);
        dispatch('clearDetail');
      },
      onitemupdate: function (result) {
        dispatch('updateNode', result);
      },
      onimport: function (result) {
        var data = this.sdCache._$getListInCache(this.sdCacheKey);
        data = this.__copyArray(data);
        this.__sortByName(data, true);
        dispatch('updateSource', data);
        dispatch('clearDetail');
      }.bind(this),
      onempty: function () {
        dispatch('updateSource', []);
        dispatch('clearDetail');
      },
      onerror: function (result) {
        result.options.ext && result.options.ext.callback && result.options.ext.callback();
      }.bind(this),
      onbatch: function (result) {
        dispatch('updateNode', result);
        dispatch('upload');
      },
      ontokensload: this.__tokensLoad.bind(this),
      onmove: function (result) {
        dispatch('move', result);
        dispatch('moveFrom', result);
        dispatch('moveTo', result);
      }
    });
    this.showDetailFunc = this.__showDetail.bind(this);
    this.clearDetailFunc = this.__clearDetail.bind(this);
    listen('showDetail', this.showDetailFunc);
    listen('clearDetail', this.clearDetailFunc);
    this.__doInitDomEvent([
      [this.detailNode, 'change click', function (event) {
        if (event.type == 'change') {//更新内容
          var key = _e._$dataset(event.target, 'key');
          var updateData = {};
          if (key == 'name' && !event.target.value.replace(/\s/g, '')) { //这里判断修改的文件名不能为空
            event.target.value = this.fileName;
          } else {
            updateData[key] = event.target.value;
            this.__updateSpecDoc(updateData, key);
          }
        } else { //格式化
          var node = _v._$getElement(event, 'd:format');
          if (!node)
            return;
          this.__formatCode();
        }
      }._$bind(this)],
      [this.sCache.constructor, 'onlanguageupdate', function (data) {
        if (!this.dirTypeSelect) {
          this.catalogTree.$emit('updateLanguage', {
            language: data.language
          });
          return;
        }
        //语言切换的时候要改变下拉框的数据源
        if (data.language == db.SPC_LNG_JAVA) {
          this.dirTypeSelect.$updateSource(rootType);
          return;
        }
        //非java语言 要把jar包选项去掉
        var source = rootType.slice(0);
        var _item = source.pop();
        if (_item.id == 'jarRoot') {
          this.dirTypeSelect.$updateSource(source);
        }


      }.bind(this)]
    ]);
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param {Object} 配置参数
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    if (_options.param.id) {
      this.sCache._$getItem({
        key: _sCache._$cacheKey,
        id: _options.param.id
      });
    }
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__clearDetail();
    this.catalogTree && this.catalogTree.destroy();
    this.catalogTree = null;
    removeListen('showDetail', this.showDetailFunc);
    removeListen('clearDetail', this.clearDetailFunc);
    this.__doClearDomEvent();
    this.__super();
  };
  _pro.__getDirRootTypeList = function (lang, specType) {
    var _rootType = rootType.slice(0);
    //iOS 和 AOS显示指定的三个目录
    if (specType == db.CMN_TYP_AOS || specType == db.CMN_TYP_IOS) {
      _rootType = _rootType.filter(function (itm) {
        return itm.id == 'normal' || itm.id == 'mockApiRoot' || itm.id == 'mockViewRoot';
      });
      return _rootType;
    }
    //只有java语言才显示jar包
    if (lang == db.SPC_LNG_JAVA) return _rootType;

    _rootType.forEach(function (itm, i) {
      if (itm.id == 'jarRoot') {
        _rootType.splice(i, 1);
      }
    });
    return _rootType;
  };
  /**
   * 显示详情
   * @param {Number} 节点id
   */
  _pro.__showDetail = function (id) {
    this.specDocId = id;
    var data = this.sdCache._$getItemInCache({
      key: this.sdCacheKey,
      id: this.specDocId
    });
    if (data) {
      this.fileName = data.name;
      if (data.type == db.SPC_NOD_DIR) {
        this.__showDirDetail(data);
      } else {
        this.__showFileDetail(data);
      }
    }
  };
  /**
   * 显示文件详情
   * @param {Object} 文件节点数据
   */
  _pro.__showFileDetail = function (data) {
    this.__clearDetail();
    if (imageRegex.test(data.mime)) { //图片
      _j._$render(this.detailNode, 'module-spec-detail-file', {
        node: data,
        isMySpec: this.isMySpec,
        isImage: true
      });
      this.imageNode = _e._$getByClassName(this.detailNode, 'node-content-image')[0];
      _v._$addEvent(this.imageNode, 'click', function () {
        if (_e._$hasClassName(this.imageNode, 'node-content-image2')) {
          _e._$delClassName(this.imageNode, 'node-content-image2');
        } else {
          _e._$addClassName(this.imageNode, 'node-content-image2');
        }
      }.bind(this));
    } else if (textRegex.test(data.mime)) { //可显示文件内容
      _j._$render(this.detailNode, 'module-spec-detail-file', {
        node: data,
        isMySpec: this.isMySpec
      });
      var datasource = this.__getDataSource(data);
      this.dataSourceSelect = new Select2({
        data: {
          initSilent: true,
          preview: true,
          sortList: false,
          editable: this.isMySpec,
          source: dataSource,
          selected: datasource
        }
      }).$inject(_e._$getByClassName(this.detailNode, 'node-file-datatype')[0])
        .$on('change', function (evt) {
          //监听选中事件，更新节点详情
          if (evt.oSelected) {
            this.__updateDataSource(evt.selected);
          }

        }.bind(this));
      var mimeMode = this.findMimeById(data.mime);
      this.mimeSelect = new Select2({
        data: {
          source: mimeMap,
          selected: mimeMode,
          editable: this.isMySpec,
          sortList: false
        }
      }).$inject(_e._$getByClassName(this.detailNode, 'editor-header')[0], 'top')
        .$on('change', function (evt) {
          //下拉框选中，切换语法高亮模式
          var obj = this.findMimeById(evt.selected.id);
          this.editor.getSession().setMode(obj.mode);
          this.__updateSpecDoc({mime: evt.selected.id}, 'mime');
        }.bind(this));
      //设置内容，模式
      this.editor = ace.edit(_e._$getByClassName(this.detailNode, 'editor')[0]);
      this.editor.$blockScrolling = Infinity;
      this.editor.setTheme('ace/theme/eclipse');
      this.editor.setOption('tabSize', 2);
      this.editor.getSession().setMode(mimeMode.mode);
      if (datasource.id === db.SPC_DTS_HANDLEBAR && !data.content) {
        this.fileContent = handlerTip;
        this.__updateSpecDoc({content: handlerTip}, 'content');
      } else {
        this.fileContent = data.content;
      }
      this.editor.setValue(this.fileContent, 1);
      //非创建者不能修改
      if (!this.isMySpec) {
        this.editor.setReadOnly(true);
      }
      //失焦保存
      this.editor.on('blur', function () {
        var newValue = this.editor.getValue();
        if (this.fileContent != newValue) {
          this.fileContent = newValue;
          this.__updateSpecDoc({content: newValue}, 'content');
        }
      }.bind(this));
    } else { //下载链接
      _j._$render(this.detailNode, 'module-spec-detail-file', {
        node: data,
        isMySpec: this.isMySpec,
        isUpload: true
      });
    }
  };
  /**
   * 格式化
   */
  _pro.__formatCode = function () {
    var obj = this.findMimeById(this.mimeSelect.data.selected.id);
    var type = obj.beautifyType;
    var text = this.editor.getValue();
    switch (type) {
      case 'js':
        text = js_beautify(text);
        break;
      case 'html':
        text = html_beautify(text);
        break;
      case 'css':
        text = css_beautify(text);
        break;
      default:
        break;
    }
    this.editor.setValue(text);
  };
  /**
   * 显示目录详情
   * @param {Object} 目录节点数据
   */
  _pro.__showDirDetail = function (data) {
    this.__clearDetail();
    _j._$render(this.detailNode, 'module-spec-detail-dir', {
      node: data,
      isTest: this.isTest,
      isMySpec: this.isMySpec
    });
    var sdata = this.sCache._$getItemInCache(this.specId);
    var _rootType = this.__getDirRootTypeList(sdata.language, this.specType);
    if (!this.isTest) { //只有测试工程没有目录标识属性
      // //只有java语言才显示jar包
      // if(sdata.language == db.SPC_LNG_JAVA) {
      //     _rootType = rootType;
      // } else {
      //     var tempType = rootType.slice(0);
      //     tempType.pop();
      //     _rootType = tempType;
      // }
      this.dirTypeSelect = new Select2({
        data: {
          initSilent: true,
          preview: true,
          sortList: false,
          editable: this.isMySpec,
          source: _rootType,
          selected: this.__getDirType(data.id)
        }
      }).$inject(_e._$getByClassName(this.detailNode, 'node-dir-type')[0])
        .$on('change', function (evt) {
          //监听选中事件，更新节点详情
          if (evt.oSelected) {
            this.__updateDirType(evt.selected, evt.oSelected);
          }
        }.bind(this));
    }
  };
  /**
   * 清空详情显示
   * @return {Void}
   */
  _pro.__clearDetail = function () {
    this.editor && this.editor.destroy();
    this.editor = null;
    this.dataSourceSelect && this.dataSourceSelect.destroy();
    this.dataSourceSelect = null;
    this.mimeSelect && this.mimeSelect.destroy();
    this.mimeSelect = null;
    this.dirTypeSelect && this.dirTypeSelect.destroy();
    this.dirTypeSelect = null;
    this.imageNode && _v._$clearEvent(this.imageNode, 'click');
    this.imageNode = null;
    _e._$clearChildren(this.detailNode);
  };
  /**
   * 根据id查找mime对应的对象
   * @param {String} id
   * @return {Object} mimeMap中对应的对象
   */
  _pro.findMimeById = function (id) {
    var mimeMode = mimeMap.find(function (item) {
      return item.id === id;
    });
    if (!mimeMode) {
      mimeMode = mimeMap[5];
    }
    return mimeMode;
  };
  /**
   * 获取目录类型
   * @params {Number} 目录id
   * @return {Object} 目录类型（用于下拉框选中项）
   */
  _pro.__getDirType = function (specDocId) {
    var data = this.sCache._$getItemInCache(this.specId);
    var dirType = {name: '常规目录', id: 'normal'};
    if (data) {
      switch (specDocId) {
        case data.viewRoot:
          dirType = {name: '模板根目录', id: 'viewRoot'};
          break;
        case data.webRoot:
          dirType = {name: '前端资源根路径', id: 'webRoot'};
          break;
        case data.mockApiRoot:
          dirType = {name: '接口MOCK数据根路径', id: 'mockApiRoot'};
          break;
        case data.mockViewRoot:
          dirType = {name: '模板MOCK数据根路径', id: 'mockViewRoot'};
          break;
        case data.jarRoot:
          dirType = {name: 'JAR包根目录', id: 'jarRoot'};
          break;
        default :
          break;
      }
    }
    return dirType;
  };
  /**
   * 修改节点信息
   * @param {Object} 修改内容
   * @param {String} 修改字段
   */
  _pro.__updateSpecDoc = function (updateData, key) {
    this.sdCache._$updateItem({
      key: this.sdCacheKey,
      id: this.specDocId,
      data: updateData,
      ext: {
        updateKey: key,
        id: this.specDocId
      }
    });
  };
  /**
   * 修改目录类型
   * @param {Object} 修改的值
   * @param {Object} 原始值
   */
  _pro.__updateDirType = function (newValue, oldValue) {
    var updateData = {};
    if (!oldValue) {
      oldValue = this.__getDirType(this.specDocId);
    }
    if (oldValue.id != 'normal') { //原来类型不是normal,将原类型设为0
      updateData[oldValue.id] = 0;
    }
    if (newValue.id != 'normal') { //修改后类型不为normal
      updateData[newValue.id] = this.specDocId;
    }
    this.sCache._$updateItem({
      id: this.specId,
      data: updateData,
      ext: {
        type: 'dirType',
        newValue: newValue
      }
    });
  };
  /**
   * 获取填充文件的数据模型(先判断是否是命令行参数配置文件，如果不是则判断填充的数据模型类别)
   * @param 规范节点数据
   * @return {Object} 数据填充类型
   */
  _pro.__getDataSource = function (data) {
    var specData = this.sCache._$getItemInCache(this.specId);
    if (!data) {
      data = this.sdCache._$getItemInCache({
        key: this.sdCacheKey,
        id: this.specDocId
      });
    }
    var type;
    if (specData.argsConfig === data.id) {
      type = 'args_config';
    } else {
      type = data.dataSource;
    }
    var selected = dataSource.find(function (item) {
      return item.id === type;
    });
    return selected;
  };
  /**
   * 更新填充文件的数据模型
   * @param {Object} 修改的值
   */
  _pro.__updateDataSource = function (newValue, oldValue) {
    if (!oldValue) {
      oldValue = this.__getDataSource();
    }
    if (newValue.id === 'args_config') { //datasource变命令行，spec更新
      this.sCache._$updateItem({
        id: this.specId,
        data: {
          argsConfig: this.specDocId
        },
        ext: {
          updateSpecDoc: true,
          id: this.specId,
          type: 'datasource',
          newValue: newValue
        }
      });
    } else { //其余情况specDoc更新
      var data = {
        dataSource: newValue.id
      };
      if (newValue.id === db.SPC_DTS_HANDLEBAR && !this.fileContent) {
        dataSource.content = this.fileContent = data.content = handlerTip;
        this.editor.setValue(this.fileContent, 1);
      }
      this.sdCache._$updateItem({
        key: this.sdCacheKey,
        id: this.specDocId,
        data: data,
        ext: {
          id: this.specDocId,
          updateKey: 'dataSource',
          callback: function () {
            if (this.dataSourceSelect) {
              this.dataSourceSelect.$select(oldValue);
            }
          }.bind(this)
        }
      });
    }
  };
  /**
   * 根据文件后缀名查找是否是纯文本文件
   * @param {String} 文件后缀名
   * @return {Boolean} 是否是纯文本
   */
  _pro.__isText = function (ext) {
    var isText = !!exts.text.find(function (item) {
      return item == ext;
    });
    return isText;
  };
  /**
   * tokensload后将文件上传后端
   * @param {Object} tokensload返回数据
   * @property {String} key
   * @property {Object} ext
   */
  _pro.__tokensLoad = function (result) {
    var parent = result.ext.parent,
      type = result.ext.type,
      callback = result.ext.callback,
      files = this.uploadFiles;
    var tokens = this.sdCache.__getDataInCache(result.key);
    var formData = new FormData();
    var uploadToNos = function (data, file) { //封装上传操作
      var req = new XMLHttpRequest();
      req.open('POST', window.pageConfig.nosServer);
      req.responseType = 'json';
      req.onloadend = function () {
        this.index++;
        if (req.status >= 200 && req.status < 300) {
          var url = req.response.url;
          var o = {
            type: db.SPC_NOD_FILE,
            name: file.name,
            mime: file.type == '' ? 'application/unknown' : file.type,
            content: url
          };
          if (type === 1) {
            o.filePath = file.webkitRelativePath;
          }
          this.adds.push(o);
        } else {
          Notify.show(file.name + '文件上传失败', 'error', 2000);
        }
        if (this.index === this.fileLength && this.adds.length > 0) {
          this.__uploadToServer(parent, type, callback);
        }
      }.bind(this);
      req.send(data);
    }.bind(this);
    for (var i = 0, file; file = files[i]; i++) {
      formData.append('x-nos-token', tokens[i].token);
      formData.append('Object', tokens[i].key);
      formData.append('file', file);
      uploadToNos(formData, file);
    }
  };
  /**
   * 按文件名称排序(文件夹在前，文件在后)
   * @param {Array} 需要进行排序的数组
   * @param {Boolean} 是否对children进行排序
   *
   */
  _pro.__sortByName = function (array, isChildrenSort) {
    array.sort(function (a, b) {
      if (a.type == b.type) {
        return a.name.localeCompare(b.name, 'zh-CN');
      } else {
        return a.type - b.type;
      }
    });
    if (isChildrenSort) {
      array.forEach(function (item) {
        if (item.children && item.children.length > 0) {
          this.__sortByName(item.children, true);
        }
      }.bind(this));
    }
  };
  /**
   * 上传文件或文件夹，批量添加，向服务器发送数据
   * @param {Number} 父节点id
   * @param {Number} 上传文件(0)或文件夹(1)
   */
  _pro.__uploadToServer = function (parent, type, callback) { //批量添加，向服务器发送数据
    var data = {
      parent: parent,
      specId: this.specId,
      isDir: type === 0 ? db.CMN_BOL_NO : db.CMN_BOL_YES,
      items: this.adds,
      isUpload: db.CMN_BOL_YES
    };
    this.sdCache._$batch({
      data: data,
      key: this.sdCacheKey,
      ext: {
        parent: parent,
        isDir: type,
        callback: callback
      }
    });
  };
  /**
   * 复制数组
   * @param {Array} 原数组
   * @return {Array} 复制数组
   */
  _pro.__copyArray = function (array) {
    var newArray = [];
    array.forEach(function (item) {
      item = _u._$merge({}, item);
      if (item.children) {
        item.children = this.__copyArray(item.children);
      }
      newArray.push(item);
    }.bind(this));
    return newArray;
  };
  /**
   * 获取目录树构造器
   * @returns {Function} 目录树构造器
   */
  _pro.__getCatalogTree = function () {
    var that = this;
    /**
     * 目录树节点
     */
    var Node = Base.extend({
      name: 'Node',
      template: _html2,
      config: function () {
        this.data = _u._$merge({
          drag: false, //正在进行拖拽
          dragenter: false,//dragenter状态
          dirType: db.SPC_NOD_DIR//目录节点type
        }, this.data);
        this.data.left = this.data.level * 20 + 5;
        this.clearSelectFunc = this.clearSelect.bind(this);
        this.renameFunc = this.rename.bind(this);
        this.updateNodeFunc = this.updateNode.bind(this);
        this.dragEndFunc = this.dragEnd.bind(this);
        this.dragBeginFunc = this.dragBegin.bind(this);
        listen('selectSingle', this.clearSelectFunc);
        listen('rename', this.renameFunc);
        listen('updateNode', this.updateNodeFunc);
        listen('dragEnd', this.dragEndFunc);
        listen('dragBegin', this.dragBeginFunc);
        if (this.data.source.type === db.SPC_NOD_DIR) {
          this.getRightNameFunc = this.getRightName.bind(this);
          this.addChildFunc = this.addChild.bind(this);
          this.moveFromFunc = this.moveFrom.bind(this);
          this.moveToFunc = this.moveTo.bind(this);
          listen('addChild', this.addChildFunc);
          listen('moveFrom', this.moveFromFunc);
          listen('moveTo', this.moveToFunc);
        }
        if (this.data.source.selected) {
          this.selectSingle();
        }
      },
      init: function () {
        if (this.data.source.editable) { //需要默认选中的节点，监听inject事件
          this.rename(this.data.source.id);
        }
      },
      destroy: function () { //销毁组件，移除事件监听
        removeListen('selectSingle', this.clearSelectFunc);
        removeListen('rename', this.renameFunc);
        removeListen('updateNode', this.updateNodeFunc);
        removeListen('dragEnd', this.dragEndFunc);
        removeListen('dragBegin', this.dragBeginFunc);
        if (this.data.source.type === db.SPC_NOD_DIR) {
          removeListen('addChild', this.addChildFunc);
          removeListen('moveFrom', this.moveFromFunc);
          removeListen('moveTo', this.moveToFunc);
        }
        this.supr();
      },
      addChild: function (event) { //添加子节点
        if (event.id == this.data.source.id) {
          event.data.name = this.getRightName(event.data.name);
          this.data.source.children.push(event.data);
          this.data.source.opened = true;
          this.data.source.hasChildren = true;
        }
      },
      clearEdit: function () { //取消标记状态，还原节点名称
        this.data.source.editable = false;
        this.$refs.input.value = this.data.source.name;
        this.$update();
      },
      clearSelect: function (data) { //清除选中
        this.data.source.selected = data.id == this.data.source.id;
      },
      close: function () {
        this.data.source.opened = false;
        this.data.source.children = [];
      },
      dragBegin: function () { //开始拖动啦
        this.data.drag = true;
        if (this.data.source.type !== this.data.dirType && !this.data.source.selected) {
          _e._$addClassName(this.$refs.node, 'js-nodrop');
          _e._$addClassName(this.$refs.input, 'js-nodrop');
        }
        this.$update();
      },
      dragEnd: function () { //拖动结束
        this.data.drag = false;
        this.data.dragenter = false;
        if (this.data.source.type !== this.data.dirType) {
          _e._$delClassName(this.$refs.node, 'js-nodrop');
          _e._$delClassName(this.$refs.input, 'js-nodrop');
        }
        this.$update();
      },
      findById: function (id) { //根据子节点id查找
        var child = this.data.source.children.find(function (item) {
          return item.id === id;
        });
        return child;
      },
      findIndexById: function (id) {//根据子节点id返回子节点下标
        for (var i = 0, l = this.data.source.children.length; i < l; i++) {
          if (this.data.source.children[i].id == id) {
            break;
          }
        }
        return i;
      },
      getRightName: function (name) { //解决子节点重名，返回一个合适的名称
        var rightName, index = 1, same, origin = name, regex = new RegExp('^' + name.replace(/(\(|\))/g, '\\$1'));
        var arr = this.data.source.children.filter(function (child) {
          return child.name.search(regex) !== -1 && child.id !== undefined;
        });
        while (!rightName) {
          same = arr.find(function (child) {
            return child.name === name;
          });
          if (!same) {
            rightName = name;
          } else {
            name = origin + '(' + index++ + ')';
          }
        }
        return rightName;
      },
      keypress: function (event) { //回车保存
        if (event.which == 13) {
          this.save();
          return false;
        }
      },
      mouseDown: function (ev) { //鼠标按下
        var event = ev.event;
        event.stopPropagation();
        if (!this.data.source.editable) {
          that.hiddenNode.focus();
          event.preventDefault();
          switch (event.button) {
            case 0: //鼠标左键按下
              if (this.data.source.id === 0) { //root节点,没有多选和拖拽操作，一律单选操作
                this.selectSingle();
              } else {
                if (event.ctrlKey || event.shiftKey) { //按下ctrl或shift，多选
                  //选中或取消选中
                  this.data.source.selected ? dispatch('cancelsSelectMulti', this.data.source.id) : dispatch('selectMulti', this.data.source);
                  this.data.source.selected = !this.data.source.selected;
                } else { //未按下ctrl和shift
                  if (!this.data.source.selected) { //如果当前节点未选中，选中
                    this.selectSingle();
                  } else { //当前节点已选中，可能是多选状态要进行拖拽，因此单选操作在mouseup上，判断flag值
                    this.data.flag = true;
                  }
                  //添加拖拽相关操作
                  if (!_v._$getElement('c:node-toggle') && this.data.isMySpec) {
                    dispatch('mouseDown');
                  }
                }
              }
              break;
            case 2: //右键
              if (this.data.isMySpec) {
                if (!this.data.source.selected) { //如果当前节点未选中，单选节点
                  this.selectSingle();
                }
              }
              break;
          }
        }
      },
      mouseEnter: function (evt) { //鼠标进入节点范围
        if (this.data.drag && !this.data.source.selected) {
          this.interval = setTimeout(function () {
            if (!this.data.source.opened) {
              this.open();
              this.$update();
            }
          }.bind(this), 300);
          this.data.dragenter = true;
        }
      },
      mouseLeave: function () { //鼠标离开节点范围
        if (this.data.drag) {
          this.data.dragenter = false;
        }
        clearTimeout(this.interval);
      },
      mouseUp: function (ev) { //鼠标松开
        var event = ev.event;
        event.stopPropagation();
        if (event.button === 0) { //左键
          if (this.data.drag) { //拖动过程松开
            if (this.data.source.type === db.SPC_NOD_DIR && !this.data.source.selected && !(Object.keys(that.dragData).length === 1 && that.dragData.hasOwnProperty(this.data.source.id))) { //发请求啦
              delete that.dragData[this.data.source.id];
              var ids = [];
              for (var parent in that.dragData) {
                ids = ids.concat(that.dragData[parent]);
              }
              that.sdCache._$move({
                data: {
                  specId: that.specId,
                  toId: this.data.source.id,
                  ids: ids
                },
                key: that.sdCacheKey,
                ext: {
                  oldParents: that.dragData,
                  newParent: this.data.source.id
                }
              });
            }
          } else { //没有开始拖动，单选当前节点
            this.data.flag && this.selectSingle();
          }
          this.data.flag = false;
          dispatch('dragEnd');
        }
      },
      moveFrom: function (result) { //从当前节点移出，删除节点
        if (result.ext.oldParents.hasOwnProperty(this.data.source.id)) {
          result.ext.oldParents[this.data.source.id].forEach(function (childId) {
            var index = this.findIndexById(childId);
            this.data.source.children.splice(index, 1);
          }.bind(this));
          if (this.data.source.children.length === 0) {
            this.data.source.hasChildren = false;
            this.data.source.opened = false;
          }
          this.$update();
        }
      },
      moveTo: function (result) { //移动到当前节点，添加节点
        if (this.data.source.id === result.ext.newParent) {
          this.data.source.children = this.data.source.children.concat(that.__copyArray(result.data));
          that.__sortByName(this.data.source.children, false);
          if (this.data.source.children.length > 0) {
            this.data.source.hasChildren = true;
            this.data.source.opened = true;
          }
          this.$update();
          result.data.forEach(function (item) {
            item.selected = true;
          });
          this.$update();
        }
      },
      open: function () { //展开节点
        this.data.source.opened = true;
        var data;
        if (this.data.source.id === 0) {
          data = that.sdCache._$getListInCache(that.sdCacheKey);
        } else {
          data = that.sdCache._$getItemInCache({
            key: that.sdCacheKey,
            id: this.data.source.id
          });
        }
        this.data.source.children = that.__copyArray(data.children || data);
        this.sort();
        that.sdCache._$getChildren({
          key: that.sdCacheKey,
          data: {
            specId: that.specId,
            parent: this.data.source.id
          },
          ext: {
            parent: this.data.source.id
          }
        });
      },
      rename: function (id) { //重命名，变更为编辑模式，选中文字
        if (id == this.data.source.id) {
          this.data.source.editable = true;
          setTimeout(function () {
            this.$refs.input.select();
          }.bind(this), 0);
        }
      },
      save: function () { //重命名或添加节点
        var inputName = this.$refs.input.value;
        if (this.data.source.id === undefined) { //id为undefined,新增节点
          if (!inputName.replace(/\s/g, '')) {//判断input内容是否为空
            inputName = this.data.source.type === db.SPC_NOD_DIR ? '新建文件夹' : '新建文件';
          }
          //判断是否重名，如果重名生成一个合适的名称
          this.data.source.name = inputName;
          this.data.source.name = this.$parent.getRightNameFunc(inputName);
          that.sdCache._$addItem({
            key: that.sdCacheKey,
            data: {
              parent: this.data.source.parent,
              specId: this.data.source.specId,
              type: this.data.source.type,
              name: this.data.source.name,
              mime: 'text/plain',
              children: [],
              content: '',
              isUpload: db.CMN_BOL_NO
            },
            ext: {
              id: this.data.source.id,
              callback: function () {
                this.$refs.input.focus();
              }.bind(this)
            }
          });
        } else {
          var old = this.data.source.name;
          if (inputName != old && inputName.replace(/\s/g, '')) { //重命名
            that.sdCache._$updateItem({
              key: that.sdCacheKey,
              id: this.data.source.id,
              data: {
                name: inputName
              },
              ext: {
                callback: this.clearEdit.bind(this),
                id: this.data.source.id,
                updateKey: 'name',
                updateDetail: true
              }
            });
          } else {
            this.clearEdit();
          }
        }
      },
      selectSingle: function () { //选中节点
        dispatch('selectSingle', {
          id: this.data.source.id,
          selected: this.data.source
        });
      },
      showMenu: function (event) { //显示右键菜单
        dispatch('showMenu', {
          event: event.event,
          node: event.origin
        });
      },
      sort: function () { //对当前节点的子节点排序
        that.__sortByName(this.data.source.children, false);
      },
      toggle: function () { //展开或收起子节点
        this.data.source.opened ? this.close() : this.open();
      },
      updateNode: function (result) { //更新节点信息
        if (result.ext.hasOwnProperty('id') && result.ext.id === this.data.source.id) { //直接修改当前节点（add、update）
          _u._$merge(this.data.source, result.data);
          this.data.source.editable = false;
          this.$update();
          if (result.action == 'add' || result.ext.updateKey == 'name') { //添加或修改名称时需要排序
            this.$emit('sort');
          }
          if (result.action == 'add' || result.ext.updateDetail) { //添加或者修改详情时需要更新显示的详情内容
            if (this.data.selected) {
              dispatch('showDetail', this.data.source.id);
            }
          }
          //更新选中节点的数据（最外层监听即可）
          dispatch('updateSelected', {id: this.data.source.id, selected: this.data.source});
        } else { //更新当前节点子节点
          if (result.ext.hasOwnProperty('parent') && result.ext.parent === this.data.source.id) {
            //只在一个父节点下节点下操作（单个删除delete和批量添加bat）
            switch (result.action) {
              case 'delete':
                var index = this.findIndexById(result.data.id);
                this.data.source.children.splice(index, 1);
                if (!this.data.source.children.length) {
                  this.data.source.hasChildren = false;
                }
                this.$update();
                //更新选中节点的数据（最外层监听即可）
                dispatch('updateSelected', {id: result.data.id, selected: undefined});
                break;
              case 'bat':
                this.data.source.children = this.data.source.children || [];
                if (result.ext.isDir) { //选择文件上传，需要复制一份
                  result.data = that.__copyArray(result.data);
                }
                this.data.source.children = result.data;
                this.data.source.opened = true;//展开目录
                this.data.source.hasChildren = true;
                that.__sortByName(this.data.source.children, false);
                this.$update();
                break;
              default:
                break;
            }
          } else if (result.ext.hasOwnProperty('parents') && result.ext.parents.hasOwnProperty(this.data.source.id)) {//批量删除
            var childIds = result.ext.parents[this.data.source.id];
            var children = this.data.source.children;
            childIds.forEach(function (id) {
              var index = this.findIndexById(id);
              children.splice(index, 1);
            }.bind(this));
            if (!children.length) {
              this.data.source.hasChildren = false;
            }
            this.$update();
            dispatch('updateSelected', {ids: childIds, selected: undefined});
          }
        }
      }
    });
    /**
     * 目录树及操作菜单
     */
    var Catalogtree = Base.extend({
      template: _html1,
      config: function () {
        this.data = _u._$merge({
          node: db.SPC_LNG_NODE,
          java: db.SPC_LNG_JAVA,
          fileType: db.SPC_NOD_FILE,
          dirType: db.SPC_NOD_DIR,
          menuShow: false,
          importShow: false,
          selected: undefined,
          isMySpec: false,
          selectList: []
        }, this.data);
        this.mouseMoveFunc = this.mouseMove.bind(this);
        this.mouseUpFunc = this.mouseUp.bind(this);
        listen('cancelSelectMulti', this.cancelSelectMulti.bind(this));
        listen('mouseDown', this.mouseDown.bind(this));
        listen('selectSingle', this.selectSingle.bind(this));
        listen('selectMulti', this.selectMulti.bind(this));
        listen('showMenu', this.showMenu.bind(this));
        listen('updateSelected', this.updateSelected.bind(this));
        listen('updateSource', this.updateSource.bind(this));
        listen('dragEnd', this.dragEnd.bind(this));
        listen('move', this.move.bind(this));
        listen('upload', this.clearLoading.bind(this));
        this.$on('updateLanguage', function (data) {
          this.data.language = data.language;
        });
      },
      init: function () { //取消右键默认事件
        Regular.dom.on(this.$refs.body, 'contextmenu', this.stopDefault);
        Regular.dom.on(document, 'mouseup', this.mouseUpFunc);
      },
      destroy: function () { // destroy 移除事件监听
        this.eventHandler && Regular.dom.off(document, 'click contentMenu wheel', this.eventHandler);
        Regular.dom.off(this.$refs.body, 'contextmenu', this.stopDefault);
        Regular.dom.off(document, 'mouseup', this.mouseUpFunc);
        this.supr();
      },
      add: function (type, flag) { //添加同级文件或文件夹,flag表示当前树是否为空
        if (flag) {
          this.addChild(type, 0); //为空时添加节点
        } else if (this.data.selected && this.data.selectList.length == 1 && this.data.selected.id !== 0) {
          this.addChild(type, this.data.selected.parent);
        }
      },
      checkLock: function () {
        if (this.data.isLock) {
          Notify.show('该规范已被锁定，不能操作', 'error', 1200);
        }
        return this.data.isLock;
      },
      addChild: function (type, id) { //添加子文件或子目录
        if (this.checkLock()) {
          return;
        }
        dispatch('clearDetail');
        var data = {
          editable: true,
          selected: true,
          name: type == db.SPC_NOD_FILE ? '新建文件' : '新建文件夹',
          parent: id === undefined ? this.data.selected.id : id,
          type: type,
          specId: this.data.specId,
          id: undefined
        };
        if (type === db.SPC_NOD_DIR) {
          data.children = [];
        }
        dispatch('addChild', {
          id: data.parent,
          data: data
        });
      },
      addEventOnce: function () { //添加document的click监听，隐藏上传模板菜单和右键菜单
        this.eventHandler = this.eventHandler || function (event) {
            if (event.target !== this.$refs.btn1 && event.target !== this.$refs.btn2
              && event.target !== this.$refs.btn3 && event.target !== this.$refs.btn4) {
              this.data.importShow = false;
              this.data.menuShow = false;
              this.$update();
              Regular.dom.off(document, 'click contentMenu wheel', this.eventHandler);
            }
          }.bind(this);
        //防止用户重复点击添加多次事件
        Regular.dom.off(document, 'click contentMenu wheel', this.eventHandler);
        Regular.dom.on(document, 'click contentMenu wheel', this.eventHandler);
      },
      cancelSelectMulti: function (id) { //多选状态下取消节点的选中
        for (var i = 0; i < this.data.selectList.length; i++) {
          if (this.data.selectList[i].id === id) {
            this.data.selectList.splice(i, 1);
            break;
          }
        }
      },
      clearLoading: function () { //清除loading状态
        this.data.loading = false;
        this.$update();
      },
      delete: function () { //删除选中节点
        if (this.checkLock()) {
          return;
        }
        if (this.data.selected && this.data.selected.id != undefined) {
          if (this.data.selectList.length === 1) { //单个删除
            if (this.data.selected.id != undefined) {
              that.sdCache._$deleteItem({
                key: that.sdCacheKey,
                id: this.data.selected.id,
                ext: {
                  parent: this.data.selected.parent
                }
              });
            }
          } else { //批量删除
            var ids = [], parents = {};
            this.data.selectList.forEach(function (item) {
              if (item.id !== undefined) {
                ids.push(item.id);
                if (parents.hasOwnProperty(item.parent)) {
                  parents[item.parent].push(item.id);
                } else {
                  parents[item.parent] = [item.id];
                }
              }
            });

            that.sdCache._$deleteItems({
              key: that.sdCacheKey,
              ids: ids,
              ext: {
                parents: parents
              }
            });
          }
        }
      },
      dragEnd: function () { //拖拽结束（mouseup事件触发），取消mousemove监听
        if (that.cloneElement) {
          this.$refs.root.removeChild(that.cloneElement);
        }
        that.dragData = that.cloneElement = null;
        that.drag = that.clone = false;
        Regular.dom.off(document, 'mousemove', this.mouseMoveFunc);
      },
      hasSameName: function (arr, name) { //是否有同名文件夹
        return arr.find(function (item) {
          return item.name === name;
        });
      },
      import: function (key) { //导入预置模板
        if (key == 'zip') {
          var files = this.$refs.templateSelect.files;
          if (files[0].name.match(/.*\.zip$/)) {
            if (files[0].size > maxSize) {
              Notify.show('所选文件过大，无法上传', 'error', 2000);
            } else {
              that.sdCache._$import({
                key: that.sdCacheKey,
                data: {
                  specId: that.specId,
                  file: files[0]
                },
                ext: {
                  updateSpec: true,
                  callback: this.clearLoading.bind(this)
                }
              });
              this.data.loading = true;
              dispatch('clearDetail');
            }
            this.$refs.templateSelect.value = '';
          } else {
            Notify.show('上传失败，请选择Zip文件上传', 'error', 2000);
          }
        } else {
          if (this.data.source.children.length > 0) {
            var tip = '该操作会清空当前的工程结构，是否继续?';
            if (key == 'empty') {
              tip = '确定要清空当前的工程结构吗？';
            }
            var modal = Modal.confirm({
              content: tip,
              title: '导入模板确认'
            });
            modal.$inject(document.body)
              .$on('ok', this.importConfirm.bind(this, key));
          } else {
            this.importConfirm(key);
          }
        }
      },
      importConfirm: function (key) { //key是导入类型（node,maven,empty,select）
        switch (key) {
          case 'node':
          case 'maven':
            var id = key == 'node' ? db.SPC_SYS_NODE : db.SPC_SYS_MAVEN;
            that.sdCache._$import({
              key: that.sdCacheKey,
              data: {
                specId: that.specId,
                importSpecId: id
              },
              ext: {
                updateSpec: true,
                callback: this.clearLoading.bind(this)
              }
            });
            this.data.loading = true;
            dispatch('clearDetail');
            break;
          case 'empty':
            that.sdCache._$empty({
              key: that.sdCacheKey,
              specId: that.specId
            });
            this.data.loading = true;
            dispatch('clearDetail');
            break;
          case 'select':
            this.$refs.templateSelect.click();
            break;
          default:
            break;
        }
      },
      mouseDown: function () {//文件或目录节点mousedown,开始监听全局的mousemove事件
        Regular.dom.on(document, 'mousemove', this.mouseMoveFunc);
      },
      mouseMove: function (evt) {//鼠标移动（针对被拖动节点操作）
        var event = evt.event;
        if (!that.drag) {
          that.drag = true;
          that.dragData = {};
          this.data.selectList.forEach(function (item) {
            if (that.dragData.hasOwnProperty(item.parent)) {
              that.dragData[item.parent].push(item.id);
            } else {
              that.dragData[item.parent] = [item.id];
            }
          });
          that.x = event.clientX;
          that.y = event.clientY;
          dispatch('dragBegin');
        }
        if (!that.clone && (event.clientX - that.x > 3 || event.clientX - that.x < -3 || event.clientY - that.y > 3 || event.clientY - that.y < -3)) {
          that.clone = true;
          that.cloneElement = _e._$html2node('<div class="js-clone">已选择' + this.data.selectList.length + '项</div>');
          this.$refs.root.appendChild(that.cloneElement);
        }
        that.cloneElement && _e._$style(that.cloneElement, {
          left: event.clientX + 5 + 'px',
          top: event.clientY + 5 + 'px'
        });
      },
      mouseUp: function () { //拖拽结束
        dispatch('dragEnd');
      },
      move: function (result) { //移动结束，更新selected和selectList数据
        this.data.selectList.forEach(function (select) {
          var newData = result.data.find(function (item) {
            return item.id === select.id;
          });
          select = _u._$merge(select, newData);
          if (select.id === this.data.selected.id) {
            this.data.selected = select;
          }
        }.bind(this));
      },
      readFile: function (file, parent, type, callback) { //读取文件内容
        var reader = new FileReader();
        reader.onload = function (event) {
          var obj = {
            type: db.SPC_NOD_FILE,
            mime: file.type == '' ? 'text/plain' : file.type.replace('application', 'text'),
            name: file.name,
            content: event.target.result
          };
          if (type == 1) {
            obj.filePath = file.webkitRelativePath;
          }
          that.adds.push(obj);
          if (++that.index === that.fileLength && that.adds.length > 0) { //向后端发送请求
            that.__uploadToServer(parent, type, callback);
          }
        };
        reader.readAsText(file);
      },
      rename: function () { //重命名
        if (this.checkLock()) {
          return;
        }
        dispatch('rename', this.data.selected.id);
      },
      selectSingle: function (data) { //选中节点
        this.data.selected = data.selected;
        this.data.selectList = [data.selected];
        if (data.id === 0) {
          dispatch('clearDetail');
        } else if (data.id) {
          dispatch('showDetail', data.id);
        }
      },
      selectMulti: function (data) {//多个选中，将选中节点添加到selectList中
        this.data.selectList.push(data);
        if (this.data.selected.id === 0) { //root目录不能在多选状态中
          this.data.selected = data;
          this.data.source.selected = false;
          this.data.selectList.shift();
          this.$update();
        }
      },
      setDataSource: function (key) { //设置文件标识
        var selected = dataSource.find(function (item) {
          return item.key === key;
        });
        this.$emit('updateDataSource', selected);
      },
      setDirType: function (type) { //设置目录标识
        var dirType = {
          id: type
        };
        this.$emit('updateDirType', dirType);
      },
      showImport: function () { //显示上传模板菜单
        this.data.importShow = true;
        this.data.menuShow = false;
        this.addEventOnce();
      },
      showMenu: function (data) { //显示右键菜单
        this.data.importShow = false;
        this.data.menuShow = true;
        _e._$delClassName(this.$refs.menu, 'f-dn');
        var event = data.event, node = data.node;
        var menuWidth = parseInt(_e._$getStyle(this.$refs.menu, 'width'));
        var menuHeight = this.$refs.menu.offsetHeight;
        var nodeWidth = node.clientWidth;
        var ctnHeight = this.$refs.body.clientHeight;
        if (event.offsetX + menuWidth + 152 > nodeWidth) {
          _e._$addClassName(this.$refs.menu, 'm-menu3');
        } else {
          _e._$delClassName(this.$refs.menu, 'm-menu3');
        }
        var menuLeft;
        if (event.offsetX + menuWidth > nodeWidth) {
          menuLeft = (event.clientX - menuWidth - 2) + 'px';
        } else {
          menuLeft = (event.clientX + 2) + 'px';
        }
        var menuTop;
        if (event.offsetY + node.offsetTop + menuHeight > ctnHeight) {
          menuTop = (event.clientY - menuHeight + 2) + 'px';
        } else {
          menuTop = (event.clientY + 2) + 'px';
        }
        _e._$style(this.$refs.menu, {
          top: menuTop,
          left: menuLeft
        });
        this.addEventOnce();
        this.$update();
      },
      showUploadSelect: function (type) { //显示上传文件(0)或文件夹(1)选择
        if (this.checkLock()) {
          return;
        }
        if (this.data.selected && this.data.selected.type == this.data.dirType) {
          type ? this.$refs.dirSelect.click() : this.$refs.fileSelect.click();
        }
      },
      sort: function () { //排序
        that.__sortByName(this.data.source.children, false);
      },
      stopDefault: function (event) { //取消右键默认事件
        event.preventDefault();
      },
      updateSelected: function (data) { //更新选中节点的数据
        if ((data.hasOwnProperty('id') && this.data.selected.id === data.id) || (data.hasOwnProperty('ids') && data.ids.indexOf(this.data.selected.id) != -1)) {
          this.data.selected = data.selected;
          if (!data.selected) {
            this.data.selectList = [];
          }
          this.$update();
        }
      },
      updateSource: function (source) {//导入或清空结构时更新
        this.data.loading = false;
        this.data.source.children = source;
        this.data.source.hasChildren = !!source.length;
        this.data.source.opened = this.data.source.selected = true;
        this.data.selected = this.data.source;
        this.data.selectList = [this.data.source];
        this.$update();
      },
      upload: function (type) { //选择文件(0)或文件夹(1)上传
        //上传文件(根据文件type和后缀名判断是否是纯文本，纯文本读取文件内容添加到that.adds中，其余类型上传到nos再添加到that.adds中，统一向后台发送请求)
        var files = type ? this.$refs.dirSelect.files : this.$refs.fileSelect.files;
        if (files.length === 0) {
          return;
        }
        if (files.length > 100) {
          Notify.show('文件数量过多，无法上传', 'error', 2000);
          return;
        }
        if (type) {
          var dirName = files[0].name.substring(0, files[0].name.indexOf('/'));
          if (this.hasSameName(this.data.selected.children, dirName)) {
            Notify.show('同目录下已存在同名文件夹节点', 'error', 2000);
            return;
          }
        }
        this.data.loading = true;
        var size = 0, i, file;
        for (i = 0; file = files[i]; i++) {
          size += file.size;
          if (size > maxSize) {
            Notify.show('所选文件过大，无法上传', 'error', 2000);
            return;
          }
        }
        that.uploadFiles = []; //需要上传到nos的文件
        that.fileLength = files.length; //所有文件的长度
        that.adds = [];  //需要向后台发送的文件数据
        var parent = this.data.selected.id; //父节点id
        var callback = this.clearLoading.bind(this); //清除loading状态
        that.index = 0; //记录已读取文件数
        for (i = 0; file = files[i]; i++) {
          if (textRegex.test(file.type)) { //纯文本类型,将application替换为text
            this.readFile(file, parent, type);
          } else {
            if (file.type == '') { //type值为空，判断后缀
              var ext = file.name.substring(file.name.lastIndexOf('.') + 1);
              if (that.__isText(ext)) { //是纯文本
                this.readFile(file, parent, type, callback);
              } else {
                that.uploadFiles.push(file);
              }
            } else { //非文本类型
              that.uploadFiles.push(file);
            }
          }
        }
        if (that.uploadFiles.length > 0) { //获取token上传
          that.sdCache._$getTokens({
            n: that.uploadFiles.length,
            ext: {
              parent: this.data.selected.id,
              type: type,
              callback: callback
            }
          });
        }
        this.$refs.fileSelect.value = this.$refs.dirSelect.value = '';
      }
    });
    return Catalogtree;
  };
// notify dispatcher
  _m._$regist(
    'spec-detail-template',
    _p._$$ModuleSpecDetailTemplate
  );
});
