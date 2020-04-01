NEJ.define([
  'base/klass',
  'base/element',
  'util/tab/view',
  'util/template/tpl',
  'util/template/jst',
  'pro/common/module',
  'pro/common/util',
  'pro/cache/interface_cache'
], function (_k, _e, _t, _tpl, _jst, _m, _util, _inCache, _p, _pro) {

  _p._$$ModuleResInterfaceDetailTab = _k._$klass();
  _pro = _p._$$ModuleResInterfaceDetailTab._$extend(_m._$$Module);

  // 标签列表数据
  var xlist = [
    {type: 'req', name: '请求信息'},
    {type: 'res', name: '响应信息'},
    {type: 'mockstore', name: 'MockStore'},
    {type: 'version', name: '版本管理'},
    {type: 'statistics', name: '使用统计'},
    {type: 'activity', name: '操作历史'}
  ];

  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _tpl._$getTextTemplate('module-res-interface-detail-tab')
    );
    this.__tabWrap = _e._$getByClassName(this.__body, 'tab-wrap')[0];
    this.__inCache = _inCache._$$CacheInterface._$allocate({
      onitemload: function () {
        this.__interface = this.__inCache._$getItemInCache(this.__id);
        var list = _util._$clone(xlist);
        if (this.__interface.versions && this.__interface.versions.length) {
          list[3].sufix = '(' + this.__interface.versions.length + ')';
        }
        if (this.__interface.clients && this.__interface.clients.length) {
          list[4].sufix = '(' + this.__interface.clients.length + ')';
        }

        _jst._$render(this.__tabWrap, 'module-res-interface-detail-tabs', {
          id: this.__id,
          pid: this.__interface.projectId,
          xlist: list
        });
        this.__initTab();
      }.bind(this)
    });
  };

  _pro.__onShow = function (_options) {
    this._options = _options;
    this.__doInitDomEvent([
      [
        _inCache._$$CacheInterface, 'update',
        function (evt) {
          if (evt.ext && evt.ext.type === 'client') {
            var info = _e._$getByClassName(this.__tabWrap, 'statistics-sufix')[0];
            var inter = evt.data;
            if (inter.clients.length === 0) {
              info.textContent = '';
            } else {
              info.textContent = '(' + inter.clients.length + ')';
            }
          }
        }.bind(this)
      ], [
        _inCache._$$CacheInterface, 'itemsdeleted',
        function (result) {
          var deletedList = result.data;
          var deletedVersions = (deletedList || []).filter(function (it) {
            return it.version && this.__interface.version &&
              it.version.origin === this.__interface.version.origin;
          }.bind(this));
          if (deletedVersions.length) {
            var info = _e._$getByClassName(this.__tabWrap, 'version-sufix')[0];
            var oldNum = (info.textContent || '').replace(/\D+/g, '');
            if (oldNum) {
              var rest = parseInt(oldNum) - deletedVersions.length;
              if (rest) {
                info.textContent = '(' + rest + ')';
              } else {
                info.textContent = '';
              }
            }
          }
        }.bind(this),
      ], [
        _inCache._$$CacheInterface, 'versioncreated',
        function () {
          var info = _e._$getByClassName(this.__tabWrap, 'version-sufix')[0];
          var oldNum = (info.textContent || '').replace(/\D+/g, '') || 0;
          var result = parseInt(oldNum) + 1;
          info.textContent = '(' + result + ')';
        }.bind(this)
      ]
    ]);
    this.__super(_options);
  };

  _pro.__onRefresh = function (_options) {
    this.__id = _options.param.id;
    this.__super(_options);
    this.__inCache._$getItem({
      id: this.__id
    });
  };

  _pro.__initTab = function () {
    this.__tbview = _t._$$TabView._$allocate({
      list: _e._$getChildren(this.__tabWrap),
      oncheck: this.__doCheckMatchEQ._$bind(this)
    });
    this.__tbview._$match(
      this.__getPathFromUMI(this._options)
    );
  };

  _pro.__onHide = function () {
    this.__super();
    this.__tbview && (this.__tbview = this.__tbview._$recycle());
    this.__doClearDomEvent();
  };
  _pro.__doCheckMatchEQ = function (_event) {
    _event.matched = _event.target.indexOf(_event.source) == 0;
  };

  _m._$regist(
    'res-interface-detail-tab',
    _p._$$ModuleResInterfaceDetailTab
  );
});
