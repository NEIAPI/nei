NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'util/list/page',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/pg_cache',
  'pro/cache/pro_cache',
  'pro/cache/user_cache',
  'pro/common/regular/regular_progroup',
  'pro/modal/modal_project',
  'pro/modal/modal_pgroup',
  'pro/menu/menu',
  'json!./action.json',
  'pro/modal/modal'
], function (_k, _e, _v, _u, _l, _t, _m, _cu, _pgCache, _proCache, _userCache, _r, modal_project, modal_pgroup, Menu, action_json, Modal, _p, _pro) {
  /**
   * 项目组树模块
   * @class   {wd.m._$$ModuleProGroupTree}
   * @extends {nej.ut._$$AbstractModule}
   */
  _p._$$ModuleProGroupTree = _k._$klass();
  _pro = _p._$$ModuleProGroupTree._$extend(_m._$$Module);

  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-progroup-tree')
    );
    this.__treeNode = _e._$getByClassName(document, 'tree-wrap')[0];
    this.__contentWrap = _e._$getSibling(this.__treeNode);
    this.__progroupList = _l._$getTextTemplate('progroup-tree');
  };

  /**
   * 模块显示
   * @param options
   * @private
   */
  _pro.__onShow = function (options) {
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
      onlistload: function (option) {
        var projectGroups = this.__pgCache._$getListInCache(_pgCache._$cacheKey);
        if (!this.__rProGroup) {
          var proGroupTree = this._initTree();
          this.__rProGroup = new proGroupTree({
            data: {
              progroups: projectGroups
            }
          }).$inject(this.__body);
        }
        this.__rProGroup.$emit('urlchange', {pid: this.__pid, pgid: this.__pgid});
      }._$bind(this),
      onquit: function () {
        dispatcher._$redirect('/progroup/home/management/');
      }
    });
    this.__proCache = _proCache._$$CachePro._$allocate({});
    this.__userCache = _userCache._$$CacheUser._$allocate({});
    _e._$delClassName(this.__treeNode, 'j-animation-width');
    // init event
    this.__doInitDomEvent([
      [
        _pgCache._$$CacheProGroup, 'listchange',
        function (_result) {
          var list = this.__pgCache._$getListInCache(_pgCache._$cacheKey);
          if (_result.action == 'add') {
            this.__rProGroup.$emit('showtree', this.__rProGroup.data);
            this.__rProGroup.$emit('list-change', list, _result.action);
          } else {
            this.__rProGroup.$emit('list-change', list);
          }
        }._$bind(this)
      ], [
        _pgCache._$$CacheProGroup, 'add',
        function (_result) {
          dispatcher._$redirect('/progroup/detail?pgid=' + _result.data.id);
        }._$bind(this)
      ], [
        _pgCache._$$CacheProGroup, 'update',
        function (_result) {
          this.__rProGroup.$emit('update', _result.data);
        }._$bind(this)
      ], [
        _pgCache._$$CacheProGroup, 'delete',
        function (_result) {
          dispatcher._$redirect('/progroup/home/management/');
        }._$bind(this)
      ], [
        _proCache._$$CachePro, 'listchange',
        function (_result) {
          var list = this.__proCache._$getListInCache(this.__proCache._$getListKey(_result.ext.progroupId));
          this.__rProGroup.$emit('pro-change', list, _result.action);
        }._$bind(this)
      ], [
        _proCache._$$CachePro, 'add',
        function (_result) {
          dispatcher._$redirect('/project?pid=' + _result.data.id);
        }._$bind(this)
      ], [
        _proCache._$$CachePro, 'update',
        function (_result) {
          this.__rProGroup.$emit('pro-update', _result.data);
        }._$bind(this)
      ], [
        _proCache._$$CachePro, 'delete',
        function (_result) {
          dispatcher._$redirect('/progroup/detail/projectmanage?pgid=' + _result.data.progroupId);
        }._$bind(this)
      ],
      [
        window, 'add-project',
        function (evt) {
          this.__doOperateProject({
            method: 'create',
            pgid: evt.pgid
          });
        }.bind(this)
      ],
      [
        window, 'add-progroup',
        function (evt) {
          this.__doOperateProjectGroup({
            method: 'create'
          });
        }.bind(this)
      ],
      [
        window, 'delete-project',
        function (evt) {
          this.__doOperateProject({
            method: 'delete',
            name: evt.name,
            id: evt.id,
            pgid: evt.pgid
          });
        }.bind(this)
      ],
      [
        window, 'delete-progroup',
        function (evt) {
          this.__doOperateProjectGroup({
            method: 'delete',
            id: evt.id,
            name: evt.name
          });
        }.bind(this)
      ]
    ]);
    this.__super(options);
  };
  /**
   * 刷新模块
   * @param  {Object} _options 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    if (_options.param) {
      if (_options.param.pgid) {
        this.__pgid = _options.param.pgid.replace('/', '');
      } else {
        this.__pgid = '';
      }
      if (_options.param.pid) {
        this.__pid = _options.param.pid.replace('/', '');
      } else {
        this.__pid = '';
      }
    }
    // 请求项目组数据
    this.__pgCache._$getList({
      key: _pgCache._$cacheKey
    });
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    this.__doClearDomEvent();
    this.__pgid = this.__pid = '';
    if (!!this.__pgCache) {
      this.__pgCache._$recycle();
    }
    if (!!this.__proCache) {
      this.__proCache._$recycle();
    }
    if (!!this.__rProGroup) {
      this.__rProGroup = this.__rProGroup && this.__rProGroup.destroy();
    }
  };


  /**
   * 项目组树regular组件
   * @return {Object}
   */
  _pro._initTree = function () {
    var _this = this;
    var proGroupTree = _r.extend({
      name: 'proGroupTree',
      template: this.__progroupList,
      config: function (data) {
        this.showTree(data);
        this.supr(data);
        this.data.showTreeFlag = _cu._$toBool(window.localStorage.showPgTreeFlag);
      },
      init: function () {
        this.supr();
        this.$on('urlchange', this.resetSelect.bind(this));
        this.$on('showtree', this.showTree.bind(this));

      },
      toggleProjects: function (pg, event) {
        var pgArrow = _v._$getElement(event, 'c:glyphicon-chevron-right');
        if (!!pgArrow) {
          _v._$stop(event);
        }
        pg.open = !pg.open;
      },
      //url变化处理项目组树的选中状态
      resetSelect: function (options) {
        var _this = this;

        if (!options.pid && !options.pgid) {
          this.data.proSelId = '';
          this.data.pgSelId = '';
          this.$update();
          return;
        }
        if (options.pid) {
          this.data.proSelId = options.pid;
          _u._$forEach(this.data.progroups, function (progroup) {
            _u._$forEach(progroup.projects, function (project) {
              if (project.id == options.pid) {
                _this.data.pgSelId = progroup.id;
              }
            });
          });
          this.$update();
          return;
        }
        if (options.pgid) {
          this.data.proSelId = '';
          this.data.pgSelId = options.pgid;
          this.$update();
          return;
        }

      },
      //更多操作
      _doMore: function (event, type, opt, pgid) {
        event.preventDefault();
        event.stopPropagation();
        var projectType = type;
        var getActionList = function (opt) {
          var type = opt.type || 'ownprogroup';
          var _actionjson = _cu._$clone(action_json);
          var xlist = _actionjson[type];
          if (type !== 'ownprogroup') {
            var role = opt.role || 'normal';
            xlist = xlist.filter(function (item) {
              var pgCreaterId = _this.__pgCache._$getItemInCache(pgid).creatorId;
              var userId = _this.__userCache._$getUserInCache().id;
              //项目组的创建者或者项目的创建着拥有复制特权
              if (item.action == 'pro-copy') {
                if (pgCreaterId == userId || opt.creatorId == userId) {
                  return true;
                }
                return false;
              } else if (item.action == 'pro-transfer') {//项目的移交只能是自己创建的项目

                if (opt.creatorId == userId) {
                  return true;
                }
                return false;
              } else {
                return item.role.indexOf(role) !== -1;
              }
            }.bind(this));
            xlist.forEach(function (item) {
              if (item.action == 'pro-top' || item.action == 'pg-top') {
                var names = item.name.split('|');
                item.name = names[Number(opt.isTop)];
              } else if (item.action == 'pg-lock') {
                var names = item.name.split('|');
                item.name = names[Number(opt.isLock)];
              }
            }.bind(this));
          }
          return xlist;
        };
        var xlist = getActionList({
          type: type,
          role: opt && opt.role || '',
          isLock: opt && opt.isLock || 0,
          isTop: opt && opt.isTop || 0,
          creatorId: opt && opt.creatorId
        });
        if (!!this._moreMenu) {
          this._moreMenu.destroy();
        }
        this._moreMenu = new Menu({
          data: {
            xlist: xlist
          }
        }).$on('click', function (action) {
          this._moreMenu.destroy();
          this._delegateEvent(action, opt, pgid);
        }._$bind(this));
        //设置菜单的位置
        this._setMenuPos(event);
      },
      /**
       *设置更多操作菜单的位置
       * @private
       */
      _setMenuPos: function (event) {
        var dom = Regular.dom.element(this._moreMenu);
        var _wHeight = document.body.clientHeight;
        var _parentNode = _e._$getParent(event.target, 't:li') || event.target.parentNode;
        var _y = _parentNode.getBoundingClientRect().top;

        if (_wHeight - _y >= dom.offsetHeight) {
          _e._$style(dom, {
            left: '300px',
            top: _y + 'px'
          });
        } else {
          _e._$style(dom, {
            left: '300px',
            top: (_y - dom.offsetHeight + event.target.parentNode.clientHeight) + 'px'
          });
        }
      },
      _delegateEvent: function (action, opt, pgid) {
        switch (action) {
          case 'pg-create':
            _this.__doOperateProjectGroup({
              method: 'create'
            });
            break;
          case 'pg-modify' :
            _this.__doOperateProjectGroup({
              method: 'modify',
              inputName: opt.name,
              description: opt.description,
              id: opt.id
            });
            break;
          case 'pg-delete':
            _this.__doOperateProjectGroup({
              method: 'delete',
              id: opt.id,
              name: opt.name
            });
            break;
          case 'pg-lock':
            _this.__doLockProjectGroup({
              method: 'delete',
              id: opt.id,
              isLock: Number(opt.isLock)
            });
            break;
          case 'pg-quit':
            _this.__doQuitProjectGroup({
              id: pgid
            });
            break;
          case 'pg-transfer':
            _this.__doTransferProjectGroup({
              method: 'transfer',
              id: pgid
            });
            break;
          case 'pg-top':
            _this.__doStickProjectGroup({
              id: opt.id,
              isTop: Number(opt.isTop)
            });
            break;
          case 'pro-create':
            _this.__doOperateProject({
              method: 'create',
              pgid: pgid
            });
            break;
          case 'pro-copy':
            _this.__doOperateProject({
              method: 'copy',
              name: opt.name,
              id: opt.id,
              pgid: pgid,
              type: opt.type
            });
            break;
          case 'pro-modify':
            _this.__doOperateProject({
              method: 'modify',
              inputName: opt.name,
              lob: opt.lob,
              description: opt.description,
              id: opt.id,
              pgid: pgid
            });
            break;
          case 'pro-delete':
            _this.__doOperateProject({
              method: 'delete',
              name: opt.name,
              id: opt.id,
              pgid: pgid
            });
            break;
          case 'pro-transfer':
            _this.__doOperateProject({
              method: 'transfer',
              name: opt.name,
              id: opt.id,
              pgid: pgid
            });
            break;
          case 'pro-top':
            _this.__doStickProject({
              id: opt.id,
              pgid: pgid,
              isTop: Number(opt.isTop)
            });
            break;
          case 'view-doc':
            _this.__doViewDoc({
              id: opt.id
            });
            break;
          case 'features':
            _this.__doReadProduction();
            //todo
            break;
        }
      },
      showTree: function (data) {
        _u._$forEach(data.progroups, function (item) {
          var role = _this.__pgCache._$getRole(item.id);
          if (role == 'creator' || role == 'administrator') {
            item.showAdd = true;
            item.role = role;
          } else {
            item.showAdd = false;
            item.role = 'normal';
          }
          if (!!_this.__pgid) {
            if (_this.__pgid == item.id) {
              item.open = true;
              item.selected = true;
            } else {
              item.open = false;
              item.selected = false;
            }
          } else if (!!_this.__pid) {
            _u._$forEach(item.projects, function (item2) {
              if (_this.__pid == item2.id) {
                item.open = true;
                item.selected = true;
                item2.selected = true;
              } else {
                item2.selected = false;
              }
            });
          } else {
            item.open = false;
            item.selected = false;
          }
        });
      },
      toggleTree: function () {
        this.data.showTreeFlag = !this.data.showTreeFlag;
        window.localStorage.showPgTreeFlag = this.data.showTreeFlag;
        if (!this.data.showTreeFlag) {
          _e._$addClassName(_this.__treeNode, 'j-animation ');
          _e._$addClassName(_this.__contentWrap, 'j-contentAnimation');
        } else {
          _e._$delClassName(_this.__treeNode, 'j-animation');
          _e._$delClassName(_this.__contentWrap, 'j-contentAnimation');
        }
        this.$update();
      }
    });
    return proGroupTree;
  };
  /**
   * 项目弹窗实例化
   * @return {Void}
   */
  _pro.__doOperateProject = function (options) {
    new modal_project({
      data: options
    });
  };
  /**
   * 项目组弹窗实例化
   * @return {Void}
   */
  _pro.__doOperateProjectGroup = function (options) {
    new modal_pgroup({
      data: options
    });
  };

  /**
   * 锁定/解锁项目组
   * @param options
   * @private
   */
  _pro.__doLockProjectGroup = function (options) {
    var msg = ['确定要锁定项目组吗？锁定之后项目组中的所有资源不可修改', '确定要解锁项目组吗？解锁之后项目组中的所有资源可被修改'];
    var modal = Modal.confirm({
      title: '确认',
      content: msg[options.isLock]
    });
    modal.$on('ok', function () {
      this.__pgCache._$lock({
        v: 1 - options.isLock,
        id: options.id
      });
    }._$bind(this));

  };
  /**
   * 置顶/取消置顶项目组
   * @param options
   * @private
   */
  _pro.__doStickProjectGroup = function (options) {
    this.__pgCache._$stick({
      v: 1 - options.isTop,
      id: options.id
    });
  };
  /**
   * 退出项目组
   * @param options
   * @private
   */
  _pro.__doQuitProjectGroup = function (options) {
    var _this = this;
    var modal = Modal.confirm({
      title: '确认',
      content: '确认要退出项目组吗？'
    });
    modal.$on('ok', function () {
      _this.__pgCache._$quit({
        id: options.id
      });
    });
  };
  /**
   * 移交项目组创建者身份
   * @param options
   * @private
   */
  _pro.__doTransferProjectGroup = function (options) {
    var modal = Modal.confirm({
      title: '确认',
      content: '确认要转交项目组吗？转交之后你的身份变为开发人员'
    });
    modal.$on('ok', function () {
      new modal_pgroup({
        data: options
      });
    });
  };
  /**
   * 移交项目组创建者身份
   * @param options
   * @private
   */
  _pro.__doTransferProject = function (options) {
    var modal = Modal.confirm({
      title: '确认',
      content: '确认要转交项目吗？转交之后你的身份变为开发人员'
    });
    modal.$on('ok', function () {
      new modal_pgroup({
        data: options
      });
    });
  };
  /**
   * 置顶/取消置顶项目
   * @param options
   * @private
   */
  _pro.__doStickProject = function (options) {
    var opt = {
      v: 1 - options.isTop,
      id: options.id,
      pgId: options.pgid,
      key: this.__proCache._$getListKey(options.pgid),
      ext: {progroupId: options.pgid}
    };

    this.__proCache._$stick(opt);
  };
  /**
   * 查看文档
   * @param options
   * @private
   */
  _pro.__doViewDoc = function (options) {
    var node = document.createElement('a');
    node.href = '/doc?id=' + options.id;
    node.target = '_blank';
    document.body.appendChild(node);
    node.click();
    document.body.removeChild(node);
  };
  /**
   * 公共资源库介绍
   * @private
   */
  _pro.__doReadProduction = function () {
    var modal = new Modal({
      data: {
        'contentTemplate': '<div style="white-space: normal; text-align: left;">一个项目组可以包含多个项目，这些项目可能会用到相同的资源（比如接口、数据模型、规则函数等），可以把它们提取出来放到“公共资源库”中，以免重复创建相同的资源。如果资源不是所有项目共享的，请新建一个项目，然后把资源存放到新建的项目中。</div>',
        'class': 'm-modal-import',
        'title': '公共资源库介绍',
        'closeButton': true,
        'okButton': false,
        'cancelButton': false
      }
    });
  };
  // notify dispatcher
  _m._$regist(
    'progroup-tree',
    _p._$$ModuleProGroupTree
  );
});
