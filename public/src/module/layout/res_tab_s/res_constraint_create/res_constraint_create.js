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
  'pro/cache/constraint_cache',
  'pro/cache/group_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/notify/notify',
  'pro/select2/select2',
  'pro/common/constants'
], function (_k, _e, _v, _t, _l, _f, _u, _m, create, cache, groupCache, proCache, pgCache, notify, select2, consts, _p, _pro) {

  _p._$$ModuleResConstraintCreate = _k._$klass();
  _pro = _p._$$ModuleResConstraintCreate._$extend(create._$$ModuleResCreate);

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-constraint-create').replace('CONSTRAINT_NAME_REGEX', consts.CONSTRAINT_NAME_REGEX)
    );
    this.__funcName = _e._$getByClassName(this.__body, 'funcname')[0];
    this.localStorageKey = 'CONSTRAINT_CREATE_TEMP';
    var options = {
      resType: 'constraint',
      localStorageKey: this.localStorageKey,
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__conCache',
      //是否有私有模块（模块自身有新建的私有模块弹窗）
      hasPrivateFlag: false,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {},
      //模块中用到的私有模块（新建的私有模块弹窗）
      inlineCreateList: ['group'],
      hasGroup: true,
      hasRespo: false,
      hasTag: true,
      hasShare: false,
      allocateComponent: this.__renderCodeEditor.bind(this)
    };
    this.__super(options);
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    // 函数名随名称变化
    _v._$addEvent(this.__formElem['name'], 'input', function (_event) {
      this.__funcName.innerText = _v._$getElement(_event).value;
    }.bind(this));
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var that = this;
    this.__functionCollect = [{'meta': 'object', 'caption': 'NEI', 'value': 'NEI', 'score': 1}, {
      'meta': 'object',
      'caption': 'Mock',
      'value': 'Mock',
      'score': 0.5
    }];
    ['mock', 'Random'].forEach(function (fun) {
      that.__functionCollect.push({
        meta: 'function',
        caption: fun,
        value: 'Mock.' + fun,
        score: fun == 'mock' ? 0.8 : 0.5
      });
    });
    ['Basic', 'Date', 'Image', 'Color',
      'Text', 'Name', 'Web', 'Address', 'Helper',
      'guid', 'id', 'increment'].forEach(function (fun) {
      that.__functionCollect.push({
        meta: 'function',
        caption: fun,
        value: 'Mock.Random.' + fun,
        score: 0.2
      });
    });
    this.__conCache._$addEvent('onlistload', function () {
      var list = this.__conCache._$getListInCache(this._listCacheKey);
      list.forEach(function (item) {
        this.__functionCollect.push({
          'meta': 'function',
          'caption': item.name,
          'value': item.type == 1 ? 'NEI.' + item.name : item.name,
          'score': 1
        });
      }, this);
    }.bind(this));
    this.__conCache._$getList({
      key: this._listCacheKey,
      data: {
        pid: this.__pid
      }
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    //this.__apply = null;
    this.__function = null;
    this.__funcName.innerText = '';
    this.__codeEditor = this.__codeEditor.destroy();
    _v._$clearEvent(this.__formElem['name']);
  };

  /**
   * 配置业务分组选择
   * @return {Void}
   */
  _pro.__renderGroupSelect = function () {
    var groups = this.__groupCache._$getGroupSelectSource(this.__pid);
    this.__groupSelect = new select2({
      data: {
        source: groups
      }
    });
    this.__group = groups[0];
    if (!!this.__dataStorge && this.__dataStorge.group) {
      this.__groupSelect.$emit('select', {selected: this.__dataStorge.group});
      this.__group = this.__dataStorge.group;
    }
    this.__groupSelect.$inject(_e._$getByClassName(this.__form, 'groups')[0])
      .$on('change', function (result) {
        this.__group = result.selected;
      }.bind(this));
    // 此时页面加载结束,保存当前表单数据,用来和离开前的数据比较以控制弹框提示。
    this.__initialData = JSON.stringify(this.__getSubmitOptions());
  };

  /**
   * 配置代码编辑器
   * @return {Void}
   */
  _pro.__renderCodeEditor = function () {
    var that = this;
    this.__codeEditor = ace.edit(_e._$getByClassName(this.__form, 'func')[0]);
    this.__codeEditor.setTheme('ace/theme/eclipse');
    this.__codeEditor.getSession().setMode('ace/mode/javascript');
    var funcText = '';
    if (!!this.__dataStorge && this.__dataStorge.function) {
      funcText = this.__dataStorge.function;
      this.__function = funcText;
    }
    this.__codeEditor.setValue(funcText);
    this.__codeEditor.setAutoScrollEditorIntoView(true);
    this.__codeEditor.setOption('showPrintMargin', false);
    this.__codeEditor.setOption('tabSize', 2);
    this.__codeEditor.on('change', function () {
      this.__function = this.__codeEditor.getValue();
    }.bind(this));
    var langTools = ace.require('ace/ext/language_tools');
    var tangideCompleter = {
      getCompletions: function (editor, session, pos, prefix, callback) {
        if (prefix.length === 0) {
          return callback(null, []);
        } else {
          return callback(null, that.__functionCollect);
        }
      }
    };
    this.__codeEditor.setOptions({
      enableLiveAutocompletion: true
    });
    langTools.addCompleter(tangideCompleter);
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
    return {
      name: this.__formElem['name'].value,
      tag: tags && tags.length ? tags.join(',') : '',
      description: this.__formElem['description'].value || '',
      groupId: this.__group ? this.__group.id : 0,
      projectId: parseInt(this.__pid),
      function: this.__function || ''
    };
  };

  /**
   * 内容存储
   * @return {Void}
   */
  _pro.__setStorage = function (evt) {
    var storOpt = this.__getSubmitOptions();
    storOpt.respo = this.__respo;
    storOpt.group = this.__group;
    storOpt.tags = this.__tags;
    window.localStorage.removeItem('constraint');
    window.localStorage.setItem(this.localStorageKey, JSON.stringify(storOpt));
  };

  /**
   * 填入表单逻辑
   * @param  {Object} _options 待填入表单数据
   * @return {Void}
   */
  _pro.__doFillForm = function (options) {
    _e._$attr(this.__formElem['name'], 'value', options.name);
    this.__formElem['description'].innerHTML = options.description;
    this.__funcName.innerText = options.name;
  };

  /**
   * 表单重置
   * @return {Void}
   */
  _pro.__resetForm = function () {
    //父类定义的表单重置方法
    this.__formReset();

    this.__codeEditor.setValue('');
    this.__tag._$empty();
  };

  // notify dispatcher
  _m._$regist(
    'res-constraint-create',
    _p._$$ModuleResConstraintCreate
  );
});
