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
  'pro/cache/pro_cache',
  'pro/cache/varmap_cache',
  'pro/cache/spec_cache',
  'pro/cache/user_cache',
  'pro/cache/cliarg_cache',
  'pro/select2/select2',
  'pro/stripedlist/stripedlist',
  'pro/params_preview/params_preview',
  'json!{3rd}/fb-modules/config/db.json',
  'pro/notify/notify',
  'pro/modal/modal',
  'pro/common/util'
], function (_k, _e, _u, _v, _t, _l, _jst, _m, _pgCache, _proCache, _VMCache, _specCache, _userCache, _cliCache, _s2, _sl, _editor, dbConst, _notify, _modal, _cu, _p, _pro) {

  _p._$$ModuleProPT = _k._$klass();
  _pro = _p._$$ModuleProPT._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-p-t')
    );
    _jst._$render(this.__body, 'project-toollist', {});
    //获取复制到粘贴板的节点
    this.__copyTxt = _e._$getByClassName(this.__body, 'copy-txt')[0];
    this.__sampleCode = _e._$getByClassName(this.__body, 'sample-code')[0];
    this.__copyBtn = _e._$getByClassName(this.__body, 'copy-btn')[0];
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    this.__flagCtn = this.__body.querySelector('.tool-setting .t-part-content');
    this.__etoolkey = _e._$getByClassName(this.__copyTxt, 'key')[0];
    this.__itemLoadedOptions = {
      onitemload: this.__onloadHandler.bind(this),
      onrefreshkey: function (evt) {
        var node = _e._$getByClassName(this.__body, 'key')[0];
        node.innerText = evt.data.toolKey;
      }._$bind(this),
      onitemupdate: function (evt) {
        if (evt.ext && evt.ext.action === 'updateFlag') {
          this.__updateFlag(evt.ext.name);
        }
      }.bind(this)
    };
    this.__listLoadedOptions = {
      onlistload: this.__onloadHandler.bind(this)
    };
  };

  _pro.__onShow = function (_options) {
    this._loadedTime = 0;
    this.__updateTime = 0;
    this.__updateNum = 2;
    this.__vmCache = _VMCache._$$CacheVarMap._$allocate(this.__listLoadedOptions);
    this.__proCache = _proCache._$$CachePro._$allocate(this.__itemLoadedOptions);
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate(this.__itemLoadedOptions);
    this.__specCache = _specCache._$$CacheSpec._$allocate(this.__listLoadedOptions);
    this.__cliCache = _cliCache._$$CacheCliArg._$allocate(this.__listLoadedOptions);
    this.__super(_options);
    this.__doInitDomEvent([[
      _proCache._$$CachePro, 'update',
      function (_result) {
        this.__proCache._$getItem({id: _result.data.id});
        this.__vmCache._$getList({
          key: this._proVMKey,
          data: {
            parentId: this.__pid,
            parentType: dbConst.SPC_MAP_PROJECT
          },
          ext: {type: 'VMCache'}
        });
        if (!!_result.ext && !!_result.ext.updateSpec && _result.ext.updateSpec) {
          this.__specCache._$getList({
            key: _specCache._$cacheKey,
            ext: {type: 'specCache'}
          });
        }
      }.bind(this)
    ]]);
  };

  _pro.__onRefresh = function (_options) {
    _e._$addClassName(this.__body, 'f-dn');
    _e._$delClassName(this.__loading, 'f-dn');
    this.__super(_options);
    this.__pid = _options.param.pid;
    this.__proCache._$getItem({id: this.__pid});
    this.__pgCache._$getItem({id: this.__pgid, ext: {type: 'pgGroup'}});
    this._proVMKey = this.__vmCache._$getListKey(this.__pid, dbConst.SPC_MAP_PROJECT);
    this._cliArgsKey = this.__cliCache._$getListKey(this.__pid);
    this.__vmCache._$getList({
      key: this._proVMKey,
      data: {
        parentId: this.__pid,
        parentType: dbConst.SPC_MAP_PROJECT
      }
    });
    this.__specCache._$getList({
      key: _specCache._$cacheKey
    });
    this.__cliCache._$getList({
      key: this._cliArgsKey,
      data: {
        projectId: this.__pid
      }
    });
  };

  _pro.__onHide = function () {
    this.__super();
    if (this.__webCliList) {
      this.__webCliList = this.__webCliList._$recycle();
    }
    if (this.__aosCliList) {
      this.__aosCliList = this.__aosCliList._$recycle();
    }
    if (this.__iosCliList) {
      this.__iosCliList = this.__iosCliList._$recycle();
    }
    if (this.__testCliList) {
      this.__testCliList = this.__testCliList._$recycle();
    }
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
    if (this.__pgCache) {
      this.__pgCache = this.__pgCache._$recycle();
    }
    if (this.__proCache) {
      this.__proCache = this.__proCache._$recycle();
    }
    if (this.__vmCache) {
      this.__vmCache = this.__vmCache._$recycle();
    }
    if (this.__specCache) {
      this.__specCache = this.__specCache._$recycle();
    }
    if (this.__cliCache) {
      this.__cliCache = this.__cliCache._$recycle();
    }
    delete this.__proFlags;
    this.__doClearDomEvent();
  };
  /**
   * 参数编辑器实例化
   * @param  {Object} options
   * @return {Object} 参数编辑器实例
   */
  _pro.__newEditor = function (options) {
    if (options.type == 'vmlist') {
      return _editor._$$Editor._$allocate({
        parent: options.parent,
        parentId: this.__pid,
        pid: this.__pid,
        parentType: dbConst.SPC_MAP_PROJECT,
        params: options.list,
        format: 7,
        specType: options.specType,
        level: this.__level,
        shape: 'project',
        listKey: options.listKey
      });
    } else if (options.type == 'cliargs') {
      return _editor._$$Editor._$allocate({
        parent: options.parent,
        parentId: this.__pid,
        pid: this.__pid,
        parentType: dbConst.SPC_MAP_PROJECT,
        params: options.list,
        format: 8,
        specType: options.specType,
        level: this.__level,
        listKey: options.listKey
      });
    }
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
      btn, 'click', this.__showHide.bind(this, subParent, type)
    ]]);
  };
  /**
   * 展开收起处理函数
   * @param  {Object} parent 列表父节点
   * @return {Void}
   */
  _pro.__showHide = function (parent, type, event) {
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

  /**
   * 工程规范映射列表数据处理
   *
   * @return {Void}
   */

  _pro.__renderVMList = function () {
    //项目规范划分
    var webSpec = [], aosSpec = [], iosSpec = [], testSpec = [];
    //取得工程名字
    var spec = {
      web: this.__project.toolSpecWeb,
      aos: this.__project.toolSpecAos,
      ios: this.__project.toolSpecIos,
      test: this.__project.toolSpecTest
    };
    //选择出不同的规范类型
    _u._$forEach(this.__specList, function (item) {
      var specItem = {
        name: item.name,
        id: item.id
      };
      switch (item.type) {
        case 0: //web工程
          //如果是有权限的用户，筛选出他创建的和他人选中的
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
    }.bind(this));
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
    var list = this.__vmCache._$getListInCache(this._proVMKey + '-' + type);
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
    // this._loadedTime等于5时，说明四个请求皆发送成功，可正常显示模块
    this._loadedTime++;
    // 获取当前项目
    this.__project = this.__proCache._$getItemInCache(this.__pid);
    if (!this.__project) {
      return;
    }
    this.__pgid = this.__project.progroupId;
    if (evt.ext && evt.ext.type == 'pgGroup') {
      var progroup = this.__pgCache._$getItemInCache(this.__pgid);
      progroup.projects.forEach(function (item) {
        if (item.id == this.__pid) {
          var eKey = _e._$getByClassName(this.__copyTxt, 'key')[0];
          eKey.innerHTML = item.toolKey;
        }
      }, this);
    }
    if (this._loadedTime < 5) {
      return;
    } else if (this._loadedTime > 5) {
      // this._loadedTime大于5时，重新设置了工程规范，重新渲染映射列表及相关的信息
      this.__updateTime++;
      if (this.__updateTime < this.__updateNum) {
        if (!!evt && !!evt.ext && !!evt.ext.type && evt.ext.type == 'specCache') {
          this.__specList = this.__specCache._$getListInCache(_specCache._$cacheKey);
        }
        return;
      }
      this.__updateTime = 0;
      this.__vmList = this.__vmCache._$getListInCache(this._proVMKey);
      this.__filterVMList(this.__vmList);
      this.__renderVMList();
      return;
    }

    this.__userId = _userCache._$$CacheUser._$allocate()._$getUserInCache().id;
    this.__canEdit = this.__pgCache._$getPrivilege(this.__pgid).isAdminOrCreator;
    // 获取所有规范
    this.__specList = this.__specCache._$getListInCache(_specCache._$cacheKey);
    // 获取当前项目下的变量映射
    this.__vmList = this.__vmCache._$getListInCache(this._proVMKey);
    this.__filterVMList(this.__vmList);
    //命令行参数
    this.__cliList = this.__cliCache._$getListInCache(this._cliArgsKey);
    if (this.__canEdit) {
      this.__level = 1;
      this.__editable = true;
    } else {
      this.__level = 0;
      this.__editable = false;
    }


    //删除加载中提示
    _e._$delClassName(this.__body, 'f-dn');
    _e._$addClassName(this.__loading, 'f-dn');
    //进行变量映射表的拼装
    this.__renderVMList();

    if (this.__canEdit) {
      this.__refreshBtn = _e._$getByClassName(this.__body, 'refresh-btn')[0];
      _e._$delClassName(this.__refreshBtn, 'f-dn');
      this.__doInitDomEvent([[
        this.__refreshBtn, 'click', this.__refreshKey.bind(this)
      ]]);
    }
    this.__doInitDomEvent([[
      this.__copyBtn, 'click', this.__clipboard.bind(this)
    ]]);
    hljs.highlightBlock(this.__sampleCode);

    var listParent = _e._$getByClassName(this.__body, 'tool-info')[0];
    //实例化命令行参数编辑器，添加展开收起功能
    this.__cliAllocate(listParent, 'web', 0);
    this.__addShowHideEvent(listParent, 'web');
    this.__cliAllocate(listParent, 'aos', 1);
    this.__addShowHideEvent(listParent, 'aos');
    this.__cliAllocate(listParent, 'ios', 2);
    this.__addShowHideEvent(listParent, 'ios');
    this.__cliAllocate(listParent, 'test', 3);
    this.__addShowHideEvent(listParent, 'test');

    if (this.__canEdit) {
      _e._$delClassName(this.__flagCtn, 'project-view-mode');
      this.__doInitDomEvent([[
        this.__flagCtn, 'click', this.__doUpdateFlag.bind(this)
      ]]);
    } else {
      _e._$addClassName(this.__flagCtn, 'project-view-mode');
    }

    this.__updateFlag();
  };

  _pro.__updateFlag = function () {
    this.__project = this.__proCache._$getItemInCache(this.__pid);
    this.__proFlags = [];
    this.__proFlags.push({
      name: 'resParamRequired',
      tip: '推荐给非必需字段设置默认值（比如空字符串、空数组），而不是不返回该字段',
      label: 'HTTP 接口-响应信息-返回结果的字段可否配置为非必需',
      resParamRequired: this.__project.resParamRequired == undefined ? 0 : this.__project.resParamRequired,
    }, {
      name: 'useWordStock',
      tip: '开启后，录入的参数名需预先在参数词库内定义',
      label: '开启参数字典校验',
      useWordStock: this.__project.useWordStock == undefined ? 0 : this.__project.useWordStock
    });

    _jst._$render(this.__flagCtn, 'project-setting-items', {
      flags: this.__proFlags
    });
  };

  _pro.__sendUpdateRequest = function (data, flagName) {
    this.__proCache._$updateItem({
      id: this.__pid,
      data: data,
      ext: {
        name: flagName,
        action: 'updateFlag'
      }
    });
  };

  _pro.__doUpdateFlag = function (evt) {
    var elem = _v._$getElement(event, 'd:name');
    if (elem) {
      var flagName = _e._$dataset(elem, 'name');
      for (var i = 0, len = this.__proFlags.length; i < len; i++) {
        if (this.__proFlags[i].name === flagName) {
          break;
        }
      }
      var flagItem = this.__proFlags[i];
      var data = {};
      data[flagName] = Number(!flagItem[flagName]);
      if (data[flagName] === 1) {
        var modal = _modal.confirm({
          title: '提示',
          content: flagItem.tip
        });
        modal.$on('ok', this.__sendUpdateRequest.bind(this, data, flagName));
      } else {
        this.__sendUpdateRequest(data, flagName);
      }
    }
  };

  /**
   * 实例化命令行参数
   * @param  {Object} listpaent 父节点
   * @param  {String} type 命令行参数类型
   *@param  {Number} clitype listkey的num
   * @return {vod}
   */
  _pro.__cliAllocate = function (listParent, type, clitype) {
    var className = 'tool-' + type;
    var subParent = _e._$getByClassName(listParent, className)[0];
    var parent = _e._$getByClassName(subParent, 'procli-list')[0];
    var list = this.__cliCache._$getListInCache(this._cliArgsKey + '-' + clitype);
    var cliList = list.map(function (item) {
      var cliItem = {
        key: item.key,
        value: item.value,
        id: item.id
      };
      return cliItem;
    });
    var options = {
      type: 'cliargs',
      parent: parent,
      list: cliList,
      specType: clitype,
      listKey: this._cliArgsKey + '-' + clitype
    };
    this['__' + type + 'CliList'] = this.__newEditor(options);
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
    var selectDiv = _e._$getByClassName(this.__body, 'spec-' + type + '-select')[0];
    selectDiv.innerHTML = '';
    if (!!filtered[0]) {
      var dataOption = {
        source: specObj[type],
        selected: filtered[0],
        editable: editable,
        preview: true,
        selectFirst: false
      };
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
    var hintHTML = '您暂时没有可选择的' + type + '规范<a class="u-spec-add stateful" href="/spec/create?s=' + type
      + '">新建' + type + '规范</a>';
    var divParent = _e._$getByClassName(this.__body, 'tool-' + type)[0];
    var insertNode = _e._$getByClassName(divParent, 't-part-specname')[0];
    var specCheck = _e._$getByClassName(divParent, 'spec-check')[0];
    var specClear = _e._$getByClassName(divParent, 'spec-clear')[0];
    //如果不能编辑并且没有默认选中的规范，就不实例化选择器
    if (!editable && !filtered[0]) {
      var _node = _e._$create('div', 'z-empty', insertNode);
      _node.innerHTML = '<span>无</span>';
      selectDiv.appendChild(_node);
      this.__showSpecVM(type, _e._$getByClassName(this.__body, 'tool-' + type)[0], this.__pid);
    } else {
      if (specObj[type].length > 0) {
        //实例化工程规范下拉组件
        if (!!this['__' + type + 'SpecSelect']) {
          this['__' + type + 'SpecSelect'] = this['__' + type + 'SpecSelect'].destroy();
        }
        this['__' + type + 'SpecSelect'] = new _s2({
          data: dataOption
        }).$inject(selectDiv);
        //值发生改变的时候重新重新渲染数据
        this['__' + type + 'SpecSelect'].$on('change', function (result) {
          var Obj = {};
          var specType = type.charAt(0).toUpperCase() + type.substr(1);
          Obj['toolSpec' + specType] = result.selected.id;
          //如果旧值不是自己创建的，就清空specCache重新获取
          if (!!result.oSelected.isCreator && result.oSelected.isCreator == true) {
            this.__updateNum = 3;
            this.__specCache._$clearListInCache(_specCache._$cacheKey);
            this.__proCache._$updateItem({
              id: this.__pid,
              data: Obj,
              ext: {updateSpec: true}
            });
          } else {
            this.__proCache._$updateItem({id: this.__pid, data: Obj});
          }
          this.__vmCache._$clearListInCache(this._proVMKey);
        }.bind(this));
        //显示规范映射列表
        if (!!filtered[0]) {
          this.__showSpecVM(type, _e._$getByClassName(this.__body, 'tool-' + type)[0], filtered[0].id);
          _e._$delClassName(specCheck, 'f-dn');
          _e._$attr(specCheck, 'href', '/spec/detail/?id=' + filtered[0].id);

          if (this.__editable) {
            //显示清除按钮
            _e._$delClassName(specClear, 'f-dn');
            this.__doInitDomEvent([[
              specClear, 'click', this.__clearSpec._$bind(this, type, specClear, specCheck)
            ]]);
          }
        } else {
          this.__showSpecVM(type, _e._$getByClassName(this.__body, 'tool-' + type)[0], this.__pid);
        }
      } else {
        if (!editable) {
          hintHTML = '';
        }
        selectDiv.innerHTML = hintHTML;
        this.__showSpecVM(type, _e._$getByClassName(this.__body, 'tool-' + type)[0], this.__pid);
      }
    }
  };
  /**
   * 挑选出不同的映射列表
   * @param  {Array} list  与项目组相关的所有映射列表
   * @return {Void}
   */
  _pro.__filterVMList = function (list) {
    this.__specWebVM = [];
    this.__specAosVM = [];
    this.__specIosVM = [];
    this.__specTestVM = [];
  };

  /**
   * 清除规范
   * @param  {String} type  当前规范类型
   * @param  {Object} specCheck 查看规范节点
   * @param  {Object} specClear 清除节点
   * @return {Void}
   */

  _pro.__clearSpec = function (type, specClear, specCheck) {
    if (!!this.__clearSpecLayer) {
      this.__clearSpecLayer.destroy();
      this.__clearSpecLayer = null;
    }
    this.__clearSpecLayer = _modal.confirm({
      'content': '您确定要清除当前选中的规范吗？',
      'title': '清除选中的规范',
      'closeButton': true,
      'okButton': '清除',
      'cancelButton': true
    }).$on('ok', function () {
      var obj = {};
      var specType = type.charAt(0).toUpperCase() + type.substr(1);
      obj['toolSpec' + specType] = 0;
      //发送请求，清除选中的规范
      this.__proCache._$updateItem({
        id: this.__pid,
        data: obj
      });
      //隐藏查看规范详情和清除按钮
      _e._$addClassName(specClear, 'f-dn');
      _e._$addClassName(specCheck, 'f-dn');
    }.bind(this));

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
          type: 'vmlist',
          parent: insertDiv,
          list: this.__specWebVM,
          specType: 0,
          id: id,
          listKey: this._proVMKey + '-' + 0
        };
        this.__webSpecEidtor = this.__newEditor(optionsWeb);
        break;
      case 'aos':
        if (!!this.__aosSpecEidtor) {
          this.__aosSpecEidtor = this.__aosSpecEidtor._$recycle();
        }
        var optionsAos = {
          type: 'vmlist',
          parent: insertDiv,
          list: this.__specAosVM,
          specType: 1,
          id: id,
          listKey: this._proVMKey + '-' + 1
        };
        this.__aosSpecEidtor = this.__newEditor(optionsAos);
        break;
      case 'ios':
        if (!!this.__iosSpecEidtor) {
          this.__iosSpecEidtor = this.__iosSpecEidtor._$recycle();
        }
        var optionsIos = {
          type: 'vmlist',
          parent: insertDiv,
          list: this.__specIosVM,
          specType: 2,
          id: id,
          listKey: this._proVMKey + '-' + 2
        };
        this.__iosSpecEidtor = this.__newEditor(optionsIos);
        break;
      case 'test':
        if (!!this.__testSpecEidtor) {
          this.__testSpecEidtor = this.__testSpecEidtor._$recycle();
        }
        var optionsTest = {
          type: 'vmlist',
          parent: insertDiv,
          list: this.__specTestVM,
          specType: 3,
          id: id,
          listKey: this._proVMKey + '-' + 3
        };
        this.__testSpecEidtor = this.__newEditor(optionsTest);
        break;
    }
  };
  /**
   * 复制到剪贴板
   */
  _pro.__clipboard = function (evt) {
    var transfer = _e._$getByClassName(this.__body, 'copy-transfer')[0];
    if (!transfer) {
      transfer = _e._$create('textarea', 'copy-transfer', this.__body);
      var transferNode = _e._$getByClassName(this.__body, 'copy-transfer')[0];
      _e._$style(transferNode, {position: 'absolute', left: '-9999px', top: '-9999px'});
    }
    if (this.__copyTxt.innerText) {
      transfer.value = this.__copyTxt.innerText.trim();
      transfer.focus();
      transfer.select();
      document.execCommand('Copy', false, null);
      _notify.success('已成功复制到剪贴板');
    } else {
      _notify.error('工具标识为空');
    }
  };
  /**
   * 重新生成key
   */
  _pro.__refreshKey = function () {
    if (!!this.__refreshLayer) {
      this.__refreshLayer.destroy();
      this.__refreshLayer = null;
    }
    this.__refreshLayer = new _modal({
      data: {
        'contentTemplate': '<div>重新生成之后，之前的key将无法使用，确认重新生成吗？</div>',
        'class': 'm-modal-refresh',
        'title': '重新生成key',
        'closeButton': true,
        'okButton': true,
        'cancelButton': true
      }
    })
      .$on('ok', function () {
        this.__proCache._$refreshKey({
          id: this.__pid,
          key: this.__proCache._$getListKey(this.__pgid),
        });
      }.bind(this));
  };
  _m._$regist(
    'progroup-p-tool',
    _p._$$ModuleProPT
  );
});
