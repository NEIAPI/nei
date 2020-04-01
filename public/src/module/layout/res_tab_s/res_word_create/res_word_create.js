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
  'pro/cache/word_cache',
  'pro/cache/group_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/notify/notify',
  'pro/select2/select2',
  'pro/tagme/tagme',
  'pro/common/constants',
  'json!3rd/fb-modules/config/db.json',
], function (_k, _e, _v, _t, _l, _f, _u, _m, create, cache, groupCache, proCache, pgCache, notify, select2, tagme, consts, dbConst, _p, _pro) {

  _p._$$ModuleResWordCreate = _k._$klass();
  _pro = _p._$$ModuleResWordCreate._$extend(create._$$ModuleResCreate);

  _pro.__doBuild = function () {
    // todo 此处的名称规则 应该参考现有的参数名称录入规则
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-res-word-create')
    );

    this.localStorageKey = 'WORD_CREATE_TEMP';
    var options = {
      resType: 'word',
      localStorageKey: this.localStorageKey,
      listCache: cache._$cacheKey,
      //实例化cache实例名称
      cacheName: '__wordCache',
      //是否有私有模块（模块自身有新建的私有模块弹窗）
      hasPrivateFlag: false,
      //cache监听的回调事件
      callBackList: ['onitemadd', 'onerror'],
      //子类cache 参数
      cacheOption: {
        onlistload: function () {
          _pro.wordList = this[this._subOpt.cacheName]._$getListInCache(this._listCacheKey);
        }.bind(this)
      },
      //模块中用到的私有模块（新建的私有模块弹窗）
      inlineCreateList: ['group'],
      hasGroup: true,
      hasRespo: false,
      hasTag: true,
      hasShare: false,
      //allocateComponent: this.__renderCodeEditor.bind(this)
    };
    this.__super(options);
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this[this._subOpt.cacheName]._$getList({
      key: this._listCacheKey,
      data: {pid: this.__pid}
    });
  };

  _pro.__initForm = function (useStorage) {
    this.__super(useStorage);
    this.__initAssociate();
  };

  /**
   * 初始化关联词输入模块
   * @return {Void}
   */
  _pro.__initAssociate = function () {
    this.__associate = tagme._$$ModuleTagme._$allocate({
      parent: _e._$getByClassName(this.__form, 'associate')[0],
      preview: false,
      choseOnly: false,
      foreceHideDropdown: true,
      noTagTip: '暂无联想词',
      tagName: '联想词',
      itemStyle: {
        backgroundColor: '#dbb64c'
      },
      tags: this.__dataStorge && this.__dataStorge.associatedWords ? this.__dataStorge.associatedWords : [],
      done: function (result) {
        if (!!result.change) {
          this.__associatedWords = result.tags;
        }
      }.bind(this),
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();

    if (this.__associate) {
      this.__associatedWords = [];
      setTimeout(function () {
        this.__associate._$recycle();
        delete this.__associate;
      }.bind(this), 0);
    }
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

  _pro.__oncheck = function (event) {
    if (!_pro.wordList || event.target.name !== 'name') {
      return;
    }

    var word = _pro.wordList.find(function (w) {
      return w.name === event.target.value;
    });

    if (word && word.type === dbConst.WORD_TYP_SYSTEM) {
      event.value = 100;
    }
  };

  _pro.__oninvalid = function (event) {
    if (event.target.name === 'name' && event.code === 100) {
      event.value = '系统内置词条，无需添加 <a href="https://github.com/x-orpheus/nei-toolkit/blob/master/doc/%E5%8F%82%E6%95%B0%E8%AF%8D%E6%9D%A1%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E.md#%E7%B3%BB%E7%BB%9F%E9%A2%84%E7%BD%AE%E5%8F%82%E6%95%B0%E8%AF%8D%E6%9D%A1" style="color: #30a1f2" target="_blank">系统词条</a>';
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

    if (this.__associatedWords && this.__associatedWords.length) {
      var associatedWords = this.__associatedWords.map(function (item) {
        return item.name;
      });
    }

    return {
      name: this.__formElem['name'].value,
      tag: tags && tags.length ? tags.join(',') : '',
      description: this.__formElem['description'].value || '',
      associatedWord: associatedWords && associatedWords.length ? associatedWords.join(',') : '',
      groupId: this.__group ? this.__group.id : 0,
      projectId: parseInt(this.__pid),
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
    storOpt.associatedWords = this.__associatedWords;
    window.localStorage.removeItem(this.localStorageKey);
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
    this.__associatedWords = options.associatedWords;
  };

  /**
   * 表单重置
   * @return {Void}
   */
  _pro.__resetForm = function () {
    //父类定义的表单重置方法
    this.__formReset();
    this.__tag._$empty();
    this.__associate._$empty();
  };

  // notify dispatcher
  _m._$regist(
    'res-word-create',
    _p._$$ModuleResWordCreate
  );
});
