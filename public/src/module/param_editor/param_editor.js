/**
 * 参数编辑器组件
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'ui/base',
  'util/chain/chainable',
  'util/template/jst',
  'pro/common/jst_extend',
  'pro/common/regular/regular_base',
  'pro/common/util',
  'pro/modal/modal',
  'pro/notify/notify',
  'pro/cache/config_caches',
  'pro/param_editor/param_select/param_select',
  './param_editor_util.js',
  './param_editor_config.js',
  './param_editor_core.js',
  'pro/param_editor/modify_datatype/modify_datatype',
  'pro/common/constants',
  'json!3rd/fb-modules/config/db.json',
  'text!./param_editor.html',
  'css!./param_editor.css'
], function (k, u, e, v, ui, $, jst, jstex, rb, util, Modal, _notify, caches, ParamSelect, editorUtil, editorConfig, ParamEditorCore, DatatypeModify, constants, dbConst, html, css, p, pro) {

  p._$$ParamEditor = k._$klass();
  pro = p._$$ParamEditor._$extend(ui._$$Abstract);
  e._$addStyle(css);

  var cacheMap = {};
  cacheMap[util.db.PAM_TYP_INPUT] = caches.interface;
  cacheMap[util.db.PAM_TYP_OUTPUT] = caches.interface;
  cacheMap[util.db.PAM_TYP_RPC_INPUT] = caches.rpc;
  cacheMap[util.db.PAM_TYP_RPC_OUTPUT] = caches.rpc;
  cacheMap[util.db.PAM_TYP_ATTRIBUTE] = caches.datatype;

  // 初始化开始
  pro.__reset = function (options) {
    delete this.datatypeLoaded;
    delete this.wordLoaded;

    this.options = u._$merge({}, editorConfig.options, options);
    this.listKey = null;
    this.datatypeCache = caches.datatype._$allocate({
      onlistload: function (evt) {
        this.initDatatypeList();
        if (this.options.preview) {
          // 获取初始化时的参数列表，用在预览页面
          this.options.params = this.getInitParams();
        }
        this.datatypeLoaded = true;
        this.render();
      }.bind(this)
    });
    this.listKey = this.datatypeCache._$getListKey(this.options.pid);
    this.datatypeCache._$getList({
      key: this.listKey,
      data: {pid: this.options.pid}
    });
    this.loadWordList(this.options.pid);
  };

  pro.__clearFullScreen = function () {
    var elems = document.querySelectorAll('.editor-full-screen');
    [].forEach.call(elems, function (el) {
      el.style = '';
      el.classList.remove('editor-full-screen');
    });
  };

  pro.__destroy = function __destroy() {
    this.__super();

    if (this.editor && this.editor.data && this.editor.data.fullScreen) {
      this.__clearFullScreen();
    }

    this.editor &&
    this.editor.$refs &&
    this.editor.$refs.editorCore &&
    this.editor.$refs.editorCore.destroy();
  };

  // 加载参数字典列表
  pro.loadWordList = function (pid) {
    var projectCache = caches.project._$allocate();
    var project = projectCache._$getItemInCache(this.options.pid);
    projectCache._$recycle();
    this.options.useWordStock = (project && project.useWordStock === 1) || false;
    if (!this.options.useWordStock) {
      // 如果项目没有开启参数词库校验，则不进行真实加载。
      this.wordLoaded = true;
      this.render();
      return;
    }
    // var progroupCache = caches.progroup._$allocate();
    // var progroup = progroupCache._$getItemInCache(project.progroupId);
    // progroupCache._$recycle();
    //this.options.useWordStock = progroup.useWordStock === 1 || false;

    var wordCache = caches.word._$allocate({
      onlistload: function (evt) {
        this.options.words = wordCache._$getListInCache(evt.key);
        this.wordLoaded = true;
        this.render();
      }.bind(this)
    });
    var cacheKey = wordCache._$getListKey(this.options.pid);
    wordCache._$clearDirtyList(pid);
    wordCache._$getList({
      key: cacheKey,
      data: {pid: this.options.pid}
    });
  };

  // 更新数据模型列表
  pro.initDatatypeList = function () {
    this.options.datatypes = JSON.parse(JSON.stringify(this.datatypeCache._$getListInCache(this.listKey)));
    // 增加自定义类型 Array 和 Object
    // 数组
    var foundArray = this.options.datatypes.find(function (item) {
      return item.id === editorConfig.customDatatypes.ARRAY_ID;
    });
    if (!foundArray) {
      this.options.datatypes.push({id: editorConfig.customDatatypes.ARRAY_ID, name: 'Array', description: '数组'});
    }
    var foundObject = this.options.datatypes.find(function (item) {
      return item.id === editorConfig.customDatatypes.OBJECT_ID;
    });
    // 对象
    if (!foundObject) {
      this.options.datatypes.push({
        id: editorConfig.customDatatypes.OBJECT_ID,
        name: 'Object',
        description: '对象'
      });
    }
  };

  // 渲染组件
  pro.render = function () {
    if (!this.wordLoaded || !this.datatypeLoaded) {
      return;
    }
    var Editor = this.getEditor();
    this.editor = new Editor({
      data: this.options
    }).$inject(this.options.parent, 'top');
  };

  // 获取 regular 组件实例
  pro.getEditor = function () {
    var self = this;
    return rb.extend({
      template: html,
      config: function () {
        this.data.fullScreen = false;
        // 事件监听
        this.$on('toggle-fullscreen', this.toggleFullScreen);
        this.$on('create-datatype', this.createDatatype);
        this.$on('modify-datatype', this.modifyDatatype);
        this.$on('checkJump', this.checkJump);
        this.$on('change-from-object-confirm', this.changeFromObject);
        this.$on('update-param', this.updateParam);
        this.$on('update-params-position', this.updateParamsPosition);
        this.$on('create-params', this.createParams);
        this.$on('delete-params', this.deleteParams);
        this.$on('import-datatypes', this.importDatatypes);
        this.$on('change-format', this.changeFormat);
      },
      toggleFullScreen: function (fullScreen) {
        this.data.fullScreen = fullScreen;
        editorUtil.toggleFullScreen(fullScreen, this.parentNode, function () {
          this.data.fullScreen = false;
          this.$update();
        }.bind(this));
      },
      checkJump: function () {
        if (self.options.isModifyDatatype) {
          if (self.options.self && self.options.self._modal) {
            self.options.self._modal.destroy();
          }
        }
      },
      modifyDatatype: function (event) {
        var dt = self.options.datatypes.find(function (d) {
          return d.id === event.selected.id;
        });
        var param = event.param.imported ? event.param.params.find(function (item) {
          return item.originalType === util.db.MDL_SYS_VARIABLE;
        }) : event.param;
        self._modal = new DatatypeModify.modal({
          data: {
            id: event.selected.id,
            parentType: dt && dt.type === 2 ? util.db.PAM_TYP_ATTRIBUTE : constants.PARAM_TYP_MODIFY_DATATYPE,
            pid: self.options.pid,
            datatypeId: event.param.imported ? event.param.id : undefined,
            showRequired: self.options.showRequired,
            pattern: self.options.pattern,
            errorMsg: self.options.errorMsg,
            param: param,
            onChange: self.options.onChange,
            callback: event.callback,
            self: self
          }
        }).$on('close', function () {
          self._modal.destroy();
        });
      },
      createDatatype: function (paramSelectInstanceOrParams) {
        // 参数可能是参数下拉组件，此时是点击了数据模型下拉列表中的“创建数据模型”按钮
        // 参数也可能是参数列表，此时是点击了“保存为数据模型”按钮
        var paramSelectInstance = null;
        var params = [];
        if (Array.isArray(paramSelectInstanceOrParams)) {
          params = paramSelectInstanceOrParams;
        } else {
          paramSelectInstance = paramSelectInstanceOrParams;
        }
        var datatypeCreateUMI = '/?/progroup/p/res/datatype/create/';
        var _modal = new Modal({
          data: {
            content: '',
            title: ' ',
            class: 'inline-create',
            okButton: false,
            cancelButton: false,
            closeButton: true
          }
        }).$on('close', function () {
          dispatcher._$hide(datatypeCreateUMI);
          _modal.destroy();
        });
        self.datatypeCache.__doInitDomEvent([
          [caches.datatype, 'add', function (result) {
            self.initDatatypeList();
            // 如果当前是枚举，且值不是字符布尔数值之一，则不选择
            if (!(this.data.format === util.db.MDL_FMT_ENUM &&
              !(result.data.format === util.db.MDL_FMT_STRING || result.data.format === util.db.MDL_FMT_BOOLEAN || result.data.format === util.db.MDL_FMT_NUMBER))) {
              if (paramSelectInstance) {
                paramSelectInstance.$select(result.data);
              }
            }
            //及时清除事件
            self.datatypeCache.__doClearDomEvent();
            self.options.onChange();
          }.bind(this)]
        ]);
        dispatcher._$redirect(datatypeCreateUMI + '?pid=' + self.options.pid, {
          input: {
            params: params,
            parent: _modal.$refs.modalbd,
            done: function () {
              dispatcher._$hide(datatypeCreateUMI);
              _modal.destroy();
            }
          }
        });
      },
      getCache: function () {
        if (this.data.isHeader
          && (this.data.parentType == util.db.API_HED_REQUEST || this.data.parentType == util.db.API_HED_RESPONSE)) {
          return caches.iHeader;
        } else if (this.data.isHeader && this.data.parentType === constants.PARAM_TYP_TEST_HOST_HEADER) {
          return caches.host;
        }
        return caches.parameter;
      },
      changeFromObject: function (options) {
        var modal = Modal.confirm({content: '把 Object 切换成其他类型会清除 Object 参数，确定切换成 “' + options.formatName + '” 类型吗？'});
        modal.$on('ok', options.ok);
        modal.$on('cancel', options.cancel);
        modal.$on('close', options.cancel);
      },
      updateParam: function (options) {
        var cache = this.getCache();
        var cacheInstance = cache._$allocate({
          onitemupdate: function (evt) {
            // 只可能更新单个参数
            // 如果更新参数的类型为Object后，会导致数据模型的列表发生变化，多了一个匿名类型
            self.initDatatypeList();
            var param = options.data.parentType === constants.PARAM_TYP_TEST_HOST_HEADER ? options.param : evt.data.params[0];
            var newParam = editorUtil.formatParam(param, self.options.datatypes, self.options);
            if (self.options.isModifyDatatype) {
              self.options.self.initDatatypeList();
              if (evt.ext && evt.ext.create) {
                Object.assign(self.options.param, param);
                self.options.param.originals = self.options.param;
                // 如果是创建，需要重新渲染当前的参数编辑器，否则重复创建
                self.options.parentId = param.type;
                self.options.parentType = util.db.PAM_TYP_ATTRIBUTE;
              }
              // 如果是修改的数据模型，则外部的param还需要更新
              self.options.self.editor.$update();
              self.options.callback && self.options.callback(evt);
            }
            if (!self.options.isModifyDatatype || !evt.ext) {
              Object.assign(options.param, newParam);
            }
            cacheInstance._$recycle();
            options.callback && options.callback(evt);
            // 如果返回了数据模型，资源会失效，需要重新去请求
            if (evt.data.datatypes && evt.data.datatypes.length) {
              var resCache = cacheMap[self.options.isModifyDatatype ? self.options.self.options.parentType : self.options.parentType];
              if (resCache) {
                resCache = resCache._$allocate({
                  onitemload: function () {
                    if (self.options.isModifyDatatype) {
                      self.options.onChange(options, evt);
                      if (evt.ext && evt.ext.create) {
                        self.options.self.editor.data.params = self.options.self.getInitParams();
                        self.options.self.editor.$update();
                      }
                    } else {
                      self.options.onChange(options, evt);
                    }
                  }.bind(this)
                });
                var res = resCache._$getItemInCache(self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId);
                if (!res || (self.options.isModifyDatatype && res.params)) {
                  self.options.onChange(options, evt);
                }
                resCache._$getItem({
                  id: self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId
                });
              }
            } else {
              self.options.onChange(options, evt);
            }
          }.bind(this),
          onerror: function (evt) {
            // 如果是更新数据模型发生的错误
            if (evt.data.code === 403 && options.data.parentType === util.db.PAM_TYP_ATTRIBUTE) {
              // 和数据模型关联，一系列错误都要还原，还原之前值
              if (options.data.type) {
                options.sender.$select(options.oSelected);
              }
              if (options.data.name) {
                options.param.name = options.param.originals.name;
                this.$update();
              }
            }
          }.bind(this)
        });
        // 只有修改参数名称和类型时才检查
        // 修改类型时，可以修改成自定义类型，自定义类型中的参数字段也要检查
        if (self.options.pattern && (options.data.hasOwnProperty('type') || options.data.hasOwnProperty('name') || options.data.hasOwnProperty('description'))) {
          var checkValidityResult = {};
          if (!this.checkValidity([options.param], self.options.pattern, checkValidityResult)) {
            var errorMsg = self.options.errorMsg[checkValidityResult.inputErrorField].replace('{{path}}', checkValidityResult.inputErrorPath);
            errorMsg = errorMsg.replace('{{value}}', checkValidityResult.inputErrorValue);
            _notify.show(errorMsg, 'error', 8000);
            // 去掉更新时的红框
            delete options.param.inputError;

            if (self.checkCreateTime(self.options.parentId)) {
              // 恢复原值
              var param = options.param.originals;
              options.param.name = param.name;
              options.param.type = param.type;
              options.param.description = param.description;
              if (options.sender) {
                options.sender.$select(options.oSelected);
              }
              return;
            }
          }
        }
        if (self.options.format === util.db.MDL_FMT_HASH && self.options.resSchemaJSON && (options.data.type || options.data.name)) {
          if (options.param.parentId === self.options.parentId && options.param.parentType === self.options.parentType) {
            var checkResult = util._$checkSingleSchema(options.param, self.options.resSchemaJSON, self.options.datatypes);
            if (!checkResult.result) {
              _notify.show(self.options.schemaErrorMsg.replace('{{value}}', options.param.name).replace('{{error}}', checkResult.error), 'error', 8000);
              if (self.checkCreateTime(self.options.parentId)) {
                // 恢复原值
                var param = options.param.originals;
                options.param.name = param.name;
                options.param.type = param.type;
                options.param.required = param.required === 0 ? 0 : 1;
                if (options.sender) {
                  options.sender.$select(options.oSelected);
                }
                return;
              }
            }
          }
        }
        if (options.data.parentType === constants.PARAM_TYP_TEST_HOST_HEADER) {
          var host = cacheInstance._$getItemInCache(options.data.parentId);
          var data = util._$getValidJSON(host.header) || [];
          var updateItem = data.filter(function (item) {
            return item.name === options.param.originals.name;
          })[0];
          // 只可能更改 name defaultValue description
          if (updateItem) {
            updateItem.name = options.param.name;
            updateItem.defaultValue = options.param.defaultValue;
            updateItem.description = options.param.description;
          }
          data = this.formatEnvParams(data);
          cacheInstance._$updateItem({
            id: options.data.parentId,
            data: {
              header: JSON.stringify(data)
            }
          });
        } else {
          if (self.options.isModifyDatatype && self.options.parentType === constants.PARAM_TYP_MODIFY_DATATYPE) {
            var datatype = self.options.datatypes.find(function (dt) {
              return dt.id === self.options.parentId;
            });
            options.data.parentType = util.db.PAM_TYP_ATTRIBUTE;
            if (datatype) {
              // 已经创建过匿名类型了
              if (datatype.type === 2) {
                // 直接更新即可
                cacheInstance._$updateItem({
                  data: options.data,
                  id: options.param.id
                });
              } else {
                // 没创建过，先创建一个匿名类型
                var imports = [{
                  id: datatype.id,
                  vars: JSON.parse(JSON.stringify(datatype.params))
                }];
                // 合并
                var param = imports[0].vars.find(function (param) {
                  return param.id === options.param.id;
                });
                if (param) {
                  Object.assign(param, options.param);
                } else {
                  // 否则是非第一层的更新，目前没好的办法处理，只能让用户再更新一次。。
                }
                cacheInstance._$updateItem({
                  data: {
                    datatypeId: self.options.datatypeId,
                    parentId: self.options.param.parentId,
                    parentType: self.options.param.parentType,
                    imports: imports,
                    typeName: datatype.name
                  },
                  id: self.options.param.id,
                  ext: {
                    create: true,
                    isModifyDatatype: true
                  }
                });
              }
            } else {
              _notify.show('找不到修改的数据模型！', 'error', 8000);
            }
          } else {
            cacheInstance._$updateItem({
              data: options.data,
              id: options.param.id
            });
          }
        }
      },
      updateParamsPosition: function (options) {
        var cache = this.getCache();
        var cacheInstance = cache._$allocate({
          onupdatepositions: function (evt) {
            cacheInstance._$recycle();
            options.callback && options.callback(evt);
            self.options.onChange();
          }.bind(this),
          onitemupdate: function (evt) {
            cacheInstance._$recycle();
            options.callback && options.callback(evt);
            self.options.onChange();
          }
        });
        if (options.data.parentType === constants.PARAM_TYP_TEST_HOST_HEADER) {
          var host = cacheInstance._$getItemInCache(options.data.parentId);
          var data = util._$getValidJSON(host.header) || [];
          options.data.params.forEach(function (item) {
            var updateItem = data.filter(function (i) {
              return i.name === item.name;
            })[0];
            updateItem.position = item.position;
          });
          data = this.formatEnvParams(data);
          cacheInstance._$updateItem({
            id: options.data.parentId,
            data: {
              header: JSON.stringify(data)
            }
          });
        } else {
          cacheInstance._$updatePositions(options.data);
        }
      },
      createParams: function (options) {
        var cache = this.getCache();
        var cacheInstance = cache._$allocate({
          onitemsadd: function (evt) {
            if (self.options.isModifyDatatype) {
              self.options.self.initDatatypeList();
              self.options.self.editor.$update();
              self.options.callback && self.options.callback(evt);
            }
            self.initDatatypeList();
            var params = self.getInitParams();
            cacheInstance._$recycle();
            options.callback && options.callback(evt, params);
            // 如果返回了数据模型，资源会失效，需要重新去请求
            if (evt.data.datatypes && evt.data.datatypes.length) {
              var resCache = cacheMap[self.options.isModifyDatatype ? self.options.self.options.parentType : self.options.parentType];
              if (resCache) {
                resCache = resCache._$allocate({
                  onitemload: function () {
                    if (self.options.isModifyDatatype) {
                      self.options.onChange(options, evt);
                      if (evt.ext && evt.ext.create) {
                        self.options.self.editor.data.params = self.options.self.getInitParams();
                        self.options.self.editor.$update();
                      }
                    } else {
                      self.options.onChange(options, evt);
                    }
                  }.bind(this)
                });
                var res = resCache._$getItemInCache(self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId);
                if (!res || (self.options.isModifyDatatype && res.params)) {
                  self.options.onChange(options, evt);
                }
                resCache._$getItem({
                  id: self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId
                });
              }
            } else {
              self.options.onChange(options, evt);
            }
          }.bind(this),
          onitemupdate: function (evt) {
            // 增加也在onitemupdate
            if (self.options.isModifyDatatype) {
              self.options.self.initDatatypeList();
              if (evt.ext && evt.ext.create) {
                var pam = evt.data.params[0];
                Object.assign(self.options.param, pam);
                // 重新渲染当前modal的参数编辑器
                self.options.parentId = pam.type;
                self.options.parentType = util.db.PAM_TYP_ATTRIBUTE;
              }
              self.options.self.editor.$update();
              self.options.callback && self.options.callback(evt);
            }
            self.initDatatypeList();
            var params = self.getInitParams();
            cacheInstance._$recycle();
            options.callback && options.callback(evt, params);
            // 如果返回了数据模型，资源会失效，需要重新去请求
            if (evt.data.datatypes && evt.data.datatypes.length) {
              var resCache = cacheMap[self.options.isModifyDatatype ? self.options.self.options.parentType : self.options.parentType];
              if (resCache) {
                resCache = resCache._$allocate({
                  onitemload: function () {
                    if (self.options.isModifyDatatype) {
                      self.options.onChange(options, evt);
                      if (evt.ext && evt.ext.create) {
                        self.options.self.editor.data.params = self.options.self.getInitParams();
                        self.options.self.editor.$update();
                      }
                    } else {
                      self.options.onChange(options, evt);
                    }
                  }.bind(this)
                });
                var res = resCache._$getItemInCache(self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId);
                if (!res || (self.options.isModifyDatatype && res.params)) {
                  self.options.onChange(options, evt);
                }
                resCache._$getItem({
                  id: self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId
                });
              }
            } else {
              self.options.onChange(options, evt);
            }
          }
        });
        if (self.options.pattern) {
          var checkValidityResult = {};
          if (!this.checkValidity(options.data.items[0].params, self.options.pattern, checkValidityResult)) {
            var errorMsg = self.options.errorMsg[checkValidityResult.inputErrorField].replace('{{path}}', checkValidityResult.inputErrorPath);
            errorMsg = errorMsg.replace('{{value}}', checkValidityResult.inputErrorValue);
            _notify.show(errorMsg, 'error', 8000);
            if (self.checkCreateTime(self.options.parentId)) {
              return;
            }
          }
        }
        if (self.options.format === util.db.MDL_FMT_HASH && self.options.resSchemaJSON) {
          var error = [];
          options.data.items.forEach(function (item) {
            // 直接添加在第一层上的
            if (item.parentId === self.options.parentId && item.parentType === self.options.parentType) {
              item.params.forEach(function (param) {
                var checkResult = util._$checkSingleSchema(param, self.options.resSchemaJSON, self.options.datatypes);
                if (!checkResult.result) {
                  error.push(checkResult.error);
                }
              }, this);
            }
          }, this);
          if (error.length) {
            error = error.length === 1 ? error[0] : '<br>' + error.join('<br>');
            _notify.show(self.options.schemaErrorMsg.replace('{{value}}', '').replace('{{error}}', error), 'error', 8000);
            if (self.checkCreateTime(self.options.parentId)) {
              return;
            }
          }
        }
        if (options.data.parentType === constants.PARAM_TYP_TEST_HOST_HEADER) {
          var host = cacheInstance._$getItemInCache(options.data.parentId);
          var data = util._$getValidJSON(host.header) || [];
          options.data.params.forEach(function (item) {
            data.push({
              type: item.type,
              name: item.name,
              defaultValue: item.defaultValue,
              description: item.description,
              position: item.position
            });
          });
          data = this.formatEnvParams(data);
          cacheInstance._$updateItem({
            id: options.data.parentId,
            data: {
              header: JSON.stringify(data)
            }
          });
        } else {
          if (self.options.isModifyDatatype && self.options.parentType === constants.PARAM_TYP_MODIFY_DATATYPE) {
            var datatype = self.options.datatypes.find(function (dt) {
              return dt.id === self.options.parentId;
            });
            if (datatype) {
              // 已经创建过匿名类型了
              if (datatype.type === 2) {
                // 直接添加即可
                cacheInstance._$addItems({
                  data: options.data
                });
              } else {
                // 没创建过，先创建一个匿名类型
                var imports = [{
                  id: datatype.id,
                  vars: JSON.parse(JSON.stringify(datatype.params))
                }];
                var params = [];

                options.data.items.forEach(function (item) {
                  // 找到需要添加的param
                  var p = imports[0].vars.find(function (pam) {
                    return pam.id === item.parentId;
                  });
                  if (p) {
                    (item.params || []).forEach(function (pam) {
                      p.params.push(pam);
                    });
                    (item.imports || []).forEach(function (ipt) {
                      p.imports.push(ipt);
                    });
                  } else {
                    // 找不到，说明添加在当前数据模型的根
                    (item.params || []).forEach(function (pam) {
                      params.push(pam);
                    });
                    (item.imports || []).forEach(function (ipt) {
                      imports.push(ipt);
                    });
                  }
                }, this);
                cacheInstance._$updateItem({
                  data: {
                    datatypeId: self.options.datatypeId,
                    parentId: self.options.param.parentId,
                    parentType: self.options.param.parentType,
                    params: params,
                    imports: imports,
                    typeName: datatype.name
                  },
                  id: self.options.param.id,
                  ext: {
                    create: true,
                    isModifyDatatype: true
                  }
                });
              }
            } else {
              _notify.show('找不到修改的数据模型！', 'error', 8000);
            }
          } else {
            cacheInstance._$addItems({
              data: options.data
            });
          }
        }
      },
      deleteParams: function (options) {
        var cache = this.getCache();
        var cacheInstance = cache._$allocate({
          onitemsdelete: function (evt) {
            if (self.options.isModifyDatatype) {
              self.options.self.initDatatypeList();
              self.options.self.editor.$update();
              self.options.callback && self.options.callback(evt);
              // 删除匿名数据模型需要更新数据模型列表
              self.initDatatypeList();
            }
            cacheInstance._$recycle();
            options.callback && options.callback(evt);
            // 如果返回了数据模型，资源会失效，需要重新去请求
            if (evt.data.datatypes && evt.data.datatypes.length) {
              var resCache = cacheMap[self.options.isModifyDatatype ? self.options.self.options.parentType : self.options.parentType];
              if (resCache) {
                resCache = resCache._$allocate({
                  onitemload: function () {
                    if (self.options.isModifyDatatype) {
                      self.options.onChange(options, evt);
                      if (evt.ext && evt.ext.create) {
                        self.options.self.editor.data.params = self.options.self.getInitParams();
                        self.options.self.editor.$update();
                      }
                    } else {
                      self.options.onChange(options, evt);
                    }
                  }.bind(this)
                });
                var res = resCache._$getItemInCache(self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId);
                if (!res || (self.options.isModifyDatatype && res.params)) {
                  self.options.onChange(options, evt);
                }
                resCache._$getItem({
                  id: self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId
                });
              }
            } else {
              self.options.onChange(options, evt);
            }
          }.bind(this),
          onitemupdate: function (evt) {
            if (self.options.isModifyDatatype) {
              self.options.self.initDatatypeList();
              if (evt.ext && evt.ext.create) {
                var pam = evt.data.params[0];
                self.options.param.originals = self.options.param;
                Object.assign(self.options.param, pam);
                // 重新渲染当前modal的参数编辑器
                self.options.parentId = pam.type;
                self.options.parentType = util.db.PAM_TYP_ATTRIBUTE;
                self.initDatatypeList();
              }
              self.options.self.editor.$update();
              self.options.callback && self.options.callback(evt);
            }
            cacheInstance._$recycle();
            options.callback && options.callback(evt);
            // 如果返回了数据模型，资源会失效，需要重新去请求
            if (evt.data.datatypes && evt.data.datatypes.length) {
              var resCache = cacheMap[self.options.isModifyDatatype ? self.options.self.options.parentType : self.options.parentType];
              if (resCache) {
                resCache = resCache._$allocate({
                  onitemload: function () {
                    if (self.options.isModifyDatatype) {
                      self.options.onChange(options, evt);
                      if (evt.ext && evt.ext.create) {
                        self.options.self.editor.data.params = self.options.self.getInitParams();
                        self.options.self.editor.$update();
                      }
                    } else {
                      self.options.onChange(options, evt);
                    }
                  }.bind(this)
                });
                var res = resCache._$getItemInCache(self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId);
                if (!res || (self.options.isModifyDatatype && res.params)) {
                  self.options.onChange(options, evt);
                }
                resCache._$getItem({
                  id: self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId
                });
              }
            } else {
              self.options.onChange(options, evt);
            }
          }
        });
        if (options.data.parentType === constants.PARAM_TYP_TEST_HOST_HEADER) {
          var host = cacheInstance._$getItemInCache(options.data.parentId);
          var data = util._$getValidJSON(host.header) || [];
          for (var i = 0; i < data.length; i++) {
            if (data[i].name === options.data.paramName) {
              break;
            }
          }
          data.splice(i, 1);
          data = this.formatEnvParams(data);
          cacheInstance._$updateItem({
            id: options.data.parentId,
            data: {
              header: JSON.stringify(data)
            }
          });
        } else {
          if (self.options.isModifyDatatype && self.options.parentType === constants.PARAM_TYP_MODIFY_DATATYPE) {
            var datatype = self.options.datatypes.find(function (dt) {
              return dt.id === self.options.parentId;
            });
            if (datatype) {
              // 已经创建过匿名类型了
              if (datatype.type === 2) {
                // 直接删除即可
                cacheInstance._$deleteItems({
                  data: options.data
                });
              } else {
                // 没创建过，先创建一个匿名类型
                var imports = [{
                  id: datatype.id,
                  vars: JSON.parse(JSON.stringify(datatype.params))
                }];
                var p = imports[0].vars.find(function (param) {
                  return param.id === options.data.parentId;
                });
                if (p) {
                  if (options.data.imports) {
                    p.imports = p.imports.filter(function (item) {
                      return item.id !== options.data.imports;
                    });
                  } else {
                    p.params = p.params.filter(function (item) {
                      return item.id !== options.data.params;
                    });
                  }
                } else {
                  if (options.data.imports) {
                    imports = imports.filter(function (item) {
                      return item.id !== options.data.imports;
                    });
                  }
                }
                cacheInstance._$updateItem({
                  data: {
                    datatypeId: self.options.datatypeId,
                    parentId: self.options.param.parentId,
                    parentType: self.options.param.parentType,
                    imports: imports,
                    typeName: datatype.name
                  },
                  id: self.options.param.id,
                  ext: {
                    create: true,
                    isModifyDatatype: true
                  }
                });
              }
            } else {
              _notify.show('找不到修改的数据模型！', 'error', 8000);
            }
          } else {
            cacheInstance._$deleteItems({
              data: options.data
            });
          }
        }
      },
      importDatatypes: function (options) {
        var cache = this.getCache();
        var cacheInstance = cache._$allocate({
          onitemsadd: function (evt) {
            self.initDatatypeList();
            var params = self.getInitParams();
            var dtList = self.datatypeCache._$getListInCache(self.listKey);
            (params || []).forEach(function (imp0rt) {
              if (imp0rt.imported) {
                (dtList || []).forEach(function (dt) {
                  if (dt.id === imp0rt.id) {
                    if (dt.version && dt.version.name) {
                      imp0rt.version = dt.version;
                    }
                  }
                });
              }
            });
            if (self.options.isModifyDatatype) {
              self.options.self.initDatatypeList();
              self.options.self.editor.$update();
              self.options.callback && self.options.callback(evt);
            }
            cacheInstance._$recycle();
            options.callback && options.callback(evt, params);
            // 如果返回了数据模型，资源会失效，需要重新去请求
            if (evt.data.datatypes && evt.data.datatypes.length) {
              var resCache = cacheMap[self.options.isModifyDatatype ? self.options.self.options.parentType : self.options.parentType];
              if (resCache) {
                resCache = resCache._$allocate({
                  onitemload: function () {
                    if (self.options.isModifyDatatype) {
                      self.options.onChange(options, evt);
                      if (evt.ext && evt.ext.create) {
                        self.options.self.editor.data.params = self.options.self.getInitParams();
                        self.options.self.editor.$update();
                      }
                    } else {
                      self.options.onChange(options, evt);
                    }
                  }.bind(this)
                });
                var res = resCache._$getItemInCache(self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId);
                if (!res || (self.options.isModifyDatatype && res.params)) {
                  self.options.onChange(options, evt);
                }
                resCache._$getItem({
                  id: self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId
                });
              }
            } else {
              self.options.onChange(options, evt);
            }
          }.bind(this),
          onitemupdate: function (evt) {
            var dtList = self.datatypeCache._$getListInCache(self.listKey);
            if (self.options.isModifyDatatype) {
              if (evt.ext && evt.ext.create) {
                var pam = evt.data.params[0];
                self.options.param.originals = self.options.param;
                Object.assign(self.options.param, pam);
                // 重新渲染当前modal的参数编辑器
                self.options.parentId = pam.type;
                self.options.parentType = util.db.PAM_TYP_ATTRIBUTE;
                self.options.self.initDatatypeList();
              }
              self.options.self.editor.$update();
              self.options.callback && self.options.callback(evt);

            }
            self.initDatatypeList();
            var params = self.getInitParams();
            (params || []).forEach(function (imp0rt) {
              if (imp0rt.imported) {
                (dtList || []).forEach(function (dt) {
                  if (dt.id === imp0rt.id) {
                    if (dt.version && dt.version.name) {
                      imp0rt.version = dt.version;
                    }
                  }
                });
              }
            });
            cacheInstance._$recycle();
            options.callback && options.callback(evt, params);
            // 如果返回了数据模型，资源会失效，需要重新去请求
            if (evt.data.datatypes && evt.data.datatypes.length) {
              var resCache = cacheMap[self.options.isModifyDatatype ? self.options.self.options.parentType : self.options.parentType];
              if (resCache) {
                resCache = resCache._$allocate({
                  onitemload: function () {
                    if (self.options.isModifyDatatype) {
                      self.options.onChange(options, evt);
                      if (evt.ext && evt.ext.create) {
                        self.options.self.editor.data.params = self.options.self.getInitParams();
                        self.options.self.editor.$update();
                      }
                    } else {
                      self.options.onChange(options, evt);
                    }
                  }.bind(this)
                });
                var res = resCache._$getItemInCache(self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId);
                if (!res || (self.options.isModifyDatatype && res.params)) {
                  self.options.onChange(options, evt);
                }
                resCache._$getItem({
                  id: self.options.isModifyDatatype ? self.options.self.options.parentId : self.options.parentId
                });
              }
            } else {
              self.options.onChange(options, evt);
            }
          }.bind(this)
        });

        function getParams() {
          var params = [];
          options.data.items[0].imports.forEach(function (item) {
            var dt = self.options.datatypes.filter(function (i) {
              return i.id === item.id;
            })[0];
            if (dt && dt.params) {
              dt.params.forEach(function (p) {
                params.push(p);
              });
            }
          });
          return params;
        }

        if (self.options.pattern) {
          var checkValidityResult = {};
          if (!this.checkValidity(getParams(), self.options.pattern, checkValidityResult)) {
            var errorMsg = self.options.errorMsg[checkValidityResult.inputErrorField].replace('{{path}}', checkValidityResult.inputErrorPath);
            errorMsg = errorMsg.replace('{{value}}', checkValidityResult.inputErrorValue);
            _notify.show(errorMsg, 'error', 8000);

            if (self.checkCreateTime(self.options.parentId)) {
              return;
            }
          }
        }
        // 参数词库校验
        if (!self.options.isHeader && self.options.useWordStock && !sessionStorage.getItem('not-check-word-stock')) {
          // 此处不对请求头做校验，如果要校验，需要注意的是 getParams 方法需要做相应的适配，否则会直接报错。
          var checkValidityResult = {};
          if (!this.checkInWordStock(getParams(), checkValidityResult)) {
            _notify.show('请求参数名称' + checkValidityResult.inputErrorPath + checkValidityResult.inputErrorMsg, 'error', 8000);
            return;
          }
        }
        if (self.options.format === util.db.MDL_FMT_HASH && self.options.resSchemaJSON) {
          var error = [];
          options.data.items.forEach(function (item) {
            if (item.parentId === self.options.parentId && item.parentType === self.options.parentType) {
              item.imports.forEach(function (ipt) {
                var datatype = self.options.datatypes.find(function (dt) {
                  return dt.id === ipt.id;
                });
                if (datatype) {
                  datatype.params.forEach(function (param) {
                    if (param.ignored !== 1) {
                      var checkResult = util._$checkSingleSchema(param, self.options.resSchemaJSON, self.options.datatypes);
                      if (!checkResult.result) {
                        error.push(checkResult.error);
                      }
                    }
                  }, this);
                }
              }, this);
            }
          }, this);
          if (error.length) {
            error = error.length === 1 ? error[0] : '<br>' + error.join('<br>');
            _notify.show(self.options.schemaErrorMsg.replace('{{value}}', '').replace('{{error}}', error), 'error', 8000);
            if (self.checkCreateTime(self.options.parentId)) {
              return;
            }
          }
        }
        if (self.options.isModifyDatatype && self.options.parentType === constants.PARAM_TYP_MODIFY_DATATYPE) {
          var datatype = self.options.datatypes.find(function (dt) {
            return dt.id === self.options.parentId;
          });
          if (datatype) {
            // 已经创建过匿名类型了
            if (datatype.type === 2) {
              // 直接添加即可
              cacheInstance._$addItems({
                data: options.data
              });
            } else {
              // 没创建过，先创建一个匿名类型
              // 可能有导入重复的可能，需要做检验
              var dt = self.options.datatypes.find(function (item) {
                return item.id === self.options.parentId;
              });
              if (dt) {
                var importIds = [];
                dt.params.forEach(function getImportIds(param) {
                  if (param.datatypeId > 0) {
                    if (importIds.indexOf(param.datatypeId) === -1) {
                      importIds.push(param.datatypeId);
                    }
                    var paramDt = self.options.datatypes.find(function (item) {
                      return item.id === param.datatypeId;
                    });
                    if (paramDt) {
                      paramDt.params.forEach(function (p) {
                        getImportIds(p);
                      });
                    }
                  }
                });
                var hasImpoted = false;
                var hasImpotedIds = [];
                options.data.items.forEach(function (item) {
                  item.imports.forEach(function (ipt) {
                    if (importIds.indexOf(ipt.id) !== -1) {
                      hasImpoted = true;
                      if (hasImpotedIds.indexOf(ipt.id) === -1) {
                        hasImpotedIds.push(ipt.id);
                      }
                    }
                  });
                });
                if (hasImpoted) {
                  var name = '';
                  hasImpotedIds.forEach(function (id) {
                    var importDt = self.options.datatypes.find(function (d) {
                      return d.id === id;
                    });
                    if (importDt) {
                      name && (name += ',');
                      name += importDt.name;
                    }
                  });
                  _notify.show('数据模型 ' + name + ' 已经被引入！', 'error', 3000);
                  return;
                }
              }
              var imports = [{
                id: datatype.id,
                vars: JSON.parse(JSON.stringify(datatype.params))
              }];
              options.data.items.forEach(function (item) {
                var p = imports[0].vars.find(function (pam) {
                  return pam.id === item.parentId;
                });
                if (p) {
                  item.imports.forEach(function (ipt) {
                    p.imports.push(ipt);
                  });
                } else {
                  item.imports.forEach(function (ipt) {
                    imports.push(ipt);
                  });
                }
              });

              cacheInstance._$updateItem({
                data: {
                  datatypeId: self.options.datatypeId,
                  parentId: self.options.param.parentId,
                  parentType: self.options.param.parentType,
                  imports: imports,
                  typeName: datatype.name
                },
                id: self.options.param.id,
                ext: {
                  create: true,
                  isModifyDatatype: true
                }
              });
            }
          } else {
            _notify.show('找不到修改的数据模型！', 'error', 8000);
          }
        } else {
          // 这里面需要调用 _$addItems 方法，它会处理(更新)后端返回的 datatypes
          cacheInstance._$addItems({
            data: options.data
          });
        }
      },
      changeFormat: function (options) {
        if (options.data.format === this.data.format) {
          return;
        }
        var updateFormat = function () {
          switch (this.data.parentType) {
            case util.db.PAM_TYP_ATTRIBUTE:
              return this.changeDatatypeFormat(options);
            case util.db.PAM_TYP_INPUT:
            case util.db.PAM_TYP_RPC_INPUT:
              options.data.reqFormat = options.data.format;
              delete options.data.format;
              return this.changeInterfaceFormat(options, this.data.parentType === util.db.PAM_TYP_INPUT ? 'interface' : 'rpc');
            case util.db.PAM_TYP_OUTPUT:
            case util.db.PAM_TYP_RPC_OUTPUT:
              options.data.resFormat = options.data.format;
              delete options.data.format;
              return this.changeInterfaceFormat(options, this.data.parentType === util.db.PAM_TYP_OUTPUT ? 'interface' : 'rpc');
          }
        }.bind(this);
        var modal = Modal.confirm({content: '切换类型将会导致现有数据丢失，确定切换成 “' + options.formatName + '” 类型吗？'});
        modal.$on('ok', updateFormat);
      },
      changeDatatypeFormat: function (options) {
        var datatypeCache = caches.datatype._$allocate({
          onitemupdate: function (evt) {
            datatypeCache._$recycle();
            self.initDatatypeList();
            var params = self.getInitParams();
            options.callback && options.callback(evt, params);
            self.options.onChange();
          }.bind(this)
        });
        datatypeCache._$updateItem({
          data: options.data,
          id: options.id
        });
      },
      changeInterfaceFormat: function (options, type) {
        var cache = caches[type]._$allocate({
          onitemupdate: function (evt) {
            cache._$recycle();
            self.initDatatypeList();
            var params = self.getInitParams();
            options.callback && options.callback(evt, params);
            self.options.onChange();
          }.bind(this)
        });
        if (type === 'interface' && options.data.resFormat && options.data.resFormat !== util.db.MDL_FMT_HASH && self.options.resSchemaJSON) {
          _notify.show(self.options.schemaErrorMsg.replace('{{value}}', '').replace('{{error}}', '响应类型不为Hash！'), 'error', 8000);
          if (self.checkCreateTime(self.options.parentId)) {
            return;
          }
        }
        cache._$updateItem({
          data: options.data,
          id: options.id
        });
      },
      formatEnvParams: function (params) {
        var data = [];
        params.forEach(function (item) {
          data.push({
            name: item.name,
            defaultValue: item.defaultValue,
            description: item.description,
            position: item.position
          });
        });
        return data;
      },
      checkValidity: function (params, pattern, checkValidityResult) {
        var options = {
          format: self.options.format,
          parentType: self.options.parentType,
          parentId: self.options.parentId,
          datatypes: self.options.datatypes,
        };
        return params.every(function (param) {
          // index 标识判断到哪个param，好给出错误提示
          return Object.keys(pattern).every(function (key) {
            var regex;
            var isValidFn;
            try {
              regex = new RegExp(pattern[key]);
              isValidFn = function (value) {
                return regex.test(value);
              };
              return editorUtil.checkParamFieldValidity(param, key, isValidFn, checkValidityResult, options);
            } catch (e) {
              console.log('Spec regExp is invalid: ' + pattern[key]);
            }
          });
        });
      },
      checkInWordStock: function (params, checkValidityResult) {
        var key = 'name';
        var isValidFn = function (value, checkResult) {
          if (!checkResult) {
            checkResult = {};
          }
          var word = self.options.words.find(function (w) {
            return w.name === value;
          });
          if (!word) {
            checkResult.inputErrorMsg = '未在参数字典内定义';
            return false;
          }
          if (word && word.forbidStatus !== dbConst.WORD_STATUS_NORMAL) {
            checkResult.inputErrorMsg = '在参数字典内被禁用';
            return false;
          }
          return true;
        };
        var options = {
          format: self.options.format,
          parentType: self.options.parentType,
          parentId: self.options.parentId,
          datatypes: self.options.datatypes,
        };
        return params.every(function (param) {
          return editorUtil.checkParamFieldValidity(param, key, isValidFn, checkValidityResult, options);
        });
      },

    });
  };

  /**
   * 检查接口创建时间是否晚于规范创建时间
   * @param {Number} id 接口id
   * @return {Boolean} true 表示接口创建时间晚于规范创建时间，限制修改 false则反之
   */
  pro.checkCreateTime = function (id) {
    var inCache = caches.interface._$allocate();
    var progCache = caches.progroup._$allocate();
    var interface = inCache._$getItemInCache(id);
    inCache._$recycle();
    if (interface) {
      var pg = progCache._$getItemInCache(interface.progroupId);
      // 接口创建时间小于规范创建时间，只做提示不做创建和修改的限制，否则限制修改
      if (pg && (!pg.httpSpec.createTime || pg.httpSpec.createTime <= interface.createTime)) {
        progCache._$recycle();
        return true;
      }
    }
    progCache._$recycle();
    return false;
  };

  // 获取初始化时的参数列表
  pro.getInitParams = function () {
    switch (this.options.parentType) {
      case util.db.PAM_TYP_ATTRIBUTE:
        // 数据模型的预览页面
        var dt = this.options.datatypes.find(function (dt) {
          return dt.id === this.options.parentId;
        }, this);
        if (dt) {
          this.options.format = dt.format;
          var params = JSON.parse(JSON.stringify(dt.params));
          return editorUtil.formatParams(params, this.options.datatypes, this.options);
        }
        return [];
      case util.db.PAM_TYP_INPUT:
        // HTTP 接口请求参数的详情页面
        var interfaceCache = caches.interface._$allocate();
        var interfaceData = interfaceCache._$getItemInCache(this.options.parentId);
        this.options.format = interfaceData.reqFormat;
        this.options.showRequired = true;
        var params = JSON.parse(JSON.stringify(interfaceData.params.inputs));
        return editorUtil.formatParams(params, this.options.datatypes, this.options);
      case util.db.PAM_TYP_OUTPUT:
        // HTTP 接口响应参数的详情页面
        var projCache = caches.project._$allocate();
        this.options.showRequired = !!projCache._$getItemInCache(this.options.pid).resParamRequired;
        projCache._$recycle();
        var interfaceCache = caches.interface._$allocate();
        var interfaceData = interfaceCache._$getItemInCache(this.options.parentId);
        this.options.format = interfaceData.resFormat;
        var params = JSON.parse(JSON.stringify(interfaceData.params.outputs));
        return editorUtil.formatParams(params, this.options.datatypes, this.options);
      case util.db.PAM_TYP_RPC_INPUT:
        // RPC接口请求参数的详情页面
        var rpcCache = caches.rpc._$allocate();
        var rpcData = rpcCache._$getItemInCache(this.options.parentId);
        this.options.format = rpcData.reqFormat;
        this.options.showRequired = true;
        var params = JSON.parse(JSON.stringify(rpcData.params.inputs));
        return editorUtil.formatParams(params, this.options.datatypes, this.options);
      case util.db.PAM_TYP_RPC_OUTPUT:
        // RPC接口响应参数的详情页面
        var projCache = caches.project._$allocate();
        this.options.showRequired = !!projCache._$getItemInCache(this.options.pid).resParamRequired;
        projCache._$recycle();
        var rpcCache = caches.rpc._$allocate();
        var rpcData = rpcCache._$getItemInCache(this.options.parentId);
        this.options.format = rpcData.resFormat;
        var params = JSON.parse(JSON.stringify(rpcData.params.outputs));
        return editorUtil.formatParams(params, this.options.datatypes, this.options);
      case 0:
        // 接口的请求头参数、页面的查询参数的 parentType 都是 0
        if (this.options.isHeader) {
          // 接口请求头
          var interfaceCache = caches.interface._$allocate();
          var interfaceData = interfaceCache._$getItemInCache(this.options.parentId);
          // 肯定是哈希类型
          this.options.format = util.db.MDL_FMT_HASH;
          this.options.isNormalParam = true;
          var params = JSON.parse(JSON.stringify(interfaceData.params.reqHeaders));
          return editorUtil.formatParams(params, this.options.datatypes, this.options);
        } else {
          // 页面查询参数
          var pageCache = caches.page._$allocate();
          var pageData = pageCache._$getItemInCache(this.options.parentId);
          // 肯定是哈希类型
          this.options.format = util.db.MDL_FMT_HASH;
          var params = JSON.parse(JSON.stringify(pageData.params));
          return editorUtil.formatParams(params, this.options.datatypes, this.options);
        }
      case 1:
        // 接口的响应头参数、页面模板的预填参数的 parentType 都是 1
        if (this.options.isHeader) {
          // 接口响应头
          var interfaceCache = caches.interface._$allocate();
          var interfaceData = interfaceCache._$getItemInCache(this.options.parentId);
          // 肯定是哈希类型
          this.options.format = util.db.MDL_FMT_HASH;
          this.options.isNormalParam = true;
          var params = JSON.parse(JSON.stringify(interfaceData.params.resHeaders));
          return editorUtil.formatParams(params, this.options.datatypes, this.options);
        } else {
          // 页面模板的预填参数
          var templateCache = caches.template._$allocate();
          var templateData = templateCache._$getItemInCache(this.options.parentId);
          // 肯定是哈希类型
          this.options.format = util.db.MDL_FMT_HASH;
          var params = JSON.parse(JSON.stringify(templateData.params));
          return editorUtil.formatParams(params, this.options.datatypes, this.options);
        }
      case constants.PARAM_TYP_TEST_HOST_HEADER:
        var hostCache = caches.host._$allocate();
        var hostData = hostCache._$getItemInCache(this.options.parentId);
        this.options.format = util.db.MDL_FMT_HASH;
        this.options.isNormalParam = true;
        var params = util._$getValidJSON(hostData.header);
        if (Array.isArray(params)) {
          editorUtil.formatParams(params, this.options.datatypes, this.options);
        } else {
          params = [];
        }
        return params;
      case constants.PARAM_TYP_MODIFY_DATATYPE:
        // 接口修改数据模型，需要以导入的形式展示！！
        var dt = this.options.datatypes.find(function (dt) {
          return dt.id === this.options.parentId;
        }, this);
        if (dt) {
          this.options.format = dt.format;
          var params = JSON.parse(JSON.stringify(dt.params));
          params = editorUtil.formatParams(params, this.options.datatypes, this.options);
          if (dt.type === 2) {
            return params;
          } else {
            var ipts = [];
            params.forEach(function getParam(param) {
              if (param.imported) {
                param.params.forEach(function (p) {
                  getParam(p);
                });
              } else {
                param.datatypeId = dt.id;
                param.datatypeName = dt.name;
                ipts.push(param);
              }
            });
            return [{
              imported: 1,
              name: dt.name,
              id: dt.id,
              params: ipts
            }];
          }
        }
        return [];
      default:
        break;
    }
  };

  // 获取组件的数据，公开方法
  pro._$getData = function () {
    // 防止外部程序在没有初始化完成时就会调用
    if (this.editor) {
      var data = this.editor.$refs.editorCore.getData();
      var result = editorUtil.getParams(data.params, data.format);
      delete data.params;
      return Object.assign(data, result);
    }
  };

  // 重置，公开方法
  pro._$reset = function () {
    this.editor && this.editor.destroy();
  };

});
