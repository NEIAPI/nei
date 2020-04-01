/*
 * 依赖测试集详情
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
  './dependency_test_panel.js',
  './dependency_test_report.js',
  'pro/modal/modal_res_list',
  'pro/modal/modal',
  'pro/stripedlist/stripedlist',
  'pro/generate_rule/generate_rule',
], function (_k, _e, _u, _c, _cu, _l, _jst, _jstEx, _m, _tabBase, _notify, _collectCache, _caseCache, _hostCache, _proCache, _csCache, _dtCache, _infCache, dependencyTestPanel, dependencyTestReport, modalResList, modal, _stripedList, GenerateRule, _p, _pro) {
  _p._$$ModuleDependencyTest = _k._$klass();
  _pro = _p._$$ModuleDependencyTest._$extend(_tabBase._$$ModuleTestTabBase);
  _pro.__doBuild = function (_options) {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-test-dependency')
    );
    this.__reportData = {};
    this.__startTestBtn = _e._$getByClassName(this.__body, 'start-test')[0];
    this.__resetTestBtn = _e._$getByClassName(this.__body, 'reset-test')[0];
    this.__reportPanel = _e._$getByClassName(this.__body, 'report-panel')[0];
    this.__reportListElem = _e._$getByClassName(this.__body, 'report-list')[0];
    this.__reportGeneral = _e._$getByClassName(this.__body, 'report-general')[0];
    this.__reportStatus = _e._$getByClassName(this.__body, 'report-status')[0];
    this.__reportSuccess = _e._$getByClassName(this.__body, 'report-success')[0];
    this.__reportFail = _e._$getByClassName(this.__body, 'report-fail')[0];
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    this.__doInitDomEvent([
      [
        window, 'add-interfaces', function (evt) {
        this.__addInterfaceList(evt.ids);
      }.bind(this)
      ], [
        this.__startTestBtn, 'click', function () {
          var data = JSON.parse(this._collectCache._$getItemInCache(this._cid).data);
          this.__getCsDtData(this.__startTest.bind(this, data));
        }.bind(this)
      ], [
        this.__resetTestBtn, 'click', function () {
          this.__resetTest();
        }.bind(this)
      ], [
        window, 'collect-add-testcase-entry', function (evt) {
          this.__showTestcaseEditDialog('add', evt.interfaceId, evt.callback);
        }.bind(this)
      ], [
        window, 'collect-add-testcase', function (evt) {
          this.__addCases(evt.interfaceId, evt.ids, this._caseDialog.callback);
        }.bind(this)
      ], [
        window, 'collect-remove-testcase', function (evt) {
          this.__delCases(evt.interfaceId, evt.ids, this._caseDialog.callback);
        }.bind(this)
      ]
    ]);
  };

  _pro.__addCases = function (interfaceId, caseIds, callback) {
    this._collectCache._$addCases({
      id: this._cid,
      data: {
        interfaceId: interfaceId,
        caseIds: caseIds.join(',')
      },
      onload: function (evt) {
        callback && callback(evt);
        this._caseDialog.destroy();
      }.bind(this)
    });
  };

  _pro.__delCases = function (interfaceId, caseIds, callback) {
    this._collectCache._$removeCases({
      id: this._cid,
      data: {
        interfaceId: interfaceId,
        caseIds: caseIds.join(',')
      },
      onload: function (evt) {
        callback && callback(evt);
        this._caseDialog.destroy();
      }.bind(this)
    });
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

  _pro.__renderPanel = function (layers) {
    this.__panel = new dependencyTestPanel({
      data: {
        layers: layers
      }
    }).$on('show-interface-modal', function (opts) {
      var infCache = _infCache._$$CacheInterface._$allocate({
        onlistload: function (event) {
          var infList = infCache._$getListInCache(event.key);
          var collectInfs = this._collectCache._$getInterfaces(this._cid);
          infList = this.__diffArray(infList, collectInfs);
          infCache._$recycle();
          this._modalDialog = new modalResList({
            data: {
              title: '依赖测试集 - 接口管理',
              callback: opts.callback,
              layers: opts.data,
              layerIndex: opts.layerIndex,
              fromRuleIndex: opts.fromRuleIndex,
              index: opts.index,
              listOption: {
                _$getTagList: _cu.getTagList(infList),
                xlist: infList,
                lsListKey: 'nei-dependency-interfaces-add-list',
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
                      event: 'add-interfaces'
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
    }.bind(this)).$on('delete-interface', function (opts) {
      var layers = opts.data,
        layerIndex = opts.layerIndex,
        index = opts.index,
        fromRuleIndex = opts.fromRuleIndex;
      layers[layerIndex].data.splice(index, 1);
      layers[layerIndex].fromRuleIndex = fromRuleIndex;
      this._collectCache._$updateItem({
        id: this._cid,
        data: {
          data: JSON.stringify(this._$getSubmitData(layers))
        },
        ext: {
          callback: opts.callback
        }
      });
    }.bind(this)).$on('delete-layer', function (opts) {
      var layers = opts.data,
        layerIndex = opts.layerIndex;
      layers.splice(layerIndex, 1);
      layers[0].fromRuleIndex = undefined;
      this._collectCache._$updateItem({
        id: this._cid,
        data: {
          data: JSON.stringify(this._$getSubmitData(layers))
        },
        ext: {
          callback: opts.callback
        }
      });
    }.bind(this)).$on('select-to-receive', function (opts) {
      var layers = opts.data,
        layerIndex = opts.layerIndex,
        fromRuleIndex = opts.fromRuleIndex;
      layers[layerIndex].fromRuleIndex = fromRuleIndex;
      this._collectCache._$updateItem({
        id: this._cid,
        data: {
          data: JSON.stringify(this._$getSubmitData(layers))
        },
        ext: {
          callback: opts.callback
        }
      });
    }.bind(this)).$on('add-rule', function (opts) {
      var layers = opts.data,
        layerIndex = opts.layerIndex;
      layers.splice(layerIndex, 0, {
        type: 'RULE',
        data: ''
      });
      this._collectCache._$updateItem({
        id: this._cid,
        data: {
          data: JSON.stringify(this._$getSubmitData(layers))
        },
        ext: {
          callback: opts.callback
        }
      });
    }.bind(this)).$on('show-edit-rule', function (opts) {
      var grModal = new GenerateRule({
        data: {
          pid: this._pid,
          value: opts.value,
          title: '转换规则',
          tip: '请输入调用规则函数的 JavaScript 代码, 例如: transform()。详情参考 <a href="https://github.com/x-orpheus/nei-toolkit/blob/master/doc/NEI平台依赖测试使用说明.md#转换规则规范说明" target="_blank">转换规则说明</a>'
        }
      }).$on('ok', function (data) {
        // update & callback
        var layers = opts.data,
          layerIndex = opts.layerIndex;
        layers[layerIndex].data = data;
        this._collectCache._$updateItem({
          id: this._cid,
          data: {
            data: JSON.stringify(this._$getSubmitData(layers))
          },
          ext: {
            callback: opts.callback,
            cbData: data
          }
        });
      }.bind(this));
    }.bind(this)).$on('view-testcases', function (opts) {
      this.__showTestcaseEditDialog('view', opts.interface.id, opts.callback);
    }.bind(this)).$inject(this.__reportPanel);
  };

  _pro._$getSubmitData = function (layers) {
    return layers.map(function (layer) {
      if (layer.type === 'INTERFACE') {
        layer.data = layer.data.map(function (interface, index) {
          return interface.id;
        });
        return layer;
      } else {
        return {
          type: layer.type,
          data: layer.data
        };
      }
    }, this);
  };

  _pro.__addInterfaceList = function (ids) {
    var interfaces = [];
    var infCache = _infCache._$$CacheInterface._$allocate();
    ids.forEach(function (id) {
      interfaces.push(infCache._$getItemInCache(id));
    });
    var callback = this._modalDialog.data.callback,
      layers = this._modalDialog.data.layers,
      layerIndex = this._modalDialog.data.layerIndex,
      index = this._modalDialog.data.index,
      layer = layers[layerIndex],
      fromRuleIndex = this._modalDialog.data.fromRuleIndex;
    if (index) {
      interfaces.forEach(function (inf) {
        layer.data.splice(index + 1, 0, inf);
      });
    } else {
      interfaces.forEach(function (inf) {
        layer.data.push(inf);
      });
    }
    if (fromRuleIndex != null) {
      layer.fromRuleIndex = fromRuleIndex;
    }
    this._collectCache._$updateItem({
      id: this._cid,
      data: {
        data: JSON.stringify(this._$getSubmitData(layers))
      },
      ext: {
        updateKey: 'data',
        callback: callback,
        cbData: interfaces
      }
    });
    this._modalDialog.destroy();
  };

  _pro.__startTest = function (layers, listData) {
    if (layers == null || !Array.isArray(layers)) {
      _notify.show('非法的层定义！', 'error', 3000);
      return;
    } else if (layers.length === 0) {
      _notify.show('当前测试集还未添加用例', 'error', 1200);
      return;
    }
    var result = this.__checkLayerValidity(layers);
    if (result !== true) {
      _notify.show('依赖测试集层定义不符合规范！', 'error', 3000);
    } else {
      var infList = [];
      layers.forEach(function (layer) {
        if (layer.type === 'INTERFACE') {
          layer.data.forEach(function (item) {
            infList.push(item);
          });
        }
      });
      if (this._caseCache) {
        this._caseCache._$clearListInCache(this._caseCache._$getListKeyByCollection(this._cid));
        this._caseCache._$recycle();
      }
      // 开始测试
      var casePromise = _cu._$getDataByPromise(_caseCache._$$CacheTestCase, 'onlistload',
        function (cache, event, promise, resolve) {
          this._caseCache = cache;
          resolve([]);
        }.bind(this), null, '_$getList',
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
        {ids: infList.join(',')}, this
      );
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
        var infCache = this._infCache = _infCache._$$CacheInterface._$allocate({});
        var hostCache = _hostCache._$$CacheHost._$allocate({});
        var caseList = this._caseCache._$getListInCache(this._caseCache._$getListKeyByCollection(this._cid));
        var host = hostCache._$getItemInCache(this._hostId);
        var isAllHaveTestcase = true;
        var tdata = {
          env: host,
          constraints: listData[0],
          datatypes: listData[1]
        };
        var data = [];
        layers.every(function (layer, layerIndex) {
          if (layer.type === 'RULE') {
            data.push(layer);
          } else {
            var infs = [];
            layer.data.every(function (interface, infIndex) {
              var inf = infCache._$getItemInCache(interface);
              var testcases = caseList.filter(function (tc) {
                return tc.interfaceId === interface;
              });
              if (testcases.length === 0) {
                _notify.show('第 ' + layerIndex + ' 层 第 ' + infIndex + ' 个接口没有测试用例！', 'error', 2000);
                isAllHaveTestcase = false;
                return isAllHaveTestcase;
              }
              var tcs = [];
              testcases.forEach(function (tc) {
                tcs.push({
                  testcase: tc
                });
                tc.state = this.dbConst.API_TST_TODO;
              }, this);
              infs.push({
                interface: inf,
                testcases: tcs
              });
              return isAllHaveTestcase;
            }, this);
            if (isAllHaveTestcase) {
              data.push({
                type: layer.type,
                fromRuleIndex: layer.fromRuleIndex,
                data: infs
              });
            }
          }
          return isAllHaveTestcase;
        }, this);
        hostCache._$recycle();
        if (isAllHaveTestcase) {
          var total = data.reduce(function (mul, layer) {
            if (layer.type === 'INTERFACE') {
              return layer.data.reduce(function (m, i, idx) {
                if (layer.fromRuleIndex === idx) {
                  return m * i.testcases.length * mul;
                } else {
                  return m * i.testcases.length;
                }
              }, 1);
            } else {
              return mul;
            }
          }, 1);
          var promise;
          if (total > 200) {
            promise = new Promise(function (resolve) {
              var confirmDialog = new modal({
                data: {
                  'content': '当前依赖关系最终可能包含 ' + total + ' 个结果，您确定要进行测试吗',
                  'title': '测试确认',
                  'closeButton': true,
                  'okButton': '确认测试',
                  'cancelButton': true,
                  'closeButton': true
                }
              }).$on('ok', function () {
                resolve(confirmDialog);
              }.bind(this));
            });
          } else {
            promise = Promise.resolve();
          }
          promise.then(function (dialog) {
            if (dialog) {
              dialog.destroy();
            }
            var successCount = 0;
            var failCount = 0;
            tdata.data = data;
            tdata.onAllTestFinished = function (result) {
              this.__reportData[this._cid] = result;
              this.__reportStatus.innerHTML = '测试状态：<span class="test-finished">测试完成</span>';
              result.forEach(function (res) {
                if (res.type !== 'RUN_RULE') {
                  res.interface = this._infCache._$getItemInCache(res.testcase.iid);
                }
              }, this);
              this.__reportList.setReports(result);
              this.__panel.setErrorBorder(result);
            }.bind(this);
            tdata.onSingleTestFinished = function (result) {
              if (!_e._$hasClassName(this.__reportGeneral, 'active')) {
                _e._$addClassName(this.__reportGeneral, 'active');
                this.__reportStatus.innerHTML = '测试状态：<span class="test-notfinished">测试未完成...</span>';
              }
              if (result.status === 0) {
                failCount++;
              } else {
                successCount++;
              }
              this.__reportSuccess.innerText = successCount;
              this.__reportFail.innerText = failCount;
            }.bind(this);
            if (!this.__reportList) {
              this.__reportList = new dependencyTestReport({
                data: {
                  datatypes: listData[1],
                  checkRequiredParam: !this.__project.resParamRequired
                }
              }).$inject(this.__reportListElem);
            } else {
              this.__reportList.clear();
              this.__panel.draw();
              if (!_e._$hasClassName(this.__reportGeneral, 'active')) {
                _e._$addClassName(this.__reportGeneral, 'active');
              }
              this.__reportStatus.innerHTML = '测试状态：<span class="test-notfinished">测试未完成...</span>';
              this.__reportSuccess.innerText = successCount;
              this.__reportFail.innerText = failCount;
            }
            this._caseCache._$startDependencyTests(tdata);
          }.bind(this));
        }
      }.bind(this)).catch(function (e) {
        throw e;
      });
    }
  };

  _pro.__checkLayerValidity = function (layers) {
    var result = [];
    if (Array.isArray(layers) && layers.length) {
      var isInterface = true;
      layers.forEach(function (layer, index) {
        if (isInterface && layer.type === 'INTERFACE') {
          if (layer.data.length === 0) {
            result.push('第 ' + index + ' 层不存在待测试的接口！');
          } else if (index > 0) {
            if (layer.fromRuleIndex == null) {
              result.push('第 ' + index + ' 层不存在接受转换规则数据的接口！');
            }
          }
        } else if (!isInterface && layer.type === 'RULE') {
          // 留空，以后可能有检验
        } else {
          result.push('第 ' + index + ' 层应为' + (isInterface ? '接口层' : '转换规则层') + '，实为' + (!isInterface ? '接口层' : '转换规则层'));
        }
        isInterface = !isInterface;
      });
      if (isInterface) {
        result.push('没有一个合法的输出接口！');
      } else {
        if (layers[layers.length - 1].data.length > 1) {
          result.push('第 ' + (layers.length - 1) + ' 层的接口只能有一个！');
        }
      }
      return result.length ? result : true;
    } else {
      return ['依赖测试层定义非数组或没有层'];
    }
  };

  _pro.__resetTest = function () {
    this._collectCache._$updateItem({
      id: this._cid,
      data: {
        data: JSON.stringify([])
      },
      ext: {
        isReset: true
      }
    });
  };

  _pro.__getBatchAction = function (actionData) {
    var batch = '';
    actionData.forEach(function (item) {
      batch += ('<a class="' + ['batch-action-item', item.class ? item.class : '', item.action.type == 'link' ? 'stateful' : ''].join(' ')
      + '" data-action=' + JSON.stringify(item.action) + '>' + item.name + '</a>');
    });
    return batch;
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
    this.__panel && this.__panel.destroy();
    if (this.__reportList) {
      this.__reportList = this.__reportList && this.__reportList.destroy();
    }
    _e._$delClassName(this.__reportGeneral, 'active');
    this.__clearPromises();
    this._promises = [];
    if (this._cid) {
      if (!this._collectCache) {
        this._collectCache = _collectCache._$$CacheTestcollection._$allocate({
          onlistload: function () {
            this.__collect = this._collectCache._$getItemInCache(this._cid);
            if (this.__collect.type === 0) {
              dispatcher._$redirect('/test/group/suite/?pgid=' + this._pgid + '&pid=' + this._pid + '&cid=' + this._cid);
              return;
            }
            this.__infCache = _infCache._$$CacheInterface._$allocate({
              onlistload: function () {
                var layers = this.__collect.data ? JSON.parse(this.__collect.data) : [];
                layers.forEach(function (layer) {
                  if (layer.type === 'INTERFACE') {
                    layer.data.forEach(function (interfaceId, index) {
                      var interface = this.__infCache._$getItemInCache(interfaceId);
                      layer.data[index] = interface;
                    }, this);
                  }
                }, this);
                this.__renderPanel(layers);
              }.bind(this)
            });
            this.__infCache._$getList({
              key: this.__infCache._$getListKey(this._pid),
              data: {
                pid: this._pid
              }
            });
          }.bind(this),
          onitemupdate: function (evt) {
            if (evt.ext.isReset) {
              this.__panel.reset();
            }
            evt.ext.callback && evt.ext.callback(evt.ext.cbData);
          }.bind(this)
        });
      }
      this._collectCache._$getList({
        key: this._collectCache._$getListKey(this._pid),
        data: {
          pid: this._pid
        }
      });
      if (!this.__proCache) {
        this.__proCache = _proCache._$$CachePro._$allocate({
          onitemload: function () {
            this.__project = this.__proCache._$getItemInCache(this._pid);
            this.__renderReport();
          }.bind(this)
        });
        this.__proCache._$getItem({
          id: this._pid
        });
      } else {
        this.__renderReport();
      }
    }
  };
  _pro.__renderReport = function () {
    this.__getCsDtData(function (listData) {
      var result = this.__reportData[this._cid];
      if (result) {
        var successCount = result.filter(function (report) {
          return report.status === 1;
        }).length;
        var failCount = result.length - successCount;
        if (!_e._$hasClassName(this.__reportGeneral, 'active')) {
          _e._$addClassName(this.__reportGeneral, 'active');
        }
        this.__reportStatus.innerHTML = '测试状态：<span class="test-finished">测试完成</span>';
        this.__reportSuccess.innerText = successCount;
        this.__reportFail.innerText = failCount;
        this.__reportList = new dependencyTestReport({
          data: {
            datatypes: listData[1],
            reports: result,
            checkRequiredParam: !this.__project.resParamRequired
          }
        }).$inject(this.__reportListElem);
        this.__panel && this.__panel.setErrorBorder(result);
      }
    }.bind(this));
  };
  _pro.__showTestcaseEditDialog = function (actionType, interfaceId, callback) {
    var collectCasePromise = _cu._$getDataByPromise(_caseCache._$$CacheTestCase, 'onlistload',
      null, null, '_$getList',
      function (c) {
        return {
          key: c._$getListKeyByCollection(this._cid, interfaceId),
          data: {
            collectionId: this._cid,
            interfaceId: interfaceId
          }
        };
      }.bind(this),
      this
    );
    var infCasePromise;
    if (actionType === 'view') {
      infCasePromise = Promise.resolve([]);
    } else {
      infCasePromise = _cu._$getDataByPromise(_caseCache._$$CacheTestCase, 'onlistload',
        null, null, '_$getList',
        function (c) {
          return {
            key: c._$getListKey(interfaceId),
            data: {
              interfaceId: interfaceId
            }
          };
        }.bind(this),
        this
      );
    }
    Promise.all([collectCasePromise, infCasePromise]).then(function (data) {
      var caseList, actionHtml, batActions, modalTitle;
      if (actionType === 'view') {
        caseList = data[0];
        actionHtml = '<span class="res-add" data-action="'
          + _jstEx.escape2(JSON.stringify({
            interfaceId: interfaceId,
            callback: callback,
            event: 'collect-add-testcase-entry'
          }))
          + '"><i class="u-icon-add-normal"></i>增加用例</span>';
        batActions = [{
          name: '移除',
          action: {
            interfaceId: interfaceId,
            event: 'collect-remove-testcase'
          }
        }];
        modalTitle = '依赖测试集 - 用例管理';
      } else {
        this._caseDialog.destroy();
        caseList = this.__diffArray(data[1], data[0]);
        batActions = [
          {
            name: '增加',
            action: {
              interfaceId: interfaceId,
              event: 'collect-add-testcase'
            }
          }
        ];
        modalTitle = '依赖测试集 - 用例管理(待增加)';
      }
      this._caseDialog = new modalResList({
        data: {
          interfaceId: interfaceId,
          title: modalTitle,
          actionHtml: actionHtml,
          callback: callback,
          listOption: {
            xlist: caseList,
            lsListKey: 'nei-collect-testcases-list',
            defaultSortKey: 'testBegTime',
            sortable: true,
            headers: [{
              name: '名称',
              key: 'name'
            }, {
              name: '执行者',
              key: 'tester.realname',
              valueType: 'deepKey',
            }, {
              name: '结果',
              key: 'state',
              valueType: 'testResult',
            }, {
              name: '执行时间',
              key: 'testBegTime',
              valueType: 'time',
            }],
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
    }.bind(this)).catch(function (e) {
      throw e;
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

  _pro.__onHide = function (_options) {
    this.__doClearDomEvent();
    if (this.__panel) {
      this.__panel = this.__panel && this.__panel.destroy();
    }
    if (this.__reportList) {
      this.__reportList = this.__reportList && this.__reportList.destroy();
    }
    _e._$delClassName(this.__reportGeneral, 'active');
    this._collectCache && this._collectCache._$recycle();
    delete this._collectCache;
    this._caseCache && this._caseCache._$recycle();
    delete this._caseCache;
    this.__clearPromises();
    this.__super();
  };

  _m._$regist(
    'test-dependency',
    _p._$$ModuleDependencyTest
  );
});
