/**
 * crud生成器 列表
 */
NEJ.define([
  'base/element',
  'base/util',
  'pro/common/regular/regular_base',
  'pro/select2/select2',
  'json!3rd/fb-modules/config/db.json',
  'pro/tagme/tagme',
  'text!./crud_list.html'
], function (_e, _u, Base, Select2, dbConst, tagme, html) {
  var xMethodList = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'], methods = [];
  xMethodList.forEach(function (item) { //配置请求方法数据
    methods.push({
      id: item,
      name: item
    });
  });
  var interfaces = [{
    name: '获取单个详情',
    method: {id: 'GET', name: 'GET'},
    addition: ':id',
    selected: true,
    type: dbConst.API_MDL_CRUD_SINGLE_GET
  }, {
    name: '获取列表',
    method: {id: 'GET', name: 'GET'},
    addition: '',
    selected: true,
    type: dbConst.API_MDL_CRUD_BAT_GET
  }, {
    name: '新建',
    method: {id: 'POST', name: 'POST'},
    addition: '',
    selected: true,
    type: dbConst.API_MDL_CRUD_POST
  }, {
    name: '修改',
    method: {id: 'PATCH', name: 'PATCH'},
    addition: ':id',
    selected: true,
    type: dbConst.API_MDL_CRUD_PATCH
  }, {
    name: '删除单个',
    method: {id: 'DELETE', name: 'DELETE'},
    addition: ':id',
    selected: true,
    type: dbConst.API_MDL_CRUD_SINGLE_DELETE
  }, {
    name: '删除多个',
    method: {id: 'DELETE', name: 'DELETE'},
    addition: '',
    selected: true,
    type: dbConst.API_MDL_CRUD_BAT_DELETE
  }];
  var crudTypeToConnectType = {};
  crudTypeToConnectType[dbConst.API_MDL_CRUD_SINGLE_GET] = dbConst.CONNECT_TYPE_GET;
  crudTypeToConnectType[dbConst.API_MDL_CRUD_BAT_GET] = dbConst.CONNECT_TYPE_GET_ALL;
  crudTypeToConnectType[dbConst.API_MDL_CRUD_POST] = dbConst.CONNECT_TYPE_CREATE;
  crudTypeToConnectType[dbConst.API_MDL_CRUD_PATCH] = dbConst.CONNECT_TYPE_UPDATE;
  crudTypeToConnectType[dbConst.API_MDL_CRUD_SINGLE_DELETE] = dbConst.CONNECT_TYPE_DELETE;
  crudTypeToConnectType[dbConst.API_MDL_CRUD_BAT_DELETE] = dbConst.CONNECT_TYPE_DELETE_LIST;
  var curd_list = Base.extend({
    name: 'crud_list',
    template: html,
    config: function () {
      this.data = _u._$merge({
        methods: methods,
        errorList: []
      }, this.data);
      this.data.xlist.forEach(function (item) { //为每个数据模型添加接口列表
        item.interfaces = this.initInterface(item.name);
        item.path = '/api/' + item.name.toLowerCase() + 's/';
        item.gid = 0;
        item.tag = [];
      }.bind(this));
    },
    init: function () {
      this.initTag();
      this.supr();
    },
    destroy: function () { // 销毁tagme组件
      this.tagList && this.tagList.forEach(function (item) {
        item && item._$recycle();
      });
      this.supr();
    },
    changeGroup: function (event, index) { //修改分组
      this.data.xlist[index].gid = event.selected.id;
    },
    check: function (event, index) { //检查路径是否为空
      var item = this.data.xlist[index],
        index2 = this.data.errorList.indexOf(item.name);
      if (/^\s*$/.test(event.target.value)) { //输入为空串
        item.error = true;
        if (index2 == -1) {
          this.data.errorList.push(item.name);
        }
      } else {
        item.error = false;
        if (index2 != -1) {
          this.data.errorList.splice(index2, 1);
        }
      }
    },
    initInterface: function (name) { //初始化数据模型接口 name：数据模型名称
      var array = [];
      interfaces.forEach(function (item) {
        var obj = _u._$merge({}, item);
        item && (obj.name = name + '-' + obj.name);
        array.push(obj);
      });
      return array;
    },
    initTag: function () { //初始化tagme组件
      this.tagList = [];
      var nodes = _e._$getByClassName(this.$refs.body, 'tag'),
        i, node;
      var getDoneFunc = function (index) { //生成tagme组件的done function
        return function (data) {
          if (!!data.change) {
            this.data.xlist[index].tag = data.tags;
          }
        }.bind(this);
      }.bind(this);
      for (i = 0; node = nodes[i]; i++) {
        this.tagList[i] = tagme._$$ModuleTagme._$allocate({
          parent: node,
          searchCache: this.data.searchCache,
          searchCacheKey: this.data.listCacheKey,
          searchResultFilter: function () {
            return this.data.cache._$getTagList(this.data.listCacheKey);
          }.bind(this),
          preview: false,
          choseOnly: false,
          editable: true,
          tags: [],
          done: getDoneFunc(i),
          queryData: {
            pid: this.data.pid
          }
        });
      }
    },
    select: function (index1, index2) { //切换选中状态，index1:数据模型下标，index2:接口下标
      this.data.xlist[index1].interfaces[index2].selected = !this.data.xlist[index1].interfaces[index2].selected;
    },
    getTag: function (tags) { //获取后台所需的tag数据
      var result = tags.map(function (item) {
        return item.name;
      });
      if (result) {
        return result.join(',');
      }
      return '';
    },
    getValues: function () { //对外方法，获取数据
      var result = {
        pid: this.data.pid
      }, items = [];
      if (!this.data.errorList.length) {
        this.data.xlist.forEach(function (item) {
          var interfaces = [];
          item.interfaces.forEach(function (interface) {
            if (interface.selected) { //选中接口
              interfaces.push({
                name: interface.name,
                method: interface.method.id,
                path: item.path + interface.addition,
                type: interface.type,
                connectId: item.datatypeId,
                connectType: crudTypeToConnectType[interface.type]
              });
            }
          });
          if (interfaces.length) {
            item.tag = this.getTag(item.tag);
            item.interfaces = interfaces;
            delete item.name;
            delete item.path;
            items.push(item);
          }
        }.bind(this));
        result.items = items;
        return result;
      }
    }
  });
  return curd_list;
});
