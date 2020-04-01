NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/common/util',
  'json!{lib}/../../fb-modules/config/db.json',
  'pro/cache/pg_cache',
  'text!./user_import_layer.html',
  'css!./user_import_layer.css'
], function (e, v, _u, Modal, _cu, _dbConst, _pgCache, tpl, css) {
  var modal = Modal.extend({
    config: function () {
      this.initList();
      _cu._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-user-import',
        'title': '从"' + this.data.progroup.name + '"项目组导入用户',
        'closeButton': true,
        'okButton': true,
        'cancelButton': true,
        checkStatus: {},
      });
      this.initRoleSelectData();
      this.data.searchFlag = false;
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
      e._$addStyle(css);
    },
    selectAll: function (xlist) {
      var checked = this.data.selectAll = !this.data.selectAll;
      var that = this;
      if (!xlist) return;
      xlist.forEach(function (item) {
        that.data.checkStatus[item.id] = checked;
      });
      this.data.checkArray = this.data.xlist.filter(function (item) {
        return that.data.checkStatus[item.id];
      });
    },
    selectItem: function (event, item) {
      var selectRole = v._$getElement(event, 'c:list-col-role');
      if (selectRole) {
        return;
      }
      var that = this;
      this.data.checkStatus[item.id] = !this.data.checkStatus[item.id];
      this.data.checkArray = this.data.xlist.filter(function (item) {
        return that.data.checkStatus[item.id];
      });
      if (this.data.checkArray.length != this.data.xlist.length) {
        this.data.selectAll = false;
      } else {
        this.data.selectAll = true;
      }
    },
    ok: function () {
      this.$emit('ok', this.data.checkArray);
      this.destroy();
    },
    _onListenInput: function ($event) {
      var value = this.$refs.input.value.trim();
      this.data.xlist = this.data.list.filter(function (item) {
        return item.realname.indexOf(value) === 0;
      });
    },
    initList: function () {
      var pgCache = _pgCache._$$CacheProGroup._$allocate();
      var importProgroup = pgCache._$getItemInCache(this.data.selectedPg.id);
      this.data.progroup = _cu._$cloneObj(importProgroup);
      //当前项目组已经存在，不可编辑的用户
      this.data.existList = [];
      this.data.exist = {
        owner: [],
        admins: [],
        developers: [],
        testers: [],
        observers: [],
      };
      //筛选出项目组中能编辑（不能编辑）的用户
      this.filterUser();
    },
    filterUser: function () { //筛选出项目组中能编辑（不能编辑）的用户
      var roleList = ['owner', 'admins', 'developers', 'testers', 'observers'];
      _u._$forEach(roleList, function (role) {
        //对每种角色 筛选出当前项目组已存在的，并从原数组中删除
        _u._$reverseEach(this.data.progroup[role], function (item, index) {
          _u._$forEach(this.data.oProgroup.roleList, function (item2) {
            if (item.id == item2.id) {
              this.data.progroup[role].splice(index, 1);
              //搜索代码高亮所需参数
              item.hit = true;
              item.hasInclude = false;
              switch (item2.role) {
                case _dbConst.PRG_ROL_GUEST:
                  item.roleName = '观察者';
                  this.data.exist.observers.push(item);
                  break;
                case _dbConst.PRG_ROL_ADMIN:
                  item.roleName = '管理员';
                  this.data.exist.admins.push(item);
                  break;
                case _dbConst.PRG_ROL_DEVELOPER:
                  item.roleName = '开发者';
                  this.data.exist.developers.push(item);
                  break;
                case _dbConst.PRG_ROL_TESTER:
                  item.roleName = '测试者';
                  this.data.exist.testers.push(item);
                  break;
                default:
                  item.roleName = '创建者';
                  this.data.exist.owner.push(item);
                  break;
              }
            }
          }.bind(this));
        }.bind(this));
        //如果是创建者，则修改他的身份为开发者
        if (role == 'owner' && this.data.progroup.owner.length) {
          _u._$forEach(this.data.progroup.owner, function (item) {
            item.role = _dbConst.PRG_ROL_DEVELOPER;
          });
          this.data.progroup.developers = this.data.progroup.developers.concat(this.data.progroup.owner);
        }
        //给筛选出的数组按名称排序
        if (this.data.progroup[role].length) {
          this.sortByName(this.data.progroup[role]);
        }
        if (this.data.exist[role].length) {
          this.sortByName(this.data.exist[role]);
        }
      }.bind(this));
      //整合数据
      this.data.xlist = this.data.progroup.admins.concat(this.data.progroup.developers, this.data.progroup.testers, this.data.progroup.observers);
      this.data.existList = this.data.exist.owner.concat(this.data.exist.admins, this.data.exist.developers, this.data.exist.testers, this.data.exist.observers);
    },
    sortByName: function (arr) {
      arr.sort(function (a, b) {
        return a.realnamePinyin.localeCompare(b.realnamePinyin, 'zh-CN');
      });
      return arr;
    },
    roleUpdate: function (event, userItem) {
      var selected = event.selected;
      var oSelected = event.oSelected;
      //吧正在编辑的用户从原先的身份数组里删掉
      switch (userItem.role) {
        case _dbConst.PRG_ROL_GUEST:
          _u._$reverseEach(this.data.progroup.observers, function (item, index) {
            if (item.id === userItem.id) {
              this.data.progroup.observers.splice(index, 1);
            }
          }.bind(this));
          break;
        case _dbConst.PRG_ROL_ADMIN:
          _u._$reverseEach(this.data.progroup.admins, function (item, index) {
            if (item.id === userItem.id) {
              this.data.progroup.admins.splice(index, 1);
            }
          }.bind(this));
          break;
        case _dbConst.PRG_ROL_DEVELOPER:
          _u._$reverseEach(this.data.progroup.developers, function (item, index) {
            if (item.id === userItem.id) {
              this.data.progroup.developers.splice(index, 1);
            }
          }.bind(this));
          break;
        case _dbConst.PRG_ROL_TESTER:
          _u._$reverseEach(this.data.progroup.testers, function (item, index) {
            if (item.id === userItem.id) {
              this.data.progroup.testers.splice(index, 1);
            }
          }.bind(this));
          break;
      }
      //添加到新的身份数组里
      switch (selected.id) {
        case _dbConst.PRG_ROL_GUEST:
          userItem.role = selected.id;
          this.data.progroup.observers.push(userItem);
          break;
        case _dbConst.PRG_ROL_ADMIN:
          userItem.role = selected.id;
          this.data.progroup.admins.push(userItem);
          break;
        case _dbConst.PRG_ROL_DEVELOPER:
          userItem.role = selected.id;
          this.data.progroup.developers.push(userItem);
          break;
        case _dbConst.PRG_ROL_TESTER:
          userItem.role = selected.id;
          this.data.progroup.testers.push(userItem);
          break;
      }
    },
    initRoleSelectData: function () {
      this.data.source = [
        {name: '观察者', id: _dbConst.PRG_ROL_GUEST},
        {name: '管理员', id: _dbConst.PRG_ROL_ADMIN},
        {name: '开发者', id: _dbConst.PRG_ROL_DEVELOPER},
        {name: '测试者', id: _dbConst.PRG_ROL_TESTER}
      ];
      var roleString = '';
      _u._$forEach(this.data.xlist, function (item) {
        //搜索代码高亮所需参数
        item.hit = true;
        item.hasInclude = false;
        switch (item.role) {
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
        }
        //角色下拉框的选中
        item.selected = {
          name: roleString,
          id: item.role
        };
      }._$bind(this));
    },
    search: function ($event) {
      var value = $event.target.value.trim();
      var isEmpty = value === '';
      if (isEmpty) {
        this.clearSearchArgs();
        this.$update();
        return;
      } else {
        this.data.searchFlag = true;
      }
      //根据搜索值匹配名称
      this.searchByField(this.data.xlist, 'xlistNoItemflag', value);
      this.searchByField(this.data.existList, 'existListNoItemflag', value);
      //搜索结果不存在
      this.data.noItemFlag = this.data.xlistNoItemflag && this.data.existListNoItemflag;
      this.$update();
    },
    searchHighLight: function (propname, propnamePinyin, item, value) {
      var itemV = item[propname];
      var hitIndex = itemV.toString().toLowerCase().indexOf(value.toLowerCase());
      if (hitIndex > -1) {
        item.itemState[propname] = _cu._$renderByJst('${a}<b class="hl">${b|escape}</b>${c}', {
          a: itemV.substr(0, hitIndex),
          b: itemV.substr(hitIndex, value.length),
          c: itemV.substr(hitIndex + value.length, itemV.length - 1)
        });
        item.hit = true;
        item.hasInclude = true;
      } else {
        var itemVPinyin = item[propnamePinyin];
        var matchPinyinResult = _cu.highlightPinyin(itemV, itemVPinyin, value);
        if (matchPinyinResult) {
          item.itemState[propname] = matchPinyinResult;
          item.hit = true;
          item.hasInclude = true;
        }
      }
      return item;
    },
    clearSearchArgs: function () {
      this.data.searchFlag = false;
      _u._$forEach(this.data.xlist, function (item) {
        //搜索代码高亮参数
        item.hit = true;
        item.hasInclude = false;
      });
      _u._$forEach(this.data.existList, function (item) {
        //搜索代码高亮参数
        item.hit = true;
        item.hasInclude = false;
      });
    },
    searchByField: function (list, noItemflag, value) {
      _u._$forEach(list, function (item) {
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
          }
        }
      }._$bind(this));
      this.data[noItemflag] = list.every(function (item) {
        return item.hasInclude == false;
      });
    }
  });
  return modal;
});
