/*
 * 参数编辑器-基类组件------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/notify/notify',
  'pro/modal/modal',
  'pro/datatype_select/datatype_select2',
  'pro/params_import/datatype_import',
  'pro/params_import/json_import',
  'pro/params_import/interface_import',
  'pro/params_import/javabean_import',
  'pro/params_preview/params_empty',
  'pro/generate_rule/generate_rule',
  'pro/params_preview/operate_menu',
  'pro/params_preview/params_property',
  'pro/params_preview/list_head',
  'pro/cache/config_caches'
], function (base, v, u, e, _, Notify, Modal, DatatypeSelect2, DTImport, JSImport, INTImport, JBImport, ParamsEmpty, GRule, Menu, params_property, list_head, cofcache) {
  var Origin = base.extend({
    config: function () {

    },
    init: function () {
      //获取rugular组件本身的dom节点：Regular.dom.element(this);
      this._onClickAction = this._onClickAction || function (event) {
          var isClickType = e._$hasClassName(event.target, 'backtype');
          var target = v._$getElement(event, 'd:active');
          if (!target) return;
          var actionData;
          try {
            actionData = u._$query2object(e._$dataset(target, 'active'));
          } catch (err) {
            return console.error(err);
          }
          switch (actionData.actionType) {
            case 'input':
              // v._$stopBubble(event);
              this._modifyInputValue(target, actionData);
              break;
            case 'select':
              v._$stopBubble(event);
              this._modifySelectValue(target, actionData, isClickType);
              break;
            case 'expression':
              v._$stopBubble(event);
              this._modifyExpressionValue(target, actionData);
              break;
            default:
              break;
          }
        }.bind(this);
      this._onKeyupAction = this._onKeyupAction || function (event) {
          var node = v._$getElement(event, 'd:enter');
          if (!node || event.which != 13) return;
          var index = e._$dataset(node, 'enter');
          this.update(index);
        }.bind(this);
      Regular.dom.on(Regular.dom.element(this), 'click', this._onClickAction);
      Regular.dom.on(Regular.dom.element(this), 'keyup', this._onKeyupAction);
    },
    /**
     * 获取缓存实体
     * @param type
     * @returns {*}
     * @private
     */
    _getCacheInstance: function (type) {
      if (this['__' + type + 'cache']) return this['__' + type + 'cache'];
      var cache = this['__' + type + 'cache'] = cofcache[type]._$allocate({
        onitemsadd: function (option) {
          this.data.isSending = false;
          if (option.ext && option.ext.cache == 'iHeader') {
            if (option.ext.action == 'importAdd') {
              this.data.params = this.data.params.concat(this.formatParamsSource(option.data.params));
            } else {
              var item = this.data.params[option.ext.index];
              u._$merge(item, option.data.params[0]);
              this.data.params[option.ext.index].isAdding = false;
              item.nameSelected = {
                id: item.name,
                name: item.name
              };
              item.defaultValueSelected = {
                id: item.defaultValue,
                name: item.defaultValue
              };
            }
            this.$update();
          } else if (option.ext && option.ext.action == 'importAdd') {//通过导入json、数据模型、在线接口、javabean等添加参数
            this.data.params = this.data.params.concat(this.formatParamsSource(option.data.params));
            this.$update();
          } else {
            u._$merge(this.data.params[option.ext.index], option.data.params[0]);
            this.data.params[option.ext.index].isAdding = false;
            this.$update();
          }
        }._$bind(this),
        onitemsdelete: function (option) {
          //批量删除
          var _this = this;
          if (typeof option.ext.index === 'object') {
            var obj = option.ext.index;
            u._$reverseEach(obj.imports, function (_id) {
              _this.data.params.forEach(function (item, i) {
                if (item.datatypeId == _id) {
                  _this.data.params.splice(i, 1);
                }
              });
            });
            u._$reverseEach(obj.params, function (_id) {
              _this.data.params.forEach(function (item, i) {
                if (item.id == _id) {
                  _this.data.params.splice(i, 1);
                }
              });
            });
            this.resetHeadStatusCom();
          } else {
            this.data.params.splice(option.ext.index, 1);
          }
          this.$update();
        }._$bind(this),
        onitemupdate: function (option) {
          //如果是切换编辑器的类型，则不需要做其它处理
          if (option.ext.action == 'menuchange') {
            return;
          }
          //如果有回调则先处理回调
          if (typeof option.ext.callback == 'function') {
            option.ext.callback();
          }
          //索引是二维的说明是导入类型
          var x = (option.ext.index + '').split('-')[0];
          var y = (option.ext.index + '').split('-')[1];
          if (y !== undefined) {
            delete this.data.params[x].imports[y].isObjectType;
            delete this.data.params[x].imports[y].isEditObjectType;
            u._$merge(this.data.params[x].imports[y], option.data.params[0]);
          } else {
            delete this.data.params[option.ext.index].isObjectType;
            delete this.data.params[option.ext.index].isEditObjectType;
            u._$merge(this.data.params[option.ext.index], option.data.params[0]);
          }
          this.$update();
        }._$bind(this),
        onerror: function (option) {
          var options = option.options;
          //添加失败的时候要把正在添加参数的状态置为false;
          if (options.ext && (options.ext.action || '').toLowerCase().indexOf('add') !== -1) {
            this.data.isSending = false;
          }
        }._$bind(this)
      });
      return cache;
    },
    /**
     *保存参数数据 数据来源为直接添加
     * @param index
     */
    update: function (index) {
      // if (this.data.sending) return;
      var _imports = [];
      var _params = [this.data.params[index]];
      var _ext = {
        action: 'add',
        index: index
      };
      if (!this.validate(this.data.params[index])) return;
      this._doUpdateParams(_params, _imports, _ext);
    },
    /**
     * 发送添加参数的ajax请求
     * @param _params
     * @param _imports
     * @param _ext
     * @private
     */
    _doUpdateParams: function (_params, _imports, _ext) {
      if (this.data.isSending) return;
      _ext.uuid = this.data.uuid;
      var $cache = null;
      if (this._isIHeader()) {
        $cache = this._getCacheInstance('iHeader');
        _ext.cache = 'iHeader';
      } else {
        $cache = this._getCacheInstance('parameter');
        _ext.cache = 'parameter';
        _ext.pid = this.data.pid;
      }
      this.data.isSending = true;
      $cache._$addItems({
        data: {
          params: _params,
          imports: _imports,
          parentType: this.data.parentType,
          parentId: this.data.parentId
        },
        onerror: function (option) {
          console.log('error');
        }._$bind(this),
        ext: _ext
      });
    },
    /**
     *
     * @param index 删除的项索引
     */
    remove: function (index) {
      var item = null, _params = [], _imports = [], $cache = null;
      if (typeof index === 'number') {//单条数据删除
        item = this.data.params[index];
        if (item.isAdding) {
          this.data.params.splice(index, 1);
          return;
        }
        if (item.isImport) {
          _imports.push(item.datatypeId);
        } else {
          _params.push(item.id);
        }
      } else {//批量删除
        _imports = index.imports;
        _params = index.params;
      }

      var _data = {};
      if (this.data.format == 7) {//如果是变量映射
        _data = {
          ids: _params.join(',')
        };
        $cache = this._getCacheInstance('varmap');
      } else if (this.data.format == 8) {
        _data = {
          ids: _params.join(',')
        };
        $cache = this._getCacheInstance('cliArg');
      } else if (this.data.format == 9) {
        _data = {
          ids: _params.join(',')
        };
        $cache = this._getCacheInstance('jarmap');
      } else {
        _data = {
          parentId: this.data.parentId,
          parentType: this.data.parentType,
          params: _params.join(','),
          imports: _imports.join(',')
        };
        if (this._isIHeader()) {
          $cache = this._getCacheInstance('iHeader');
        } else {
          $cache = this._getCacheInstance('parameter');
        }
      }
      var options = {
        key: this.data.listKey,
        data: _data,
        ext: {
          uuid: this.data.uuid,
          index: index
        }
      };
      if (this.data.format == 7 || this.data.format == 8 || this.data.foramt == 9) {
        options['key'] = this.data.listKey;
      }
      $cache._$deleteItems(options);
    },
    /***
     * 参数的导入操作 (导入类型、导入json、在线接口、javabean)
     * @param type
     */
    import: function (type) {
      var modal = null;
      var that = this;
      var _imports = [], _params = [], _ext = null;
      var doUpdate = function (list, importType) {
        if (importType == 'type') {
          u._$forEach(list, function (item) {
            _imports.push({id: item.id, vars: []});
          });
          _params = [];
        } else {
          // //用来区分导入json或者在线接口的回调也走正常添加的流程
          // this.data.isAdding = true;
          _params = list;
          _imports = [];
        }
        //从参数列表后面追加
        var index = this.data.params.length + 1;
        _ext = {
          action: 'importAdd',
          index: index
        };
        this._doUpdateParams(_params, _imports, _ext);
      }._$bind(this);
      if (type == 'type') {
        var getImportTypeList = function () {
          //只需要把哈希的类型显示出来就行,同时把已经导入的过滤掉(含嵌套导入)
          var arr = [];
          //如果是数据模型的话还要把自己给过滤掉
          if (this.data.parentType == 4) {
            arr.push(this.data.resourceId);
          }
          //把已经导入的过滤掉
          this.data.params.forEach(function (item) {
            if (item.datatypeId) {
              arr.push(item.datatypeId);
              //  item.imports.forEach(function (item2) {
              //      if (arr.indexOf(item2.originalDatatypeId) == -1 && item2.originalDatatypeId) {
              //          arr.push(item2.originalDatatypeId);
              //      }
              //  });
            }
          }.bind(this));
          return arr;
        };
        var datatypeIdList = getImportTypeList.call(this);
        modal = new DTImport({
          data: {
            format: this.data.format,
            pid: this.data.pid,
            hasImportList: datatypeIdList
          }
        });
        modal.$on('ok', function (list) {
          if (!list) return;
          doUpdate(list, type);
        });
      } else if (type == 'json') {
        modal = new JSImport({});
        modal.$on('ok', function (json) {
          var list = that.formatJSONData(json);
          if (!list.length) return;
          doUpdate(list, type);
        });
      } else if (type == 'JavaBean') {
        modal = new JBImport({
          data: {
            pid: this.data.pid
          }
        });
        modal.$on('ok', function (javabean) {
          //  var list = that.formatJSONData(json);
          doUpdate(javabean, type);
        });
      } else {
        modal = new INTImport({
          data: {
            source: [{
              name: 'GET', id: 'get'
            }, {
              name: 'POST', id: 'post'
            }]
          }
        });
        modal.$on('ok', function (json) {
          var list = that.formatJSONData(json);
          if (!list.length) return;
          doUpdate(list, type);
        });
      }

    },
    /***
     * 校验当前添加项的值
     * @param item
     * @returns {boolean}
     */
    validate: function (item) {
      var _params = this.data.params;
      var verifyName = this.data.verifyName;
      if (item[verifyName] == '') {
        item['error'] = true;
        return false;
      }
      for (var i = 0, len = _params.length; i < len; i++) {
        if (_params.indexOf(item) != -1) continue;
        if (item[verifyName] == _params[i][verifyName]) {
          item['error'] = true;
          return false;
        }
      }
      //去掉多余的参数
      // delete item.isAdding;
      delete item.isImport;
      delete item.datatypeId;
      return true;
    },
    _isIHeader: function () {
      return this.data.format == 0 && this.data.shape == 'header';
    },
    /**
     * 创建规则函数表达式
     * @param index
     */
    createExp: function (index, key, callback) {
      var that = this;
      //说明是导入类型，二维数组,用-分开
      if (index.toString().indexOf('-') > 0) {
        var index1 = index.split('-')[0];
        var index2 = index.split('-')[1];
        var modal = new GRule({
          data: {
            pid: this.data.pid,
            value: that.data.params[index1].imports[index2][key]
          }
        }).$on('ok', function (val) {
          if (callback) {
            callback(val);
          } else {
            that.data.params[index][key] = val;
          }
          that.$update();
        });
      } else {
        var modal = new GRule({
          data: {
            pid: this.data.pid,
            value: that.data.params[index][key]
          }
        }).$on('ok', function (val) {
          if (callback) {
            callback(val);
          } else {
            that.data.params[index][key] = val;
          }
          that.$update();
        });
      }
    },
    /**
     * 监听数据模型选择器change事件 创建状态的数据模型选择器
     * @param item
     * @param index
     * @private
     */
    _onSelectChange: function (item, index) {
      if (!item) return;
      if (item.typeName == 'Object') { //进入匿名类型创建流程
        this.data.params[index].isObjectType = true;
      } else {
        if (this.data.params[index].isObjectType) {//从匿名类型切换非匿名类型
          this.data.params[index].isObjectType = false;
          delete this.data.params[index].attrs;
        } else {//从非匿名类型切换非匿名类型
          this.data.params[index].type = item.type;
          this.data.params[index].typeName = item.typeName;
          this.data.params[index].isArray = item.isArray;
        }
      }
    },
    formatJSONData: function (_json) {
      if (!_json) return [];
      if (_json && _json instanceof Array) {
        _json = _json[0];
      }
      var _conf = {
        string: '10001',
        number: '10002',
        boolean: '10003'
      };
      var arr = [];
      for (var _p in _json) {
        var _type = typeof _json[_p];
        var _v, _t;
        if (_conf[_type]) {
          _v = _json[_p];
          _t = _type;
        } else {
          _v = _json[_p] === null ? '' : JSON.stringify(_json[_p]);
          _t = 'string';
        }
        _v = (_v.toString() || '').slice(0, 500);//如果默认值过长则直接截断
        arr.push({
          isImport: false,
          name: _p,
          type: _conf[_t],
          isArray: _.db.CMN_BOL_NO,
          defaultValue: _v,
          expression: ''
        });
      }
      return arr;
    },
    formatParamsSource: function (params) {
      if (!u._$isArray(params) || params.length == 0) return [];
      var _params = [];
      var _temp = {};
      for (var i = 0, len = params.length; i < len; i++) {
        if (!params[i].datatypeId) {//非导入类型
          _params.push(params[i]);
        } else {//导入类型
          if (_temp[params[i].datatypeId]) {
            _temp[params[i].datatypeId].imports = _temp[params[i].datatypeId].imports.concat(params[i]);
          } else {
            _temp[params[i].datatypeId] = {
              datatypeId: params[i].datatypeId,
              id: params[i].datatypeId,
              imports: [params[i]],
              isImport: true,
              datatypeName: params[i].datatypeName
            };
          }
        }
      }
      for (key in _temp) {
        _params = _params.concat(_temp[key]);
      }
      return _params;
    },
    /**
     * 可编辑输入框元素上 data-active 的含义:
     * cache: 所使用的缓存
     * name: 所更新的字段名称
     * id: 要更新的对象的id
     *
     * data-active 的示例值: {"cache":"user","name":"name","id":"1465726373492"}
     */
    _modifyInputValue: function (input, actionData) {
      var that = this;
      if (!input.readOnly) {
        // 已经是编辑状态
        return;
      }
      input.readOnly = false;
      e._$addClassName(input, 'u-input-editting');
      input.select();
      var oldValue = input.value;
      var index = actionData.index;
      var handler = function () {
        input.readOnly = true;
        e._$delClassName(input, 'u-input-editting');
        var newValue = input.value;
        if (actionData.required == 'true' && newValue.trim() === '') {
          input.value = oldValue;
        } else if (newValue !== oldValue) {
          // 发送更新请求
          var _data = {};
          if (!actionData.cache) {
            return console.error('cache "' + actionData.cache + '" not found');
          }
          if (that.data.format == 7 || that.data.format == 8) {
            _data = {
              type: actionData.specType
            };
          } else if (that.data.format == 9) {
            _data = {};
          } else {
            _data = {
              parentId: that.data.parentId,
              parentType: that.data.parentType
            };
          }
          //datatypeId存在说明是修改导入的参数
          if (actionData.datatypeId != undefined) {
            _data['datatypeId'] = actionData.datatypeId;
          }

          _data[actionData.name] = newValue;

          that._updateField(actionData.id, _data, {
            index: index,
            field: actionData.name,
            cache: actionData.cache,
            datatypeId: actionData.datatypeId,
            uuid: that.data.uuid
          });

        }
        v._$delEvent(input, 'blur', handler);
        v._$delEvent(input, 'keydown', keydownHandler);
      };
      var keydownHandler = function (evt) {
        if (evt.keyCode === 13) {
          evt.target.blur();
          // handler();
        }
      };
      v._$addEvent(input, 'blur', handler);
      v._$addEvent(input, 'keydown', keydownHandler);
    },
    //修改数据模型的值
    _modifySelectValue: function (target, actionData, isClickType) {
      if (this.__datatypeSelect) {
        this.__datatypeSelect._$dispatchEvent('onclickout');
        this.__datatypeSelect = this.__datatypeSelect._$recycle();
        return;
      }
      var element = target, that = this;
      //修改的参数索引
      var index = actionData.index;
      //存放临时select的值，在失焦的时候提交数据
      var temp = null;
      //是否是点击数据类型Array后面的类型
      var isClickArrayType = function () {
        if (isClickType && actionData.isArray == _.db.CMN_BOL_YES) {
          return true;
        } else {
          return false;
        }
      };
      e._$addClassName(element, 'f-dn');
      this.__datatypeSelect = DatatypeSelect2._$$DataTypeSelect._$getInstance({
        parent: element.parentNode,
        pid: this.data.pid,
        selected: {
          id: (actionData.typeName == '' || actionData.typeName == 'Object') ? 'object' : Number(actionData.type),
          name: actionData.typeName || 'Object'
        },
        format: this.data.format,
        backOpen: isClickArrayType(),
        noArray: actionData.noArray === 'true' ? true : false,
        noObject: actionData.noObject === 'true' ? true : false,
        isArray: Number(actionData.isArray),
        choseOnly: actionData.choseOnly === 'false' ? false : true,
        ondatatypechange: function (options) {
          //修改的参数索引
          var index = actionData.index;

          if (options.typeName == 'Object') { //进入匿名类型创建流程
            if (index.toString().indexOf('-') > 0) {
              var index1 = index.split('-')[0];
              var index2 = index.split('-')[1];
              this.data.params[index1].imports[index2].isEditObjectType = true;
              this.data.params[index1].imports[index2].typeName = '';
              //记住原始状态，取消的时候要还原
              this.data.params[index1].imports[index2].originArrayStatus = this.data.params[index1].imports[index2].isArray;
              this.data.params[index1].imports[index2].isArray = options.isArray;

            } else {
              this.data.params[index].isEditObjectType = true;
              this.data.params[index].typeName = '';
              //记住原始状态，取消的时候要还原
              this.data.params[index].originArrayStatus = this.data.params[index].isArray;
              this.data.params[index].isArray = options.isArray;
            }
            e._$delClassName(element, 'f-dn');
            this.__datatypeSelect._$recycle();
            this.$update();
          } else {
            var isAnonymousType = function () {
              var tag = false;
              if (index.toString().indexOf('-') > 0) {
                var index1 = index.split('-')[0];
                var index2 = index.split('-')[1];
                tag = this.data.params[index1].imports[index2].typeName == '' ? true : false;
              } else {
                tag = this.data.params[index].typeName == '' ? true : false;
              }
              return tag;
            }.bind(this);
            if (isAnonymousType()) {
              var modal = Modal.confirm({content: '修改类型后，Object类型的属性将会丢失，确定修改？'});
              modal.$on('ok', function () {
                temp = options;
              });
              modal.$on('cancel', function () {
                e._$delClassName(element, 'f-dn');
                that.__datatypeSelect = that.__datatypeSelect._$recycle();
              });
            } else {
              temp = options;
            }
          }
        }.bind(this),
        onclickout: function () {
          if (!temp) {
            e._$delClassName(element, 'f-dn');
            this.__datatypeSelect = this.__datatypeSelect._$recycle();
            return;
          }
          var _data = {
            type: temp.type,
            isArray: temp.isArray,
            typeName: temp.typeName,
            parentId: this.data.parentId,
            parentType: this.data.parentType
          };

          //datatypeId存在说明是修改导入的参数
          if (actionData.datatypeId != undefined) {
            _data['datatypeId'] = actionData.datatypeId;
          }
          if (actionData.datatypeId) {
            var index1 = index.split('-')[0];
            var index2 = index.split('-')[1];
            if (this.data.params[index1].imports[index2]['isArray'] == _data.isArray && this.data.params[index1].imports[index2]['type'] == _data.type) {
              e._$delClassName(element, 'f-dn');
              this.__datatypeSelect = this.__datatypeSelect._$recycle();
              return;
            }
            this.data.params[index1].imports[index2]['isArray'] = _data.isArray;
            this.data.params[index1].imports[index2]['type'] = _data.type;
            this.data.params[index1].imports[index2]['typeName'] = temp.typeName;
          } else {
            //如果没有发生修改则不发送请求
            if (this.data.params[index]['isArray'] == _data.isArray && this.data.params[index]['type'] == _data.type) {
              e._$delClassName(element, 'f-dn');
              this.__datatypeSelect._$recycle();
              return;
            }
            this.data.params[index]['isArray'] = _data.isArray;
            this.data.params[index]['type'] = _data.type;
            this.data.params[index]['typeName'] = temp.typeName;
          }
          this.$update();
          this._updateField(actionData.id, _data, {
            index: index,
            field: 'typeName',
            typeName: temp.typeName,
            cache: actionData.cache,
            datatypeId: actionData.datatypeId,
            uuid: this.data.uuid,
            callback: function () {
              e._$delClassName(element, 'f-dn');
              this.__datatypeSelect = this.__datatypeSelect && this.__datatypeSelect._$recycle();
            }._$bind(this)
          });
        }.bind(this)
      });

    },
    //修改表达式的值
    _modifyExpressionValue: function (input, actionData) {
      var oldValue = input.value;
      var that = this;
      this.createExp(actionData.index, actionData.name, function (val) {
        if (oldValue == val) return;
        var _data = {
          parentId: that.data.parentId,
          parentType: that.data.parentType
        };
        if (actionData.datatypeId) {
          _data['datatypeId'] = actionData.datatypeId;
        }
        _data[actionData.name] = val;
        that._updateField(actionData.id, _data, {
          index: actionData.index,
          field: actionData.name,
          cache: actionData.cache,
          datatypeId: actionData.datatypeId,
          uuid: that.data.uuid
        });
      });
    },
    _updateField: function (id, data, ext) {
      var $cache = this._getCacheInstance(ext.cache);
      ext.pid = this.data.pid;
      $cache._$updateItem({
        id: id,
        data: data,
        ext: ext
      });
    },
    /**
     * 删除无效的数据
     * @param params
     * @returns {*}
     */
    removeEmpty: function (params) {
      var verifyName = this.data.verifyName;
      var tml = params.slice(0);
      u._$reverseEach(params, function (item, index) {
        if (item[verifyName] == '') {
          tml.splice(index, 1);
        }
        delete item.error;
      });
      return tml;
    },
    /**
     * 监听数据模型修改菜单的check事件
     * @param data
     * @property format {number}
     * @property action {string}
     * @private
     */
    _onMenuCheck: function (data) {
      if (data.action == 'modify') {
        var modal = Modal.confirm({content: '切换类型将会导致现有数据丢失，确认切换么？'});
        var _changeHandler = function () {
          //数据模型的切换
          if (this.data.parentType == 4) {
            this._getCacheInstance('datatype')._$updateItem({
              key: this._getCacheInstance('datatype')._$getListKey(this.data.pid),
              id: this.data.parentId,
              data: {
                format: data.format
              },
              ext: {action: 'menuchange', format: data.format, uuid: this.data.uuid}
            });
            return;
          }
          var _data = {}, _type = this.data.parentType;
          if (_type == 2) {
            _data['reqFormat'] = data.format;
          } else {
            _data['resFormat'] = data.format;
          }
          var infCache = this._getCacheInstance('interface');
          infCache._$updateItem({
            key: infCache._$getListKey(this.data.pid),
            id: this.data.parentId,
            data: _data,
            ext: {action: 'menuchange', format: data.format, resType: _type, uuid: this.data.uuid}
          });
        };
        modal.$on('ok', _changeHandler.bind(this));
      } else {
        this.import(data.action);
      }
    },
    selectItem: function (id) {
      this.data.checkStatus[id] = !this.data.checkStatus[id];
      this.$refs['LH'].listCheckChanged(this.data.checkStatus);
    },
    listenHeadStatusChange: function (status) {
      this.data.params.forEach(function (item) {
        if (!item.id) {
          //新添加的什么也不做
        } else if (item.datatypeId) {
          this.data.checkStatus['dr' + item.datatypeId] = status;
        } else {
          this.data.checkStatus[item.id] = status;
        }
      }.bind(this));
      this.$refs['LH'].listCheckChanged(this.data.checkStatus);
    },
    reverseSelect: function () {
      for (var key in this.data.checkStatus) {
        this.data.checkStatus[key] = !this.data.checkStatus[key];
      }
    },
    resetHeadStatusCom: function () {
      if (this.$refs['LH']) {
        this.$refs['LH'].resetSelected();
      }
    },
    appendModel: function () {
      var _tmp = this.data.checkStatus;
      var item = null;
      var params = [];
      //key的字符串以dr开头的说明是导入的
      for (var key in _tmp) {
        if (_tmp[key]) {
          if (key.indexOf('dr') === 0) {
            item = this.data.params.find(function (itm) {
              return itm.datatypeId == key.slice(2);
            });
            params = params.concat(item.imports);
          } else {
            item = this.data.params.find(function (itm) {
              return itm.id == key;
            });
            params.push(item);
          }
        }
      }
      params = _._$clone(params);
      //如果是请求头或者响应头的话，则需要format下数据格式
      if (this.data.format == 0 && this.data.shape == 'header') {
        params.forEach(function (item) {
          item.name = item.name.id;
          item.defaultValue = item.defaultValue.id;
        });
      }
      var _tempParams = [];
      //接口里面参数的parantId指接口的ID,而数据类型里面的属性的parantId指的是导入的数据类型的ID
      params.forEach(function (itm) {
        //如果参数的类型是匿名类型则转换为字符串
        if (!itm.typeName) {
          itm.type = 10001;
          itm.typeName = 'String';
        }
        _tempParams.push({
          name: itm.name,
          defaultValue: itm.defaultValue,
          description: itm.description,
          genExpression: itm.genExpression,
          valExpression: itm.valExpression || '',
          type: itm.type,
          typeName: itm.typeName,
          isArray: itm.isArray
        });
      }.bind(this));

      var modal = new Modal({
        data: {
          content: '',
          noTitle: true,
          'class': 'inline-create',
          okButton: false,
          cancelButton: false,
          closeButton: true
        }
      }).$on('close', function () {
        dispatcher._$hide('/?/progroup/p/res/datatype/create/');
        this.destroy();
      });
      dispatcher._$redirect('/?/progroup/p/res/datatype/create/?pid=' + this.data.pid, {
        input: {
          format: this.data.format,
          params: _tempParams,
          parent: modal.$refs.modalbd,
          done: function () {
            dispatcher._$hide('/?/progroup/p/res/datatype/create/');
            modal.destroy();
          }.bind(this)
        }
      });
    },
    modifyAnonymousType: function (event, id, index) {
      event.stopPropagation();
      var item = this._getCacheInstance('datatype')._$getItemInCache(id);
      var params = _._$clone(item.params);

      //导入类型的属性datatypeId不为0
      params.forEach(function (item) {
        //导入类型加个标示
        if (item.datatypeId) {
          item.isImport = _.db.CMN_BOL_YES;
        }
      });
      //索引是二维的说明是导入类型
      var x = (index || '').split('-')[0];
      var y = (index || '').split('-')[1];
      if (y !== undefined) {
        this.data.params[x].imports[y].isEditObjectType = true;
        this.data.params[x].imports[y].attrs = params;
        this.data.params[x].imports[y].originArrayStatus = this.data.params[x].imports[y].isArray;
      } else {
        this.data.params[index].isEditObjectType = true;
        this.data.params[index].attrs = params;
        this.data.params[index].originArrayStatus = this.data.params[index].isArray;
      }
      this.data.originalData = _._$clone(params.slice(0));//备份数据
    },
    /**
     * 保存修改匿名模型
     * @param $event
     * @param index
     * @param action
     */
    submitModify: function (event, index) {
      event.stopPropagation();
      var item = null;
      var isChangeArray = '';
      //索引是二维的说明是导入类型
      var x = (index || '').split('-')[0];
      var y = (index || '').split('-')[1];
      if (y !== undefined) {
        item = this._getCacheInstance('datatype')._$getItemInCache(this.data.params[x].imports[y].type);
        isChangeArray = this.data.params[x].imports[y].isArray == this.data.params[x].imports[y].originArrayStatus ? false : true;
      } else {
        item = this._getCacheInstance('datatype')._$getItemInCache(this.data.params[index].type);
        isChangeArray = this.data.params[index].isArray == this.data.params[index].originArrayStatus ? false : true;
      }
      //编辑匿名类型
      //item.type == 2 说明本身就是匿名类型，这时候做的操作就是修改匿名类型了，否则就是添加匿名类型了
      // _datatypeId是修改的匿名类型的数据类型
      if (item.type == 2 && !isChangeArray) {
        if (y !== undefined) {
          var result = this.formatAnonymousTypeParams(this.data.params[x].imports[y].attrs);
          var _params = result.params;
          var _imports = result.imports;
          var _datatypeId = this.data.params[x].imports[y].type;
          var _isArray = this.data.params[x].imports[y].isArray;
        } else {
          var result = this.formatAnonymousTypeParams(this.data.params[index].attrs);
          var _params = result.params;
          var _imports = result.imports;
          var _datatypeId = this.data.params[index].type;
          var _isArray = this.data.params[index].isArray;
        }
        if (_params.length == 0 && _imports.length == 0) {
          this.cancelModify(event, index);
          return;
        }
        this._getCacheInstance('parameter')._$updateAnonymousDatatype({
          key: 'anonymous-datatype-modify',
          data: {
            datatypeId: _datatypeId,
            projectId: this.data.pid,
            type: 2,
            params: _params,
            imports: _imports
          },
          ext: {
            uuid: this.data.uuid,
            index: index,
            pid: this.data.pid,
            callback: function () {
              if (y !== undefined) {
                this.$refs['tp' + (x + '-' + y)].initDom();
              } else {
                this.$refs['tp' + index].initDom();
              }
            }._$bind(this)
          }
        });
      } else {
        //修改为匿名类型
        //type:2 匿名数据模型
        if (y !== undefined) {
          var result = this.formatAnonymousTypeParams(this.data.params[x].imports[y].attrs);
          var _params = result.params;
          var _imports = result.imports;
          var _id = this.data.params[x].imports[y].id;
          var _datatypeId = this.data.params[x].imports[y].datatypeId;
          var _isArray = this.data.params[x].imports[y].isArray;
        } else {
          var result = this.formatAnonymousTypeParams(this.data.params[index].attrs);
          var _params = result.params;
          var _imports = result.imports;
          var _id = this.data.params[index].id;
          var _datatypeId = this.data.params[index].datatypeId;
          var _isArray = this.data.params[index].isArray;
        }
        var _data = {
          type: 0,
          isArray: _isArray,
          typeName: '',
          attrs: _params,
          imports: _imports,
          datatypeId: _datatypeId,
          parentId: this.data.parentId,
          parentType: this.data.parentType
        };

        this._updateField(_id, _data, {
          index: index,
          field: 'typeName',
          typeName: 'String',
          cache: 'parameter',
          datatypeId: _datatypeId,
          uuid: this.data.uuid,
          callback: function () {
            //...
          }._$bind(this)
        });
      }
    },
    /**
     * 取消修改匿名模型
     * @param $event
     * @param index
     */
    cancelModify: function (event, index) {
      event.stopPropagation();
      //索引是二维的说明是导入类型
      var x = (index || '').split('-')[0];
      var y = (index || '').split('-')[1];
      if (y !== undefined) {
        this.data.params[x].imports[y].isEditObjectType = false;
        //还原之前切换选择匿名类型时候给替换成的"";
        var item = this._getCacheInstance('datatype')._$getItemInCache(this.data.params[x].imports[y].type);
        this.data.params[x].imports[y].typeName = item.name;
        this.data.params[x].imports[y].isArray = this.data.params[x].imports[y].originArrayStatus;
        delete this.data.params[x].imports[y].originArrayStatus;
        delete this.data.params[x].imports[y].attrs;
      } else {
        this.data.params[index].isEditObjectType = false;
        //还原之前切换选择匿名类型时候给替换成的"";
        var item = this._getCacheInstance('datatype')._$getItemInCache(this.data.params[index].type);
        this.data.params[index].typeName = item.name;
        this.data.params[index].isArray = this.data.params[index].originArrayStatus;
        delete this.data.params[index].originArrayStatus;
        delete this.data.params[index].attrs;
      }
    },
    formatAnonymousTypeParams: function (params) {
      var that = this;
      var params = this.removeEmpty(params);
      var newparams = [];
      var delPool = [];//删除的参数列表
      var addPool = []; //增加的参数列表
      var updatePool = [];//修改的参数列表
      var newImports = [];

      var delImportPool = [];//删除的参数列表
      var addImportPool = []; //增加的参数列表
      var updateImportPool = [];//修改的参数列表
      var isSame = function (obj1, obj2) {
        var bl = true;
        for (var key in obj1) {
          if (obj1[key] !== undefined && obj2[key] !== undefined && obj1[key] !== obj2[key]) {
            bl = false;
          }
        }
        return bl;
      };
      //该id是否存在于数组里面，不存在说明是添加的
      var isExistArrayById = function (arr, id) {
        var tag = false;
        if (!arr.length) return tag;
        arr.forEach(function (item) {
          if (item.id == id) {
            tag = true;
          }
        });
        return tag;
      };
      //数组对象里面是否已经有了以该ID创建的对象
      var hasIdInArray = function (arr, field, id) {
        var tag = false;
        if (arr.length === 0) return tag;
        arr.forEach(function (item) {
          if (item[field] == id) {
            tag = true;
          }
        });
        return tag;
      };
      this.data.originalData = this.data.originalData || [];
      //把删除的找出来
      this.data.originalData.forEach(function (item) {
        if (!isExistArrayById(params, item.id)) {
          if (item.isImport) {
            //是否已经存放了导入类型的id
            if (!hasIdInArray(delImportPool, 'id', item.datatypeId)) {
              delImportPool.push({id: item.datatypeId, action: 'delete'});
            }
          } else {
            delPool.push({id: item.id, action: 'delete'});
          }
        }
      });
      //把新增的找出来
      u._$reverseEach(params, function (item, i) {
        if (!item.id) {//新添加的非导入参数
          item.action = 'add';
          addPool.push(item);
          params.splice(i, 1);
        } else {
          //在原始数据里查找不存在说明是添加的
          //新增导入类型parentId即为导入类型的Id
          if (!isExistArrayById(that.data.originalData, item.id)) {
            var tag = true;
            //判断新增的属性是否有复写
            var _obj = that._getCacheInstance('datatype')._$getItemInCache(item.parentId);
            var _attrs = _obj.params;
            _attrs.forEach(function (itm) {
              if (isSame(itm, item)) {
                tag = false;
              }
            });
            if (hasIdInArray(addImportPool, 'id', item.parentId)) {
              addImportPool.forEach(function (itm) {
                if (itm.id == item.parentId) {
                  delete item.originals;
                  if (tag) {//有被复写才加进去
                    itm.vars.push(item);
                  }
                }
              });
            } else {
              delete item.originals;
              if (tag) {
                addImportPool.push({
                  id: item.parentId,
                  action: 'add',
                  vars: [item]
                });
              } else {
                addImportPool.push({
                  id: item.parentId,
                  action: 'add',
                  vars: []
                });
              }

            }
            ;
            params.splice(i, 1);
          }
        }
      });
      //把修改的找出来
      //修改导入类型的时候dataypeId为导入类型的id
      this.data.originalData.forEach(function (item1) {
        params.forEach(function (item2, i) {
          if (item1.id == item2.id) {
            if (!isSame(item1, item2)) {
              item2.action = 'update';
              if (item2.isImport) {
                if (hasIdInArray(updateImportPool, 'id', item2.datatypeId)) {
                  updateImportPool.forEach(function (itm) {
                    if (itm.id == item2.datatypeId) {
                      itm.vars.push(item2);
                      params.splice(i, 1);
                    }
                  });
                } else {
                  updateImportPool.push({
                    id: item2.datatypeId,
                    action: 'update',
                    vars: [item2]
                  });
                }
              } else {
                updatePool.push(item2);
              }
            }
          }
        });

      });
      newparams = newparams.concat(addPool).concat(delPool).concat(updatePool);
      newImports = newImports.concat(addImportPool).concat(delImportPool).concat(updateImportPool);
      return {
        params: newparams,
        imports: newImports
      };
    },
    /**
     * 全屏toggle操作
     */
    doFullScreen: function () {
      var _node = this.parentNode;
      var pnode = _node.parentNode;
      var arrNode = [];
      if (!this.data.isFullScreen) {
        while (pnode && pnode.nodeName.toLowerCase() != 'html') {
          var _value = e._$getStyle(pnode, 'position');
          if (_value == 'relative' || _value == 'absolute') {
            arrNode.push({
              node: pnode,
              prop: _value
            });
          }
          pnode = pnode.parentNode;
        }
        ;
      } else {
        while (pnode && pnode.nodeName.toLowerCase() != 'html') {
          if (e._$hasClassName(pnode, 'full-screen')) {
            arrNode.push({
              node: pnode
            });
          }
          pnode = pnode.parentNode;
        }
        ;
      }
      var that = this;
      var escHandle = function (event) {
        event.witch = event.keyCode || event.witch;
        if (event.witch == 27) {
          that.doFullScreen();
        }
      };
      if (!this.data.isFullScreen) {
        e._$style(_node, {
          'position': 'fixed',
          'width': document.documentElement.clientWidth + 'px',
          'height': document.documentElement.clientHeight + 'px',
          'left': '0px',
          'padding': '30px',
          'top': '0px',
          'background': '#fff',
          'z-index': '99',
          'box-sizing': 'border-box',
          'overflow': 'scroll'
        });
        arrNode.forEach(function (item) {
          e._$setStyle(item.node, 'position', 'static');
          e._$addClassName(item.node, 'full-screen');
        });
        e._$addClassName(_node.firstElementChild, 'fullScreening');
        this.data.isFullScreen = true;
        v._$addEvent(window, 'keyup', escHandle);
      } else {
        _node.style = null;
        arrNode.forEach(function (item) {
          item.node.style = null;
          e._$delClassName(item.node, 'full-screen');
        });
        e._$delClassName(_node.firstElementChild, 'fullScreening');
        this.data.isFullScreen = false;
        v._$clearEvent(window, 'keyup', escHandle);
      }
    },
    doIgnoreProperty: function (index) {
      //索引是二维的说明是导入类型
      var x = (index || '').split('-')[0];
      var y = (index || '').split('-')[1];
      var item = this.data.params[x].imports[y];
      var _data = {
        parentId: this.data.parentId,
        parentType: this.data.parentType,
        datatypeId: item.datatypeId,
        ignored: 1 - item.ignored
      };
      this._updateField(item.id, _data, {
        datatypeId: item.datatypeId,
        uuid: this.data.uuid,
        cache: 'parameter',
        index: index
      });
    },
    doShowAllProperty: function (index) {
      this.data.params[index].allProperty = 1 - (this.data.params[index].allProperty ? 1 : 0);
    },
    destroy: function () {
      this.supr();
      var list = ['interface', 'datatype', 'parameter', 'page', 'iHeader', 'jarmap', 'varmap', 'cliArg'];
      list.forEach(function (type) {
        if (this['__' + type + 'cache']) {
          this['__' + type + 'cache']._$recycle();
        }
      }, this);
      this.__datatypeSelect = this.__datatypeSelect && this.__datatypeSelect._$recycle();
    }
  });
  return Origin;
});
