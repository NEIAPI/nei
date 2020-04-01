/**
 * 接口测试-用例管理模块
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/template/tpl',
  'pro/common/module',
  'pro/common/util',
  'pro/layout/test_main_tab_tab_s/test_tab_base',
  'pro/cache/testcase_cache',
  'pro/cache/interface_cache',
  'pro/cache/datatype_cache',
  'pro/cache/host_cache',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/constraint_cache',
  'pro/stripedlist/stripedlist'
], function (_k, _e, _u, _l, _m, util, tabBase, cache, interfaceCache, datatypeCache, hostCache, _pgCache, _proCache, csCache, stripedList, _p, _pro) {

  _p._$$ModuleTestCase = _k._$klass();
  _pro = _p._$$ModuleTestCase._$extend(tabBase._$$ModuleTestTabBase);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-case')
    );

    // 测试cache
    this.__cache = cache._$$CacheTestCase._$allocate({
      onitemupdate: function () {
        this.updateStripedList(true);
      }._$bind(this)
    });
    // 规则函数cache
    this.__csCache = csCache._$$CacheConstraint._$allocate({
      onlistload: function () {
        this.__constraints = this.__csCache._$getListInCache(this._listCacheKeyCs);
      }.bind(this)
    });
    // 数据模型cache
    this.__datatypeCache = datatypeCache._$$CacheDatatype._$allocate({
      onlistload: function () {
        this.__datatypes = this.__datatypeCache._$getListInCache(this._listCacheKeyDt);
        this.__csCache._$getList({
          key: this._listCacheKeyCs,
          data: {
            pid: this.__pid
          }
        });
      }._$bind(this)
    });
    this.__hostCache = hostCache._$$CacheHost._$allocate({
      onitemload: function (_options) {
        this._hostId = _options.id;
      }.bind(this)
    });
    this.__proCacheOptions = {
      onitemload: function () {
        this.__project = this.__proCache._$getItemInCache(this.__pid);
        this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
          onitemload: function () {
            //获取用户权限，并根据权限修改striplist参数
            var progroup = this.__pgCache._$getItemInCache(this.__project.progroupId);
            this.__role = this.__pgCache._$getRole(this.__project.progroupId);
            //如果是观察者没有批量操作权限
            if (this.__role == 'observer') {
              this.stripedListOptions.batchAction = '';
            }
            this.stripedList = stripedList._$$ModuleStripedList._$allocate(this.stripedListOptions);
            // 节流，防止列表更新太多卡顿
            this.updateList = util._$throttle(this.stripedList._$updateList.bind(this.stripedList));
            this.updateStripedList = function (cancelSort) {
              this.stripedList && (this.updateList(this.__cache._$getListInCache(this._listCacheKey), !!cancelSort));// 测试结果更新时刷新列表，先不进行排序，等所有测试结束后才进行排序，防止卡顿
            }.bind(this);
            this.__doInitDomEvent([
              [
                window, 'updateTestcaseList', function (event) {
                this.updateStripedList(event.data);
              }.bind(this)
              ]
            ]);
          }.bind(this)
        });
        //发送请求
        this.__pgCache._$getItem({
          id: this.__project.progroupId
        });
        if (this.__project.hostId > 0) {
          this.__hostCache._$getItem({
            id: this.__project.hostId
          });
        }
      }.bind(this)
    };
    this.__proCache = _proCache._$$CachePro._$allocate(this.__proCacheOptions);
    this.stripedListOptions = {
      parent: _e._$getByClassName(this.__body, 'case-content-wrap')[0],
      listCache: cache._$cacheKey,
      lsListKey: 'nei-testcases-list',
      filter: function (list, listStates) {
        // 处理 action 列
        list.forEach(function (item) {
          var infParamStr = 'pgid=' + this.__pgid + '&pid=' + this.__pid + '&iid=' + this.__iid;
          var itemState = listStates[item.id];
          itemState['__ui_name'] = '<a href="/test/group/case/detail?' + infParamStr + '&id=' + item.id
            + '" class="stateful">' + _u._$escape(item.name) + '</a>';
          itemState['__ui_name_hit_template'] = '<a href="/test/group/case/detail?' + infParamStr + '&id=' + item.id
            + '" class="stateful">{value}</a>';
          var str = '';
          str += '<a href="/test/group/case/detail?' + infParamStr + '&id=' + item.id + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';
          str += '<a title="测试报告" class="stateful" href="/test/group/report?' + infParamStr + '&id=' + item.id + '"><em class="u-icon-report-normal"></em></a>';
          //如果是观察者，不显示删除按钮
          if (this.__role !== 'observer') {
            var actionData = JSON.stringify({
              type: 'del',
              warn: true,
              cache: 'testcase',
              key: this._listCacheKey,
              ids: [item.id],
              items: [{
                id: item.id
              }]
            });
            str += '<a data-action=' + actionData + ' title="删除当前项"><em class="u-icon-delete-normal"></em></a>';
          }
          itemState['__nei-actions'] = str;
          if (item.state == this.dbConst.API_TST_DISABLED) {
            itemState['__class'] = 'disable';
          }
        }._$bind(this));
        return list;
      }._$bind(this),
      headers: [
        {
          name: '名称',
          key: 'name'
        },
        {
          name: '执行者',
          key: 'tester.realname',
          valueType: 'deepKey',
        },
        {
          name: '结果',
          key: 'state',
          valueType: 'testResult',
        },
        {
          name: '执行时间',
          key: 'testBegTime',
          valueType: 'time',
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions',
          sortable: false
        }
      ],
      defaultSortKey: 'testBegTime',
      sortable: true
    };

    this.__noDataElem = _e._$getByClassName(this.__body, 'no-item-tip')[0];
    this.__cntWrap = _e._$getByClassName(this.__body, 'case-content-wrap')[0];
  };

  _pro.__onRefresh = function (_options) {
    this.__pid = _options.param.pid;
    this.__iid = _options.param.iid;
    this.__pgid = _options.param.pgid;

    this.__super(_options);
    this.stripedList && this.stripedList._$recycle();
    delete this.stripedList;
    if (this.__iid) {
      _e._$addClassName(this.__noDataElem, 'f-dn');
      _e._$delClassName(this.__cntWrap, 'f-dn');
    } else { // 没有选中接口
      _e._$addClassName(this.__cntWrap, 'f-dn');
      _e._$delClassName(this.__noDataElem, 'f-dn');
      return;
    }

    this._listCacheKey = this.__cache._$getListKey(this.__iid);
    this._listCacheKeyDt = this.__datatypeCache._$getListKey(this.__pid);
    this._listCacheKeyCs = this.__csCache._$getListKey(this.__pid);
    this.stripedListOptions.queryData = {
      interfaceId: this.__iid
    };
    this.stripedListOptions.listCacheKey = this._listCacheKey;

    var delActionData = {
      type: 'del',
      cache: cache._$cacheKey,
      warn: true,
      key: this._listCacheKey
    };
    var testActionData = {
      type: 'test',
      event: 'interfaceDetailCaseTest',
      pid: this.__pid
    };
    var testBtn = '<a class="batch-action-item" data-action=\'' + JSON.stringify(testActionData) + '\'>全部重测</a>';
    var delBtn = '<a class="batch-action-item" data-action=' + JSON.stringify(delActionData) + '>删除</a>';
    this.stripedListOptions.batchAction = delBtn + testBtn;

    this.__cache._$getList({
      key: this._listCacheKey,
      data: {
        interfaceId: this.__iid
      }
    });
    //发送请求
    this.__proCache._$getItem({
      id: this.__pid
    });
    this.__datatypes = this.__datatypeCache._$getListInCache(this._listCacheKeyDt);
    if (this.__datatypes.length === 0) {
      this.__datatypeCache._$getList({
        key: this._listCacheKeyDt,
        data: {pid: this.__pid}
      });
    } else {
      this.__csCache._$getList({
        key: this._listCacheKeyCs,
        data: {
          pid: this.__pid
        }
      });
    }
  };

  _pro.__onShow = function (_options) {
    this.__doInitDomEvent([
      [
        window, 'interfaceDetailCaseTest', this.__runAll.bind(this)
      ]
    ]);
    this.__super(_options);
  };

  /**
   * 开始全部测试
   * @return {Void}
   */
  _pro.__runAll = function (event) {
    var ids = event.ids.join(',');
    // HTTP 接口cache
    this.__interfaceCache = interfaceCache._$$CacheInterface._$allocate({
      oncustomlistload: function () {
        this.__tests = this.__cache._$getListInCache(this._listCacheKey);
        var host = this.__hostCache._$getItemInCache(this._hostId);
        var tdata = {
          env: host,
          datatypes: this.__datatypes,
          constraints: this.__constraints,
          checkRequiredParam: !this.__project.resParamRequired,
          data: []
        };
        this.__tests.forEach(function (test) {
          if (~ids.indexOf(test.id)) {
            var addItem = tdata.data.filter(function (item) {
              return item.interface.id === test.interfaceId;
            })[0];
            var interface = this.__interfaceCache._$getItemInCache(test.interfaceId);
            if (!addItem) {
              tdata.data.push({
                interface: interface,
                testcases: [{
                  testcase: test
                }]
              });
            } else {
              addItem.testcases.push({
                testcase: test
              });
            }
            test.env = host;
            test.state = this.dbConst.API_TST_TODO;// 将所有测试显示为待开始状态
          }
        }._$bind(this));
        this.__cache._$startTests(tdata);
        this.stripedList._$updateList(this.__tests);
      }.bind(this)
    });
    this.__interfaceCache._$getCustomList({ids: this.__iid});//请求多个HTTP 接口详情
  };

  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    this.stripedList && this.stripedList._$recycle();
    delete this.stripedList;
  };

  _m._$regist(
    'test-case',
    _p._$$ModuleTestCase
  );
});
