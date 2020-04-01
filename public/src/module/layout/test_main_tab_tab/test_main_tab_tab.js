/**
 * 接口操作tab模块
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/testcase_cache',
  'pro/modal/import_testcase/import_testcase',
  'pro/modal/modal'
], function (_k, _e, _v, t, _l, jst, _m, _cu, _tcCache, importTestcase, Modal, _p, _pro) {
  _p._$$ModuleTestMainTabTab = _k._$klass();
  _pro = _p._$$ModuleTestMainTabTab._$extend(_m._$$Module);
  // 标签列表数据
  var xlist1 = [
    {name: '用例填写', type: 'record', m: 'create'},
    {name: '测试报告', type: 'record', m: 'report'},
    {name: '规则函数', type: 'record', m: 'constraint'}
  ];
  var xlist2 = [
    {name: '用例管理', type: 'group', m: 'case'},
    {name: '创建用例', type: 'group', m: 'create'},
    {name: '测试报告', type: 'group', m: 'report'}
  ];

  _pro.__doBuild = function () {
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-main-tab-tab')
    );
  };

  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    this.__tbview._$recycle();
    delete this.__tbview;
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var isRecordTab = _options.input.location.umi.indexOf('record') > -1;
    var tplId = isRecordTab ? 'module-test-main-tab-tab-record' : 'module-test-main-tab-tab-progroup';
    var xlist = isRecordTab ? xlist1 : xlist2;
    var tplData = {
      xlist: xlist,
      iid: _options.param.iid,
      id: _options.param.id || NaN  // id 属性比较特别，window.id存在，如果是undefined，模板会插入auto-id的值
    };
    if (!isRecordTab) {
      tplData.pgid = _options.param.pgid;
      tplData.pid = _options.param.pid;
    }
    jst._$render(this.__body, tplId, tplData);
    this.__tbview && this.__tbview._$recycle();
    this.__tbview = t._$$TabView._$allocate({
      list: _e._$getChildren(this.__body),
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
    this._pid = _options.param.pid;
    this._iid = _options.param.iid;
    if (this._iid && /test\/group\/case/.test(_options.input.location.source)) {
      _e._$delClassName(_e._$getByClassName(this.__body, 'import-testcase-btn')[0], 'f-dn');
      var importBtn = this.__tbview.__list.find(function (tab) {
        return tab.className === 'import-testcase-btn';
      });
      var importFile = this.__tbview.__list.find(function (tab) {
        return tab.className === 'import-testcase-file f-dn';
      });
      this.__doInitDomEvent([
        [importFile, 'change', function (evt) {
          if (evt.target.files.length) {
            _cu._$importTestcaseFiles('json', evt.target.files, this.showImportConfirm.bind(this), this._pid);
            evt.target.value = '';
          }
        }.bind(this)],
        [importBtn, 'click', function () {
          importFile.click();
        }]
      ]);
    } else {
      _e._$addClassName(_e._$getByClassName(this.__body, 'import-testcase-btn')[0], 'f-dn');
    }
    this.__tbview._$match(_options.input.location.source.replace('/m', ''));
  };

  _pro.showImportConfirm = function (importData) {
    var importData = importData.filter(function (ipt) {
      return ipt.interface.id === +this._iid;
    }, this);
    if (importData.length) {
      new importTestcase({
        data: {
          pid: this._pid,
          iid: this._iid,
          importData: importData,
          checkSameInterface: true
        }
      }).$on('ok', function (evt) {
        var data = evt.data;
        // create batch testcases
        var sendData = [];
        data.forEach(function (ipt) {
          ipt.testcases.forEach(function (tc) {
            var pathParams = ipt.interface.params.pathParams.reduce(function (obj, item) {
              obj[item.name] = tc.pathParams && tc.pathParams[item.name];
              return obj;
            }, {});
            var reqParamsOptions = {};
            var reqParams = ipt.interface.params.inputs.reduce(function (obj, item) {
              obj[item.name] = tc.reqData && tc.reqData[item.name] && tc.reqData[item.name].value;
              reqParamsOptions[item.id] = tc.reqData && tc.reqData[item.name] ? {ignored: !!tc.reqData[item.name].ignored} : {ignored: false};
              return obj;
            }, {});
            var reqHeader = ipt.interface.params.reqHeaders.reduce(function (obj, item) {
              obj[item.name] = tc.reqHeaders && tc.reqHeaders[item.name];
              return obj;
            }, {});
            var resExpectHeader = ipt.interface.params.resHeaders.reduce(function (obj, item) {
              obj[item.name] = tc.resExpectHeaders && tc.resExpectHeaders[item.name] ? {
                value: tc.resExpectHeaders[item.name].value,
                error: tc.resExpectHeaders[item.name].error
              } : undefined;
              return obj;
            }, {});
            var resExpect = ipt.interface.params.outputs.reduce(function (obj, item) {
              obj[item.name] = tc.resExpect && tc.resExpect[item.name] ? {
                value: tc.resExpect[item.name].value,
                error: tc.resExpect[item.name].error
              } : undefined;
              return obj;
            }, {});
            sendData.push({
              interfaceId: ipt.interface.id,
              name: tc.name,
              description: tc.description,
              host: '',
              reqHeader: JSON.stringify(reqHeader),
              reqData: JSON.stringify({
                reqParams: reqParams,
                pathParams: pathParams,
                reqParamsOptions: reqParamsOptions
              }),
              resExpectHeader: JSON.stringify(resExpectHeader),
              resExpect: JSON.stringify(resExpect)
            });
          });
        });
        if (sendData.length) {
          var tcCache = _tcCache._$$CacheTestCase._$allocate();
          tcCache._$createBatch({
            data: {
              items: sendData
            },
            onload: function (event) {
              // 找到tabview中用例管理的stripedList来更新
              _v._$dispatchEvent(
                window, 'updateTestcaseList', {
                  data: false
                }
              );
            }.bind(this)
          });
        }
      }.bind(this));
    } else {
      Modal.alert({
        title: '导入测试用例失败',
        content: '在用例管理只能导入当前接口的用例！',
        clazz: 'modal-exp-error'
      });
    }
  };

  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };

  _m._$regist(
    'test-main-tab-tab',
    _p._$$ModuleTestMainTabTab
  );
});
