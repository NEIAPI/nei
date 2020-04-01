NEJ.define([
  'base/klass',
  'base/element',
  'base/util',
  'util/tab/view',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/tagme/tagme',
  'json!{lib}/../../fb-modules/config/db.json',
  'pro/common/regular/regular_base',
  'pro/common/util',
  'pro/modal/modal'
], function (_k, _e, _u, _t, _l, _m, _pgCache, userCache, _tag, _dbConst, _r, util, _modal, _p, _pro) {
  /**
   * 项目组团队成员模块
   * @class   {wd.m._$$ModuleProGroupDetailT}
   * @extends {nej.ut._$$AbstractModule}
   * @param   {Object}  可选配置参数，已处理参数列表如下所示
   */
  _p._$$ModuleProGroupDetailT = _k._$klass();
  _pro = _p._$$ModuleProGroupDetailT._$extend(_m._$$Module);
  /**
   * 构建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-pg-d-t')
    );
    this.__loading = _e._$getByClassName(document, 'u-loading')[0];
    this.__pgCache = _pgCache._$$CacheProGroup._$allocate({
      onitemload: function () {
        this.__getMembersData();
        //实例化组件
        var teamManage = this.__initTeamManage();
        this.__teamManage = new teamManage({
          data: {
            progroup: this.__progroup
          }
        }).$inject(this.__body);

        //删除加载中提示，显示内容
        _e._$addClassName(this.__loading, 'f-dn');
        _e._$delClassName(this.__body, 'f-dn');
      }._$bind(this),
      onquit: function () {
        //项目组成员退出项目组之后跳转到我的项目组页面
        dispatcher._$redirect('/progroup/home/management/');
      }
    });
    var _userCache = userCache._$$CacheUser._$allocate();
    this.__user = _userCache._$getUserInCache();
  };

  /**
   * 获取各种身份的数据
   * @param  {Void}
   * @return {Void}
   */
  _pro.__getMembersData = function () {
    this.__progroup = this.__pgCache._$getItemInCache(this.__pgid);
    //按名称排序
    this.__progroup.admins = this._sortByName(this.__progroup.admins);
    this.__progroup.developers = this._sortByName(this.__progroup.developers);
    this.__progroup.testers = this._sortByName(this.__progroup.testers);
    this.__progroup.observers = this._sortByName(this.__progroup.observers);
    this.__progroup.owner = this._sortByName(this.__progroup.owner);
    this.__progroup.roleList = [].concat(
      this.__progroup.owner,
      this.__progroup.admins,
      this.__progroup.developers,
      this.__progroup.testers,
      this.__progroup.observers,
      this.__progroup.auditors
    );
  };

  /**
   * 按名称排序
   * @param {Array} arr 要排序的数组
   */
  _pro._sortByName = function (arr) {
    arr.sort(function (a, b) {
      return a.realnamePinyin.localeCompare(b.realnamePinyin, 'zh-CN');
    });
    return arr;
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
    if (this.__teamManage) {
      this.__teamManage = this.__teamManage.destroy();
    }
  };

  /**
   * 实例化teammanage组件
   * @return {Void}
   */
  _pro.__initTeamManage = function () {
    var _this = this;
    var teamManage = _r.extend({
      template: _l._$getTextTemplate('m-pg-d-t'),
      config: function (data) {
        this.initRoleSelectData();
        data.list = data.progroup.roleList;
        this.changeCount();
        data.searchFlag = false;
        this.resetLogo();
      },
      init: function () {
      },
      changeCount: function () {
        this.data.count = this.data.progroup.roleList.length;
      },
      initRoleSelectData: function () {
        this.data.source = [
          {name: '创建者', id: _dbConst.PRG_ROL_OWNER},
          {name: '观察者', id: _dbConst.PRG_ROL_GUEST},
          {name: '管理员', id: _dbConst.PRG_ROL_ADMIN},
          {name: '开发者', id: _dbConst.PRG_ROL_DEVELOPER},
          {name: '测试者', id: _dbConst.PRG_ROL_TESTER},
          {name: '审核者', id: _dbConst.PRG_ROL_AUDITOR},
        ];
        var roleString = '';
        _u._$forEach(this.data.progroup.roleList, function (item) {
          //搜索代码高亮参数
          item.hit = true;
          item.hasInclude = false;
          var _time = !!item.loginTime ? item.loginTime : item.createTime;
          item.loginTime = _u._$format(new Date(_time), 'yyyy-MM-dd');
          if (_this.__user.id == item.id) {
            item.meFlag = true;
          }
          switch (item.role) {
            case _dbConst.PRG_ROL_OWNER:
              roleString = '创建者';
              break;
            case _dbConst.PRG_ROL_GUEST:
              roleString = '观察者';
              break;
            case _dbConst.PRG_ROL_ADMIN:
              roleString = '管理员';
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
          item.hit = false;
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
    'progroup-detail-t',
    _p._$$ModuleProGroupDetailT
  );
});
