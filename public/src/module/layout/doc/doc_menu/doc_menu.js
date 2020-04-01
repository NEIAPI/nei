/*
 * 项目文档模块
 */
NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'pro/common/module',
  'util/template/tpl',
  'util/template/jst',
  'pro/cache/doc_cache',
  'pro/common/util',
  'json!{3rd}/fb-modules/config/db.json',
], function (k, e, v, _m, tpl, jst, cache, u, db, _p, _pro) {

  /**
   * 项目文档
   *
   * @class   _$$Module
   * @extends pro/widget/module._$$Module
   * @param  {Object} options - 模块输入参数
   */
  _p._$$Module = k._$klass();
  _pro = _p._$$Module._$extend(_m._$$Module);

  var systemType = [db.MDL_SYS_FILE, db.MDL_SYS_VARIABLE, db.MDL_SYS_STRING, db.MDL_SYS_NUMBER, db.MDL_SYS_BOOLEAN];
  var map = {
    pages: {
      name: '页面'
    },
    interfaces: {
      name: 'HTTP 接口'
    },
    rpcs: {
      name: 'RPC 接口'
    },
    templates: {
      name: '页面模板'
    },
    datatypes: {
      name: '数据模型'
    },
    constraints: {
      name: '规则函数'
    },
    groups: {
      name: '业务分组'
    }
  };

  //判断字段是否在map的配置字段中
  var isInMap = function (key) {
    return map.hasOwnProperty(key);
  };

  _pro.__doBuild = function () {
    this.__super();
    //获取模版
    this.__cache = cache._$$CacheDoc._$allocate({});
    this.__loading = e._$getByClassName(document.body, 'loading')[0];
    this.__container = e._$getByClassName(document.body, 'container')[0];
    v._$addEvent(document, 'click', function (evt) {
      var node = v._$getElement(evt, 'd:click');
      if (!node) {
        return;
      }
      var type = e._$dataset(node, 'click');
      switch (type) {
        case 'toggle-menu': //是否显示菜单
          if (e._$hasClassName(document.body, 'close')) {
            e._$delClassName(document.body, 'close');
          } else {
            e._$addClassName(document.body, 'close');
          }
          break;
        case 'toggle-menu-item': //菜单项切换
          var currentMenyItem = e._$getSibling(node, function (_element) {
            return _element.className.indexOf('app-sub-sidebar') > -1;
          });

          if (e._$hasClassName(currentMenyItem, 'active')) {
            e._$delClassName(currentMenyItem, 'active');
          } else {
            e._$addClassName(currentMenyItem, 'active');
          }

          var allMenuItem = e._$getByClassName(document.body, 'menu-link');

          allMenuItem.forEach(function (item) {
            e._$delClassName(item, 'active');
          });
          e._$addClassName(node, 'active');

          break;
        case 'add-doc':
          var projectInfo = this.__cache._$getProjectInfo();
          dispatcher._$redirect('/doc/custom/?id=' + projectInfo.id + '&state=add');
        default:
          break;
      }
    }.bind(this));
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);

    this.doShow(_options);
  };

  _pro.doShow = function (_options) {
    var from = _options.param.from || '';
    var menuData = this.__cache._$getMenuData();
    this.__renderMenu(menuData);

    if (from === 'outside') {
      // 展示部分
      var firstMenuItem = e._$getByClassName(document.body, 'menu-link')[0];
      e._$delClassName(firstMenuItem, 'active');
      var sidebars = e._$getByClassName(document.body, 'app-sidebar');
      sidebars.forEach(function (item) {
        e._$setStyle(item, 'display', 'none');
      });
      e._$addClassName(e._$get('doc'), 'close');
    } else {
      this.__setMenuSelected(_options);
    }
  };

  _pro.__onHide = function () {
    this.__super();
  };


  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var menuData = this.__cache._$getMenuData();
    this.__renderMenu(menuData);
    // 如果没有 resid，则选中相应的第一条数据，不要全部渲染，不然内容多的时候页面直接卡死
    if (!_options.param.resid) {
      var key = _options.input.location.target.split('/')[3];
      if (this.menuData.sortData[key] && this.menuData.sortData[key].length > 0) {
        var items = this.menuData.sortData[key][0].items;
        var getFirstItemId = function () {
          if (key === 'datatypes') {
            // 不能取到匿名类型
            var validDatatypes = items.filter(function (item) {
              if (item.name) {
                return item;
              }
            });
            return validDatatypes[0].id;
          } else {
            return items[0].id;
          }
        }.bind(this);
        return dispatcher._$redirect(location.href + '&resid=' + getFirstItemId());
      }
    }
    var from = _options.param.from || '';
    if (from != 'outside') {
      var sidebars = e._$getByClassName(document.body, 'app-sidebar');
      sidebars.forEach(function (item) {
        e._$setStyle(item, 'display', 'block');
      });
    }
    this.__setMenuSelected(_options);
  };

  _pro.__parsePath = function (path) {
    var name = path.replace('/m/doc/', '');
    name = name.replace('/', '');
    return name;
  };

  _pro.__setMenuSelected = function (_options) {
    var resId = _options.param.resid || 0;
    var path = _options.input.location.target;
    path = this.__parsePath(path);
    if (path) {
      //路径对应上资源，id也对应上
      var allMenuItem = e._$getByClassName(document.body, 'menu-link');
      if (allMenuItem.length > 0) {
        var selectedItem = allMenuItem.filter(function (item) {
          var info = e._$dataset(item, 'id');
          var resPath = path;
          if (resId != 0) {
            resPath = path + '-' + resId;
          }
          if (info == resPath) {
            return true;
          }
        });

        if (selectedItem.length > 0) {
          selectedItem = selectedItem[0];
          //对应需要展开的菜单项
          allMenuItem.forEach(function (item) {
            e._$delClassName(item, 'active');
          });
          e._$addClassName(selectedItem, 'active');

          //上一级目录
          var parentNode = selectedItem.parentNode;

          while (parentNode.tagName != 'UL') {
            parentNode = parentNode.parentNode;
          }
          //其他的收起来
          var sidebars = e._$getByClassName(document.body, 'app-sub-sidebar');
          sidebars.forEach(function (item) {
            e._$delClassName(item, 'active');
          });
          e._$addClassName(parentNode, 'active');

        }
      }
    }
  };

  _pro.__getMenuData = function (data) {
    var res = data;
    for (var item in map) {
      if (item != 'members') {
        res[item].sort(function (a, b) {
          return a.name.localeCompare(b.name, 'zh-CN');
        });
      }
    }
    //替换为带版本的数据，菜单只需要每个接口的初始版本
    res.interfaces = u._$filterVersion(data['interfaces']);
    res.rpcs = u._$filterVersion(data['rpcs']);
    res.datatypes = u._$filterVersion(data['datatypes']);
    //过滤分组，数据按照某个规则排序
    var sortItems = ['interfaces', 'rpcs', 'datatypes', 'pages', 'templates', 'constraints'];
    res['sortData'] = {};
    for (var sortItem in sortItems) {
      if (res.hasOwnProperty(sortItems[sortItem])) {
        var sortData = res[sortItems[sortItem]].sort(
          function (itemA, itemB) {
            return itemA.name.localeCompare(itemB.name, 'zh-CN');
          }
        );
        res['sortData'][sortItems[sortItem]] = {};
        var objArr = {};
        var groupNames = [];
        for (var item in sortData) {
          if (sortData[item]['group']) {
            var groupId = sortData[item]['group']['id'];
            var groupName = sortData[item]['group']['name'];
            if (!objArr[groupName]) {
              objArr[groupName] = {
                id: groupId,
                items: []
              };
              groupNames.push(groupName);
            }
            objArr[groupName]['items'].push(sortData[item]);
          }
        }
        groupNames.sort(function (nameA, nameB) {
          return nameA.localeCompare(nameB, 'zh-CN');
        });
        var objArr2 = [];
        groupNames.forEach(function (groupName) {
          objArr2.push({
            name: groupName,
            id: objArr[groupName].id,
            items: objArr[groupName].items
          });
        });
        res['sortData'][sortItems[sortItem]] = objArr2;
      }
    }
    return res;
  };

  _pro.__renderMenu = function (data) {
    //获取项目信息
    var projectInfo = this.__cache._$getProjectInfo();
    this.menuData = this.__getMenuData(data);

    //菜单隐藏操作
    if (this.__menuShow == false) {
      e._$addClassName(document.body, 'close');
    }

    var content = jst._$get('module-layout-doc-menu', {
      data: this.menuData,
      isInMap: isInMap,
      projectInfo: projectInfo,
      map: map
    });

    var menuNode = e._$getByClassName(document.body, 'sidebar')[0];
    menuNode.innerHTML = content;

    e._$setStyle(this.__loading, 'display', 'none');
    e._$setStyle(this.__container, 'opacity', '1');
  };

  _m._$regist(
    'layout-doc-menu',
    _p._$$Module
  );
  return _p;
});
