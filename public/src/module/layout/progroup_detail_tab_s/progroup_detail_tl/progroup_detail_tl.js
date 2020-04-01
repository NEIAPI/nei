NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/cache/varmap_cache',
  'pro/cache/spec_cache',
  'pro/cache/user_cache',
  'pro/select2/select2',
  'pro/stripedlist/stripedlist',
  'pro/params_preview/params_preview',
  'json!{lib}/../../fb-modules/config/db.json',
  'pro/notify/notify',
  'pro/common/util',
  'pro/modal/modal',
  'pro/modal/modal_agree',
  'pro/ace/ace'
], function (_k, _e, _u, _v, _t, _l, _jst, _m, _pgCache, _VMCache, _specCache, _userCache, _s2, _sl, _editor, dbConst, _notify, _cu, modal, _pal, aceEditor, _p, _pro) {
  /**
   * 项目组详情设置模块
   * @class   {wd.m._$$ModuleProGroupDetailTLM}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupDetailTL = _k._$klass();
  _pro = _p._$$ModuleProGroupDetailTL._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-d-tl')
    );
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
  };
  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__pgid = _options.param.pgid;
    this._loadedTime = 0;
    this.__updateTime = 0;
    this.__updateNum = 2;
    this.__VMCache = _VMCache._$$CacheVarMap._$allocate({
      onlistload: this.__onloadHandler._$bind(this)
    });
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
      onitemload: this.__onloadHandler._$bind(this),
      onitemupdate: function (evt) {
        if (evt.ext && evt.ext.action === 'updateFlag') {
          this.__updateFlag(evt.ext.name);
        }
      }.bind(this)
    });
    //规范缓存对象
    this.__specCache = _specCache._$$CacheSpec._$allocate({
      onlistload: this.__onloadHandler._$bind(this)
    });
    this.__super(_options);
    this.__doInitDomEvent([[
      _pgCache._$$CacheProGroup, 'update',
      function (_result) {
        this.__pgCache._$getItem(_result.data.id);
        this.__VMCache._$getList({
          key: this._pgVMKey,
          data: {
            parentId: this.__pgid,
            parentType: dbConst.SPC_MAP_PROGROUP
          },
          ext: {type: 'VMCache'}
        });
        if (!!_result.ext && !!_result.ext.updateSpec && _result.ext.updateSpec) {
          this.__specCache._$getList({
            key: _specCache._$cacheKey,
            ext: {type: 'specCache'}
          });
        }
        if (!!_result.ext && !!_result.ext.import) {
          this.__renderHttpSpecList(_result.data.httpSpec, true);
        }
      }._$bind(this)
    ]]);
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    _e._$addClassName(this.__body, 'f-dn');
    _e._$delClassName(this.__loading, 'f-dn');
    this.__super(_options);
    this.__pgCache._$getItem({id: this.__pgid});
    this._pgVMKey = this.__VMCache._$getListKey(this.__pgid, dbConst.SPC_MAP_PROGROUP);
    this.__VMCache._$getList({
      key: this._pgVMKey,
      data: {
        parentId: this.__pgid,
        parentType: dbConst.SPC_MAP_PROGROUP
      }
    });
    this.__specCache._$getList({
      key: _specCache._$cacheKey
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    if (this.__webSpecSelect) {
      this.__webSpecSelect = this.__webSpecSelect.destroy();
    }
    if (this.__aosSpecSelect) {
      this.__aosSpecSelect = this.__aosSpecSelect.destroy();
    }
    if (this.__iosSpecSelect) {
      this.__iosSpecSelect = this.__iosSpecSelect.destroy();
    }
    if (this.__testSpecSelect) {
      this.__testSpecSelect = this.__testSpecSelect.destroy();
    }
    if (this.__webSpecEidtor) {
      this.__webSpecEidtor = this.__webSpecEidtor._$recycle();
    }
    if (this.__aosSpecEidtor) {
      this.__aosSpecEidtor = this.__aosSpecEidtor._$recycle();
    }
    if (this.__iosSpecEidtor) {
      this.__iosSpecEidtor = this.__iosSpecEidtor._$recycle();
    }
    if (this.__testSpecEidtor) {
      this.__testSpecEidtor = this.__testSpecEidtor._$recycle();
    }
    this.__doClearDomEvent();
  };
  /**
   * 参数编辑器实例化
   * @param  {Object} parent 插入父节点
   * @param  {Array} list    数据
   * @return {Object}        参数编辑器实例
   */
  _pro.__newEditor = function (options) {
    return _editor._$$Editor._$allocate({
      parent: options.parent,
      parentId: this.__pgid,
      parentType: dbConst.SPC_MAP_PROGROUP,
      params: options.list,
      format: 7,
      specType: options.specType,
      level: this.__level,
      shape: 'progroup',
      listKey: options.listKey
    });
  };

  /**
   * 展开收起按钮事件添加
   * @param  {Object} parent 容器节点
   * @param  {String} type   区别工程类型
   * @return {Void}
   */
  _pro.__addShowHideEvent = function (parent, type) {
    var className = 'tool-' + type;
    var subParent = _e._$getByClassName(parent, className)[0];
    var btn = _e._$getByClassName(subParent, 'j-open')[0];
    this.__doInitDomEvent([[
      btn, 'click', this.__showHide._$bind(this, subParent, type)
    ]]);
  };
  /**
   * 展开收起处理函数
   * @param  {Object} parent 列表父节点
   * @return {Void}
   */
  _pro.__showHide = function (parent, type) {
    var list = _e._$getByClassName(parent, 'tool-part-content')[0];
    if (!!_e._$hasClassName(list, 'f-dn')) {
      _e._$delClassName(list, 'f-dn');
      var target = _e._$getByClassName(parent, 'u-icon-arrow-down-normal')[0];
      _e._$delClassName(target, 'u-icon-arrow-down-normal');
      _e._$addClassName(target, 'u-icon-arrow-up-normal');
      _e._$attr(target.parentNode, 'title', '收起');
    } else {
      _e._$addClassName(list, 'f-dn');
      var target = _e._$getByClassName(parent, 'u-icon-arrow-up-normal')[0];
      _e._$delClassName(target, 'u-icon-arrow-up-normal');
      _e._$addClassName(target, 'u-icon-arrow-down-normal');
      _e._$attr(target.parentNode, 'title', '展开');
    }
    //清除被自动选中的文本
    _cu.__clearSelections();
  };

  _pro.__renderHttpSpecList = function (httpSpec, notInitDomEvent) {
    var spec = httpSpec ? httpSpec : this.__progroup.httpSpec;
    var fields = ['path', 'param', 'paramdesc', 'method', 'tag'];
    fields.forEach(function (item) {
      var value = spec[item];
      var input = _e._$getByClassName(this.__body, 'spec-item-' + item)[0];
      var inputDescription = _e._$getByClassName(this.__body, 'spec-item-' + item + '-description')[0];
      input.value = value;
      inputDescription.value = spec[item + 'Description'];
      if (!this.__canEdit) {
        input.setAttribute('readonly', true);
        inputDescription.setAttribute('readonly', true);
      }
      if (!notInitDomEvent) {
        this.__doInitDomEvent([[
          input, 'change',
          this.__doUpdateHttpSpec.bind(this, item)
        ]]);
        this.__doInitDomEvent([[
          input, 'focus',
          function () {
            _e._$delClassName(input, 'error-ipt');
          }
        ]]);
        this.__doInitDomEvent([[
          input, 'blur',
          function () {
            var value = input.value;
            try {
              new RegExp(value);
            } catch (e) {
              _e._$addClassName(input, 'error-ipt');
              _notify.show('错误的正则表达式！', 'error', 2000);
            }
          }
        ]]);
        this.__doInitDomEvent([[
          inputDescription, 'change',
          function () {
            var value = inputDescription.value;
            var httpSpec = this.__progroup.httpSpec;
            if (httpSpec[item + 'Description'].trim() === value.trim()) {
              return;
            }
            httpSpec[item + 'Description'] = value;
            this.__pgCache._$updateItem({
              id: this.__pgid,
              data: {
                httpSpec: httpSpec
              }
            });
          }.bind(this)
        ]]);
      }
    }, this);
    if (this.__resSchemaEditor) {
      this.__resSchemaEditor = this.__resSchemaEditor.destroy();
    }
    if (this.__interfaceSchemaEditor) {
      this.__interfaceSchemaEditor = this.__interfaceSchemaEditor.destroy();
    }

    // 初始化参数编辑器
    this.__resSchemaEditor = new aceEditor({
      data: {
        showGutter: true,
        readOnly: !this.__canEdit,
        highlightActiveLine: true,
        maxLines: 9,
        defaultValue: (function (data) {
          var schema = _cu._$getValidJSON(data);
          return schema ? JSON.stringify(schema, null, '  ') : '';
        })(spec.resSchema)
      }
    }).$inject(_e._$getByClassName(this.__body, 'editor')[0])
      .$on('blur', function (options) {
        // 检查，包括pattern的检查，并提示
        var schema = _cu._$getValidJSON(options.data);
        if (schema == null && options.data.trim() !== '') {
          _notify.show('JSON格式不正确！', 'error', 3000);
          return;
        } else if (Array.isArray(schema)) {
          // 检查 pattern
          if (spec.param) {
            var regex;
            try {
              regex = new RegExp(spec.param);
            } catch (e) {
            }
            if (regex) {
              var result = schema.every(function (rule) {
                if (rule) {
                  return regex.test(rule.name);
                } else {
                  return true;
                }
              });
              if (!result) {
                _notify.show('响应参数' + rule.name + '不符合HTTP接口规范【' + (spec.paramDescription ? spec.paramDescription : _u._$escape(spec.param)) + '】');
                return;
              }
            }
          }
          // 检查是否变更
          var value = this.__progroup.httpSpec.resSchema;
          if (value.trim() === JSON.stringify(schema)) {
            return;
          }
        }
        // 压缩空格
        this.__pgCache._$updateItem({
          id: this.__pgid,
          data: {
            httpSpec: {
              resSchema: JSON.stringify(schema)
            }
          }
        });
      }.bind(this));
    // 响应结果描述初始化
    var resDescriptionInput = _e._$getByClassName(this.__body, 'spec-item-res-schema-description')[0];
    resDescriptionInput.value = spec.resSchemaDescription || '';
    if (!this.__canEdit) {
      resDescriptionInput.setAttribute('readonly', true);
    }
    if (!notInitDomEvent) {
      this.__doInitDomEvent([[
        resDescriptionInput, 'change',
        function () {
          var value = resDescriptionInput.value;
          var httpSpec = this.__progroup.httpSpec;
          if (httpSpec.resSchemaDescription.trim() === value.trim()) {
            return;
          }
          httpSpec.resSchemaDescription = value;
          this.__pgCache._$updateItem({
            id: this.__pgid,
            data: {
              httpSpec: httpSpec
            }
          });
        }.bind(this)
      ]]);
    }

    // 初始化接口出入参规范编辑器
    this.__interfaceSchemaEditor = new aceEditor({
      data: {
        showGutter: true,
        readOnly: !this.__canEdit,
        highlightActiveLine: true,
        maxLines: 9,
        defaultValue: (function (data) {
          var schema = _cu._$getValidJSON(data);
          return schema ? JSON.stringify(schema, null, '  ') : '';
        })(spec.interfaceSchema)
      }
    }).$inject(_e._$getByClassName(this.__body, 'editor')[1])
      .$on('blur', function (options) {
        // 检查，包括pattern的检查，并提示
        var schema = _cu._$getValidJSON(options.data);
        if (schema == null && options.data.trim() !== '') {
          _notify.show('JSON格式不正确！', 'error', 3000);
          return;
        } else if (schema) {
          // validate schema
          try {
            var schemaKeys = Object.keys(schema);
            for (var i = 0; i < schemaKeys.length; i++) {
              var innerKeys = Object.keys(schema[schemaKeys[i]]);
              if (innerKeys.length > 0) {
                for (var j = 0; j < innerKeys.length; j++) {
                  if (['req', 'res', 'reqMethod'].indexOf(innerKeys[j]) > -1) {
                    if (innerKeys[j] === 'reqMethod') {
                      var reqMethod = schema[schemaKeys[i]][innerKeys[j]];
                      if (
                        typeof reqMethod !== 'string'
                        && ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].indexOf(reqMethod) < 0
                      ) {
                        throw 'Schema not valid';
                      }
                    } else {
                      var ajvSchema = schema[schemaKeys[i]][innerKeys[j]];
                      if (!this.ajv) {
                        this.ajv = new Ajv({allErrors: true});
                      }
                      // check if ajv schema is valid
                      var validate = this.ajv.compile({
                        'type': 'object',
                        'properties': {
                          'type': {
                            'type': 'string',
                            'pattern': '^object$'
                          },
                          'properties': {
                            'type': 'object'
                          }
                        },
                        'required': ['properties', 'type'],
                        'minProperties': 1
                      });
                      if (!validate(ajvSchema)) {
                        throw 'Schema not valid';
                      } else {
                        this.ajv.compile(ajvSchema);
                      }
                    }
                  } else {
                    throw 'InnerKeys not valid';
                  }
                }
              } else {
                throw 'InnerKeys Missing';
              }
            }
          } catch (e) {
            _notify.show('接口出入参规范格式错误', 'error', 3000);
            return;
          }
        }
        // 检查是否变更
        var value = this.__progroup.httpSpec.interfaceSchema;
        if (value.trim() === JSON.stringify(schema)) {
          return;
        }
        // 压缩空格
        this.__pgCache._$updateItem({
          id: this.__pgid,
          data: {
            httpSpec: {
              interfaceSchema: schema ? JSON.stringify(schema) : ''
            }
          }
        });
      }.bind(this));

    // 初始化接口出入参描述初始化
    var interfaceDescriptionInput = _e._$getByClassName(this.__body, 'spec-item-interface-schema-description')[0];
    interfaceDescriptionInput.value = spec.interfaceSchemaDescription || '';
    if (!this.__canEdit) {
      interfaceDescriptionInput.setAttribute('readonly', true);
    }
    if (!notInitDomEvent) {
      this.__doInitDomEvent([[
        interfaceDescriptionInput, 'change',
        function () {
          var value = interfaceDescriptionInput.value;
          var httpSpec = this.__progroup.httpSpec;
          if (httpSpec.interfaceSchemaDescription.trim() === value.trim()) {
            return;
          }
          httpSpec.interfaceSchemaDescription = value;
          this.__pgCache._$updateItem({
            id: this.__pgid,
            data: {
              httpSpec: httpSpec
            }
          });
        }.bind(this)
      ]]);
    }
  };

  _pro.__doUpdateHttpSpec = function (type, evt) {
    var value = evt.target.value.trim();
    var oldValue = this.__progroup.httpSpec[type].trim();
    if (value === oldValue) return;
    try {
      new RegExp(value);
      var httpSpec = {
        path: this.__progroup.httpSpec.path,
        param: this.__progroup.httpSpec.param,
        paramdesc: this.__progroup.httpSpec.paramdesc,
        method: this.__progroup.httpSpec.method,
        tag: this.__progroup.httpSpec.tag
      };
      httpSpec[type] = value;
      this.__pgCache._$updateItem({
        id: this.__pgid,
        data: {
          httpSpec: httpSpec
        }
      });
    } catch (e) {
      var input = _e._$getByClassName(this.__body, 'spec-item-' + type)[0];
      _e._$addClassName(input, 'error-ipt');
      _notify.show('错误的正则表达式！', 'error', 2000);
    }
  };

  /**
   * 工程规范映射列表数据处理
   * @return {Void}
   */

  _pro.__renderVMList = function () {
    // 规范区分
    var webSpec = [], aosSpec = [], iosSpec = [], testSpec = [];
    //数组存放不同类型工程的映射
    //取得工程名字
    var spec = {
      web: this.__progroup.toolSpecWeb,
      aos: this.__progroup.toolSpecAos,
      ios: this.__progroup.toolSpecIos,
      test: this.__progroup.toolSpecTest
    };
    //选择出不同的规范类型
    _u._$forEach(this.__specList, function (item) {
      var specItem = {
        name: item.name,
        id: item.id
      };
      switch (item.type) {
        case 0: //web工程
          if (this.__canEdit) {
            if (item.creatorId == this.__userId) {
              webSpec.push(specItem);
            }
          }
          if (spec.web == item.id && item.creatorId != this.__userId) {
            specItem.isCreator = true;
            webSpec.push(specItem);
          }
          break;
        case 1: //aos工程
          if (this.__canEdit) {
            if (item.creatorId == this.__userId) {
              aosSpec.push(specItem);
            }
          }
          if (spec.aos == item.id && item.creatorId != this.__userId) {
            specItem.isCreator = true;
            aosSpec.push(specItem);
          }
          break;
        case 2: //ios工程
          if (this.__canEdit) {
            if (item.creatorId == this.__userId) {
              iosSpec.push(specItem);
            }
          }
          if (spec.ios == item.id && item.creatorId != this.__userId) {
            specItem.isCreator = true;
            iosSpec.push(specItem);
          }
          break;
        case 3: //测试工程
          if (this.__canEdit) {
            if (item.creatorId == this.__userId) {
              testSpec.push(specItem);
            }
          }
          if (spec.test == item.id && item.creatorId != this.__userId) {
            specItem.isCreator = true;
            testSpec.push(specItem);
          }
          break;
      }
    }._$bind(this));
    var specObj = {
      web: webSpec,
      aos: aosSpec,
      ios: iosSpec,
      test: testSpec
    };
    //取出不同类型的VMList并拼装数据
    this.__filterVM('0', 'Web', spec);
    this.__filterVM('1', 'Aos', spec);
    this.__filterVM('2', 'Ios', spec);
    this.__filterVM('3', 'Test', spec);
    //处理规范选择器（工程规范）
    this.__handleSpecSelect('web', spec, specObj, this.__editable);
    this.__handleSpecSelect('aos', spec, specObj, this.__editable);
    this.__handleSpecSelect('ios', spec, specObj, this.__editable);
    this.__handleSpecSelect('test', spec, specObj, this.__editable);
  };
  /**
   * 拼装映射规则列表
   * @param  {Number} type  获取对应类型的映射规则的listKey的 number值
   * @param  {string} listtype  对应映射规则的类型
   * @param  {object} spec  选中工程的信息
   * @return {Void}
   */
  _pro.__filterVM = function (type, listtype, spec) {
    var list = this.__VMCache._$getListInCache(this._pgVMKey + '-' + type);
    var spectype = listtype.charAt(0).toLowerCase() + listtype.slice(1, listtype.length);
    _u._$forEach(list, function (item) {
      var vmItem = {
        orgName: item.orgName,
        varName: item.varName,
        id: item.id,
        parentType: item.parentType
      };
      vmItem.level = item.parentType == 0 ? 0 : 1;
      if (item.parentType == 0) {
        if (spec[spectype] == item.parentId) {
          this['__spec' + listtype + 'VM'].push(vmItem);
        }
      } else {
        this['__spec' + listtype + 'VM'].push(vmItem);
      }
    }._$bind(this));
  };

  /**
   * 请求成功处理事件
   * @return {Void}
   */
  _pro.__onloadHandler = function (evt) {
    this._loadedTime++;
    if (this._loadedTime < 3) {
      return;
    } else if (this._loadedTime > 3) {
      //this.__loadedTime > 3 表示修改了工程规范，重新请求VMCache
      this.__updateTime++;
      //this.__updateTime 等于2 表示 pg_cache 和VMCache都重新请求回来了，重新拼装工程规范的变量映射表
      //updateNum默认为2，如果之前选中的不是自己创建的，那么工程规范二次选择时，重新获取specCache
      if (this.__updateTime < this.__updateNum) {
        if (!!evt && !!evt.ext && !!evt.ext.type && evt.ext.type == 'specCache') {
          this.__specList = this.__specCache._$getListInCache(_specCache._$cacheKey);
        }
        return;
      }
      this.__updateTime = 0;
      this.__vmList = this.__VMCache._$getListInCache(this._pgVMKey);
      this.__filterVMList(this.__vmList);
      this.__renderVMList();
      return;
    }
    // 获取当前项目组
    this.__progroup = this.__pgCache._$getItemInCache(this.__pgid);
    this.__userId = _userCache._$$CacheUser._$allocate()._$getUserInCache().id;
    _jst._$render(this.__body, 'progroup-toollist', {
      key: this.__progroup.toolKey
    });

    this.__canEdit = this.__pgCache._$getPrivilege(this.__pgid).isAdminOrCreator;
    if (this.__canEdit) {
      this.__level = 1;
      this.__editable = true;
    } else {
      this.__level = 0;
      this.__editable = false;
    }

    // 获取所有工程规范
    this.__specList = this.__specCache._$getListInCache(_specCache._$cacheKey);
    //获取所有映射列表
    this.__vmList = this.__VMCache._$getListInCache(this._pgVMKey);
    this.__filterVMList(this.__vmList);
    //拼装映射列表的数据
    this.__renderVMList();

    // custom settings
    this.__flagCtn = this.__body.querySelector('.tool-setting .t-part-content');

    if (this.__canEdit) {
      _e._$delClassName(this.__flagCtn, 'project-view-mode');
      this.__doInitDomEvent([[
        this.__flagCtn, 'click', this.__doUpdateFlag.bind(this)
      ]]);
    } else {
      _e._$addClassName(this.__flagCtn, 'project-view-mode');
    }
    this.__updateFlag();
    this.__renderHttpSpecList();
    // 添加每个工程展开收起功能
    var listParent = _e._$getByClassName(this.__body, 'tool-info')[0];
    this.__addShowHideEvent(listParent, 'http');
    this.__addShowHideEvent(listParent, 'web');
    this.__addShowHideEvent(listParent, 'aos');
    this.__addShowHideEvent(listParent, 'ios');
    this.__addShowHideEvent(listParent, 'test');

    // 添加导入
    this.__importPgBtn = _e._$getByClassName(this.__body, 'import-httpspec')[0];
    if (!this.__canEdit) {
      _e._$addClassName(this.__importPgBtn, 'u-btn-disabled');
      _e._$attr(this.__importPgBtn, 'disabled', 'disabled');
    } else {
      _e._$delClassName(this.__importPgBtn, 'u-btn-disabled');
      this.__importPgBtn.removeAttribute('disabled');
    }
    this.__doInitDomEvent([[
      this.__importPgBtn, 'click', function () {
        var projectGroups = this.__pgCache._$getListInCache(_pgCache._$cacheKey).filter(function (item) {
          return item.id != this.__pgid;
        }, this);
        this.__selectProgroupLayer = new _pal({
          data: {
            class: 'm-modal-import',
            title: '选择项目组',
            bottonText: '导入',
            source: projectGroups
          }
        }).$on('ok', function (result) {
          if (result) {
            var progroup = this.__pgCache._$getItemInCache(result.id);
            var importSpec = function () {
              //发送请求，导入选中的规范
              var obj = Object.keys(progroup.httpSpec).reduce(function (o, key) {
                if (['type', 'progroupId', 'id', 'createTime'].indexOf(key) === -1) {
                  o[key] = progroup.httpSpec[key];
                }
                return o;
              }, {});
              this.__pgCache._$updateItem({
                id: this.__pgid,
                data: {
                  httpSpec: obj
                },
                ext: {
                  import: true
                }
              });
            }.bind(this);
            // 会覆盖时做提示
            if (this.__progroup.httpSpec.createTime) {
              var _modal = modal.confirm({
                'content': '导入其他项目组的HTTP规范将会覆盖当前项目组HTTP规范，您确定要导入当前选中的项目组的HTTP规范吗？',
                'title': '导入HTTP规范',
                'closeButton': true,
                'okButton': '导入',
                'cancelButton': true
              }).$on('ok', function () {
                _modal = _modal.destroy();
                importSpec();
              }.bind(this));
            } else {
              importSpec();
            }
          }
        }.bind(this));
      }.bind(this)
    ]]);

    //删除加载中提示，显示内容
    _e._$addClassName(this.__loading, 'f-dn');
    _e._$delClassName(this.__body, 'f-dn');
  };

  _pro.__updateFlag = function () {
    this.__progFlags = [];
    this.__progFlags.push({
      name: 'apiAudit',
      label: '新建接口需要审核',
      apiAudit: this.__progroup.apiAudit === 1
    }, {
      name: 'apiUpdateControl',
      label: '更新接口需要接口关注者确认',
      apiUpdateControl: this.__progroup.apiUpdateControl === 1
    }, {
      name: 'showPublicList',
      label: '在普通项目的资源列表中显示公共资源列表',
      showPublicList: this.__progroup.showPublicList === 1
    });
    // {
    //   name: 'useWordStock',
    //   label: '开启参数字典校验',
    //   useWordStock: this.__progroup.useWordStock === 1
    // }
    _jst._$render(this.__flagCtn, 'progroup-setting-items', {
      flags: this.__progFlags
    });
  };

  /**
   * 处理规范下拉选择器
   * @param  {Object} spec    项目组规范字段
   * @param  {Object} specObj 分好组的规范列表
   * @return {Void}
   */
  _pro.__handleSpecSelect = function (type, spec, specObj, editable) {
    var id = spec[type];
    var filtered = specObj[type].filter(function (item) {
      return item.id == id;
    });
    //节点获取
    var selectDiv = _e._$getByClassName(this.__body, 'spec-' + type + '-select')[0];
    var divParent = _e._$getByClassName(this.__body, 'tool-' + type)[0];
    var specCheck = _e._$getByClassName(divParent, 'spec-check')[0];
    var specClear = _e._$getByClassName(divParent, 'spec-clear')[0];
    var insertNode = _e._$getByClassName(divParent, 't-part-specname')[0];
    var hintHTML = '您暂时没有可选择的' + type + '规范<a class="u-spec-add stateful" href="/spec/create?s=' + type
      + '">新建' + type + '规范</a>';

    if (!!filtered[0]) {
      var dataOption = {source: specObj[type], selected: filtered[0], selectFirst: false, preview: true};
    } else if (editable) {
      var dataOption = {
        source: specObj[type],
        placeholder: '请选择一个' + type + '规范',
        selectFirst: false,
        preview: true,
        emptyTip: '您还未设置' + type + '规范,请设置'
      };
    } else {
      var dataOption = {source: specObj[type], placeholder: '无', editable: editable, preview: false};
    }

    if (!editable && !filtered[0]) {
      var _node = _e._$create('div', 'z-empty', insertNode);
      _node.innerHTML = '<span>无</span>';
      selectDiv.appendChild(_node);
      this.__showSpecVM(type, _e._$getByClassName(this.__body, 'tool-' + type)[0], this.__pid);
    } else {
      //有选中的规范
      if (specObj[type].length > 0) {
        //组件已存在，销毁再重新实例化
        if (!!this['__' + type + 'SpecSelect']) {
          this['__' + type + 'SpecSelect'] = this['__' + type + 'SpecSelect'].destroy();
        }
        this['__' + type + 'SpecSelect'] = new _s2({
          data: dataOption
        }).$inject(selectDiv);
        this['__' + type + 'SpecSelect'].$on('change', function (result) {
          var Obj = {};
          var specType = type.charAt(0).toUpperCase() + type.substr(1);
          Obj['toolSpec' + specType] = result.selected.id;
          //如果旧值不是自己创建的，就清空specCache重新获取
          if (!!result.oSelected.isCreator && result.oSelected.isCreator == true) {
            this.__updateNum = 3;
            this.__specCache._$clearListInCache(_specCache._$cacheKey);
            this.__pgCache._$updateItem({
              id: this.__pgid,
              data: Obj,
              ext: {updateSpec: true}
            });
          } else {
            this.__pgCache._$updateItem({id: this.__pgid, data: Obj});
          }
          this.__VMCache._$clearListInCache(this._pgVMKey);
        }._$bind(this));
        //显示规范映射列表
        if (!!filtered[0]) {
          this.__showSpecVM(type, _e._$getByClassName(this.__body, 'tool-' + type)[0], filtered[0].id);

          //显示查看规范详情的链接
          _e._$delClassName(specCheck, 'f-dn');
          _e._$attr(specCheck, 'href', '/spec/detail/?id=' + filtered[0].id);

          //显示清除按钮
          if (this.__editable) {
            _e._$delClassName(specClear, 'f-dn');
            this.__doInitDomEvent([[
              specClear, 'click', this.__clearSpec._$bind(this, type, specClear, specCheck)
            ]]);
          }
        } else {
          this.__showSpecVM(type, _e._$getByClassName(this.__body, 'tool-' + type)[0], this.__pgid);
        }
      } else {
        //没有选中的规范
        if (!editable) {
          hintHTML = '';
        }
        selectDiv.innerHTML = hintHTML;
        this.__showSpecVM(type, _e._$getByClassName(this.__body, 'tool-' + type)[0], this.__pgid);
      }
    }
  };

  /**
   * 清除规范
   * @param  {String} type  当前规范类型
   * @param  {Object} specCheck 查看规范节点
   * @param  {Object} specClear 清除节点
   * @return {Void}
   */

  _pro.__clearSpec = function (type, specClear, specCheck) {
    var _modal = modal.confirm({
      'content': '您确定要清除当前选中的规范吗？',
      'title': '清除选中的规范',
      'closeButton': true,
      'okButton': '清除',
      'cancelButton': true
    }).$on('ok', function () {
      _modal = _modal.destroy();
      var obj = {};
      var specType = type.charAt(0).toUpperCase() + type.substr(1);
      obj['toolSpec' + specType] = 0;
      //发送请求，清除选中的规范
      this.__pgCache._$updateItem({
        id: this.__pgid,
        data: obj
      });
      //隐藏查看规范详情和清除按钮
      _e._$addClassName(specClear, 'f-dn');
      _e._$addClassName(specCheck, 'f-dn');
    }.bind(this));
  };

  /**
   * 挑选出不同的映射列表
   * @param  {Array} list  与项目组相关的所有映射列表
   * @return {Void}
   */
  _pro.__filterVMList = function () {
    this.__specWebVM = [];
    this.__specAosVM = [];
    this.__specIosVM = [];
    this.__specTestVM = [];
  };
  /**
   * 实例化规范的映射列表
   * @param  {String} type   规范类型
   * @param  {Object} parent 插入dom的父节点
   * @param  {Number} id     规范的id
   * @return {Void}
   */
  _pro.__showSpecVM = function (type, parent, id) {
    var insertDiv = _e._$getByClassName(parent, 'spec-vmlist')[0];
    switch (type) {
      case 'web':
        if (!!this.__webSpecEidtor) {
          this.__webSpecEidtor = this.__webSpecEidtor._$recycle();
        }
        var optionsWeb = {
          parent: insertDiv,
          list: this.__specWebVM,
          specType: 0,
          id: id,
          listKey: this._pgVMKey + '-' + 0
        };
        this.__webSpecEidtor = this.__newEditor(optionsWeb);
        break;
      case 'aos':
        if (!!this.__aosSpecEidtor) {
          this.__aosSpecEidtor = this.__aosSpecEidtor._$recycle();
        }
        var optionsAos = {
          parent: insertDiv,
          list: this.__specAosVM,
          specType: 1,
          id: id,
          listKey: this._pgVMKey + '-' + 1
        };
        this.__aosSpecEidtor = this.__newEditor(optionsAos);
        break;
      case 'ios':
        if (!!this.__iosSpecEidtor) {
          this.__iosSpecEidtor = this.__iosSpecEidtor._$recycle();
        }
        var optionsIos = {
          parent: insertDiv,
          list: this.__specIosVM,
          specType: 2,
          id: id,
          listKey: this._pgVMKey + '-' + 2
        };
        this.__iosSpecEidtor = this.__newEditor(optionsIos);
        break;
      case 'test':
        if (!!this.__testSpecEidtor) {
          this.__testSpecEidtor = this.__testSpecEidtor._$recycle();
        }
        var optionsTest = {
          parent: insertDiv,
          list: this.__specTestVM,
          specType: 3,
          id: id,
          listKey: this._pgVMKey + '-' + 3
        };
        this.__testSpecEidtor = this.__newEditor(optionsTest);
        break;
    }
  };

  _pro.__doUpdateFlag = function (evt) {
    var elem = _v._$getElement(evt, 'd:name');
    if (elem) {
      var flagName = _e._$dataset(elem, 'name');
      for (var i = 0, len = this.__progFlags.length; i < len; i++) {
        if (this.__progFlags[i].name === flagName) {
          break;
        }
      }
      var flagItem = this.__progFlags[i];
      var data = {};
      data[flagName] = Number(!flagItem[flagName]);
      this.__sendUpdateRequest(data, flagName);
    }
  };

  _pro.__sendUpdateRequest = function (data, flagName) {
    this.__pgCache._$updateItem({
      id: this.__pgid,
      data: data,
      ext: {
        name: flagName,
        action: 'updateFlag'
      }
    });
  };

  // notify dispatcher
  _m._$regist(
    'progroup-detail-tl',
    _p._$$ModuleProGroupDetailTL
  );
});
