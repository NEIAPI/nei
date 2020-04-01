/**
 * 接口测试模块 项目-接口树regular组件
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/menu/menu',
  'pro/select2/select2',
  'pro/cache/pg_cache',
  'pro/cache/progroup_interface_cache',
  'pro/cache/interface_cache',
  'pro/cache/testcase_cache',
  'pro/cache/group_cache',
  'pro/cache/testcollection_cache',
  'pro/cache/host_cache',
  'pro/cache/pro_cache',
  'pro/modal/modal_hosts',
  'pro/modal/modal_collection',
  'pro/modal/import_testcase/import_testcase',
  'text!./project_interface_tree.html',
  'css!./project_interface_tree.css'
], function (rb, _v, _u, _e, _cu, jstExt, Menu, _select, _pgCache, _testInfCache, _infCache, _tcCache, _groupCache, _collectCache, _hostCache, _projCache, modal_hosts, modal_collection, importTestcase, tpl, css) {
  _e._$addStyle(css);

  var Comp = rb.extend({
    name: 'pro_inf_tree',
    template: tpl,
    /**
     * 获取项目组和项目的变更状态
     *
     * @return {Object} 变更状态对象
     */
    getChangeStatus: function (data) {
      var result = {};
      if (!this._proGroups || data.pgid !== this.data.pgid) {
        result.pgChanged = true;
        result.projChanged = true;
      } else {
        result.pgChanged = false;
        result.projChanged = data.pid !== this.data.pid;
      }
      return result;
    },
    config: function (data, changeMap) {
      changeMap = changeMap || this.getChangeStatus(data);
      if (!this._proGroups) { // 切换至项目接口tab
        var tmpPgCache = _pgCache._$$CacheProGroup._$allocate({});
        this._proGroups = tmpPgCache._$getListInCache(_pgCache._$cacheKey);
        tmpPgCache._$recycle();
      } else { // 刷新接口树
        this.data.pgid = data.pgid;
        this.data.pid = data.pid;
      }
      if (changeMap.pgChanged) {
        var pgSel = {}; // 设置项目组
        this.data.pgSel = pgSel;
        pgSel.source = this._proGroups;
        if (this.data.pgid) {
          pgSel.selected = pgSel.source.find(function (pgItem) {
            return pgItem.id === data.pgid;
          });
        }
        if (!pgSel.selected) { // 项目组被移除
          pgSel.selected = pgSel.source[0];
          this.data.pgid = pgSel.selected.id;
        }
      }

      if (changeMap.projChanged) {
        var projSel = {};
        this.data.projSel = projSel;
        var selectedPg = (pgSel || this.$refs.pgSelector.data).selected;
        var projects = [];
        var projTopList;
        if (typeof selectedPg.projectTopList === 'string') {
          projTopList = selectedPg.projectTopList === '' ? [] : selectedPg.projectTopList.split(',');
        } else {
          projTopList = selectedPg.projectTopList;
        }
        selectedPg.projects.forEach(function (proj) {
          var orderWeight;
          if (proj.type === 1) {
            orderWeight = 2;
          } else {
            if (projTopList.indexOf(proj.id + '') === -1) {
              orderWeight = 1;
            } else {
              orderWeight = 0;
            }
          }
          projects.push({ // orderWeight-排序权重: 0-置顶 1-普通 2-公共
            id: proj.id,
            name: proj.name,
            orderWeight: orderWeight
          });
        });
        projects.sort(function (proj1, proj2) {
          return proj1.orderWeight > proj2.orderWeight;
        });
        projSel.source = projects;
        if (this.data.pid) {
          projSel.selected = projSel.source.find(function (projItem) {
            return projItem.id === data.pid;
          });
        }
        if (!projSel.selected) {
          projSel.selected = projSel.source[0];
          this.data.pid = projSel.selected.id;
        }
      }

      this.data.iid = data.iid;
      this.data.cid = data.cid;
    },
    init: function () {
      var me = this;
      this._promises = [];
      delete this.data.pgSel;
      delete this.data.projSel;
      this.fetchTreeData();
      this.$refs.pgSelector.$on('change', function (evt) {
        me.$emit('pg-proj-change', {
          pgid: evt.selected.id
        });
      });
      this.$refs.projSelector.$on('change', function (evt) {
        me.$emit('pg-proj-change', {
          pid: evt.selected.id
        });
      });
      this._hostCache = _hostCache._$$CacheHost._$allocate({
        onlistload: function (options) {
          me.showSettingMenu(options.data.pid);
        }
      });
      this._projCache = _projCache._$$CachePro._$allocate({});
    },

    fetchTreeData: function () {
      var me = this;
      var pid = this.data.pid;
      setTimeout(function () {
        me.$emit('pg-proj-change', {
          pgid: me.data.pgid,
          pid: pid,
          init: true
        });
      }, 0);
      var getListParam = function (c) {
        return {
          key: c._$getListKey(pid),
          data: {
            pid: pid
          }
        };
      }.bind(this);
      var infPromise = _cu._$getDataByPromise(_infCache._$$CacheInterface, 'onlistload',
        function (cache, event, promise, resolve) {
          me._infCache = cache;
          resolve();
        }, null, '_$getList',
        getListParam, this);
      var collPromise = _cu._$getDataByPromise(_collectCache._$$CacheTestcollection, 'onlistload',
        function (cache, event, promise, resolve) {
          me._collectCache = cache;
          resolve();
        }, null, '_$getList',
        getListParam, this);
      var groupPromise = _cu._$getDataByPromise(_groupCache._$$CacheGroup, 'onlistload',
        function (cache, event, promise, resolve) {
          me._groupCache = cache;
          resolve();
        }, null, '_$getList',
        getListParam, this);
      Promise.all([infPromise, collPromise, groupPromise]).then(function () {
        me.renderTree();
      }).catch(function () {
      });
    },

    /**
     * 直接匹配/拼音, 返回高亮字符串
     *
     * @param  {string} str - 原始字符串
     * @param  {string} pyStr - 原始对应的拼音字符串
     * @param  {string} value - 输入字符串
     * @return {boolean|string} - 不匹配返回 false, 否则返回匹配的含高亮信息的html字符串
     */
    hlSearchString: function (str, pyStr, value) {
      var hitIndex = str.toLowerCase().indexOf(value.toLowerCase());
      if (hitIndex > -1) {
        // 此处拼接不能直接使用 value 值, 因为有大小写的问题
        return _cu._$renderByJst('${a|escape2}<b class="hl">${b|escape2}</b>${c|escape2}', {
          a: str.substr(0, hitIndex),
          b: str.substr(hitIndex, value.length),
          c: str.substr(hitIndex + value.length, str.length - 1)
        });
      }
      return _cu.highlightPinyin(str, pyStr, value);
    },

    findResources: function (list, key, searchText) {
      var matchedResources = [];
      var keyPinyin = key + 'Pinyin';
      list.forEach(
        function (item) {
          var hlStr = this.hlSearchString(item[key], item[keyPinyin], searchText);
          if (hlStr !== false) {
            var newItem = _cu._$cloneObj(item);
            newItem[key + 'Escaped'] = hlStr;
            matchedResources.push(newItem);
          }
        },
        this
      );
      return matchedResources;
    },
    groupInterfaces: function (list, isOpen) {
      if (isOpen === undefined) {
        isOpen = false;
      }
      var res = [];
      var groupMap = {};
      list.forEach(function (inf) {
        var group = this._groupCache._$getItemInCache(inf.groupId);
        if (groupMap[group.id]) {
          groupMap[group.id].infs.push(inf);
        } else {
          groupMap[group.id] = {
            id: group.id,
            name: group.name,
            type: group.type,
            createTime: group.createTime,
            isOpen: isOpen,
            infs: [inf]
          };
          if (group.projectId !== this.data.pid) {
            groupMap[group.id].name += '(公共资源库)';
          }
        }
        if (inf.id == this.data.iid) {
          groupMap[group.id].isOpen = true;
        }
      }, this);
      for (var gid in groupMap) {
        res.push(groupMap[gid]);
      }
      res.sort(function (g1, g2) {
        return g1.id > g2.id;
      });
      return res;
    },
    /**
     * 绘制接口树
     *
     * @return {Void}
     */
    renderTree: function () {
      var me = this;
      var pgid = this.data.pgid;
      var pid = this.data.pid;
      if (this._originProjInfs) { // 项目没变, 只需要刷新相关打开和选中状态，执行搜索结果
        if (this._searchState === -1) { //  清除搜索
          this.data.projInfs = this._originProjInfs;
          this.data.projColls = this._originProjColls;
          this.data.infsOpen = false;
          this.data.collsOpen = false;
          this.data.dpcOpen = false;
        } else if (this._searchState === 1) { // 搜索
          var matchedResources = [];
          var searchText = this._search;

          this.data.projInfs = this.groupInterfaces(this.findResources(this.data.allInfs, 'name', searchText), true);
          this.data.infsOpen = true;

          this.data.projColls = this.findResources(this._originProjColls, 'name', searchText);
          this.data.collsOpen = true;
          this.data.dpcOpen = true;
        } else {
          if (this.data.iid) {
            var infItem = this.data.projInfs.find(function (inf) {
              return inf.id === me.data.iid;
            });
            var newHref = location.pathname + location.search;
            if (infItem && newHref !== infItem.href) {
              infItem.href = newHref;    // 设置新的链接
              _testInfCache._$saveResourceData(infItem.id, _testInfCache._$resourceInf, {
                href: newHref
              });
            }
          }
        }

        if (this._searchState === -1) {
          this._searchState = 0;
        }
      } else {
        if (!this._infCache) {
          return;
        }
        var infs = this._infCache._$getListInCache(this._infCache._$getListKey(pid)); // 取接口列表并归类
        infs = _cu._$filterVersion(infs);
        var projInfs = [];
        infs.forEach(function (inf) {
          if (inf.id === this.data.iid) { // 保存当前href
            _testInfCache._$saveResourceData(inf.id, _testInfCache._$resourceInf, {
              href: location.pathname + location.search
            });
          }
          var resData = _testInfCache._$getResourceData(inf.id, _testInfCache._$resourceInf, 'href');
          projInfs.push({
            id: inf.id,
            groupId: inf.groupId,
            method: inf.method,
            name: inf.name,
            nameEscaped: jstExt.escape2(inf.name),
            namePinyin: inf.namePinyin,
            href: inf.href || ('/test/group/?pgid='
            + this.data.pgid + '&pid='
            + this.data.pid + '&iid=' + inf.id)
          });
        }, this);
        this.data.allInfs = projInfs;
        projInfs = this.groupInterfaces(projInfs);
        this.data.projInfs = projInfs;
        this._originProjInfs = projInfs;

        var collects = this._collectCache._$getListInCache(this._collectCache._$getListKey(pid));
        collects.forEach(function (coll) {
          coll.nameEscaped = jstExt.escape2(coll.name);
        });
        this.data.projColls = collects;
        this._originProjColls = collects;

        this.data.infsOpen = !!this.data.iid;
        if (this.data.cid) {
          var collect = collects.find(function (item) {
            return item.id === this.data.cid;
          }, this);
          if (collect) {
            if (collect.type === 0) {
              this.data.collsOpen = true;
            } else {
              this.data.dpcOpen = true;
            }
          }
        }
      }
      var infNum = 0;
      this.data.projInfs.forEach(function (group) {
        infNum += group.infs.length;
      });

      this.data.infNum = infNum;

      this.$update();
    },
    toggleCollapse: function (groupType) {
      this.data[groupType] = !this.data[groupType];
    },
    toggleSetting: function (evt) {
      if (!this._menuPid) { // 防止重复点击
        this._menuPid = this.data.pid;
        this._hostCache._$getList({
          key: this._hostCache._$getListKey(this.data.pid),
          data: {
            pid: this.data.pid
          }
        });
      } else {
        _v._$stop(evt);
      }
    },

    clickHandler: function (evt) {
      var elem = _v._$getElement(evt, 'd:caction');
      if (elem) {
        var caction = _e._$dataset(elem, 'caction');
        var rid = _e._$dataset(elem, 'rid');
        if (caction === 'coll-toggle') {
          this.toggleCollapse('collsOpen');
        } else if (caction === 'inf-toggle') {
          this.toggleCollapse('infsOpen');
        } else if (caction === 'dpc-toggle') {
          this.toggleCollapse('dpcOpen');
        } else if (caction === 'group-toggle') {
          var group = this.data.projInfs.find(function (group) {
            return group.id == rid;
          });
          group.isOpen = !group.isOpen;
        } else if (caction === 'inf-item') {
          _v._$stop(evt);
          dispatcher._$redirect('/interface/detail/?pid=' + this.data.pid + '&id=' + rid);
        } else if (caction === 'coll-item') {
          _v._$stop(evt);
          this.showMoreMenu(elem, caction, rid);
        } else if (caction === 'dpc-item') {
          _v._$stop(evt);
          this.showMoreMenu(elem, caction, rid);
        } else if (caction === 'import-testcase') {
          _v._$stop(evt);
          this.showMoreMenu(elem, caction);
        }
      }
    },
    showMoreMenu: function (srcElem, action, cid) {
      this._settingMenu && this._settingMenu.hide();
      this._collMenu && this._collMenu.hide();
      var me = this;
      var menuList = [];
      if (cid) {
        menuList.push(
          {
            action: 'coll-' + cid + '-modify',
            name: '修改'
          },
          {
            action: 'coll-' + cid + '-delete',
            name: '删除'
          }
        );
      } else {
        if (action === 'import-testcase') {
          menuList.push({
            action: 'show-import-testcase',
            name: '导入测试用例'
          });
          menuList.push({
            action: 'import-testcase-help',
            name: '帮助文档'
          });
        } else {
          menuList.push({
            action: action === 'coll-item' ? 'coll-create' : 'dep-coll-create',
            name: '创建测试集'
          });
          menuList.push({
            action: action === 'coll-item' ? 'coll-help' : 'dep-coll-help',
            name: '帮助文档'
          });
        }
      }
      this._collMenu = new Menu({
        data: {
          xlist: menuList,
          classList: 'coll-more-menu'
        }
      }).$on('click', function (action) {
        me._collMenu.hide();
        me.collMenuHandler(action);
      });
      var elemPos = srcElem.getBoundingClientRect();
      var menuPosition = {
        left: elemPos.width + elemPos.left + 2 + 'px'
      };
      var menuElem = Regular.dom.element(this._collMenu);
      var menuHight = menuElem.offsetHeight;
      var docHeight = document.body.clientHeight;
      if (elemPos.top + menuHight + 2 > docHeight) {
        menuPosition.top = docHeight - menuHight - 2 + 'px';
      } else {
        menuPosition.top = elemPos.top + 2 + 'px';
      }
      _e._$style(menuElem, menuPosition);
    },

    collMenuHandler: function (menuAction) {
      if (menuAction === 'coll-create' || menuAction === 'dep-coll-create') {
        new modal_collection({
          data: {
            pid: this.data.pid,
            action: 'create',
            type: menuAction === 'dep-coll-create' ? 1 : 0
          }
        });
      } else if (menuAction === 'coll-help' || menuAction === 'dep-coll-help') {
        var docName = menuAction === 'coll-help' ? '测试集' : '依赖测试';
        window.open('https://github.com/x-orpheus/nei-toolkit/blob/master/doc/NEI平台' + docName + '使用说明.md');
      } else if (/coll-(\d+)-([a-z]+)/.test(menuAction)) {
        var cid = parseInt(RegExp.$1, 10);
        var action = RegExp.$2;
        var collect = this._collectCache._$getItemInCache(cid);
        new modal_collection({
          data: {
            pid: this.data.pid,
            cid: cid,
            action: action,
            name: collect.name,
            description: collect.description
          }
        });
      } else if (menuAction === 'show-import-testcase') {
        this.importTestcase();
      } else if (menuAction === 'import-testcase-help') {
        window.open('https://github.com/x-orpheus/nei-toolkit/blob/master/doc/%E5%9C%A8NEI%E4%B8%AD%E5%AF%BC%E5%85%A5%E6%8E%A5%E5%8F%A3%E7%9A%84%E6%B5%8B%E8%AF%95%E7%94%A8%E4%BE%8B.md');
      }
    },
    /**
     * 返回数据后显示指定项目的菜单
     *
     * @param {number} pid 项目id
     * @return {void}
     */
    showSettingMenu: function (pid) {
      var me = this;
      if (this.data.pid === pid) { // 切换过项目，不显示设置
        var hosts = this._hostCache._$getListInCache(this._hostCache._$getListKey(pid));
        var proj = this._projCache._$getItemInCache(pid);
        var hostMenu = {
          action: 'hosts',
          name: '服务器环境'
        };
        var hostList = [];
        hosts.forEach(function (host) {
          var hostItem = {
            action: 'set-' + host.id,
            name: host.name
          };
          if (host.id === proj.hostId) {
            hostItem.className = 'menu-item-selected';
          }
          hostList.push(hostItem);
        });
        hostList.push({
          action: 'manage',
          name: '环境管理'
        });
        hostMenu.children = hostList;
        var menuList = [];
        menuList.push(hostMenu);
        this._settingMenu = new Menu({
          data: {
            xlist: menuList,
            classList: 'proj-setting-menu'
          }
        }).$on('click', function (action, subaction) {
          me._settingMenu.hide();
          me.projSettingHandler(action, subaction);
        }).$on('hide', function () {
          delete me._menuPid;
        });
        if (!this._settingMenuPosition) {
          var elem = Regular.dom.element(this).getElementsByClassName('setting-project-wrap')[0];
          var rect = elem.getBoundingClientRect();
          this._settingMenuPosition = {
            top: rect.top + 'px',
            left: rect.width + rect.left + 'px'
          };
        }
        _e._$style(Regular.dom.element(this._settingMenu), this._settingMenuPosition);
      }
    },

    $showHostsDialog: function () {
      var pid = this.data.pid;
      var getListParam = function (c) {
        return {
          key: c._$getListKey(pid),
          data: {
            pid: pid
          }
        };
      }.bind(this);
      var promise = _cu._$getDataByPromise(_hostCache._$$CacheHost, 'onlistload',
        null, null, '_$getList',
        getListParam, this);
      promise.then(function (hosts) {
        new modal_hosts({
          data: {
            pid: pid,
            hosts: hosts
          }
        });
      });
    },
    import: function (evt) {
      if (evt.target.files.length) {
        _cu._$importTestcaseFiles('json', evt.target.files, this.showImportConfirm.bind(this), this.data.pid);
        evt.target.value = '';
      }
    },
    importTestcase: function () {
      this.$refs.fileInput.click();
    },

    /**
     * 导入测试用例 根据路径匹配接口，并导入测试用例
     */
    showImportConfirm: function (importData) {
      new importTestcase({
        data: {
          pid: this.data.pid,
          importData: importData
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
              notCheckInSameInterface: true,
              items: sendData
            },
            onload: function () {
              _v._$dispatchEvent(
                window, 'updateTestcaseList', {
                  data: false
                }
              );
            }
          });
        }
      });
    },
    /**
     * 点击设置菜单项回调
     *
     * @param {string} action 菜单项标识
     * @param {string|undefined} subaction 子菜单项标识
     * @return {void}
     */
    projSettingHandler: function (action, subaction) {
      if (action === 'hosts') {
        if (subaction.indexOf('set-') === 0) {
          var hostId = subaction.substr(4);
          this._projCache._$updateItem({
            id: this.data.pid,
            data: {
              hostId: hostId
            }
          });
        } else if (subaction === 'manage') {
          this.$showHostsDialog();
        }
      }
    },
    /**
     * 设置搜索信息
     *
     * @param  {number} state 搜索状态 -1:清除搜索状态 0:非搜索状态 1:搜索状态
     * @param {string} search 搜索字符串
     * @return {void}
     */
    $setSearching: function (state, search) {
      this._search = search;
      this._searchState = state;
    },
    /**
     * 刷新渲染树
     *
     * @param  {Object} data 项目组等信息
     * @param  {fromSearchChange} 是否为搜索词变更引起的刷新
     * @return {void}
     */
    $refreshTree: function (data, fromSearchChange) {
      if (fromSearchChange) {
        this.renderTree();
      } else {
        var changeMap = this.getChangeStatus(data);
        this.config(data, changeMap);
        if (changeMap.pgChanged) {
          this.$refs.pgSelector.$updateSource(this.data.pgSel.source, this.data.pgSel.selected); //  刷新项目组下拉列表
        }
        if (changeMap.projChanged) {
          this.$refs.projSelector.$updateSource(this.data.projSel.source, this.data.projSel.selected); //  刷新项目下拉列表
        }
        delete this.data.pgSel;
        delete this.data.projSel;
        if (!changeMap.projChanged) {
          this.renderTree();
        } else {
          this.clearPromises();
          delete this.data.projInfs;
          delete this._originProjInfs;
          delete this.data.projColls;
          delete this._originProjColls;
          this.fetchTreeData();
        }
      }
    },
    clearPromises: function () {
      if (this._promises.length) {
        _u._$reverseEach(this._promises, function (p) {
          p.__cancel();
        });
      }
    },
    recycleCache: function (c) {
      if (this[c]) {
        this[c]._$recycle();
        delete this[c];
      }
    },
    destroy: function () {
      this.supr();
      this.recycleCache('_infCache');
      this.recycleCache('_collectCache');
      this.recycleCache('_groupCache');
      this.recycleCache('_projCache');
      this.recycleCache('_hostCache');
      delete this._proGroups;
      delete this.data.iid;
      delete this.data.cid;
      delete this.data.pgid;
      delete this.data.pid;
      delete this.data.allInfs;
      delete this.data.projInfs;
      delete this._originProjInfs;
      delete this.data.projColls;
      delete this._originProjColls;
      delete this._settingMenu;
      delete this._settingMenuPosition;
      this.clearPromises();
    }
  });

  return Comp;
});
