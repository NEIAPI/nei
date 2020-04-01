/*
 * 项目组列表组件基类
 */
NEJ.define([
  './regular_base.js',
  'lib/base/util',
  'pro/common/util',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'pro/cache/pro_cache',
  'json!{lib}/../../fb-modules/config/db.json'
], function (_rb, _u, _cu, pgCache, userCache, _proCache, _dbConst, _p) {
  _p.Component = _rb.extend({
    config: function (data) {
      this.__pgCache = pgCache._$$CacheProGroup._$allocate();
      this.resetProjects();
      this.resetTop();
      this.chooseDefault();
    },
    init: function () {
      // 项目组的增删操作触发
      this.$on('list-change', this.changeData.bind(this));
      //项目组的修改操作触发
      this.$on('update', this.updateData.bind(this));
      //项目的增删操作触发
      this.$on('pro-change', this.changePro.bind(this));
      //项目的修改操作触发
      this.$on('pro-update', this.updatePro.bind(this));
    },
    //选出默认分组
    chooseDefault: function () {
      this.data.defaultPG = [];
      // _u._$forEach(this.data.progroups, function (item) {
      //     if (item.type == 1) {
      //         this.data.defaultPG.push(item);
      //     }
      // }._$bind(this));
    },
    //区分置顶和非置顶项目组,显示删除，计算项目数，计算创建时间戳
    resetTop: function () {
      this.resetLogo();
      this.data.topProgroup = [];
      this.data.noTopProgroup = [];
      var topList = userCache._$$CacheUser._$allocate()._$getUserInCache().progroupTopList || '';
      if (topList != '') {
        topList = topList.split(',');
      } else if (topList.indexOf(',') == '-1') {
        topList = [topList];
      } else {
        topList = [];
      }
      _u._$forEach(this.data.progroups, function (item) {
        //添加项目数字段和创建时间字段
        item.count = item.projects.length;
        item.time = new Date(item.createTime).valueOf();
        //是否显示删除icon
        var role = this.__pgCache._$getPrivilege(item.id).isAdminOrCreator;
        if (role) {
          item.showDelete = true;
          item.showUpload = true;
          item.showStick = true;
        } else {
          item.showDelete = false;
          item.showUpload = false;
          item.showStick = true;
        }
        //置顶项目组筛选
        var flag = false; //判断当前项目组是否为置顶
        _u._$forEach(topList, function (item2) {
          if (item.id == item2) {
            item.isTop = 1;
            this.data.topProgroup.push(item);
            flag = true;
          }
        }.bind(this));
        // && item.type != 1
        if (!flag) {
          item.isTop = 0;
          this.data.noTopProgroup.push(item);
        }
      }.bind(this));

    },
    //项目区分公共资源库,区分置顶非置顶
    resetProjects: function () {
      var that = this;
      this.data.progroups.sort(function (pgA, pgB) {
        return pgA.name.localeCompare(pgB.name, 'zh-CN');
      });
      this.data.progroups = this.compactArr(this.data.progroups);

      _u._$forEach(this.data.progroups, function (item) {
        item.topPro = [];
        item.noTopPro = [];
        item.commonPros = [].concat(item.projects);
        item.topPro = [];
        item.noTopPro = [];
        item.pubPro = [];
        if (Array.isArray(item.projectTopList)) {
          item.projectTopList = [].concat(item.projectTopList);
        } else {
          if (item.projectTopList == '') {
            item.projectTopList = [];
          } else if (item.projectTopList.indexOf(',') == '-1') {
            item.projectTopList = [item.projectTopList];
          } else {
            item.projectTopList = item.projectTopList.split(',');
          }
        }
        item.projects.sort(function (pA, pB) {
          return pA.name.localeCompare(pB.name, 'zh-CN');
        });
        _u._$forEach(item.projects, function (item2) {
          var role = that.__pgCache._$getRole(item.id);
          if (role == 'creator' || role == 'administrator') {
            item2.role = role;
          } else {
            item2.role = 'normal';
          }
          item2.time = item2.createTime;
          if (item2.type == 1) {
            item.pubPro = item2;
          } else if (item.projectTopList.indexOf(item2.id.toString()) != -1) {
            item2.isTop = 1;
            item.topPro.push(item2);
          } else {
            item.noTopPro.push(item2);
          }
        }._$bind(this));
      });
    },
    //添加之后重新排序
    sortPgAfterAdd: function () {
      var orderType = parseInt(userCache._$$CacheUser._$allocate()._$getUserInCache().progroupOrder);
      //取得当前排序字段
      var sorttype = _cu.__initOrder(orderType, '');
      this.data.sortType = sorttype;
      if (!sorttype) return;
      if (!this.data.progroups) return;
      var tag = sorttype.split('-')[0];
      //按字段排序，并返回所需参数
      var _sortAfterData = _cu.__sortByField(tag, this.data.sortType, this.data.topProgroup, this.data.noTopProgroup, this.data.defaultPG, false);
      //发送请求进行排序
      this.__pgCache._$sort({ids: _sortAfterData.pids, type: _sortAfterData.typeNum});
    },
    //添加之后重新排序
    sortProAfterAdd: function (progroup) {
      var projectOrder = progroup.projectOrder;
      var sorttype = _cu.__initOrder(projectOrder, '');
      progroup.sortype = sorttype;
      if (!sorttype) return;
      if (!progroup.projects) return;
      var tag = sorttype.split('-')[0];
      var _sortAfterData = _cu.__sortByField(tag, progroup.sortype, progroup.topPro, progroup.noTopPro, progroup.pubPro, false);
      this.__proCache = _proCache._$$CachePro._$allocate();
      this.__proCache._$sort({
        ids: _sortAfterData.pids,
        type: _sortAfterData.typeNum,
        pgId: progroup.id,
        key: this.__proCache._$getListKey(progroup.id),
        ext: {progroupId: progroup.id}
      });
    },
    resetLogo: function () {
      this.data.progroups = this.compactArr(this.data.progroups);
      _cu._$resetLogo(this.data.progroups, 'name', 'namePinyin');
    },
    //项目组变化
    changeData: function (_data, type) {
      this.data.progroups = _data;
      this.resetProjects();
      this.resetTop();
      if (!!type && type == 'add') {
        this.sortPgAfterAdd();
      }
      //如果退出了别人的默认分组则需要重新组装默认分组 modified by lihl 2017.1.4
      this.chooseDefault();
      this.$update();
    },
    //项目组修改
    updateData: function (_data) {
      if (!_data) {
        return;
      }

      _u._$forEach(this.data.progroups, function (item) {
        if (item.id == _data.id) {
          item.name = _data.name;
          item.description = _data.description;
          item.logo = _data.logo;
          item.isLock = _data.isLock;
        }
      });
      this.$update();
    },
    //项目变化
    changePro: function (_data, type) {
      if (type == 'add') {
        this.data.proList = {};
      }
      _u._$forEach(this.data.progroups, function (item) {
        _u._$forEach(_data, function (item2) {
          if (item.id == item2.progroupId) {
            item.projects = _data;
            if (type == 'add') {
              this.data.proList = item;
            }
          }
        }._$bind(this));
      }._$bind(this));
      this.resetProjects();
      if (type == 'add') {
        this.sortProAfterAdd(this.data.proList);
      }
      this.$update();
    },
    //项目修改
    updatePro: function (_data) {
      _u._$forEach(this.data.progroups, function (item) {
        if (_data.progroupId == item.id) {
          _u._$forEach(item.projects, function (item2) {
            if (_data.id == item2.id) {
              item2.name = _data.name;
              item2.description = _data.description;
              item2.logo = _data.logo;
              item2.lob = _data.lob;
            }
          });
        }
      }._$bind(this));
      this.resetProjects();
      this.$update();
    },
    compactArr: function (arr) {
      for (var i = 0, len = arr.length; i < len; i++) {
        if (!arr[i] || arr[i] == '' || arr[i] === undefined) {
          arr.splice(i, 1);
          len--;
          i--;
        }
      }
      return arr;
    }
  });
  return _p.Component;
});
