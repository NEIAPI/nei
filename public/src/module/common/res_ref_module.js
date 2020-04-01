/*
 * 资源引用列表基类
 */
NEJ.define([
  'base/klass',
  'base/element',
  'util/chain/chainable',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/datatype_cache',
  'pro/cache/interface_cache',
  'pro/cache/page_cache',
  'pro/cache/template_cache',
  'pro/cache/constraint_cache',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/client_cache',
  'pro/stripedlist/stripedlist'
], function (k, e, $, l, jst, baseModule, util, dataTypeCache, interfaceCache, pageCache, templateCache, constraintCache, proCache, pgCache, clientCache, stripedList, p, pro) {

  p._$$ResRefModule = k._$klass();
  pro = p._$$ResRefModule._$extend(baseModule._$$Module);

  pro.__doBuild = function () {
    this.__body = e._$html2node(
      l._$getTextTemplate(this.__bodyTemplateId)
    );
    this._cacheOptions = {
      onitemload: function () {
        // 单个资源的详情, 顶部需要显示名称、描述等信息
        var resData = this._cache._$getItemInCache(this.__id);
        var titleEl = $(this.__body)._$getByClassName('d-title')[0];
        jst._$render(titleEl, this.__detailTemplateId, resData);
      }.bind(this),
      onreflistload: this._renderRefList.bind(this)
    };
    this._listContainer = e._$getByClassName(this.__body, 'list-content')[0];
    this.stripedListHeaders = [
      {
        name: '名称',
        key: 'name',
        keyPinyin: 'namePinyin'
      },
      {
        name: '描述',
        key: 'description'
      },
      {
        name: '地址',
        key: 'path'
      },
      {
        name: '项目',
        key: 'projectName'
      },
      {
        name: '版本',
        key: 'version.name',
        valueType: 'deepKey'
      },
      {
        name: '负责人',
        key: 'respo.realname',
        keyPinyin: 'respo.realnamePinyin',
        valueType: 'deepKey'
      },
      {
        name: '创建者',
        key: 'creator.realname',
        keyPinyin: 'creator.realnamePinyin',
        valueType: 'deepKey'
      },
      {
        name: '',
        key: '__nei-actions',
        valueType: '__nei-actions'
      }
    ];
    this.stripedListOptions = {
      parent: this._listContainer,
      filter: this._$setRefListDetailHref.bind(this),
      headers: null,
      defaultSortKey: 'createTime',
      hasSearchBox: true
    };
    this.stripedList = null;
    this.__super();
  };

  pro.__onRefresh = function (_options) {
    this.__pid = parseInt((_options.param.pid || '').replace('/', ''));
    this.__id = parseInt(_options.param.id.replace('/', ''));
    this.__super(_options);
    // 获取当前资源的详情
    this._cache._$getItem({
      id: this.__id
    });
    // 获取当前资源的引用列表
    this._cache._$getRefList({
      id: this.__id,
      action: 'ref'
    });
  };

  pro.__onHide = function () {
    this.__super();
    this.stripedList = this.stripedList._$recycle();
    this._cache = this._cache._$recycle();
    this._listContainer.innerHTML = '';
  };

  pro.__onShow = function (options) {
    this._cache = this._cacheKlass._$allocate(this._cacheOptions);
    this.__super(options);
  };

  pro._renderRefList = function () {
    // 实例化 cache
    var dc = dataTypeCache._$$CacheDatatype._$allocate();
    var ic = interfaceCache._$$CacheInterface._$allocate();
    var pc = pageCache._$$CachePage._$allocate();
    var tc = templateCache._$$CacheTemplate._$allocate();
    var cc = constraintCache._$$CacheConstraint._$allocate();
    var proc = proCache._$$CachePro._$allocate();
    var progc = pgCache._$$CacheProGroup._$allocate();
    var clic = clientCache._$$CacheClient._$allocate();

    var refListCacheKey = this._cacheModule._$cacheKeyRef + this.__id;
    // 引用当前资源的数据模型引用列表
    var datatypeRefList = dc._$getListInCache(refListCacheKey).filter(function (dt) {
      // 匿名数据模型不展示
      return dt.type !== util.db.MDL_TYP_HIDDEN;
    });
    // 引用当前资源的接口引用列表
    var interfaceRefList = ic._$getListInCache(refListCacheKey);
    // 引用当前资源的页面引用列表
    var pageRefList = pc._$getListInCache(refListCacheKey);
    // 引用当前资源的模板引用列表
    var templateRefList = tc._$getListInCache(refListCacheKey);
    // 引用当前资源的规则函数引用列表
    var constraintRefList = cc._$getListInCache(refListCacheKey);
    // 引用当前资源的项目引用列表
    var proRefList = proc._$getListInCache(refListCacheKey);
    // 引用当前资源的项目组引用列表
    var progRefList = progc._$getListInCache(refListCacheKey);
    // 引用当前资源的客户端列表
    var clientRefList = clic._$getListInCache(refListCacheKey);

    this.stripedListOptions.customGroups = [];
    this.stripedListOptions.customGroups.push({
      name: 'HTTP 接口',
      xlist: interfaceRefList,
      type: util.db.RES_TYP_INTERFACE
    });
    interfaceRefList.forEach(function (item) {
      item.__resType = util.db.RES_TYP_INTERFACE;
    });
    this.stripedListOptions.customGroups.push({
      name: '页面',
      xlist: pageRefList,
      type: util.db.RES_TYP_WEBVIEW
    });
    pageRefList.forEach(function (item) {
      item.__resType = util.db.RES_TYP_WEBVIEW;
    });
    this.stripedListOptions.customGroups.push({
      name: '页面模板',
      xlist: templateRefList,
      type: util.db.RES_TYP_TEMPLATE
    });
    templateRefList.forEach(function (item) {
      item.__resType = util.db.RES_TYP_TEMPLATE;
    });
    this.stripedListOptions.customGroups.push({
      name: '数据模型',
      xlist: datatypeRefList,
      type: util.db.RES_TYP_DATATYPE
    });
    datatypeRefList.forEach(function (item) {
      item.__resType = util.db.RES_TYP_DATATYPE;
    });

    this.stripedListOptions.customGroups.push({
      name: '规则函数',
      xlist: constraintRefList,
      type: util.db.RES_TYP_CONSTRAINT
    });
    constraintRefList.forEach(function (item) {
      item.__resType = util.db.RES_TYP_CONSTRAINT;
    });

    this.stripedListOptions.customGroups.push({
      name: '项目',
      xlist: proRefList,
      type: util.db.RES_TYP_PROJECT
    });
    proRefList.forEach(function (item) {
      item.__resType = util.db.RES_TYP_PROJECT;
    });
    this.stripedListOptions.customGroups.push({
      name: '项目组',
      xlist: progRefList,
      type: util.db.RES_TYP_PROGROUP
    });
    progRefList.forEach(function (item) {
      item.__resType = util.db.RES_TYP_PROGROUP;
    });

    this.stripedListOptions.customGroups.push({
      name: '客户端',
      xlist: clientRefList,
      type: util.db.RES_TYP_CLIENT
    });
    clientRefList.forEach(function (item) {
      item.__resType = util.db.RES_TYP_CLIENT;
    });

    this._resTypeMap = {};
    this._resTypeMap[util.db.RES_TYP_INTERFACE] = 'interface';
    this._resTypeMap[util.db.RES_TYP_WEBVIEW] = 'page';
    this._resTypeMap[util.db.RES_TYP_TEMPLATE] = 'template';
    this._resTypeMap[util.db.RES_TYP_DATATYPE] = 'datatype';
    this._resTypeMap[util.db.RES_TYP_CONSTRAINT] = 'constraint';
    this._resTypeMap[util.db.RES_TYP_PROJECT] = 'project';
    this._resTypeMap[util.db.RES_TYP_PROGROUP] = 'progroup';
    this._resTypeMap[util.db.RES_TYP_CLIENT] = 'client';

    this.stripedListOptions.xlist = interfaceRefList.concat(
      pageRefList, templateRefList, datatypeRefList, constraintRefList,
      proRefList, progRefList, clientRefList
    );

    this.stripedListOptions.headers = this.stripedListHeaders.concat();
    if (this._refType === 'spec') {
      // 规范引用列表中没有 地址 和 负责人
      this.stripedListOptions.headers.splice(2, 2);
    }
    ;
    //增加项目名称显示字段
    //规范的引用和其它资源的引用数据返回格式不一致，前端做个特殊处理
    this.stripedListOptions.xlist.forEach(function (item) {
      //规范资源是没有项目id的
      if (!item.projectId) {
        item.projectName = item.name;
      } else {
        item.projectName = proc._$getItemInCache(item.projectId).name;
      }
    });
    this.stripedList = stripedList._$$ModuleStripedList._$allocate(this.stripedListOptions);
  };

  pro._$setRefListDetailHref = function (list, listStates) {
    list.forEach(function (item) {
      var itemState = listStates[item.id];
      var str = '';
      // 查看详情
      if (this._resTypeMap[item.__resType] === 'project') {
        str += '<a href="/' + this._resTypeMap[item.__resType] + '/detail/?pid=' + item.id + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';
      } else if (this._resTypeMap[item.__resType] === 'progroup') {
        str += '<a href="/' + this._resTypeMap[item.__resType] + '/detail/?pgid=' + item.id + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';
      } else {
        str += '<a href="/' + this._resTypeMap[item.__resType] + '/detail/?pid=' + item.projectId + '&id=' + item.id + '" title="查看详情" class="stateful"><em class="u-icon-detail-normal"></em></a>';
      }
      //   delete this._resTypeMap[item.__resType];
      itemState['__nei-actions'] = str;
    }.bind(this));
    return list;
  };

  p._$regist = baseModule._$regist;
});
