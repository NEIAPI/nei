/**
 * 斑马纹列表组件
 */
NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'ui/pager/pager',
  'util/chain/chainable',
  'util/template/jst',
  'pro/select2/select2',
  'pro/common/module',
  'pro/common/jst_extend',
  'pro/common/regular/regular_base',
  'pro/common/util',
  'pro/cache/config_caches',
  'text!./stripedlist.html',
  'css!./stripedlist.css'
], function (k, u, e, v, pager, $, jst, Select2, m, jstex, rb, util, caches, html, css, p, pro) {

  p._$$ModuleStripedList = k._$klass();
  pro = p._$$ModuleStripedList._$extend(m._$$Module);
  e._$addStyle(css);

  // 常量
  var LIST_VIEW_MODE_LS_KEY = '__$list_view_mode';
  var LIST_VIEW_MODE_LIST = 'list';
  var LIST_VIEW_MODE_GROUP = 'group';
  var SELECTED_GROUP_LS_KEY = '__$selected_group';
  var EXCLUDED_HEADERS_LS_KEY = '__$excluded_headers';
  var EXCLUDED_TAGS_LS_KEY = '__$excluded_tags';
  var EXCLUDED_STATUS_LS_KEY = '__$excluded_status';
  var EXCLUDED_GROUPS_LS_KEY = '__$excluded_groups';
  var EXCLUDED_RESPOS_LS_KEY = '__$excluded_respos';

  // 默认参数配置选项
  var defaultOptions = {
    // 父容器
    parent: document.body,
    // 是否显示表头
    showHeader: true,
    // 批量操作元素的字符串表示:
    batchAction: '',
    // 根据选中的行，判断是否需要隐藏对应的batch按钮
    batchNeedHidden: function (batchActionName, selectedItems) {
      return false;
    },
    // 列表过滤函数
    filter: function (xlist) {
      return xlist;
    },
    // 列表也可以通过 cache 由组件来加载, 默认通过参数传递列表数据, 即 xlist
    listCache: null,
    // 列表 cache key, 可以不传, 默认等同于 listCache
    listCacheKey: null,
    // 请求参数
    queryData: {},
    // 请求额外参数
    queryExtData: null,
    // 列表数据
    xlist: [],
    // 排序字段排序, 如果是多级的, 使用点号, 比如按 creator 的 name 排序, 则是 "creator.name"
    // 不设置 defaultSortKey 的默认值, 因为没有什么值可以用来当默认值
    defaultSortKey: null,
    // 是否升序, 默认为 true
    isDefaultSortUp: true,
    // 是否点击表头排序
    sortable: false,
    // 本在存储中的 key 值, 用于存放列表排序等信息
    lsListKey: '', // 必需, 否则抛异常
    // 要显示的字段, 元素项格式为:
    // {
    //    name: '', // 显示名
    //    key: '', // 对应列表 xlist 中的 key 值, 如果是多级的, 使用点号, 比如 "creator.name"
    //    valueType: '', // 值类型: 暂时支持 deepKey, httpMethod, tag, time, __nei-actions, 具体含义见 jstex 的实现
    //    sortable: true, // 是否可点击此表头排序, 默认为 true,
    //    searchable: true, // 是否可按此列搜索, 默认为 true,
    //    filter: undefined, // 是否有筛选器, 目前支持 tag, group, respo
    // }
    headers: [],
    // 没有数据时的提示文案
    noItemTip: '暂无数据',
    // 没有数据时的提示文案, 是否要显示icon
    hasNoItemTipIcon: true,
    // 点击添加行图标的回调, 类型须为函数
    addRow: null,
    // 是否有分页器
    hasPager: false,
    // 是否有搜索框
    hasSearchBox: false,
    // 是否可以自定义显示哪些列
    hasHeaderFilter: false,
    // 列表分组, 元素项格式为:
    // {
    //    group: '', // 分组依据中的显示名称
    //    key: '' // 列表项中的字段名
    // }
    listGroups: null,
    // 渲染后的事件回调
    afterRender: function () {
    },
    // 自定义分组, 优先级高于 listGroups, 格式为:
    // {
    //    key: '', // 字段名称
    //    types: [
    //      {
    //          value: [value], // 字段的值
    //          name: [name] // 显示名称
    //      }
    //    ]
    // }
    customGroups: null,
    vlist: false, // 是否使用虚拟列表渲染
    itemHeight: 40, // 虚你列表项的高度，需固定一致。
    vlistHeight: 500, //虚拟列表的可视高度 Number|String
  };

  // 获取本地存储
  pro._getLSConfig = function () {
    // TODO 此处的写法应该有误 应用 localStorage.get() / localStorage.set()
    return JSON.parse(localStorage.STRIPED_LIST_LOCAL_CONFIG || '{}')[this._options.lsListKey] || {};
  };

  // 设置本地存储
  pro._setLSConfig = function (config) {
    var lsConfig = JSON.parse(localStorage.STRIPED_LIST_LOCAL_CONFIG || '{}');
    lsConfig[this._options.lsListKey] = config;
    localStorage.STRIPED_LIST_LOCAL_CONFIG = JSON.stringify(lsConfig);
  };

  // 初始化开始
  pro.__reset = function (options) {
    // 以下情况需要用到 localStorage, 此时需要指定 lsListKey
    if ((options.sortable || options.listGroups || options.hasHeaderFilter) && !options.lsListKey) {
      return console.error('请为当前的列表指定应用的唯一的lsListKey, 用来作为本地存储中的键');
    }
    this.__super(options);
    this._originalOptions = options;
    this._options = u._$merge({}, defaultOptions, options);
    // 将xlist挂在this上, 因为options会传递给Regular, 避免对xlist做脏检查。
    this._xlist = this._options.xlist;
    delete this._options.xlist;
    this._options.listCacheKey = this._options.listCacheKey || this._options.listCache;
    if (this._options.listCache && caches[this._options.listCache]) {
      // 通过 cache 加载列表
      this._listCache = caches[this._options.listCache]._$allocate({
        onlistload: function (evt) {
          this._xlist = this._listCache._$getListInCache(this._options.listCacheKey);
          // 初始化保存数据项状态的对象
          this._initXlistStates();
          // header 字段中的筛选器
          this._initHeaderFilters();
          // 设置不需要显示的列
          this._updateHiddenHeaders();
          // 是否有分页器, 获取当前页的列表数据
          if (this._options.hasPager) {
            this._sliceXlist();
          }
          // 隐藏 loading 动画
          this._options.isLoadingData = false;
          this._render();
        }.bind(this)
      });
      this._itemsDeletedHandler = function (event) {
        // 删除的时候在 cache 层已经将该元素从 list 中删除
        var deletedItems = event.data;
        (deletedItems || []).forEach(function (it) {
          if (it.version && it.version.origin) {
            //reveal the latest version
            var versions = this._xlist.filter(function (res) {
              return res.version && res.version.origin === it.version.origin;
            }).sort(function (resA, resB) {
              return resB.id - resA.id;
            });
            var latest = versions[0];
            if (latest && this._options.xlistStates &&
              this._options.xlistStates[latest.id]) {
              this._options.xlistStates[latest.id].__invisible = false;
            }
          }
        }.bind(this));
        this._groupList(); // 有可能删除的是分组的项, 要更新分组中的数量
        this.stripedList.updateSelectedNum(); // 删除的项有可能是选中状态, 需要更新选中的数量信息
        this.stripedList.$update();
      }.bind(this);
      // 监听批量删除事件
      v._$addEvent(caches[this._options.listCache], 'itemsdeleted', this._itemsDeletedHandler);
      // 显示 loading 动画
      this._options.isLoadingData = true;
      // TODO 此处初始化了2次，是为了优先展示表头吗？
      this._initXlistStates();
      this._render();
      this._getListData();
    } else {
      // 初始化保存数据项状态的对象
      this._initXlistStates();
      // header 字段中的筛选器
      this._initHeaderFilters();
      // 设置不需要显示的列
      this._updateHiddenHeaders();
      this._render();
    }
    // 监听删除列表项事件
    this.__doInitDomEvent([
      [
        caches[this._options.listCache], 'itemsdeleted',
        function (evt) {
          // 有分页器时
          if (this._options.hasPager) {
            // 当前分页索引
            this._pagerIndex = this._pager._$getIndex();
            // 重新获取总数信息
            this._options.queryData.total = true;
            // 销毁分页器
            this._pager = this._pager._$recycle();
            // 重新获取数据
            this._getListData();
          } else {
            // 当列表项删除时，需要更新下可见列表
            this.stripedList.updateShownList();
          }
        }.bind(this)
      ]
    ]);

  };

  // xlistStates 对象保存数据的状态, 比如 __hidden、__search_hit、__disabled、__selected、__indexInGroup、__invisible
  pro._initXlistStates = function () {
    this._options.xlistStates = {};
    this._xlist.forEach(function (item, index) {
      // 默认设置好 id, 方便某些情况下取元素 id
      this._options.xlistStates[item.id] = {
        id: item.id,
        status: item.status,
      };
    }, this);
  };

  // header 字段中的筛选器
  pro._initHeaderFilters = function () {
    this._options.headers.forEach(function (header) {
      switch (header.filter) {
        case 'tag':
          header.excludedFilterLSKey = EXCLUDED_TAGS_LS_KEY;
          this._initFilterHandler(header, '_$getTagList');
          break;

        case 'group':
          header.excludedFilterLSKey = EXCLUDED_GROUPS_LS_KEY;
          this._initFilterHandler(header, '_$getGroupList');
          break;

        case 'respo':
          header.excludedFilterLSKey = EXCLUDED_RESPOS_LS_KEY;
          this._initFilterHandler(header, '_$getRespoList');
          break;

        case 'status':
          header.excludedFilterLSKey = EXCLUDED_STATUS_LS_KEY;
          this._initFilterHandler(header, '_$getStatusList');
          break;

        default:
          break;
      }
    }, this);
    this._updateHiddenState();
  };

  // 初始化筛选器
  pro._initFilterHandler = function (header, listCacheFuncName) {
    var lsConfig = this._getLSConfig();
    var excludedFilterItems = lsConfig[header.excludedFilterLSKey] || [];
    var filterList;
    if (this._listCache) {
      filterList = this._listCache[listCacheFuncName](this._options.listCacheKey);
    } else {
      var fl = this._options[listCacheFuncName];
      filterList = typeof fl === 'function' ? fl() : fl;
    }
    header.filterList = (filterList || []).map(function (item) {
      return {
        value: item.value || item.id || item,
        name: item.name || item,
        selected: excludedFilterItems.indexOf(item.value || item) === -1
      };
    });
    // 空标签
    if (header.key === 'tag') {
      header.filterList.unshift({
        value: '',
        name: '<无标签>',
        selected: excludedFilterItems.indexOf('') === -1
      });
      header.filterTagByType = lsConfig.filterTagByType || 'union';
    }
    header.filterList.unshift({
      value: null,
      name: '全部',
      selected: excludedFilterItems.length === 0
    });
    header.excludedFilterItems = excludedFilterItems;
    this._updateHeaderClass(null, null, header, excludedFilterItems);
  };

  // 获取和分页器索引对应的列表数据
  pro._sliceXlist = function () {
    var options = this._options;
    var xlist = this._xlist;
    var qd = options.queryData;
    this._xlist = xlist.slice(qd.offset, qd.offset + qd.limit);
    this._xlistLen = xlist.length;
  };

  // 分页器切换处理程序
  pro._changePageNum = function (evt) {
    var last = evt.last;
    var index = evt.index;
    if (!evt.last) {
      return;
    }
    var qd = this._options.queryData;
    if (index > last) {
      qd.offset += (index - last) * qd.limit;
    } else {
      qd.offset -= (last - index) * qd.limit;
    }
    this._getListData();
  };

  // 加载数据
  pro._getListData = function () {
    var data = {
      key: this._options.listCacheKey,
      data: this._options.queryData,
      ext: this._options.queryExtData,
      offset: this._options.queryData.offset,
      limit: this._options.queryData.limit
    };
    this._listCache._$getList(data);
    if (this._options.hasPager) {
      // 仅第一次返回 total, 删除元素项后需要重新获取总数信息
      this._options.queryData.total = false;
    }
  };

  // 计算header的class类名
  pro._updateHeaderClass = function (sortKey, isSortUp, header, excludedFilterItems) {
    this._options.headers.forEach(function (item) {
      // 只计算一次
      item.class = item.class || ' col-' + item.key.replace(/[A-Z._]/g, function ($0) {
          if ($0 === '_') {
            return '';
          }
          return '-' + ($0 === '.' ? '' : $0.toLowerCase());
        });
      // 显示排序方式的图标
      if (sortKey) {
        if (item.key === sortKey) {
          item.sortClass = ' list-sort-' + (isSortUp ? 'up' : 'down');
        } else {
          item.sortClass = '';
        }
      } else if (header && item.key === header.key && item.filter && excludedFilterItems) {
        // 过滤筛选器的样式
        if (excludedFilterItems.length !== 0) {
          item.filterClass = ' some-filter-items-selected';
        } else {
          item.filterClass = '';
        }
      }
    }, this);
  };

  // 更改列表项的 __hidden 属性
  // 目前支持4种形式的筛选: tag, group, respo, status
  pro._updateHiddenState = function () {
    var lsConfig = this._getLSConfig();
    this._xlist.forEach(function (item) {
      // 本地存储中的数据
      // 被排除的筛选项
      var excludedFilterItems = [];
      var includedFilterItems = [];
      // 默认都匹配
      var tagHit = true;
      var statusHit = true;
      var groupHit = true;
      var respoHit = true;
      var tagHandler = function () {
        if (lsConfig.filterTagByType === 'intersection') {
          var tags = item.tag.split(',');
          if (item.tag === '') {
            // 资源没有标签
            // 用户只勾选了 '无标签'
            tagHit = includedFilterItems.length === 1 && includedFilterItems[0].value === '';
            return;
          }
          var selectedTags = includedFilterItems.filter(function (it) {
            // 去掉 "全部"
            return it.value !== null;
          });
          // 匹配所有，也就是includedFilterItems中的tag在item中要全部出现
          selectedTags = selectedTags.map(function (tagItem) {
            return tagItem.value;
          });
          selectedTags.forEach(function (tag) {
            if (!tags.includes(tag)) {
              tagHit = false;
            }
          });
        } else {
          if (excludedFilterItems.length === 0 && !item.tag) {
            // 如果没有筛选条件, 则没有标签的数据为选中状态
            return tagHit = true;
          }
          var tags = item.tag.split(',');
          // 默认取并集
          tags.some(function (tag) {
            tagHit = !!includedFilterItems.find(function (itm) {
              return itm.value === tag;
            });
            return tagHit; // break if true
          });
        }
      };
      var statusHandler = function () {
        if (excludedFilterItems.length === 0 && !item.status) {
          // 如果没有筛选条件, 则没有状态的数据为选中状态
          return statusHit = true;
        }
        statusHit = !!includedFilterItems.find(function (itm) {
          return itm.value === item.status.id;
        });
      };
      var groupHandler = function () {
        groupHit = !!includedFilterItems.find(function (itm) {
          return itm.value === item.group.id;
        });
      };
      var respoHandler = function () {
        respoHit = !!includedFilterItems.find(function (itm) {
          return itm.value === item.respo.id;
        });
      };

      this._options.headers.forEach(function (header) {
        if (!header.filter) {
          return;
        }
        excludedFilterItems = lsConfig[header.excludedFilterLSKey] || [];
        includedFilterItems = [];
        header.filterList.forEach(function (filterItem) {
          if (excludedFilterItems.indexOf(filterItem.value) === -1) {
            includedFilterItems.push(filterItem);
          }
        });
        switch (header.filter) {
          case 'tag':
            tagHandler();
            break;

          case 'status':
            statusHandler();
            break;

          case 'group':
            // tag 匹配了才进行业务分组的匹配
            tagHit && groupHandler();
            break;

          case 'respo':
            // group 匹配了才进行负责人的匹配
            groupHit && respoHandler();
            break;

          default:
            break;
        }
      }, this);
      var itemState = this._options.xlistStates[item.id];
      // 取交集, 即只有四者全部匹配才显示
      if (tagHit && statusHit && groupHit && respoHit) {
        itemState.__hidden = false;
      } else {
        itemState.__hidden = true;
      }
    }, this);
    // 返回不需要显示的列表
  };

  // 更改 header 列的 selected 属性
  pro._updateHiddenHeaders = function () {
    var excludedFilterItems = this._getLSConfig()[EXCLUDED_HEADERS_LS_KEY];
    this._options.headers.forEach(function (header) {
      if (excludedFilterItems === undefined) {
        // 没有设置过，优先考虑默认设置
        if (header.hasOwnProperty('defaultSelected')) {
          header.selected = header.defaultSelected;
        } else {
          header.selected = true;
        }
      } else if (Array.isArray(excludedFilterItems)) {
        if (excludedFilterItems.indexOf(header.key) > -1) {
          header.selected = false;
        } else {
          header.selected = true;
        }
      }
    });
  };

  // 列表排序
  pro._sortList = function () {
    // 列表排序
    var sortKey = null;
    var isSortUp = true;
    if (this._options.sortable) {
      // 获取本地存储中的排序信息
      var lsConfig = this._getLSConfig();
      sortKey = lsConfig.__$sort_by || this._options.defaultSortKey;
      isSortUp = lsConfig[sortKey];
      if (isSortUp === undefined) {
        var sortHeader = this._options.headers.find(function (header) {
          return header.key === sortKey;
        });
        if (sortHeader.isDefaultSortUp === undefined) {
          isSortUp = this._options.isDefaultSortUp;
        } else {
          isSortUp = sortHeader.isDefaultSortUp;
        }
      }
    } else {
      sortKey = this._options.defaultSortKey;
      isSortUp = this._options.isDefaultSortUp;
    }
    sortKey && this._xlist.sort(function (itemA, itemB) {
      // 值有可能是数值, 转成字符串来比较
      var valueA = String(jstex.getDeepValue(sortKey, itemA));
      var valueB = String(jstex.getDeepValue(sortKey, itemB));
      return isSortUp ? valueA.localeCompare(valueB, 'zh-CN') : valueB.localeCompare(valueA, 'zh-CN');
    });
    this._updateHeaderClass(sortKey, isSortUp);
  };

  // 判断是否在列表中可见
  pro._canShown = function (itemState) {
    // __invisible 是匿名数据模型, 列表中不用展示
    return !itemState.__hidden && itemState.__search_hit !== false && !itemState.__invisible;
  };

  pro._getShownList = function () {
    var shownList = this._xlist.filter(function (item) {
      return this._canShown(this._options.xlistStates[item.id]);
    }.bind(this));

    // 需要更新even状态
    shownList.forEach(function (item, index) {
      var state = this._options.xlistStates[item.id];
      state.__isEven = index % 2 === 1;
    }.bind(this));
    return shownList;
  };

  // 如果是分组模式, 则给列表分组
  pro._groupList = function () {
    // 如果是自定义分组
    if (this._options.customGroups) {
      return this._groupByCustomGroups();
    }
    // 没有视图切换功能, 简单返回
    if (!this._options.listGroups) {
      return;
    }
    // 清除隐藏的业务分组状态
    this._options.headers.forEach(function (header) {
      delete header.hiddenByGroup;
    });
    this._selectedGroup = this._getLSConfig()[SELECTED_GROUP_LS_KEY];
    this._groupSelectSource = this._options.listGroups.map(function (group) {
      return {
        name: group.group,
        id: group.key
      };
    }, this);
    this._selectedGroup = this._groupSelectSource.find(function (select) {
      return select.name === this._selectedGroup;
    }, this);
    // 如果本地存储中没有分组信息, 则选中第一个
    if (!this._selectedGroup) {
      this._selectedGroup = this._groupSelectSource[0];
    }
    this._options.listViewMode = this._getLSConfig()[LIST_VIEW_MODE_LS_KEY] || LIST_VIEW_MODE_LIST;
    if (this._options.listViewMode === LIST_VIEW_MODE_GROUP) {
      // 分组模式, 则给列表分组, 该数组用于 html 模板
      this._options.xlistGroups = [];
      this._options.xlistGroupsTotalShownNum = 0;
      switch (this._selectedGroup.id) {
        case 'group':
          // 先查该列表中所有的 group 信息
          // 然后将列表分组, 下同
          var list = this._listCache._$getGroupList(this._options.listCacheKey);
          list.forEach(function (listItem) {
            var shownNum = 0;
            this._options.xlistGroups.push({
              name: listItem.name,
              title: listItem.title,
              xlist: this._xlist.filter(function (item) {
                if (item.group.id === listItem.value) {
                  var itemState = this._options.xlistStates[item.id];
                  if (this._canShown(itemState)) {
                    shownNum++;
                    return true;
                  }
                }
              }, this),
              shownNum: shownNum
            });
            this._options.xlistGroupsTotalShownNum += shownNum;
          }, this);
          // 此时头部中的"业务分组"列不用显示, 其他还原
          this._options.headers.forEach(function (header) {
            header.hiddenByGroup = header.key === 'group.name';
          });
          break;

        case 'className':
          // 先查该列表中所有的 group 信息
          // 然后将列表分组, 下同
          var list = this._listCache._$getClassNameListByListKey(this._options.listCacheKey);
          list.forEach(function (listItem) {
            var shownNum = 0;
            this._options.xlistGroups.push({
              name: listItem.name,
              title: listItem.title,
              xlist: this._xlist.filter(function (item) {
                if (item.className === listItem.value) {
                  var itemState = this._options.xlistStates[item.id];
                  if (this._canShown(itemState)) {
                    shownNum++;
                    return true;
                  }
                }
              }, this),
              shownNum: shownNum
            });
            this._options.xlistGroupsTotalShownNum += shownNum;
          }, this);
          // 此时头部中的"业务分组"列不用显示, 其他还原
          this._options.headers.forEach(function (header) {
            header.hiddenByGroup = header.key === 'className';
          });
          break;

        case 'respo':
          var list = this._listCache._$getRespoList(this._options.listCacheKey);
          list.forEach(function (listItem) {
            var shownNum = 0;
            this._options.xlistGroups.push({
              name: listItem.name,
              title: listItem.title,
              xlist: this._xlist.filter(function (item) {
                if (item.respo.id === listItem.value) {
                  var itemState = this._options.xlistStates[item.id];
                  if (this._canShown(itemState)) {
                    shownNum++;
                    return true;
                  }
                }
              }, this),
              shownNum: shownNum
            });
            this._options.xlistGroupsTotalShownNum += shownNum;
          }, this);
          // 此时头部中的"负责人"列不用显示
          this._options.headers.forEach(function (header) {
            header.hiddenByGroup = header.key === 'respo.realname';
          });
          break;

        case 'creator':
          var list = this._listCache._$getCreatorList(this._options.listCacheKey);
          list.forEach(function (listItem) {
            var shownNum = 0;
            this._options.xlistGroups.push({
              name: listItem.name,
              title: listItem.title,
              xlist: this._xlist.filter(function (item) {
                if (item.creator.id === listItem.value) {
                  var itemState = this._options.xlistStates[item.id];
                  if (this._canShown(itemState)) {
                    shownNum++;
                    return true;
                  }
                }
              }, this),
              shownNum: shownNum
            });
            this._options.xlistGroupsTotalShownNum += shownNum;
          }, this);
          // 此时头部中的"创建者"列不用显示
          this._options.headers.forEach(function (header) {
            header.hiddenByGroup = header.key === 'creator.realname';
          });
          break;

        default:
          break;
      }
      this._setXlistGroupOrder();
    } else {
      delete this._options.xlistGroups;
      delete this._options.xlistByGroupOrder;
      // 此时不清除 __indexInGroup 也没关系, 因为每次都会重新计算
    }
  };

  // 这个数组是分组模式下的数据列表, 是有序的, 在"分组模式"视图时, Ctrl, Shift 键的选择会用到这个数组
  pro._setXlistGroupOrder = function () {
    this._options.xlistByGroupOrder = [];
    var indexInGroup = 0;
    this._options.xlistGroups.forEach(function (group) {
      this._options.xlistByGroupOrder = this._options.xlistByGroupOrder.concat(group.xlist);
      // 设置数据项在整个 group 中的索引, 在点击行的时候会用到这个值
      group.xlist.forEach(function (item) {
        this._options.xlistStates[item.id].__indexInGroup = indexInGroup++;
      }, this);
    }, this);
  };

  // 按指定的字段分组
  pro._groupByCustomGroups = function () {
    this._options.xlistGroups = [];
    this._options.xlistGroupsTotalShownNum = 0;
    this._options.customGroups.forEach(function (group) {
      var shownNum = 0;
      this._options.xlistGroups.push({
        name: group.name,
        title: group.name,
        xlist: group.xlist.filter(function (item) {
          var itemState = this._options.xlistStates[item.id];
          // 记录分组类型
          itemState.__type = group.type;
          if (this._canShown(itemState)) {
            shownNum++;
            this._options.xlistGroupsTotalShownNum++;
            return true;
          }
        }, this),
        shownNum: shownNum
      });
    }, this);
    this._setXlistGroupOrder();
  };

  // 实例化"分组依据"下拉框
  pro._initGroupSelect = function () {
    if (this._groupSelect) {
      // 已经存在就销毁
      this._groupSelect.destroy();
    }
    if (this._options.listGroups && this._options.listViewMode === LIST_VIEW_MODE_GROUP) {
      var select2Options = {
        source: this._groupSelectSource,
        selected: this._selectedGroup,
        preview: true
      };
      this._groupSelect = new Select2({
        data: select2Options
      }).$inject($(this._options.parent)._$getByClassName('group-select')[0]);
      // 监听change事件, 将分组信息存到本地存储中, 然后刷新列表
      this._groupSelect.$on('change', function (evt) {
        var config = this._getLSConfig();
        config[SELECTED_GROUP_LS_KEY] = evt.selected.name;
        this._setLSConfig(config);
        // 列表分组
        this._groupList();
        this.stripedList.$update();
      }.bind(this));
    }
  };

  // 是否有分页器, 获取当前页的列表数据
  pro._initPager = function () {
    if (this._options.hasPager && !this._pager) {
      this._pager = pager._$$Pager._$allocate({
        parent: this._options.parent,
        clazz: 'm-stripedlist-pager m-pager',
        index: this._pagerIndex || 1,
        total: Math.ceil(this._xlistLen / this._options.queryData.limit),
        label: {
          prev: '<span>上一页</span><i class="zprv-icon u-icon-arrow-left-normal normal">' +
          '</i><i class="zprv-icon u-icon-arrow-left-hover hover"></i>' +
          '<i class="zprv-icon u-icon-arrow-left-unable unable"></i>',
          next: '<span>下一页</span><i class="znxt-icon u-icon-arrow-right-normal normal"></i>' +
          '<i class="znxt-icon u-icon-arrow-right-hover hover"></i>' +
          '<i class="znxt-icon u-icon-arrow-right-unable unable"></i>'
        },
        onchange: function (evt) {
          this._changePageNum(evt);
        }.bind(this)
      });
    }
  };

  pro._initXlist = function () {
    // 6600个数据时，耗时 1.04s
    //this._xlist = this._options.filter(this._xlist, this._options.xlistStates);

    // 优化为分时计算
    var length = this._xlist.length;
    var tickLength = 100;
    var start = 0;

    // 防止后续被排序, 导致后续的切片出错
    const totalList = this._xlist.slice();

    var handlerXlist = function () {
      var end = start + tickLength < length ? start + tickLength : length;
      var list = totalList.slice(start, end);
      this._options.filter(list, this._options.xlistStates);
      start = end;
      if (end < length) {
        setTimeout(handlerXlist, 20);
      } else {
        if (this.stripedList) {
          // 由于分片更新的结束时间，可能慢于list组件渲染开始时间，导致计算的节点数量不对
          // 此处在处理完分片后，强制进行一次数量的重计算。
          this.stripedList.updateShownList();
        }
      }
    }.bind(this);

    handlerXlist();
  };

  /**
   *
   * @param {cancelSort} 是否需要取消排序，这在测试用例列表的时候比较有用，防止测试卡顿
   */
  pro._render = function (cancelSort) {
    this._initXlist();
    if (!cancelSort) {
      this._sortList();
    }
    this._groupList();
    // 头部字段类名
    this._updateHeaderClass();
    var List = this._getList();
    // 如果已存在列表实例, 则先销毁, 比如分页的时候
    if (this.stripedList) {
      this.stripedList.destroy();
    }
    this.stripedList = new List({
      data: this._options
    }).$inject(this._options.parent, 'top');
    if (this._options.isLoadingData) {
      // 还在加载数据
      return;
    }
    this._initPager();
    this._initGroupSelect();
    // 渲染完后的回调事件
    this._options.afterRender(this._options);
    // 滚动事件监听
    var listContainer = $(this._options.parent)._$delClassName('nei-scrolled');
    var listBd = listContainer._$getByClassName('list-bd')[0];
    v._$addEvent(listBd, 'scroll', function () {
      if (listBd.scrollTop === 0) {
        listContainer._$delClassName('nei-scrolled');
      } else {
        listContainer._$addClassName('nei-scrolled');
      }
    }.bind(this));
  };

  // regular 组件
  pro._getList = function () {
    var that = this;
    // 改为闭包持有，优化长列表性能
    var xlist = that._xlist;
    var shownList = that._getShownList();

    return rb.extend({
      template: html,

      config: function () {
        this.data.selectedAll = false;
        this.data.selectedNum = 0;
        // 自定义头部列的下拉列表的显示状态
        this.data.headerFilterOpen = false;
        // 上一次点击选中的行, 在选择列表行的操作中需要用到
        this.prevClickIndex = null;
        // 虚拟列表所需数据
        this.data.startIndex = 0;
        this.data.translateY = 0;
        this.data.visibleCount = 50;

        if (typeof this.data.vlistHeight === 'number') {
          this.data.vlistHeight += 'px';
        }
      },
      computed: {
        totalHeight: function () {
          return shownList.length * this.data.itemHeight;
        },
        xlist: function () {
          if (!this.data.vlist) {
            return shownList.slice();
          }
          var start = this.data.startIndex;
          var end = start + this.data.visibleCount;
          var list = shownList.slice(start, end < shownList.length ? end : shownList.length);
          return list;
        }
      },
      onScroll: function () {
        if (!this.data.vlist) {
          this.$update();
          return;
        }
        var scrollTop = this.$refs.list && this.$refs.list.scrollTop || 0;
        var fixedScrollTop = scrollTop - (scrollTop % this.data.itemHeight);
        this.data.translateY = fixedScrollTop;
        this.data.startIndex = Math.floor(scrollTop / this.data.itemHeight);
        this.$update();
      },
      // 当进行搜索、头过滤后，需要更新作用域内的可见列表
      updateShownList: function () {
        shownList = that._getShownList();
        // 分组模式下 this.$refs.list 会不存在
        if (this.$refs.list && this.$refs.list.scrollTop !== 0) {
          this.$refs.list.scrollTo(0, 0);
        } else {
          // 强制触发，以更新
          this.onScroll();
        }
      },
      canShown: function (id) {
        return that._canShown(this.data.xlistStates[id]);
      },
      isEnable: function (id) {
        return !this.data.xlistStates[id].__disabled;
      },
      indexInGroup: function (id) {
        return this.data.xlistStates[id].__indexInGroup;
      },
      // 全选的复选框
      toggleAll: function () {
        this.data.selectedAll = !this.data.selectedAll;
        xlist.forEach(function (item) {
          var itemState = this.data.xlistStates[item.id];
          if (!itemState.__disabled && !itemState.__hidden) {
            itemState.__selected = this.data.selectedAll;
          }
        }, this);
        this.updateSelectedNum();
      },

      // 切换行的选中状态
      toggleRow: function (evt, id, index) {
        var itemState = this.data.xlistStates[id];
        // 该用虚拟列表逻辑后，需增加offset
        index += this.data.startIndex;

        // 先判断是否点击了有操作的元素
        var clickActionIcon = v._$getElement(evt, 'd:action');
        if (clickActionIcon) {
          // 点击了有操作的图标, 不处理
          return;
        }
        // 点击行上的复选框
        var clickCheckbox = v._$getElement(evt, 'c:list-checkbox');
        var clickContentTitle = v._$getElement(evt, 'c:content-title');
        // 分组模式视图下, 操作的是 this._options.xlistByGroupOrder, 否则是 xlist
        var xlistToHandle = this.data.xlistByGroupOrder || xlist;
        // 实现的效果和操作系统选择文件保持一致, 包括按住 shift, ctrl 键的选择
        var shiftKey = evt.event.shiftKey;
        var ctrlKey = evt.event.ctrlKey || evt.event.metaKey;
        if (shiftKey) {
          // 按住 shift 键点击
          // 按住 shift 键选择时会选中文字, 删除 selection range
          document.getSelection().removeAllRanges();
          if (this.prevClickIndex > index) {
            xlistToHandle.forEach(function (itm, idx) {
              this.data.xlistStates[itm.id].__selected = idx >= index && idx <= this.prevClickIndex;
            }, this);
          } else {
            xlistToHandle.forEach(function (itm, idx) {
              this.data.xlistStates[itm.id].__selected = idx <= index && idx >= this.prevClickIndex;
            }, this);
          }
          this.updateSelectedNum();
        } else if (ctrlKey || clickCheckbox) {
          // 按住 ctrl 键点击
          // 只切换自身的选中状态
          itemState.__selected = !itemState.__selected;
          this.updateSelectedNum();
          this.prevClickIndex = index;
        } else if (clickContentTitle) {
          itemState.__showContent = !itemState.__showContent;
        } else {
          // 点击
          if (this.data.selectedNum > 1) {
            // 如果点击的时候有其他选中的项, 则选中点击的项
            itemState.__selected = true;
          } else {
            // 否则切换自身的选中状态
            itemState.__selected = !itemState.__selected;
          }
          // 将其他项取消选中
          xlistToHandle.forEach(function (itm) {
            if (itm.id !== itemState.id) {
              this.data.xlistStates[itm.id].__selected = false;
            }
          }, this);
          this.updateSelectedNum();
          this.prevClickIndex = index;
        }
      },

      // 更新选中的数量
      updateSelectedNum: function () {
        this.data.selectedNum = 0;
        var disabledNum = 0;
        var selectedIds = [];
        var selectedItems = [];
        xlist.forEach(function (itm) {
          // 不可用项, 隐藏项, 搜索没匹配上的项, 删除的项, 在计算选中项的数量时都要排除
          var itemState = this.data.xlistStates[itm.id];
          if (itemState.__disabled || itemState.__hidden || itemState.__search_hit === false || itemState.__invisible) {
            disabledNum++;
          } else if (itemState.__selected) {
            this.data.selectedNum++;
            selectedItems.push({
              id: itm.id,
              isShare: itm.__isShare
            });
            selectedIds.push(itm.id);
          }
        }, this);
        this.data.selectedAll = this.data.selectedNum !== 0 && this.data.selectedNum === xlist.length - disabledNum;
        that._setBatchActionData(this.$refs.header, selectedItems, selectedIds);
        that._setBatchActionVisibility(this.$refs.header, selectedIds.map(function (id) {
          return xlist.find(function (it) {
            return it.id === id;
          });
        }.bind(this)));
      },

      // 排序功能
      sort: function (header) {
        var lsConfig = that._getLSConfig();
        lsConfig.__$sort_by = header.key;
        if (lsConfig[header.key] === undefined) {
          if (header.isDefaultSortUp === undefined) {
            lsConfig[header.key] = that._options.isDefaultSortUp ? 1 : 0;
          } else {
            lsConfig[header.key] = header.isDefaultSortUp ? 0 : 1;
          }
        } else {
          lsConfig[header.key] = lsConfig[header.key] ? 0 : 1;
        }
        that._setLSConfig(lsConfig);
        that._sortList();
        // 列表分组也需要重新排序
        that._groupList();
        this.updateShownList();
      },

      // 点击 header 字段中的筛选器, tag, group ,respo, 切换下拉列表的打开还是关闭状态
      toggleFilterList: function (evt, header) {
        evt.event.stopPropagation();
        var open = header.filterListOpen;
        // 关闭其他过滤器下拉列表
        this.data.headers.forEach(function (item) {
          item.filterListOpen = false;
        });
        // 关闭列筛选器下拉列表
        this.data.headerFilterOpen = false;
        // 切换自身状态
        header.filterListOpen = !open;
        if (header.filterListOpen) {
          var handler = function () {
            header.filterListOpen = false;
            Regular.dom.off(document, 'click', handler);
            this.$update();
          }.bind(this);
          Regular.dom.on(document, 'click', handler);
        }
      },

      // 点击标签筛选器中的 并集 或者 交集
      toggleFilterTagByType: function (evt, filterTagByType, header) {
        evt.event.stopPropagation();
        // 更新本地存储
        var lsConfig = that._getLSConfig();
        header.filterTagByType = filterTagByType;
        lsConfig.filterTagByType = filterTagByType;
        that._setLSConfig(lsConfig);
        that._updateHiddenState();
        // 更新列表分组
        that._groupList();
        this.updateShownList();
      },

      // 点击 header 字段中的筛选器中的项
      toggleFilterItem: function (evt, filterItem, header) {
        evt.event.stopPropagation();
        var excludedFilterItems = [];
        filterItem.selected = !filterItem.selected;
        var isAllFilterItem = filterItem.value === null; // 点击全部
        // 选中全部, 则将所有项选中
        header.filterList.forEach(function (t) {
          isAllFilterItem && (t.selected = filterItem.selected);
          if (!t.selected && t.value !== null) {
            excludedFilterItems.push(t.value);
          }
        });
        // 更新本地存储
        var lsConfig = that._getLSConfig();
        lsConfig[header.excludedFilterLSKey] = excludedFilterItems;
        that._setLSConfig(lsConfig);
        // 没有选中全部时提示选中的数量及高亮列文字
        header.excludedFilterItems = excludedFilterItems;
        if (!isAllFilterItem) {
          // 选中"全部"
          var allFilterItem = header.filterList.find(function (item) {
            return item.value === null;
          });
          allFilterItem.selected = excludedFilterItems.length === 0;
        }
        that._updateHeaderClass(null, null, header, excludedFilterItems);
        that._updateHiddenState();
        // 更新列表分组
        that._groupList();
        this.updateShownList();
      },

      // 搜索功能, 对其他地方没有依赖
      search: function (evt) {
        // 搜索并高亮搜索关键词
        var value = evt.event.target.value.trim();
        var headers = this.data.headers;
        var isEmpty = value === '';
        var hit = false;
        var headerHit = false;
        var headerHitName = '';

        function getHLValue(rawValue, hitIndex) {
          return jstex.escape2(rawValue.substr(0, hitIndex)) + '<b class="hl">' +
            jstex.escape2(rawValue.substr(hitIndex, value.length)) + '</b>' +
            jstex.escape2(rawValue.substr(hitIndex + value.length, rawValue.length - 1));
        }

        xlist.forEach(function (item) {
          hit = false;
          var itemState = this.data.xlistStates[item.id];
          headers.forEach(function (header) {
            headerHit = false;
            if (!header.name) {
              return;
            }
            headerHitName = '__ui_' + header.key + '_hit';
            if (isEmpty) {
              delete itemState[headerHitName];
              hit = true;
              return;
            }
            var itemV;
            var hitIndex;

            function parseTag(tagValue, tagPinyin, className) {
              var itemVs = tagValue.split(',');
              var itemVsResult = [];
              itemVs.forEach(function (iv, index) {
                hitIndex = iv.toLowerCase().indexOf(value.toLowerCase());
                if (hitIndex > -1) {
                  headerHit = true;
                  hit = true;
                  var tag = {
                    title: iv,
                    name: getHLValue(iv, hitIndex),
                  };
                  itemVsResult.push(tag);
                } else {
                  // tag pinyin
                  var itemVPinyin = tagPinyin ? tagPinyin.split(',')[index] : '';
                  var matchPinyinResult = util.highlightPinyin(iv, itemVPinyin, value);
                  if (matchPinyinResult) {
                    var tag = {
                      title: iv,
                      name: matchPinyinResult
                    };
                    itemVsResult.push(tag);
                    headerHit = true;
                    hit = true;
                  } else {
                    itemVsResult.push(iv);
                  }
                }
              });
              if (headerHit) {
                itemState[headerHitName] = jstex.getTag2(itemVsResult, className);
              }
            }

            function parseStatus(statucObj) {
              itemV = statucObj.name;
              hitIndex = itemV.toLowerCase().indexOf(value.toLowerCase());
              var itemResult;
              if (hitIndex > -1) {
                headerHit = true;
                hit = true;
                itemResult = getHLValue(itemV, hitIndex);
              } else {
                var itemVPinyin = statucObj.namePinyin;
                var matchPinyinResult = util.highlightPinyin(itemV, itemVPinyin, value);
                if (matchPinyinResult) {
                  itemResult = matchPinyinResult;
                  headerHit = true;
                  hit = true;
                }
              }
              if (headerHit) {
                itemState[headerHitName] = jstex.getStatus2(statucObj, itemResult);
              }
            }

            if (header.valueType === 'tag') {
              parseTag(item.tag, item.tagPinyin);
            } else if (header.valueType === 'associatedWord') {
              parseTag(item.associatedWord, null, 'word-item');
            } else if (header.key === 'status.name') { //status
              parseStatus(item.status);
            } else if (header.key === 'forbidStatusDisplay.name') {
              parseStatus(item.forbidStatusDisplay);
            } else {
              itemV = jstex.getColValue(Object.assign({}, header, {
                noEscape: true
              }), item, itemState);
              hitIndex = itemV.toLowerCase().indexOf(value.toLowerCase());
              if (hitIndex > -1) {
                // 此处拼接不能直接使用 value 值, 因为有大小写的问题
                itemState[headerHitName] = util._$renderByJst('${a}<b class="hl">${b}</b>${c}', {
                  a: jstex.escape2(itemV.substr(0, hitIndex)),
                  b: jstex.escape2(itemV.substr(hitIndex, value.length)),
                  c: jstex.escape2(itemV.substr(hitIndex + value.length, itemV.length - 1))
                });
                headerHit = true;
                hit = true;
              } else {
                // 拼音字段中的分隔符"单引号", 不能转义
                var itemVPinyin = jstex.getColValue(Object.assign({}, header, {
                  noEscape: true
                }), item, itemState, true);
                var matchPinyinResult = util.highlightPinyin(itemV, itemVPinyin, value);
                if (matchPinyinResult) {
                  itemState[headerHitName] = matchPinyinResult;
                  headerHit = true;
                  hit = true;
                }
              }
            }
            if (!headerHit) {
              delete itemState[headerHitName];
            }
          }, this);
          itemState.__search_hit = hit;
        }, this);
        // 列表分组, 这里是为了更新匹配的数据条数, 简便起见, 直接调用 _groupList 方法
        that._groupList();
        this.updateShownList();
      },

      // 头部自定义列, 下拉列表的打开还是关闭状态
      toggleHeaderFilter: function (evt) {
        evt.event.stopPropagation();
        // 关闭其他过滤器下拉列表
        this.data.headers.forEach(function (item) {
          item.filterListOpen = false;
        });
        // 切换自身状态
        this.data.headerFilterOpen = !this.data.headerFilterOpen;
        if (this.data.headerFilterOpen) {
          var handler = function () {
            this.data.headerFilterOpen = false;
            Regular.dom.off(document, 'click', handler);
            this.$update();
          }.bind(this);
          Regular.dom.on(document, 'click', handler);
        }
      },

      // 切换具体的头部列的显示状态
      toggleHeaderFilterItem: function (evt, header) {
        evt.event.stopPropagation();
        var excludedFilterItems = [];
        header.selected = !header.selected;
        // 有效的 header
        var validHeaders = [];
        this.data.headers.forEach(function (t, index) {
          if (t.name && !t.hiddenByGroup) {
            validHeaders.push(index);
            if (t.selected === false) {
              excludedFilterItems.push(t.key);
            }
          }
        });
        // 如果全部都取消勾选了, 则最后一个点击的仍旧选中
        if (excludedFilterItems.length === validHeaders.length) {
          header.selected = true;
          var clickedIndex = excludedFilterItems.indexOf(header.key);
          excludedFilterItems.splice(clickedIndex, 1);
        }
        // 更新本地存储
        var lsConfig = that._getLSConfig();
        lsConfig[EXCLUDED_HEADERS_LS_KEY] = excludedFilterItems;
        that._setLSConfig(lsConfig);
        // 更新header列
        that._updateHiddenHeaders();
      },

      // 更改列表的视图模式
      changeListViewMode: function (mode) {
        this.data.listViewMode = mode;
        // 更新本地存储
        var lsConfig = that._getLSConfig();
        lsConfig[LIST_VIEW_MODE_LS_KEY] = mode;
        that._setLSConfig(lsConfig);
        // 更新列表分组
        that._groupList();
        // 分组依赖下拉框
        that._initGroupSelect();
      },

      // 分组视图下, 单击标题, 选中该组下所有项
      toggleGroup: function (evt, group) {
        // 没有批量操作, 不处理
        if (!this.data.batchAction) {
          return;
        }
        var handler = function () {
          // 其他分组下的清除选择
          // this.data.xlistByGroupOrder.forEach(function (item) {
          //   this.data.xlistStates[item.id].__selected = false;
          // }, this);
          group.__selected = !group.__selected;
          // 切换当前点击的分组下的状态
          group.xlist.forEach(function (item) {
            var itemState = this.data.xlistStates[item.id];
            if (itemState.__disabled) {
              return;
            }
            itemState.__selected = group.__selected;
          }, this);
          // 更新头部选中的数量
          this.updateSelectedNum();
          // 这里需要强制触发更新视图
          this.$update();
        }.bind(this);
        // 这里要区分双击和单击, 单击加计时器, 延迟执行
        // __dblClicked 的值在双击事件中设置
        group.__clickTimer = setTimeout(function () {
          if (group.__dblClicked) {
            clearTimeout(group.__clickTimer);
            delete group.__dblClicked;
            delete group.__clickTimer;
            return;
          }
          handler();
        }, 200);
      },

      // 分组视图下, 双击标题或者点击图标, 切换该分组下项的显示与隐藏, 这里使用 css3 动画
      toggleGroupHeight: function (evt, group) {
        group.__dblClicked = true;
        // 展开还是收起, 初始为 undefined, 首次点击是值变为 false
        group.__expand = group.__expand === undefined ? false : !group.__expand;
      },

      // 添加行
      addRow: function (evt) {
        if (u._$isFunction(this.data.addRow)) {
          this.data.addRow(evt);
        }
      },

      // 以 html 字符串的形式获取行的内容, 提升性能
      getRowHTML: function (item) {
        // 使用 html 字符串的方式, 显著提升性能
        var html = '';
        if (this.data.batchAction) {
          html += '<div class="list-checkbox"><i class="u-icon-checkbox-normal u-icon"></i><i class="u-icon-checkbox-pressed u-icon"></i></div>';
        }
        this.data.headers.forEach(function (header) {
          if (header.selected !== false && header.hiddenByGroup !== true) {
            html += '<div class="list-col' + header.class + '" title="' + jstex.getColTitle(header, item) + '"';
            // 特殊事件，action manager
            if (header.action) {
              html += ' data-action=\'' + header.action(item) + '\'';
            }
            html += '>';
            var itemState = this.data.xlistStates[item.id];
            // 优先显示搜索匹配结果
            if (itemState['__ui_' + header.key + '_hit']) {
              // 如果有转义结果模板，添加，如链接
              if (itemState['__ui_' + header.key + '_hit_template']) {
                html += itemState['__ui_' + header.key + '_hit_template'].replace('{value}', itemState['__ui_' + header.key + '_hit']);
              } else {
                html += itemState['__ui_' + header.key + '_hit'];
              }
            } else if (itemState['__ui_' + header.key]) {
              // 再判断原始的有转义的结果, 这个是在模型中添加的
              html += itemState['__ui_' + header.key];
            } else {
              // 正常字段
              html += jstex.getColValue(header, item, itemState);
            }
            html += '</div>';
          }
        }, this);
        if (item.content) {
          html += '<div class="list-row-content">' + item.content + '</div>';
        }
        return html;
      },

      // 计算 row 的 class
      getRowClass: function (item) {
        var state = this.data.xlistStates[item.id];
        var config = {
          'list-row': true,
          'row-item': true,
          'js-selected': !state.__disabled && state.__selected,
          'js-disabled': state.__disabled,
          'js-shared': item.__isShare,
          'js-unconfirmed': item.isConfirmed !== void (0) && !item.isConfirmed,
          'show-content': state.__showContent,
          'even': state.__isEven,
        };
        // 自定义 class
        if (state.__class) {
          config[state.__class] = true;
        }
        return util.classNames(config);
      },

      // 快捷操作, 清除选择
      clearSelected: function (evt) {
        evt.event.preventDefault();
        Object.keys(this.data.xlistStates).forEach(function (id) {
          delete this.data.xlistStates[id].__selected;
        }, this);
        this.updateSelectedNum();
      },

      // 快捷操作, 反向选择
      reverseSelected: function (evt) {
        evt.event.preventDefault();
        Object.keys(this.data.xlistStates).forEach(function (id) {
          this.data.xlistStates[id].__selected = !this.data.xlistStates[id].__selected;
        }, this);
        this.updateSelectedNum();
      }
    });
  };

  // 设置用于 action manager 的配置, 批量操作
  pro._setBatchActionData = function (header, selectedItems, selectedIds) {
    if (this._options.showHeader === false) {
      // 没有批量操作
      return;
    }
    var index;
    var batchActions = $(header)._$getByClassName('batch-action-item');
    for (index = 0; index < batchActions.length; index++) {
      var actionData = {};
      try {
        actionData = JSON.parse(e._$dataset(batchActions[index], 'action'));
      } catch (err) {
        console.error(err);
        continue;
      }
      if (actionData.type === 'link') {
        // 设置 link
        e._$attr(batchActions[index], 'href');
        e._$attr(batchActions[index], 'href', actionData.link + selectedIds.join(','));
      } else {
        actionData.ids = selectedIds;
        actionData.items = selectedItems;
        actionData.key = this._options.listCacheKey;
        e._$dataset(batchActions[index], 'action', JSON.stringify(actionData));
      }
    }
  };

  // 根据选中的行 设置 批量操作按钮的可见性
  pro._setBatchActionVisibility = function (header, selectedItems) {
    if (this._options.showHeader === false) {
      // 没有批量操作
      return;
    }

    if (selectedItems.length > 1) {
      e._$addClassName(header, 'batch-action-multi-sel');
    } else {
      e._$delClassName(header, 'batch-action-multi-sel');
    }

    // 根据选中的列表项, 设置batch操作列表中，每个 action 按钮的显隐状态
    var index;
    var batchActions = $(header)._$getByClassName('batch-action-item');
    for (index = 0; index < batchActions.length; index++) {
      var hidden = false;
      if (this._options.batchNeedHidden) {
        hidden = this._options.batchNeedHidden(batchActions[index].innerHTML, selectedItems);
      }
      if (hidden) {
        e._$addClassName(batchActions[index], 'hidden');
      } else {
        e._$delClassName(batchActions[index], 'hidden');
      }
    }
  };

  /* 公开方法 */
  /**
   * 刷新列表
   */
  pro._$update = function () {
    this.stripedList.$update();
  };

  /**
   * 重新渲染列表
   * @param  {Array} list - 新的列表数据
   */
  pro._$updateList = function (list, cancelSort) {
    this._xlist = list;
    // 这里更新originalList，因为$refresh会$recycle，导致_options消失，这时候采用的是老版本的options，就会导致显示的列表不对
    this._originalOptions.xlist = list;
    this._initXlistStates();
    // header 字段中的筛选器
    this._initHeaderFilters();
    // 设置不需要显示的列
    this._updateHiddenHeaders();
    this._render(cancelSort);
  };

  /**
   * 回收组件
   * @param  {Object} options - 配置参数
   */
  pro._$recycle = function (options) {
    this.__super(options);
    // 模块快速切换的时候, 有可能该组件还没实例化完成, 此时模块回收会调用该方法, 需要加个判断 this.stripedList 存在不存在
    this.stripedList && this.stripedList.destroy();
    delete this.stripedList;
    this._pager && this._pager._$recycle();
    this._pager = null;
    this._groupSelect && this._groupSelect.destroy();
    this._groupSelect = null;
    if (this._listCache) {
      this._listCache._$recycle();
      delete this._listCache;
      v._$delEvent(caches[this._options.listCache], 'itemsdeleted', this._itemsDeletedHandler);
      delete this._itemsDeletedHandler;
    }

    var listBd = e._$getByClassName(this._options.parent, 'list-bd')[0];
    v._$delEvent(listBd, 'scroll');
  };

  /**
   * 刷新列表
   */
  pro._$refresh = function (options) {
    this._$recycle();
    this._$clearListCache();
    this.__reset(u._$merge({}, this._originalOptions, options));
  };

  /**
   * 隐藏项
   * @param  {Object|Array|String} items - 需要隐藏的项
   * 格式: 1. xxxx(id)
   *      2. {id: xxxx}
   *      3. 以上两种的数组格式
   */
  pro._$hideItems = function (items) {
    if (!u._$isArray(items)) {
      items = [items];
    }
    items.forEach(function (item) {
      this.stripedList.data.xlistStates[item.id || item].__hidden = true;
    }, this);
    this.stripedList.$update();
  };

  /**
   * 显示项
   * @param  {Object|Array|String} items - 需要显示的项
   * 格式: 1. xxxx(id)
   *      2. {id: xxxx}
   *      3. 以上两种的数组格式
   */
  pro._$showItems = function (items) {
    if (!u._$isArray(items)) {
      items = [items];
    }
    items.forEach(function (item) {
      this.stripedList.data.xlistStates[item.id || item].__hidden = false;
    }, this);
    this.stripedList.$update();
  };

  /**
   * 设置某项数据的状态
   * @param  {Object|String} item - 需要设置的项
   * @param  {Object} state - 需要设置的状态数据
   */
  pro._$setItemState = function (item, state) {
    var itemState = this.stripedList.data.xlistStates[item.id || item];
    u._$merge(itemState, state);
    this.stripedList.$update();
  };

  /**
   * 获取列表的状态对象
   */
  pro._$getListStates = function () {
    return this.stripedList.data.xlistStates;
  };

  /**
   * 清除 list 缓存数据
   */
  pro._$clearListCache = function () {
    if (this._listCache) {
      this._listCache._$clearListInCache(this._options.listCacheKey);
    }
  };

});
