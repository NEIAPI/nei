NEJ.define([
  'base/klass',
  'base/util',
  'base/element',
  'base/event',
  'pro/common/module',
  'util/template/tpl',
  'util/template/jst',
  'pro/cache/config_caches',
  'pro/common/util',
  'pro/layout/doc/util',
  'pro/param_editor/param_editor',
  'json!{3rd}/fb-modules/config/db.json'
], function (k, _butil, e, v, _m, tpl, jst, caches, u, util, paramEditor, db, _p, _pro) {

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

  //判断是否不是系统类型
  var isNotSystemType = function (type) {
    return systemType.indexOf(type) === -1;
  };

  _pro.__doBuild = function () {
    this.__super();
    this.__body = e._$html2node(
      tpl._$getTextTemplate('markdown-body')
    );
    this.interfaceRenderNode = e._$getByClassName(this.__body, 'markdown-body-doc')[0];
    this.datatypeRenderNode = e._$getByClassName(this.__body, 'markdown-body-doc')[1];
    this.cache = caches.doc._$allocate({});
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    util._$initPrint(_options);
  };

  _pro.__onHide = function () {
    this.__super();
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var hash = location.hash.replace('#', '');
    if (hash.indexOf('-') > -1) {
      hash = hash.substring(0, hash.indexOf('-'));
    }
    this.route = {
      'id': _options.param.resid || 0,
      'isHash': false,
      'hash': hash,
      'isVersion': _options.param.isversion || false
    };
    this.projectInfo = this.cache._$getProjectInfo();
    //根据项目id获取模型数据
    var datatypeData = this.cache._$getDatatypeData();
    //根据项目id获取规则
    var constraintsData = this.cache._$getConstraintData();
    this.interfaceRenderNode.innerHTML = util._$renderInterfacesByRoute(this.route);
    this.datatypeRenderNode.innerHTML = util._$renderRdtForInterface(this.route);
    var titleEl = e._$getByClassName(this.datatypeRenderNode, 'title')[0];
    // 更改标题
    if (titleEl) {
      titleEl.innerHTML = '关联数据模型列表';
    }
    var interfaceData = this.cache._$getInterfaceData();
    var relationDatatypeData = util._$getRelationDatatypeData(this.route);
    util._$renderDatatypeListParams(this.datatypeRenderNode, this.route);
    u._$createSampleCode(this.interfaceRenderNode, 'interfaces', interfaceData, constraintsData, datatypeData, function () {
      u._$createSampleCode(this.datatypeRenderNode, 'datatypes', relationDatatypeData, constraintsData, relationDatatypeData);
    }.bind(this));
    util._$ajustToPrint();
    // 设置接口缓存，方便参数编辑器查找数据
    var projectId = _options.param.id;
    var ic = caches.interface._$allocate();
    var interfaceListKey = 'interface-' + projectId;
    ic._$setListInCache(interfaceListKey, interfaceData);
    // 设置数据模型缓存
    var dc = caches.datatype._$allocate();
    var datatypeListKey = 'datatype-' + projectId;
    dc._$setListInCache(datatypeListKey, datatypeData);
    // 设置项目缓存
    var pc = caches.project._$allocate();
    var projectListKey = 'projects-' + this.projectInfo.progroupId;
    pc._$setListInCache(projectListKey, [this.projectInfo]);
    // 参数编辑器，可能有多几个，比如用户在nei平台中选中多个接口一起查看文档
    if (this.route.id) {
      var ids = this.route.id.split(',');
      for (var i = 0; i < ids.length; i++) {
        var paramContainer = e._$get('m-interface-inputs-' + ids[i]);
        if (paramContainer) {
          paramEditor._$$ParamEditor._$allocate({
            parent: paramContainer,
            parentId: ids[i],
            parentType: db.PAM_TYP_INPUT,
            pid: projectId,
            preview: true,
            forceReadonly: true,
            docPreview: true
          });
        }
      }
      for (var i = 0; i < ids.length; i++) {
        var paramContainer = e._$get('m-interface-outputs-' + ids[i]);
        if (paramContainer) {
          paramEditor._$$ParamEditor._$allocate({
            parent: paramContainer,
            // 接口id
            parentId: ids[i],
            parentType: db.PAM_TYP_OUTPUT,
            pid: projectId,
            preview: true,
            forceReadonly: true,
            docPreview: true
          });
        }
      }
    }
  };

  _m._$regist(
    'layout-doc-interfaces',
    _p._$$Module
  );
  return _p;
});
