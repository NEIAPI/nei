NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/form/form',
  'base/util',
  'pro/common/module',
  'pro/common/res_create',
  'pro/cache/interface_cache',
  'pro/cache/group_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/notify/notify',
  'pro/select2/select2',
  'pro/radio_group/radio_group',
  'pro/modal/modal',
  'pro/tagme/tagme'
], function (_k, _e, _v, _t, _l, _f, _u, _m, create, cache, groupCache, proCache, pgCache, userCache, notify, select2, radio_group, _modal, _tag, _p, _pro) {
  /**
   * 模块
   * @class   {wd.m._$$ModuleResInterfaceCreate}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleResInterfaceCreate = _k._$klass();
  _pro = _p._$$ModuleResInterfaceCreate._$extend(create._$$ModuleResCreate);

  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function (config) {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-interface-create')
    );
    this.tagErrorTip = _e._$getByClassName(this.__body, 'tag-tip')[0];
    this.tagRequired = _e._$getByClassName(this.__body, 'tag-required')[0];
    this.localStorageKey = 'INTERFACE_CREATE_TEMP';
    var options = {
      resType: 'interface',
      localStorageKey: this.localStorageKey,
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__inCache',
      //是否有私有模块（模块自身有新建的私有模块弹窗）
      hasPrivateFlag: true,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {},
      //模块中用到的私有模块（新建的私有模块弹窗）
      inlineCreateList: ['group'],
      hasGroup: true,
      hasRespo: true,
      hasTag: true,
      hasShare: true,
      hasFollowTag: true,
      config: config
    };
    this.apiAudit = 0;
    this.proCache = proCache._$$CachePro._$allocate({
      onitemload: function () {
        var currentProject = this.proCache._$getItemInCache(this.projectId);
        this.progroupId = currentProject.progroupId;
        this.pgCache._$getItem({
          id: this.progroupId
        });
      }._$bind(this)
    });
    this.pgCache = pgCache._$$CacheProGroup._$allocate({
      onitemload: function () {
        this.apiAudit = this.pgCache._$getApiAuditStatus(this.progroupId);
        this.httpSpec = this.pgCache._$getHttpSpec(this.progroupId);
        if (this.httpSpec && this.httpSpec.tag) {
          _e._$delClassName(this.tagRequired, 'f-dn');
        }
        this.__renderSchemaSelect();
        this.__initFollowTag();
      }._$bind(this)
    });
    this.__super(options);
  };

  /**
   * 显示模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([[
      this.__form['path'], 'change',
      this.__checkValue.bind(this)
    ]]);
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this.check = !sessionStorage.getItem('not-check-http-spec');
    this.__schema = '';
    this.__renderMethodSelect();
    _e._$addClassName(this.tagErrorTip, 'f-dn');
    this.projectId = _options.param.pid;
    this.proCache._$getItem({
      id: this.projectId
    });
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__method = null;
    this.__followTag && (this.__followTag = this.__followTag._$recycle());
    this.__methodSelect = this.__methodSelect.destroy();
    this.__schemaRadio = this.__schemaRadio && this.__schemaRadio.destroy();
  };


  /**
   * 实例化关注人标签
   * @return {Void}
   */
  _pro.__initFollowTag = function () {
    var list = this.pgCache._$getRespoSelectSource(this.progroupId);
    var tags = [];
    this.__followTag = _tag._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__body, 'follow')[0],
      preview: false,
      choseOnly: true,
      placeholder: '请选择关注人',
      tags: tags,
      list: list,
      done: function (data) {
        if (!!data.change) {
          this.__watchUserIds = data.tags.map(function (user) {
            return user.id;
          });
        }
      }.bind(this)
    });
  };

  _pro.__refreshFollowTag = function () {
    if (this.__followTag) {
      var list = this.pgCache._$getRespoSelectSource(this.progroupId);
      var tags = [];
      var self = this;
      if (this.__watchUserIds && this.__watchUserIds.length > 0) {
        tags = list.filter(function (user) {
          return self.__watchUserIds.includes(user.id);
        });
      }
      this.__followTag._$add(tags);
    }
  };

  _pro.__renderSchemaSelect = function () {
    var interfaceSchema = this.httpSpec.interfaceSchema;
    var schemaSelectContainer = _e._$getByClassName(this.__form, 'form-group-schema')[0];
    if (interfaceSchema) {
      var schemaData = JSON.parse(interfaceSchema);
      var schemaNames = Object.keys(schemaData);
      _u._$forEach(schemaNames, function (item, index, list) {
        list[index] = {
          name: item,
          value: item
        };
      });
      this.__schemaRadio = new radio_group({
        data: {
          radioGroupName: 'interface_schema',
          source: [{name: '无', value: null}].concat(schemaNames),
          defaultValue: null
        }
      });

      // 获取当前选中项
      _e._$delClassName(schemaSelectContainer, 'hide');
      this.__schemaRadio.$inject(_e._$getByClassName(this.__form, 'schema')[0])
        .$on('change', function (result) {
          this.__schema = result;
          this.__checkValue();
          var method = schemaData[result] ? schemaData[result].reqMethod : '';
          this.__method = method;
          this.__renderMethodSelect(method);
        }.bind(this));
    } else {
      _e._$addClassName(schemaSelectContainer, 'hide');
    }
  };

  /**
   * 配置请求方法选择
   * @return {Void}
   */
  _pro.__renderMethodSelect = function (method) {
    var methodList = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
    var fixedMethod = false;
    if (method && methodList.indexOf(method) > -1) {
      methodList = [method];
      fixedMethod = true;
    }
    _u._$forEach(methodList, function (item, index, list) {
      list[index] = {
        name: item,
        id: item
      };
    });
    this.__methodSelect = new select2({
      data: {
        source: methodList,
        choseOnly: false,
        selected: fixedMethod ? methodList[0] : {
          name: 'GET',
          id: 'GET'
        },
        sortList: false
      }
    });
    this.__method = methodList[0];
    if (!!this.__dataStorge && this.__dataStorge.method) {
      this.__methodSelect.$emit('select', {
        selected: this.__dataStorge.method
      });
      this.__method = this.__dataStorge.method;
    }
    // 获取当前选中项
    if (_e._$getByClassName(this.__form, 'method').length > 0) {
      _e._$getByClassName(this.__form, 'method')[0].innerHTML = '';
    }
    this.__methodSelect.$inject(_e._$getByClassName(this.__form, 'method')[0])
      .$on('change', function (result) {
        this.__method = result.selected;
        this.__checkValue();
      }.bind(this));
  };

  /**
   * 检查某项输入是否符合
   * @return {Boolean}
   */
  _pro.__checkValidity = function (value, regexStr) {
    if (regexStr == null || regexStr === '') {
      return true;
    } else {
      try {
        var regex = new RegExp(regexStr);
        return regex.test(value);
      } catch (e) {
      }
    }
  };

  /**
   * 检查并显示错误信息
   * @return {Boolean}
   */
  _pro.__checkValue = function () {
    if (!this.check) {
      return true;
    }
    var path = this.__formElem['path'].value,
      method = this.__method ? this.__method.name : '';
    var hasError = false;
    var tagError = '<div>标签不符合HTTP接口规范【' + (this.httpSpec.tagDescription ? this.httpSpec.tagDescription : _u._$escape(this.httpSpec['tag'])) + '】</div>';
    if (this.__tags && this.__tags.length) {
      var tags = this.__tags.map(function (item) {
        return item.name;
      });
      if (tags.length) {
        var tagValid = tags.some(function (tag) {
          return this.__checkValidity(tag, this.httpSpec['tag']);
        }, this);
        if (!tagValid) {
          hasError = true;
          _e._$delClassName(this.tagErrorTip, 'f-dn');
          this.tagErrorTip.innerHTML = tagError;
        } else {
          _e._$addClassName(this.tagErrorTip, 'f-dn');
        }
      } else {
        if (this.httpSpec.tag) {
          hasError = true;
          _e._$delClassName(this.tagErrorTip, 'f-dn');
          this.tagErrorTip.innerHTML = tagError;
        }
      }
    } else {
      if (this.httpSpec.tag) {
        hasError = true;
        _e._$delClassName(this.tagErrorTip, 'f-dn');
        this.tagErrorTip.innerHTML = tagError;
      }
    }
    var valueObj = {
      path: path,
      method: method
    };
    var fields = ['path', 'method'];
    var fieldName = {
      path: '请求路径',
      method: '请求方法'
    };
    var errorMsg = '';
    fields.forEach(function (item) {
      if (!this.__checkValidity(valueObj[item], this.httpSpec[item])) {
        errorMsg += '<div>' + fieldName[item] + valueObj[item] + '不符合HTTP接口规范【' + (this.httpSpec[item + 'Description'] ? this.httpSpec[item + 'Description'] : _u._$escape(this.httpSpec[item])) + '】</div>';
      }
    }, this);
    if (errorMsg) {
      this.__formObj._$showMsgError('path', errorMsg);
      hasError = true;
    } else {
      this.__formObj._$showTip('path');
    }
    return !hasError;
  };

  /**
   * 提交表单，提交前作验证，重写逻辑
   */
  _pro.__handleSubmit = function () {
    if (this.__checkValue()) {
      this.__super();
    }
  };

  /**
   * 获取表单提交数据
   * @return {Object} 表单数据
   */
  _pro.__getSubmitOptions = function () {
    if (this.__tags && this.__tags.length) {
      var tags = this.__tags.map(function (item) {
        return item.name;
      });
    }
    //此处进行判断，如果项目组配置了接口审查功能，status初始为审核中，未开启的默认状态为未开始
    return {
      name: this.__formElem['name'].value,
      path: this.__formElem['path'].value,
      tag: tags && tags.length ? tags.join(',') : '',
      description: this.__formElem['description'].value || '',
      className: this.__formElem['classname'].value || '',
      respoId: this.__respo.id,
      groupId: this.__group ? this.__group.id : 0,
      projectId: this.__pid,
      method: this.__method ? this.__method.name : '',
      schema: this.__schema || '',
      status: '未开始',
      userIds: this.__watchUserIds || []
    };
  };


  /**
   * 内容存储
   * @return {Void}
   */
  _pro.__setStorage = function () {
    var storOpt = this.__getSubmitOptions();
    storOpt.respo = this.__respo;
    storOpt.group = this.__group;
    storOpt.tags = this.__tags;
    // window.localStorage.removeItem("interface");
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(storOpt));
  };

  /**
   * 填入表单逻辑
   * @param  {Object} options 待填入表单数据
   * @return {Void}
   */
  _pro.__doFillForm = function (options) {
    var items = ['name', 'path'];
    _u._$forEach(items, function (item) {
      _e._$attr(this.__formElem[item], 'value', options[item]);
    }.bind(this));
    this.__formElem['classname'].value = options.className;
    this.__formElem['description'].innerHTML = options.description;
    this.__watchUserIds = options.userIds;
  };

  /**
   * 表单重置
   * @return {Void}
   */
  _pro.__resetForm = function () {
    //父类定义的表单重置方法
    this.__formReset();
    this.__tag._$empty();
  };

  // notify dispatcher
  _m._$regist(
    'res-interface-create',
    _p._$$ModuleResInterfaceCreate
  );
});
