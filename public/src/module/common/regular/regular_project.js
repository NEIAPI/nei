/*
 * 项目列表组件基类
 */
NEJ.define([
  './regular_base.js',
  'base/util',
  'pro/common/util',
  'json!{lib}/../../fb-modules/config/db.json',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
], function (_rb, _u, _cu, _dbConst, _proCache, _pgCache, _p) {
  _p.Component = _rb.extend({
    config: function (data) {
      !this.data.privilege.isOthers && this.resetTop();
    },
    init: function () {
      this.$on('list-change', this.changeData.bind(this));
      this.$on('url-change', this.changeData.bind(this));
      this.$on('update', this.updateData.bind(this));
    },
    resetTop: function () {
      this.__proCache = _proCache._$$CachePro._$allocate({});
      this.__pgCache = _pgCache._$$CacheProGroup._$allocate({});
      this.resetLogo();
      this.data.commonPros = [].concat(this.data.projects);
      this.data.pubPro = {};
      this.data.topPro = [];
      this.data.noTopPro = [];
      //projectTopList字段为置顶id，字符串转数组操作
      if (this.data.progroup.projectTopList.constructor == Array) {
        this.data.projectTopList = [].concat(this.data.progroup.projectTopList);
      } else {
        this.data.projectTopList = this.data.progroup.projectTopList;
        //吧projectTopList对象转化为数组
        if (this.data.projectTopList == '') {
          this.data.projectTopList = [];
        } else if (this.data.projectTopList.indexOf(',') == '-1') {
          this.data.projectTopList = [this.data.projectTopList];
        } else {
          this.data.projectTopList = this.data.projectTopList.split(',');
        }
      }
      //区分置顶非置顶和公共数组
      _u._$forEach(this.data.projects, function (item) {
        item.time = item.createTime;
        if (this.data.privilege.isAdminOrCreator) {
          item.showDelete = true;
          item.showStick = true;
          item.showUpload = true;
        } else {
          item.showDelete = false;
          item.showStick = false;
          item.showUpload = false;
        }
        if (item.type == 1) {
          this.data.pubPro = item;
        } else if (this.data.projectTopList.indexOf(item.id.toString()) != -1) {
          item.isTop = 1;
          this.data.topPro.push(item);
        } else {
          this.data.noTopPro.push(item);
        }
      }._$bind(this));
      this.$update();
    },
    resetLogo: function () {
      _cu._$resetLogo(this.data.projects, 'name', 'namePinyin');
    },
    //添加之后重新排序
    sortProAfterAdd: function () {
      var projectOrder = this.data.progroup.projectOrder;
      var sorttype = '';
      //排序取得当前sorttype
      var sorttype = _cu.__initOrder(projectOrder, sorttype);
      this.data.sortType = sorttype;
      if (!sorttype) return;
      if (!this.data.projects) return;
      var tag = sorttype.split('-')[0];
      //进行具体的排序操作
      var _afterSortData = _cu.__sortByField(tag, this.data.sortType, this.data.topPro, this.data.noTopPro, this.data.pubPro, false);
      this.data.sortType = _afterSortData.sortType;
      //发送请求
      this.__proCache._$sort({
        ids: _afterSortData.pids,
        type: _afterSortData.typeNum,
        pgId: this.data.progroup.id,
        key: this.__proCache._$getListKey(this.data.progroup.id),
        ext: {progroupId: this.data.progroup.id}
      });
    },
    changeData: function (_data, _progroup, type) {
      this.data.projects = _data;
      this.data.progroup = _progroup;
      this.resetTop();
      if (type == 'add') {
        this.sortProAfterAdd();
      }
      this.$update();
    },
    updateData: function (_data) {
      if (!_data) {
        return;
      }
      _u._$forEach(this.data.projects, function (item) {
        if (item.id === _data.id) {
          item.name = _data.name;
          item.description = _data.description;
          item.logo = _data.logo;
        }
      });
      this.$update();
    },
  });
  return _p.Component;
});
