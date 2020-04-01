/**
 * 卡片列表组件
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'pro/common/regular/regular_base',
  'pro/uploadfile/upload_file',
  'pro/common/util',
  'json!3rd/fb-modules/config/db.json',
  'text!./cardlist.html',
  'css!./cardlist.css'
], function (k, u, e, v, _rb, _upload, _cu, _dbConst, html, css) {
  e._$addStyle(css);
  var defaultOptions = {
    // [必填] 表示实例化方式是否实例化为标签组件
    isAllocateByTag: true,
    // [必填] 表示哪种类型的资源0 projectmanage项目管理（管理员||创建者） , 1 project 项目（非管理员||创建者）, 2 recentproject 最近使用的项目, 3 progroupmanagement 项目组管理
    resType: 0,

    // [必填] 表示是否可以创建资源  true 表示可创建  false 不可以创建
    addable: true,
    // [必填] 表示是否有排序功能 默认为false
    sortable: false,
    // [可选] 表示是否有计数功能 默认为false
    countable: false,
    // [必填] 表示是否区分置顶和非置顶数组 默认为true
    hasStickList: true,
    filter: function (list) {
      //针对每个资源，添加增删查改排序的标记
      // 可否删除的标记 showDelete  {boolean}
      // 可否置顶的标记 showStick   {boolean}
      //可否上传头像的标记 showUpload  {boolean}
      //是否有属于哪个项目组的title showBelong  {Object} {flag: true, belong: 'xxxx'}
      //是否统计项目组数 是的话传项目组数 count
      return list;
    },

    // [可选] 资源的创建，删除，置顶等编辑操作时需要操作cache ,必须是在主文件中实例化过 可取到该资源的值得实例
    //		  比如我在主文件中实例化过 项目的cache, 那么这里传的就是 this.__proCache
    cache: null,

    // [可选] 资源的创建，删除，置顶等编辑操作时需要操作cache,传项目组的pgid
    pgid: null,
    // [可选] 置顶数组 没有置顶功能的不用传
    toplist: [],

    // [可选] 非置顶数组 没有置顶功能的不用传
    noToplist: [],

    // [可选] 公共项目 || 默认分组 没有置顶功能的不用传
    publist: [],

    // [可选] 没有置顶功能的资源列表
    noSticklist: [],

    // [可选] 排序方式 没有排序功能的不用传
    orderType: 0,

    // [可选] 排序方式（按字段名显示的字符串） 没有排序功能的不用传 eg: 'name-up'
    sortType: '',

    // [可选] 排序字段（按字段名显示的字符串） 没有排序功能的不用传 eg:[{ name: '名称' , type: 'name'}]
    sortlist: [],

    // [可选] 标题 目前只有项目组用到了，其他的不用传
    title: '',
    // [可选] 是否有快速入口，默认为true
    hasQuickEntrence: true,
    // [可选] 快速入口资源列表，[{name:'页面', type:'page'}]
    entranceList: [{name: '页面', type: 'page'}, {name: '接口', type: 'interface'}, {name: '模型', type: 'datatype'},
      {name: '模板', type: 'template'}, {name: '规则', type: 'constraint'}, {name: '分组', type: 'group'}],

    // [可选] 快速入口隐藏的资源列表，[{name:'页面', type:'page'}]
    entranceHiddenlist: [],
  };

  var CardList = _rb.extend({
    name: 'cardlist',
    template: html,
    config: function (initData) {
      //针对不同来源的数据做数据整合
      if (!!initData.options && !!initData.options.isAllocateByTag) {
        var _options = {};
        for (var prop in initData) {
          if (prop == 'options') {
            for (var prop2 in initData.options) {
              _options[prop2] = initData.options[prop2];
            }
          } else {
            _options[prop] = initData[prop];
          }
        }
        this.data = u._$merge({}, defaultOptions, _options);
      } else {
        this.data = u._$merge({}, defaultOptions, initData);
      }
      this.data.type = this.data.resType == 3 ? 'progroup' : 'project';
      this.data.resId = this.data.resType == 3 ? 'pgid' : 'pid';
      // 有删除按钮的，添加删除所需信息
      if (this.data.resType == 0 || this.data.resType == 3) {
        this.addActionData(this.data.toplist);
        this.addActionData(this.data.noToplist);
      }
      if (this.data.addable) {
        var addResActionData = {
          event: 'add-' + this.data.type
        };
        if (this.data.pgid) {
          addResActionData.pgid = this.data.pgid;
        }
        this.data.addResActionData = JSON.stringify(addResActionData);
      }
      //当前的排序方式
      if (this.data.sortable) {
        this.data.sortType = _cu.__initOrder(this.data.orderType, this.data.sortType);
      }
    },
    init: function () {
      var _this = this;
    },
    sort: function (tag) {
      //按对应字段排序
      var _data = _cu.__sortByField(tag, this.data.sortType, this.data.toplist, this.data.noToplist, this.data.publist, true);
      this.data.sortType = _data.sortType;
      if (this.data.resType === 0) {
        var _options = {
          ids: _data.pids,
          type: _data.typeNum,
          pgId: this.data.pgid,
          key: this.data.cache._$getListKey(this.data.pgid),
          ext: {progroupId: this.data.pgid}
        };
      } else {
        var _options = {
          ids: _data.pids,
          type: _data.typeNum,
        };
      }
      this.data.cache._$sort(_options);
    },
    addActionData: function (list) {
      //添加删除时用到的 action-data 需要用到的信息
      u._$forEach(list, function (item) {
        var obj = {
          event: 'delete-' + this.data.type,
          id: item.id,
          name: item.name,
          pgid: this.data.pgid
        };
        item.actionData = JSON.stringify(obj);
      }._$bind(this));
    },
    _change: function (event, res) {
      this.data.cache._$updateItem({id: res.id, data: {logo: event.file}, ext: {progroupId: res.progroupId}});
    },
    top: function (res) {
      var _this = this;
      // var top = this.data.resType == 0 ?  '__isTop' : 'isTop';
      var top = 'isTop';
      var flag = !!res[top] ? _dbConst.CMN_BOL_NO : _dbConst.CMN_BOL_YES;
      res[top] = !res[top];
      if (this.data.resType == 0) {
        var options = {
          v: flag,
          id: res.id,
          pgId: this.data.pgid,
          key: this.data.cache._$getListKey(this.data.pgid),
          ext: {progroupId: this.data.pgid}
        };
      } else {
        var options = {
          v: flag,
          id: res.id
        };
      }
      this.data.cache._$stick(options);
    }
  });
  return CardList;
});
