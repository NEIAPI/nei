NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/pg_cache',
  'pro/tagme/tagme',
  'pro/select2/select2',
  'pro/cache/user_search_cache',
  'pro/cache/user_cache',
  'json!3rd/fb-modules/config/db.json',
  'pro/common/regular/regular_base',
  'pro/modal/modal',
  'pro/notify/notify',
  'pro/modal/modal_agree',
  'pro/poplayer/user_import_layer',
  'pro/modal/modal_pgroup'
], function (_k, _e, _u, _t, _l, _jst, _m, util, _pgCache, _tag, _s2, _userSearchCache, userCache, _dbConst, _r, _modal, _notify, _pal, _imL, modal_pgroup, _p, _pro) {
  /**
   * 项目组团队管理模块
   * @class   {wd.m._$$ModuleProGroupDetailTM}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupDetailTM = _k._$klass();
  _pro = _p._$$ModuleProGroupDetailTM._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-d-tm')
    );
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    this.__pgCacheOptions = {
      onitemload: function () {
        this.__initView();
      }._$bind(this),
      onsetmembers: function (_result) {
        //如果管理员降低了自己的权限，那么把他重定向到没权限的模块中
        if (!!_result.ext && !!_result.ext.reload && _result.ext.reload == true) {
          this.__pgCache._$clearItemInCache(this.__pgid);
          dispatcher._$redirect('/progroup/detail/team?pgid=' + this.__pgid + '#');
          return;
        }
        this.__renderView(_result);
      }._$bind(this),
      onquit: function () {
        //项目组成员退出项目组之后跳转到我的项目组页面
        dispatcher._$redirect('/progroup/home/management/');
      }
    };
    var _userCache = userCache._$$CacheUser._$allocate();
    this.__user = _userCache._$getUserInCache();
    this._isOpenIdUser = this.__user.from === util.db.USR_FRM_OPENID;
  };
  /**
   * 修改项目组成员之后重新渲染
   * @param  {Void}
   * @return {Void}
   */
  _pro.__renderView = function (_result) {
    //保存各种身份数据
    this.__getMembersData();
    this.__teamManage.$emit('role-change', _result);
    //实例化组件
    this.__initUserTag(this.__tagmeUser);
  };

  /**
   * 首次进入页面渲染
   * @param  {Void}
   * @return {Void}
   */
  _pro.__initView = function () {
    //保存各种身份数据
    this.__getMembersData();
    //实例化组件
    var teamManage = this.__initTeamManage();
    this.__teamManage = new teamManage({
      data: {
        progroup: this.__progroup
      }
    }).$inject(this.__body);
    //保存所需节点
    this.__addNode = _e._$getByClassName(this.__body, 'add-user')[0];
    this.__tagmeUser = _e._$getByClassName(this.__addNode, 'tagme-user')[0];
    var roleSelectAdd = _e._$getByClassName(this.__addNode, 'role-select')[0];
    //实例化组件
    this.__initUserTag(this.__tagmeUser);
    this.__initRoleSelect(roleSelectAdd);

    //删除加载中提示，显示内容
    _e._$addClassName(this.__loading, 'f-dn');
    _e._$delClassName(this.__body, 'f-dn');
  };


  /**
   * 按名称排序
   * @param {Array} arr 要排序的数组
   * @param {String} tag 排序字段
   */
  _pro._sortByName = function (arr, tag) {
    if (!tag) {
      tag = 'realnamePinyin';
    }
    arr.sort(function (a, b) {
      return a[tag].localeCompare(b[tag], 'zh-CN');
    });
    return arr;
  };

  _pro.__onShow = function (_options) {
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate(this.__pgCacheOptions);
    this.__super(_options);
  };

  /**
   * 获取各种身份的数据
   * @return {Void}
   */
  _pro.__getMembersData = function () {
    this.__progroup = this.__pgCache._$getItemInCache(this.__pgid);

    //用户按名称排序
    this.__progroup.admins = this._sortByName(this.__progroup.admins);
    this.__progroup.developers = this._sortByName(this.__progroup.developers);
    this.__progroup.testers = this._sortByName(this.__progroup.testers);
    this.__progroup.observers = this._sortByName(this.__progroup.observers);
    this.__progroup.auditors = this._sortByName(this.__progroup.auditors);
    this.__progroup.owner = this._sortByName(this.__progroup.owner);
    //给创建者添加 role属性
    this.__progroup.owner[0].role = 'creator';
    //所有角色用户
    this.__progroup.roleList = [].concat(
      this.__progroup.owner,
      this.__progroup.admins,
      this.__progroup.developers,
      this.__progroup.testers,
      this.__progroup.observers,
      this.__progroup.auditors);
  };

  /**
   * 刷新模块
   * @param  {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    _e._$addClassName(this.__body, 'f-dn');
    _e._$delClassName(this.__loading, 'f-dn');
    this.__pgid = _options.param.pgid;
    this.__super(_options);
    this.__pgCache._$getItem({id: this.__pgid});
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__super();
    if (this.__userTag) {
      this.__userTag = this.__userTag._$recycle();
    }
    !!this.__roleSelect && this.__roleSelect.destroy();
    if (this.__teamManage) {
      this.__teamManage = this.__teamManage.destroy();
    }
    if (this.__deleteLayer) {
      this.__deleteLayer = this.__deleteLayer.destroy();
    }
  };

  /**
   * 实例化选择权限select组件
   * @param {Object} parent 插入的父节点
   */
  _pro.__initRoleSelect = function (parent) {
    this.__addRoleSelected = {name: '开发者', id: _dbConst.PRG_ROL_DEVELOPER};
    if (!!this.__roleSelect) {
      this.__roleSelect = this.__roleSelect.destroy();
    }
    this.__roleSelect = new _s2({
      data: {
        source: [
          {name: '开发者', id: _dbConst.PRG_ROL_DEVELOPER},
          {name: '观察者', id: _dbConst.PRG_ROL_GUEST},
          {name: '管理员', id: _dbConst.PRG_ROL_ADMIN},
          {name: '测试者', id: _dbConst.PRG_ROL_TESTER},
          {name: '审核者', id: _dbConst.PRG_ROL_AUDITOR}
        ],
        selected: {name: '开发者', id: _dbConst.PRG_ROL_DEVELOPER}
      }
    }).$inject(parent)
      .$on('change', function (_result) {
        this.__addRoleSelected = _result.selected;
      }._$bind(this));
  };

  /**
   * 实例化选择用户tagme组件
   * @param {Object} 要插入的父节点
   */
  _pro.__initUserTag = function (parent) {
    if (!!this.__userTag) {
      this.__userTag = this.__userTag._$recycle();
    }
    this.__userTag = _tag._$$ModuleTagme._$allocate({
      parent: parent,
      searchCache: _userSearchCache._$$CacheSearchUser,
      searchResultFilter: function (users) {
        return this.__filter(users).map(function (item) {
          return {
            id: item.id,
            name: item.realname || item.username,
            nameDesc: '(' + item.username + ')',
            namePinyin: item.realnamePinyin,
            title: item.realname ? (item.realname + '(' + item.username + ')') : item.username,
            role: item.role
          };
        });
      }._$bind(this),
      preview: false,
      choseOnly: true,
      tags: [],
      isSearchByValue: true,
      // openid 用户也改成需要多次搜索，现在用户太多了
      isSearchOnce: false,
      done: function (data) {
        //this.__changeTags(data);
      }._$bind(this),
      noTagTip: '请输入用户名称',
      placeholder: '请选择用户',
      maxNum: 5
    });
  };

  /**
   * 过滤已存在的项目组成员
   * @param  {Array} list 已存在的项目组成员
   * @return {newList} 返回过滤之后的数组
   */
  _pro.__filter = function (list) {
    var newList = list.slice();
    _u._$reverseEach(list, function (item, index) {
      _u._$forEach(this.__progroup.roleList, function (item2) {
        if (item.id == item2.id) {
          newList.splice(index, 1);
        }
      });
    }._$bind(this));
    return newList;
  };

  /**
   * 实例化teammanage组件
   * @return {Void}
   */
  _pro.__initTeamManage = function () {
    var _this = this;
    var teamManage = _r.extend({
      template: _l._$getTextTemplate('m-pg-d-tm'),
      config: function (data) {
        this.initRoleSelectData();
        data.list = data.progroup.roleList;
        //统计项目组成员
        this.changeCount();
        //加载用户的头像
        this.resetLogo();
        //是否在搜索状态下
        data.searchFlag = false;
      },
      init: function () {
        this.$on('role-change', this.roleChange.bind(this));
      },
      addUser: function () {
        var tags = _this.__userTag._$getTags();
        if (!tags.length) {
          _notify.error('请选择要添加的用户');
          return;
        }
        var selectd = _this.__addRoleSelected;
        var users = [];
        tags.forEach(function (item) {
          users.push({
            id: item.id,
            role: selectd.id,
            action: 'add'
          });
        });
        _this.__pgCache._$setMembers({
          id: _this.__pgid,
          users: users
        });
      },
      changeCount: function () {
        this.data.count = this.data.progroup.roleList.length;
      },
      deleteUser: function (role) {
        var _content = '您确定要从' + _u._$escape(this.data.progroup.name) + '项目组删除' + _u._$escape(role.realname) + '嘛';
        if (!!_this.__deleteLayer) {
          _this.__deleteLayer.destroy();
        }
        _this.__deleteLayer = _modal.confirm({
          'content': _content,
          'title': '删除用户',
          'closeButton': true,
          'okButton': '离开',
          'cancelButton': true
        }).$on('ok', function () {

          var users = [{
            id: role.id,
            role: role.role,
            action: 'delete'
          }];
          _this.__pgCache._$setMembers({
            id: _this.__pgid,
            users: users
          });
        }.bind(_this));
      },
      roleChange: function (_data) {
        this.data.progroup.roleList = _this.__progroup.roleList;
        this.data.list = this.data.progroup.roleList;
        this.initRoleSelectData();
        this.resetLogo();
        this.changeCount();
        this.$update();
      },
      roleUpdate: function (event, userItem) {
        var users = [{
          id: userItem.id,
          role: event.selected.id,
          action: 'update'
        }];
        var data = {
          id: _this.__pgid,
          users: users
        };
        //如果自己是管理员并且修改了自己的权限，此时需要重新加载页面
        if (userItem.meFlag && userItem.role === _dbConst.PRG_ROL_ADMIN) {
          data.ext = {reload: true};
        }
        _this.__pgCache._$setMembers(data);
      },
      initRoleSelectData: function () {
        this.data.source = [
          {name: '观察者', id: _dbConst.PRG_ROL_GUEST},
          {name: '管理员', id: _dbConst.PRG_ROL_ADMIN},
          {name: '开发者', id: _dbConst.PRG_ROL_DEVELOPER},
          {name: '测试者', id: _dbConst.PRG_ROL_TESTER},
          {name: '审核者', id: _dbConst.PRG_ROL_AUDITOR},
        ];
        var roleString = '';
        _u._$forEach(this.data.progroup.roleList, function (item) {
          //搜索代码高亮所需参数
          item.hit = true;
          item.hasInclude = false;
          //加入项目组的时间，创建者的是createTime
          var _time = !!item.loginTime ? item.loginTime : item.createTime;
          item.loginTime = _u._$format(new Date(_time), 'yyyy-MM-dd');
          //判断哪个是当前用户
          if (_this.__user.id == item.id) {
            item.meFlag = true;
          }
          switch (item.role) {
            case _dbConst.PRG_ROL_GUEST:
              roleString = '观察者';
              break;
            case _dbConst.PRG_ROL_ADMIN:
              roleString = '管理员';
              item.isAdministrator = true;
              break;
            case _dbConst.PRG_ROL_DEVELOPER:
              roleString = '开发者';
              break;
            case _dbConst.PRG_ROL_TESTER:
              roleString = '测试者';
              break;
            case _dbConst.PRG_ROL_AUDITOR:
              roleString = '审核者';
              break;
          }
          //角色下拉框的选中
          item.selected = {
            name: roleString,
            id: item.role
          };
        }._$bind(_this));
      },
      search: function ($event) {
        var value = $event.target.value.trim();
        var searchResult = [].concat(this.data.progroup.roleList);
        var isEmpty = value === '';
        if (isEmpty) {
          this.data.list = this.data.progroup.roleList;
          this.clearSearchArgs();
          this.changeCount();
          this.$update();
          return;
        } else {
          this.data.list = searchResult;
          this.data.searchFlag = true;
          this.changeCount();
        }
        _u._$forEach(this.data.list, function (item) {
          //是否隐藏当前项
          item.hit = false;
          //搜索是否匹配到
          item.hasInclude = false;
          item.itemState = {};
          for (var prop in item) {
            if (prop == 'realname') {
              var propname = prop;
              var propnamePinyin = 'realnamePinyin';
              item.itemState.realname = item.realname;
              item = this.searchHighLight(propname, propnamePinyin, item, value);
            } else if (prop == 'username') {
              var propname = prop;
              var propnamePinyin = prop;
              item.itemState.username = item.username;
              item = this.searchHighLight(propname, propnamePinyin, item, value);
            }
          }
        }._$bind(this));
        this.data.noItemflag = this.data.list.every(function (item) {
          return item.hasInclude == false;
        });
        this.$update();
      },
      searchHighLight: function (propname, propnamePinyin, item, value) {
        var itemV = item[propname];
        var hitIndex = itemV.toString().toLowerCase().indexOf(value.toLowerCase());
        if (hitIndex > -1) {
          item.itemState[propname] = util._$renderByJst('${a}<b class="hl">${b|escape}</b>${c}', {
            a: itemV.substr(0, hitIndex),
            b: itemV.substr(hitIndex, value.length),
            c: itemV.substr(hitIndex + value.length, itemV.length - 1)
          });
          item.hit = true;
          item.hasInclude = true;
        } else {
          var itemVPinyin = item[propnamePinyin];
          var matchPinyinResult = util.highlightPinyin(itemV, itemVPinyin, value);
          if (matchPinyinResult) {
            item.itemState[propname] = matchPinyinResult;
            item.hit = true;
            item.hasInclude = true;
          }
        }
        return item;
      },
      clearSearchArgs: function () {
        _u._$forEach(this.data.progroup.roleList, function (item) {
          //搜索代码高亮参数
          item.hit = true;
          item.hasInclude = false;
        });
      },
      resetLogo: function () {
        util._$resetLogo(this.data.progroup.roleList, 'realname', 'realnamePinyin');
      },
      importUser: function () {
        //获取当前用户所有的项目组的深拷贝，并删除当前项目组
        var projectGroups = _this.__pgCache._$getListInCache(_pgCache._$cacheKey);
        _this.__projectGroups = util._$cloneObj(projectGroups);
        _this.__projectGroups = _this.__projectGroups.filter(function (item) {
          return item.id != _this.__pgid;
        }.bind(this));
        //给我的项目组排序
        _this.__projectGroups = _this._sortByName(_this.__projectGroups, 'name');
        _this.__selectProgroupLayer = new _pal({
          data: {
            class: 'm-modal-import',
            title: '选择项目组',
            bottonText: '下一步',
            source: _this.__projectGroups
          }
        })
          .$on('ok', function (option) {
            var selected = option;
            _this.__selectProgroupLayer = _this.__selectProgroupLayer.destroy();
            _this.__importLayer = new _imL({
              data: {
                selectedPg: selected,
                oProgroup: _this.__progroup
              }
            })
              .$on('ok', function (_data) {
                if (!!_data) {
                  var importList = _data;
                  var users = [];
                  importList.forEach(function (item) {
                    users.push({
                      id: item.id,
                      role: item.role,
                      action: 'add'
                    });
                  });
                  _this.__pgCache._$setMembers({
                    id: _this.__pgid,
                    users: users
                  });
                }
                _this.__importLayer = _this.__importLayer.destroy();
              }.bind(_this));
          }.bind(_this));
      },
      //项目组移交创建者身份
      passTo: function (pgid) {
        var modal = _modal.confirm({
          title: '确认',
          content: '确认要转交项目组吗？转交之后你的身份变为开发人员'
        });
        modal.$on('ok', function () {
          new modal_pgroup({
            data: {
              method: 'transfer',
              id: pgid
            }
          });
        });
      },
      /**
       * 退出项目组
       * @param pgid
       */
      quitPgroup: function (pgid) {
        var modal = _modal.confirm({
          title: '确认',
          content: '确认要退出项目组吗？'
        });
        modal.$on('ok', function () {
          _this.__pgCache._$quit({
            id: pgid
          });
        });
      }
    });
    return teamManage;
  };

  // notify dispatcher
  _m._$regist(
    'progroup-detail-tm',
    _p._$$ModuleProGroupDetailTM
  );
});
