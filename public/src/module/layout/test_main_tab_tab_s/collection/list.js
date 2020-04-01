/**
 * 测试集接口列表
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/event/event',
  'pro/common/util',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/jst_extend',
  'pro/common/module',
  'pro/layout/test_main_tab_tab_s/test_tab_base',
  'pro/notify/notify',
  'pro/cache/testcollection_cache',
  'pro/cache/testcase_cache',
  'pro/cache/host_cache',
  'pro/cache/pro_cache',
  'pro/cache/constraint_cache',
  'pro/cache/datatype_cache',
  'pro/cache/interface_cache',
  'pro/modal/modal_res_list',
  'pro/stripedlist/stripedlist'
], function (_k, _e, _u, _c, _cu, _l, _jst, _jstEx, _m, _tabBase, _notify, _collectCache, _caseCache, _hostCache, _proCache, _csCache, _dtCache, _infCache, _modalResList, _stripedList, _p, _pro) {
  _p._$$ModuleCollectList = _k._$klass();
  _pro = _p._$$ModuleCollectList._$extend(_tabBase._$$ModuleTestTabBase);

  _pro.__doBuild = function (_options) {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-collection-list')
    );

    this.stripedListOptions = {
      parent: _e._$getByClassName(this.__body, 'list-content')[0],
      itemDraggable: true,
      lsListKey: 'nei-collect-interfaces-list',
      headers: [
        {
          name: '名称',
          key: 'name',
          keyPinyin: 'namePinyin'
        },
        {
          name: '方法',
          key: 'method'
        },
        {
          name: '路径',
          key: 'path'
        },
        {
          name: '标签',
          key: 'tag',
          valueType: 'tag',
          keyPinyin: 'tagPinyin',
        },
        {
          name: '版本',
          key: 'version.name',
          valueType: 'deepKey'
        },
        {
          name: '状态',
          key: 'status.name',
          keyPinyin: 'status.namePinyin',
          valueType: 'deepKey'
        },
        {
          name: '创建者',
          key: 'creator.realname',
          keyPinyin: 'creator.realnamePinyin',
          valueType: 'deepKey'
        },
        {
          name: '创建时间',
          key: 'createTime',
          valueType: 'time'
        },
        {
          name: '',
          key: '__nei-actions',
          valueType: '__nei-actions',
          sortable: false
        }
      ],
      filter: function (list, xlistState) {
        list.forEach(function (item) {
          var itemState = xlistState[item.id];
          itemState['__ui_name'] = _cu._$renderByJst(
            '<a href="/test/group/?pgid=${progroupId}&pid=${projectId}&iid=${id}" class="stateful">${name|escape2}</a>',
            item
          );
          itemState['__ui_name_hit_template'] = _cu._$renderByJst(
            '<a href="/test/group/?pgid=${progroupId}&pid=${projectId}&iid=${id}" class="stateful">{value}</a>',
            item
          );
          var str = '';
          str += _cu._$renderByJst(
            '<a href="/interface/detail/?pid=${projectId}&id=${id}" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>',
            item
          );
          var obj = {
            event: 'collect-view-testcase',
            ids: [item.id]
          };
          str += '<a class="edit-icon" data-action=' + JSON.stringify(obj) + ' title="查看用例"><em class="u-icon-edit-normal"></em></a>';
          obj = {
            event: 'collect-remove-inf',
            ids: [item.id]
          };
          str += '<a class="delete-icon" data-action=' + JSON.stringify(obj) + ' title="移除接口"><em class="u-icon-delete-normal"></em></a>';
          itemState['__nei-actions'] = str;
        }._$bind(this));
        return list;
      }._$bind(this),
      hasSearchBox: true,
      batchAction: this.__getBatchAction([
        {
          name: '测试已选',
          action: {
            event: 'collect-start-test'
          }
        },
        {
          name: '移除',
          action: {
            event: 'collect-remove-inf'
          }
        },
        {
          name: '置顶',
          action: {
            event: 'collect-move-inf',
            position: 'top'
          }
        },
        {
          name: '上移',
          class: 'batch-action-hide',
          action: {
            event: 'collect-move-inf',
            position: 'up'
          }
        },
        {
          name: '下移',
          class: 'batch-action-hide',
          action: {
            event: 'collect-move-inf',
            position: 'down'
          }
        },
        {
          name: '置底',
          action: {
            event: 'collect-move-inf',
            position: 'bottom'
          }
        }
      ]),
      dragstartHandler: this.__dragstartHandler.bind(this),
      dragoverHandler: this.__dragoverHandler.bind(this),
      dropHandler: this.__dropHandler.bind(this)
    };

    this.__noDataElem = _e._$getByClassName(this.__body, 'no-item-tip')[0];
    this.__collContentWrap = _e._$getByClassName(this.__body, 'collection-content-wrap')[0];
    this.__startBtn = this.__body.getElementsByClassName('start-test')[0];
  };

  _pro.__diffArray = function (arr1, arr2) {
    var keyMap = {};
    arr2.forEach(function (obj) {
      if (typeof obj === 'object') {
        keyMap[obj.id] = true;
      } else {
        keyMap[obj] = true;
      }
    });
    var res = [];
    arr1.forEach(function (obj) {
      var idKey = typeof obj === 'object' ? obj.id : obj;
      if (!keyMap[idKey]) {
        res.push(obj);
      }
    });
    return res;
  };

  _pro.__getBatchAction = function (actionData) {
    var batch = '';
    actionData.forEach(function (item) {
      batch += ('<a class="' + ['batch-action-item', item.class ? item.class : '', item.action.type == 'link' ? 'stateful' : ''].join(' ')
      + '" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>');
    });
    return batch;
  };

  _pro.__doAddInfs = function (ids) {
    this._collectCache._$addInfs({
      id: this._cid,
      data: {
        interfaceIds: ids.join(',')
      },
      onload: function () {
        this._modalDialog.destroy();
        this.__refreshList();
      }.bind(this)
    });
  };

  _pro.__doRemoveInfs = function (ids) {
    this._collectCache._$removeInfs({
      id: this._cid,
      data: {
        interfaceIds: ids.join(',')
      },
      onload: this.__refreshList.bind(this)
    });
  };

  _pro.__doAddCases = function (evt) {
    this._collectCache._$addCases({
      id: this._cid,
      data: {
        interfaceId: evt.interfaceId,
        caseIds: evt.ids.join(',')
      },
      onload: function (event) {
        this._modalDialog.destroy();
      }.bind(this)
    });
  };

  _pro.__doRemoveCases = function (evt) {
    this._collectCache._$removeCases({
      id: this._cid,
      data: {
        interfaceId: evt.interfaceId,
        caseIds: evt.ids.join(',')
      },
      onload: function () {
        this._modalDialog.destroy();
      }.bind(this)
    });
  };

  _pro.__refreshList = function () {
    this.stripedList._$updateList(this._collectCache._$getInterfaces(this._cid));
  };

  _pro.__dragstartHandler = function (evt) {
    var dt = evt.event.dataTransfer;
    dt.effectAllowed = 'move';
    dt.setData('drag-type', 'move-collect-interface');
    dt.setData('drag-data', evt.target.dataset['id']);
  };

  _pro.__dragoverHandler = function (evt) {
    evt.event.preventDefault();
  };

  _pro.__dropHandler = function (evt) {
    var dt = evt.event.dataTransfer;
    if (dt.getData('drag-type') === 'move-collect-interface') {
      var infId = dt.getData('drag-data');
      dt.dropEffect = 'move';
      if (_e._$hasClassName(evt.target, 'list-bd')) {
        this.__doMoveInfs(infId, 'bottom');
      } else {
        var listRowElem = _e._$getParent(evt.target, 'list-row');
        var targetId = listRowElem.dataset['id'];
        if (infId !== targetId) {
          this.__doMoveInfs(infId, targetId);
        }
      }
    }
    evt.event.preventDefault();
  };

  _pro.__doMoveInfs = function (movingIds, targetId) {
    if (!Array.isArray(movingIds)) {
      movingIds = [movingIds];
    }
    var collect = this._collectCache._$getItemInCache(this._cid);
    var infOrderList = collect.data;
    var infs = infOrderList.split(',');
    infs = infs.filter(function (val, index) {
      return infs.indexOf(val) === index;
    });
    var targetIndex;
    if (targetId === 'up') {
      targetIndex = Math.max(infs.indexOf('' + movingIds[0]) - 1, 0);
    } else if (targetId === 'down') {
      targetIndex = Math.max(infs.indexOf('' + movingIds) + 1, 0);
    } else if (/\d+/.test(targetId)) {
      targetIndex = infs.indexOf('' + targetId);
    }

    infs = this.__diffArray(infs, movingIds);
    if (targetId === 'bottom') {
      infs = infs.concat(movingIds);
    } else if (targetId === 'top') {
      infs = movingIds.concat(infs);
    } else if (targetIndex !== undefined) {
      movingIds.unshift(targetIndex, 0);
      [].splice.apply(infs, movingIds);
    }
    var newInfOrderList = infs.join(',');
    if (infOrderList !== newInfOrderList) {
      this._collectCache._$updateItem({
        id: this._cid,
        data: {
          data: newInfOrderList
        },
        ext: {
          updateKey: 'data'
        }
      });
    }
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([
      [
        this.__body.getElementsByClassName('interface-add')[0], 'click', function () {
        this.__showResEditDialog('interface');
      }.bind(this)
      ],
      [
        this.__startBtn, 'click', function () {
        this.__disableBtn(this.__startBtn, '测试全部', true);
        this.__getCsDtData(this.__startTest.bind(this, []));
      }.bind(this)
      ],
      [
        window, 'collect-start-test', function (evt) {
        if (!this.__isTesting) {
          this.__isTesting = true;
          this.__getCsDtData(this.__startTest.bind(this, evt.ids));
        }
      }.bind(this)
      ],
      [
        window, 'collect-add-inf', function (evt) {
        this.__doAddInfs(evt.ids);
      }.bind(this)
      ],
      [
        window, 'collect-remove-inf', function (evt) {
        this.__doRemoveInfs(evt.ids);
      }.bind(this)
      ],
      [
        window, 'collect-move-inf', function (evt) {
        this.__doMoveInfs(evt.ids, evt.position);
      }.bind(this)
      ],
      [
        window, 'collect-view-testcase', function (evt) {
        this.__showResEditDialog('testcase', 'view', evt);
      }.bind(this)
      ],
      [
        window, 'collect-add-testcase-entry', function (evt) {
        this.__showResEditDialog('testcase', 'add', evt);
      }.bind(this)
      ],
      [
        window, 'collect-add-testcase', function (evt) {
        this.__doAddCases(evt);
      }.bind(this)
      ],
      [
        window, 'collect-remove-testcase', function (evt) {
        this.__doRemoveCases(evt);
      }.bind(this)
      ]
    ]);
  };

  _pro.__startTest = function (ids, listData) {
    var infList = ids;
    if (!ids.length) {
      infList = [];
      this._collectCache._$getInterfaces(this._cid).forEach(function (inf) {
        infList.push(inf.id);
      });
    }
    if (infList.length === 0) {
      this.__disableBtn(this.__startBtn, '测试全部', false);
      _notify.show('当前测试集还未添加用例', 'error', 1200);
      return;
    }

    if (this._collCaseCache) {
      this._collCaseCache._$recycle();
    }

    var onloadFunc = function (cache, event, promise, resolve) {
      this._collCaseCache = cache;
      resolve([]);
    }.bind(this);
    var casePromise = _cu._$getDataByPromise(_caseCache._$$CacheTestCase, 'onlistload',
      onloadFunc, null, '_$getList',
      function (c) {
        return {
          key: c._$getListKeyByCollection(this._cid),
          data: {
            collectionId: this._cid,
            interfaceId: 0
          }
        };
      }.bind(this),
      this
    );

    var infPromise = _cu._$getDataByPromise(_infCache._$$CacheInterface, 'oncustomlistload',
      null, null, '_$getCustomList',
      {ids: infList.join(',')}, this);

    var projPromise = _cu._$getDataByPromise(_proCache._$$CachePro, 'onitemload',
      function (cache, event, promise, resolve) {
        var proj = cache._$getItemInCache(this._pid);
        if (proj.hostId > 0) {
          this._hostId = proj.hostId;
          _cu._$getDataByPromise(_hostCache._$$CacheHost, 'onitemload',
            function (hostCache, evt, promise, r) {
              var host = hostCache._$getItemInCache(this._hostId);
              hostCache._$recycle();
              r({
                host: host
              });
              resolve({
                proj: proj
              });
            }.bind(this), null, '_$getItem', {id: this._hostId}, this);
        }
        cache._$recycle();
      }.bind(this),
      null, '_$getItem',
      {id: this._pid}, this);

    Promise.all([casePromise, infPromise, projPromise]).then(function () {
      var infCache = _infCache._$$CacheInterface._$allocate({});
      var hostCache = _hostCache._$$CacheHost._$allocate({});
      var proCache = _proCache._$$CachePro._$allocate({});
      var caseList = this._collCaseCache._$getListInCache(this._collCaseCache._$getListKeyByCollection(this._cid));
      var host = hostCache._$getItemInCache(this._hostId);
      var checkRequiredParam = !proCache._$getItemInCache(this._pid).resParamRequired;
      var added = false;
      var tdata = {
        env: host,
        constraints: listData[0],
        datatypes: listData[1],
        checkRequiredParam: checkRequiredParam,
        data: []
      };
      infList.forEach(function (id) {
        var interface = infCache._$getItemInCache(id);
        tdata.data.push({
          interface: interface,
          testcases: []
        });
      });
      if (caseList.length) {
        caseList.forEach(function (test) {
          if (infList.indexOf(test.interfaceId) > -1) {
            test.env = host;
            tdata.data.filter(function (item) {
              return item.interface.id === test.interfaceId;
            })[0].testcases.push({
              testcase: test
            });
            test.state = this.dbConst.API_TST_TODO;
            added = true;
          }
        }._$bind(this));
      }
      infCache._$recycle();
      hostCache._$recycle();
      this.__disableBtn(this.__startBtn, '测试全部', false);
      delete this.__isTesting;
      if (added) {
        this._collCaseCache._$startTests(tdata);
        this.__doSendMessage('/?/system/tab/', {
          type: 'show-test-progress'
        });
      } else {
        _notify.show('当前测试集还未添加用例', 'error', 1200);
      }
    }.bind(this)).catch(function (e) {
    });
  };

  _pro.__showResEditDialog = function (resType, actionType, evt) {
    if (resType === 'interface') {
      var infCache = _infCache._$$CacheInterface._$allocate({
        onlistload: function (event) {
          var projInfList = infCache._$getListInCache(event.key);
          var collectInfs = this._collectCache._$getInterfaces(this._cid);
          var infList = this.__diffArray(projInfList, collectInfs);
          infCache._$recycle();
          this._modalDialog = new _modalResList({
            data: {
              title: '测试集-接口管理',
              listOption: {
                _$getTagList: _cu.getTagList(infList),
                xlist: infList,
                lsListKey: 'nei-collect-interfaces-add-list',
                hasTagFilter: true,
                headers: [
                  {
                    name: '名称',
                    key: 'name',
                    keyPinyin: 'namePinyin'
                  },
                  {
                    name: '方法',
                    key: 'method'
                  },
                  {
                    name: '路径',
                    key: 'path'
                  },
                  {
                    name: '标签',
                    key: 'tag',
                    valueType: 'tag',
                    keyPinyin: 'tagPinyin',
                    filter: 'tag'
                  },
                  {
                    name: '版本',
                    key: 'version.name',
                    valueType: 'deepKey'
                  },
                  {
                    name: '创建者',
                    key: 'creator.realname',
                    keyPinyin: 'creator.realnamePinyin',
                    valueType: 'deepKey'
                  },
                  {
                    name: '创建时间',
                    key: 'createTime',
                    valueType: 'time'
                  },
                  {
                    name: '',
                    key: '__nei-actions',
                    valueType: '__nei-actions'
                  }
                ],
                filter: function (list, xlistState) {
                  list.forEach(function (item) {
                    var itemState = xlistState[item.id];
                    var str = '';
                    // 查看详情
                    str += _cu._$renderByJst(
                      '<a href="/interface/detail/?pid=${projectId}&id=${id}" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>',
                      item
                    );
                    itemState['__nei-actions'] = str;
                  }._$bind(this));
                  return list;
                }._$bind(this),
                hasSearchBox: true,
                batchAction: this.__getBatchAction([
                  {
                    name: '增加',
                    action: {
                      event: 'collect-add-inf'
                    }
                  }
                ])
              }
            }
          });
        }.bind(this)
      });
      infCache._$getList({
        key: infCache._$getListKey(this._pid),
        data: {
          pid: this._pid
        }
      });
    } else if (resType === 'testcase') {
      var collectCasePromise = _cu._$getDataByPromise(_caseCache._$$CacheTestCase, 'onlistload',
        null, null,
        '_$getList',
        function (c) {
          return {
            key: c._$getListKeyByCollection(this._cid, evt.ids[0]),
            data: {
              collectionId: this._cid,
              interfaceId: evt.ids[0]
            }
          };
        }.bind(this),
        this
      );

      var infCasePromise;
      if (actionType === 'view') { // 查看时，不需要查询接口所有用例
        infCasePromise = Promise.resolve([]);
      } else {
        infCasePromise = _cu._$getDataByPromise(_caseCache._$$CacheTestCase, 'onlistload',
          null, null,
          '_$getList',
          function (c) {
            return {
              key: c._$getListKey(evt.ids[0]),
              data: {
                interfaceId: evt.ids[0]
              }
            };
          }.bind(this),
          this
        );
      }
      Promise.all([collectCasePromise, infCasePromise]).then(function () {
        this.__showCaseEditDialog(actionType, evt, arguments[0]);
      }.bind(this)).catch(function () {
      });
    }
  };

  _pro.__showCaseEditDialog = function (actionType, evt, listData) {
    var caseList;
    var actionHtml;
    var batActions;
    var modalTitle;
    if (actionType === 'view') {
      caseList = listData[0];
      actionHtml = '<span class="res-add" data-action="'
        + _jstEx.escape2(JSON.stringify({
          ids: evt.ids,
          event: 'collect-add-testcase-entry'
        }))
        + '"><i class="u-icon-add-normal"></i>增加用例</span>';
      batActions = [
        {
          name: '移除',
          action: {
            interfaceId: evt.ids[0],
            event: 'collect-remove-testcase'
          }
        }
      ];
      modalTitle = '测试集接口-用例管理';
    } else {
      this._modalDialog.destroy();
      caseList = this.__diffArray(listData[1], listData[0]);
      batActions = [
        {
          name: '增加',
          action: {
            interfaceId: evt.ids[0],
            event: 'collect-add-testcase'
          }
        }
      ];
      modalTitle = '测试集接口-用例管理(待增加)';
    }
    this._modalDialog = new _modalResList({
      data: {
        interfaceId: evt.ids[0],
        title: modalTitle,
        actionHtml: actionHtml,
        listOption: {
          xlist: caseList,
          lsListKey: 'nei-collect-testcases-list',
          defaultSortKey: 'testBegTime',
          sortable: true,
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
            }
          ],
          filter: function (list, xlistState) {
            list.forEach(function (item) {
              var itemState = xlistState[item.id];
              var infParamStr = 'pgid=' + item.progroupId + '&pid=' + this._pid + '&iid=' + item.interfaceId;
              itemState['__ui_name'] = '<a href="/test/group/case/detail?' + infParamStr + '&id=' + item.id
                + '" class="stateful">' + item.name + '</a>';
              itemState['__ui_name_hit_template'] = '<a href="/test/group/case/detail?' + infParamStr + '&id=' + item.id
                + '" class="stateful">{value}</a>';
            }._$bind(this));
            return list;
          }._$bind(this),
          hasSearchBox: true,
          batchAction: this.__getBatchAction(batActions)
        }
      }
    });
  };

  _pro.__getCsDtData = function (callback) {
    var getListParam = function (c) {
      return {
        key: c._$getListKey(this._pid),
        data: {
          pid: this._pid
        }
      };
    }.bind(this);
    var csPromise = _cu._$getDataByPromise(_csCache._$$CacheConstraint, 'onlistload',
      null, null, '_$getList',
      getListParam, this);
    var dtPromise = _cu._$getDataByPromise(_dtCache._$$CacheDatatype, 'onlistload',
      null, null, '_$getList',
      getListParam, this);
    Promise.all([csPromise, dtPromise]).then(function () {
      if (callback) {
        callback(arguments[0]);
      }
    }).catch(function () {
    });
  };

  _pro.__clearPromises = function () {
    delete this.__isTesting;
    if (this._promises && this._promises.length) {
      _u._$reverseEach(this._promises, function (p) {
        p.__cancel();
      });
    }
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    this._pid = parseInt(_options.param.pid, 10);
    this._cid = parseInt(_options.param.cid, 10);
    this._pgid = parseInt(_options.param.pgid, 10);
    this.stripedList && this.stripedList._$recycle();
    this.__clearPromises();
    this._promises = [];
    if (this._cid) {
      if (!this._collectCache) {
        this._collectCache = _collectCache._$$CacheTestcollection._$allocate({
          onlistload: function () {
            var collect = this._collectCache._$getItemInCache(this._cid);
            if (collect.type === 1) {
              dispatcher._$redirect('/test/group/dependency/?pgid=' + this._pgid + '&pid=' + this._pid + '&cid=' + this._cid);
              return;
            }
            // _jst._$render(this.__body, 'module-test-collection-list-content', {
            // hostAction: JSON.stringify({
            //     type: 'modify',
            //     cache: 'testcollection',
            //     id: this._cid,
            //     name: 'host',
            //     required: true
            // }),
            // host: collect.host
            // });
            this.stripedListOptions.xlist = this._collectCache._$getInterfaces(this._cid);
            this.stripedList = _stripedList._$$ModuleStripedList._$allocate(this.stripedListOptions);
          }.bind(this),
          onitemupdate: function (evt) {
            if (evt.ext.updateKey === 'data') {
              this.__refreshList();
            }
          }.bind(this)
        });
      }
      this._collectCache._$getList({
        key: this._collectCache._$getListKey(this._pid),
        data: {
          pid: this._pid
        }
      });
      this.__getCsDtData();
      _e._$addClassName(this.__noDataElem, 'f-dn');
      _e._$delClassName(this.__collContentWrap, 'f-dn');
    } else {
      _e._$delClassName(this.__noDataElem, 'f-dn');
      _e._$addClassName(this.__collContentWrap, 'f-dn');
    }
  };

  _pro.__onHide = function (_options) {
    this.__doClearDomEvent();
    this.stripedList && this.stripedList._$recycle();
    delete this.stripedList;
    this._collectCache && this._collectCache._$recycle();
    delete this._collectCache;
    this._collCaseCache && this._collCaseCache._$recycle();
    delete this._collCaseCache;
    this.__clearPromises();
    this.__super();
  };

  _m._$regist(
    'test-suite-list',
    _p._$$ModuleCollectList
  );
});
