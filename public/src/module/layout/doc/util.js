/*
 * 文档公共方法------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/util',
  'base/event',
  'pro/cache/config_caches',
  'util/template/jst',
  'json!{3rd}/fb-modules/config/db.json',
  'pro/common/util',
  'pro/param_editor/param_editor',
  'text!./doc_default/template.html',
  'text!./doc_member/template.html',
  'text!./doc_interface/template.html',
  'text!./doc_rpc/template.html',
  'text!./doc_datatype/template.html',
  'text!./doc_template/template.html',
  'text!./doc_page/template.html',
  'text!./doc_constraint/template.html'
], function (e, butil, v, caches, jst, db, util, paramEditor, defaultTemplate, memberTemplate, interfaceTemplate, rpcTemplate, datatypeTemplate, tplTemplate, pageTemplate, constraintTemplate, p) {

  var systemType = [db.MDL_SYS_FILE, db.MDL_SYS_VARIABLE, db.MDL_SYS_STRING, db.MDL_SYS_NUMBER, db.MDL_SYS_BOOLEAN];
  var map = {
    members: ['admins', 'developers', 'testers', 'observers']
  };
  var sortFuncById = function (a, b) {
    return a.id - b.id;
  };
  defaultTemplate = jst._$add(defaultTemplate);
  memberTemplate = jst._$add(memberTemplate);
  interfaceTemplate = jst._$add(interfaceTemplate);
  rpcTemplate = jst._$add(rpcTemplate);
  datatypeTemplate = jst._$add(datatypeTemplate);
  tplTemplate = jst._$add(tplTemplate);
  pageTemplate = jst._$add(pageTemplate);
  constraintTemplate = jst._$add(constraintTemplate);
  var mockLoadCount = 0;
  var isMqlListenerAdded = false;
  var isMockLoadListenerAdded = false;
  p.cache = caches.doc._$allocate({});
  //判断是否不是系统类型
  p.isNotSystemType = function (type) {
    return systemType.indexOf(type) == -1;
  };
  p.formats = [{
    format: util.db.MDL_FMT_HASH,
    name: '哈希'
  },
    {
      format: util.db.MDL_FMT_ENUM,
      name: '枚举'
    },
    {
      format: util.db.MDL_FMT_ARRAY,
      name: '数组'
    },
    {
      format: util.db.MDL_FMT_STRING,
      name: '字符'
    },
    {
      format: util.db.MDL_FMT_NUMBER,
      name: '数值'
    },
    {
      format: util.db.MDL_FMT_BOOLEAN,
      name: '布尔'
    },
    {
      format: util.db.MDL_FMT_FILE,
      name: '文件'
    }
  ];

  /**
   * @method __formatParam(param,datatypeList)
   * @public
   * @param  {param} 单个参数
   * @param  {datatypeList} 数据模型
   * @return {object} 格式化后的参数
   */
  p.__formatParam = function (param, datatypeList) {
    if (param.typeName !== '') {
      // 不是匿名类型，返回参数本身
      return param;
    } else {
      // 匿名类型,此处去处理匿名类型数据，参数下面再带上params
      var result = Object.assign({}, param, {
        isObject: 1,
        objectId: param.type,
        type: 8999
      });

      var anonymousDatatype = datatypeList.find(function (dt) {
        return dt.id === param.type;
      });
      // 检查匿名类型中是否导入了自身，防止出现循环引用
      var params = anonymousDatatype.params.map(function (p) {
        if (p.type === anonymousDatatype.id) {
          return Object.assign(p, {
            circular: true,
            circularTip: '导入 ' + p.datatypeName + ' 后产生了循环引用'
          });
        }
        return p;
      });
      result.params = this._$formatParams(params, datatypeList);

      return result;
    }
  };

  p._$handleInputs = function () {
    var inputs = document.querySelectorAll('.m-param-editor .x-row input');
    inputs.forEach(function (input) {
      if (input.parentNode.querySelectorAll('.r-v').length) {
        return;
      }
      var span = document.createElement('span');
      span.innerHTML = input.value;
      span.className = 'r-v';
      input.parentNode.appendChild(span);
    });
  };

  p._$initPrint = function (_options) {
    var that = this;
    $('.toggle-btn').off('click');
    $('.toggle-btn').on('click', function (e) {
      e.stopPropagation();
      // open/close print dropdown
      if ($(this).closest('.print-toggle-btn').hasClass('js-open')) {
        $(this).closest('.print-toggle-btn').removeClass('js-open');
      } else {
        $(this).closest('.print-toggle-btn').addClass('js-open');
      }
    });
    // hide the mock blocks
    $('.print').off('click');
    $('.print').on('click', function () {
      $('.toggle-btn').closest('.print-toggle-btn').removeClass('js-open');
      $('.markdown-body-doc pre code.sample-code').addClass('hidden');
      that._$handleInputs();
      window.print();
      $('.markdown-body-doc pre code.sample-code').removeClass('hidden');
    });
    $('.print-mock').off('click');
    $('.print-mock').on('click', function () {
      $('.toggle-btn').closest('.print-toggle-btn').removeClass('js-open');
      that._$handleInputs();
      window.print();
    });

    $('.print-all').off('click');
    $('.print-all').on('click', function () {
      $('.toggle-btn').closest('.print-toggle-btn').removeClass('js-open');
      setTimeout(function () {
        that._$printAll(null, false);
      }, 0);
    });

    $('.print-all-mock').off('click');
    $('.print-all-mock').on('click', function () {
      $('.toggle-btn').closest('.print-toggle-btn').removeClass('js-open');
      setTimeout(function () {
        that._$printAllMock();
      }, 0);
    });
    // var projectId = _options.param.id;
    // if ($("#iframe").length == 0) {
    //     $("body").append('<iframe id="iframe"></iframe>');
    //     var iframe = $("#iframe")[0];
    //     var head = iframe.contentWindow.document.head;
    //     head.innerHTML = '<link href="/src/module/common/icons.css" rel="stylesheet"/>' +
    //         '<link href="/src/module/common/unit.css" rel="stylesheet"/>' +
    //         '<link href="/src/module/layout/doc/doc.css" rel="stylesheet"/>';
    // }

  };

  p._$printAll = function (allData, needMock) {
    var html = this._$renderAll(allData);
    // hide the current page
    $('.markdown-body-doc').addClass('hidden');
    // append all docs
    $('.markdown-body-wrapper').prepend(html);

    if (!needMock) {
      // if mock does not need, hiden mock
      $('.markdown-body-doc pre code.sample-code').addClass('hidden');
    }

    // print finish handler
    if (window.matchMedia) {
      var mediaQueryList = window.matchMedia('print');
      if (!isMqlListenerAdded) {
        mediaQueryList.addListener(function (mql) {
          if (!mql.matches) {
            // printing finishes
            // after printing
            // remove print html
            $('.markdown-body-doc.print-marker').remove();
            // show old html
            $('.markdown-body-doc').removeClass('hidden');
          }
        });
        isMqlListenerAdded = true;
      }
    }
    // adjust
    this._$ajustToPrint();
    this._$handleInputs();
    // print
    window.print();
  };

  p._$printAllMock = function (doc) {
    $('.loading').show();
    var that = this;
    var interfaceData = this._$getInterfaceDataByRoute({
      id: 0
    });
    var datatypeData = this.cache._$getDatatypeData();
    var pageData = this.cache._$getPageData();
    var templateData = this.cache._$getTemplateData();

    var allData = {
      interfaces: interfaceData,
      datatypes: datatypeData,
      pages: pageData,
      templates: templateData
    };

    mockLoadCount = interfaceData.length * 2 +
      datatypeData.length +
      pageData.length +
      templateData.length;

    var constraints = this.cache._$getConstraintData();
    var datatypes = this.cache._$getDatatypeData();
    if (!isMockLoadListenerAdded) {
      // add global event listener
      v._$addEvent(
        document, 'mockLoad', function (_event) {
          mockLoadCount -= 1;
          if (mockLoadCount <= 0) {
            $('.loading').hide();
            that._$printAll(allData, true);
          }
        }, false
      );
      isMockLoadListenerAdded = true;
    }
    if (mockLoadCount > 0) {
      // length has to be greater than 0
      util._$createSampleCodeHtml(allData, constraints, datatypes);
    } else {
      // length less than 0
      // same as printAll with no mock data
      that._$printAll(null, false);
    }
  };

  p._$renderAll = function (allData) {
    var html = '<div class="markdown-body-doc print-marker">' + this._$renderDefault() + '</div>' +
      '<div class="markdown-body-doc print-marker">' + this._$renderMembers() + '</div>' +
      '<div class="markdown-body-doc print-marker">' + this._$renderAllInterfaces(allData ? allData.interfaces : null) + '</div>' +
      '<div class="markdown-body-doc print-marker">' + this._$renderAllDatatypes(allData ? allData.datatypes : null) + '</div>' +
      '<div class="markdown-body-doc print-marker">' + this._$renderAllPages(allData ? allData.pages : null) + '</div>' +
      '<div class="markdown-body-doc print-marker">' + this._$renderAllTemplates(allData ? allData.templates : null) + '</div>' +
      '<div class="markdown-body-doc print-marker">' + this._$renderAllConstraints() + '</div>';
    return html;
  };


  p._$renderDatatypesByRoute = function (route) {
    var selectedData = this.__getDatatypeDataByRoute(route);
    var projectInfo = this.cache._$getProjectInfo();
    return jst._$get(datatypeTemplate, {
      data: selectedData,
      formats: this.formats,
      projectInfo: projectInfo,
      hashFormat: db.MDL_FMT_HASH,
      enumFormat: db.MDL_FMT_ENUM,
      arrayFormat: db.MDL_FMT_ARRAY,
      isNotSystemType: this.isNotSystemType
    });
  };

  p._$renderAllDatatypes = function (datatypeData) {
    var selectedData = datatypeData ? datatypeData : this.cache._$getDatatypeData();
    selectedData = this._$sortDataByGroup(selectedData);
    var projectInfo = this.cache._$getProjectInfo();
    return jst._$get(datatypeTemplate, {
      data: selectedData,
      formats: this.formats,
      projectInfo: projectInfo,
      hashFormat: db.MDL_FMT_HASH,
      enumFormat: db.MDL_FMT_ENUM,
      arrayFormat: db.MDL_FMT_ARRAY,
      isNotSystemType: this.isNotSystemType,
      printAll: true
    });
  };

  p._$renderRdtForInterface = function (route) {
    var selectedData = this._$getRelationDatatypeData(route).filter(function (dt) {
      // 排除匿名类型和系统类型
      if (dt.id > 10003 && dt.name) {
        return dt;
      }
    });
    if (!selectedData.length) {
      return '';
    }
    var projectInfo = this.cache._$getProjectInfo();
    return jst._$get(datatypeTemplate, {
      data: selectedData,
      formats: this.formats,
      projectInfo: projectInfo,
      hashFormat: db.MDL_FMT_HASH,
      enumFormat: db.MDL_FMT_ENUM,
      arrayFormat: db.MDL_FMT_ARRAY,
      isNotSystemType: this.isNotSystemType
    });
  };

  /**
   * 渲染单个数据模型的参数
   * @param  {Object} container - 数据模型参数的容器
   * @param  {Number} projectId - 项目id
   * @param  {Number} datatypeId - 要渲染的数据模型的id
   * @param  {Array} datatypeList - 数据模型列表
   */
  p._$renderDatatypeParams = function (container, projectId, datatypeId, datatypeList) {
    if (!container) {
      // 比如系统内置的数据模型是不需要显示参数信息的
      return;
    }
    // 设置数据模型列表的缓存
    var dc = caches.datatype._$allocate();
    var datatypeListKey = dc._$getListKey(projectId);
    dc._$setListInCache(datatypeListKey, datatypeList);
    var editorOption = {
      parent: container,
      parentId: datatypeId,
      parentType: 4,
      pid: projectId,
      preview: true,
      forceReadonly: true,
      docPreview: true
    };
    return paramEditor._$$ParamEditor._$allocate(editorOption);
  };
  /**
   * 渲染数据模型列表的参数
   * @param  {Node} container - 数据模型参数的容器
   * @param  {Object} route - 项目id
   */
  p._$renderDatatypeListParams = function (container, route) {
    var selectedData = this._$getRelationDatatypeData(route).filter(function (dt) {
      // 排除匿名类型和系统类型
      if (dt.id > 10003 && dt.name) {
        return dt;
      }
    });
    var projectInfo = this.cache._$getProjectInfo();
    var datatypeList = this.cache._$getDatatypeData();
    var paramsNodes = e._$getByClassName(container, 'm-datatype-params');
    // 设置数据模型列表的缓存
    var dc = caches.datatype._$allocate();
    var datatypeListKey = dc._$getListKey(projectInfo.id);
    dc._$setListInCache(datatypeListKey, datatypeList);
    var paramEditors = [];
    selectedData.forEach(function (dt, idx) {
      var editorOption = {
        parent: paramsNodes[idx],
        parentId: dt.id,
        parentType: 4,
        pid: projectInfo.id,
        preview: true,
        forceReadonly: true,
        docPreview: true
      };
      paramEditors.push(paramEditor._$$ParamEditor._$allocate(editorOption));
    });
    return paramEditors;
  };

  p._$renderRelationalDatatypes = function (data, print) {
    var selectedData = data;
    var result = [];
    var that = this;
    selectedData.forEach(function (data) {
      that.__getDeepDatatype(result, data);
    });
    result.sort(sortFuncById);
    var projectInfo = this.cache._$getProjectInfo();
    var constructedData = {
      data: result,
      formats: this.formats,
      projectInfo: projectInfo,
      hashFormat: db.MDL_FMT_HASH,
      enumFormat: db.MDL_FMT_ENUM,
      arrayFormat: db.MDL_FMT_ARRAY,
      isNotSystemType: this.isNotSystemType
    };
    if (print) {
      constructedData['printAll'] = print;
    }
    return jst._$get(datatypeTemplate, constructedData);
  };


  p._$getRelationDatatypeData = function (route) {
    var datatypeIds = [];
    var result = [];
    var interfaceData = this._$getInterfaceDataByRoute(route);
    interfaceData.forEach(function (data) {
      if (data.params.inputs.length > 0) {
        data.params.inputs.forEach(function (param) {
          if (datatypeIds.indexOf(param.type) == -1) {
            datatypeIds.push(param.type);
          }
        });
      }
      if (data.params.outputs.length > 0) {
        data.params.outputs.forEach(function (param) {
          if (datatypeIds.indexOf(param.type) == -1) {
            datatypeIds.push(param.type);
          }
        });
      }
    });
    var that = this;
    datatypeIds.forEach(function (id) {
      var datatype = that.__getDatatypeById(id);
      if (datatype) {
        //接口第一层数据模型进来
        result.push(datatype);
        that.__getDeepDatatype(result, datatype);
      }
    });
    return result.sort(sortFuncById);
  };

  p.__getDeepDatatype = function (arr, datatype) {
    var that = this;
    if (datatype.params && datatype.params.length > 0) {
      datatype.params.forEach(function (param) {
        //避免循环引用，程序卡死
        if (datatype.id == param.type) {
          return;
        }
        if (param.type > 10003) {
          var paramData = that.__getDatatypeById(param.type);
          if (paramData) {
            if (!that.__checkRepeated(arr, paramData)) {
              arr.push(paramData);
              that.__getDeepDatatype(arr, paramData);
            }
          }
        } else {
          var paramData = that.__getDatatypeById(param.type);
          if (paramData) {
            if (!that.__checkRepeated(arr, paramData)) {
              arr.push(paramData);
            }
          }
        }
      });
    }
  };

  p.__checkRepeated = function (arr, datatype) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i]['id'] == datatype.id) {
        return true;
      }
    }
    return false;
  };

  p.__getDatatypeById = function (id) {

    var datatypeData = this.cache._$getDatatypeData();
    for (var i = 0; i < datatypeData.length; i++) {
      if (datatypeData[i]['id'] == id) {
        return datatypeData[i];
      }
    }
    return false;
  };

  p.__getDatatypeDataByRoute = function (route) {
    var datatypeData = this.cache._$getDatatypeData();
    var datatypeCloneData = util._$clone(datatypeData);
    datatypeCloneData = util._$filterVersion(datatypeCloneData);
    //历史版本列表
    var versionMap = util._$getVersionsMap(datatypeData);

    var selectedData = [];
    var idsArray = route.id;
    if (idsArray != 0) {
      if (!butil._$isArray(idsArray)) {
        idsArray = idsArray.split(',');
      }

      datatypeData.forEach(function (item) {
        idsArray.forEach(function (id) {
          if (id == item.id) {
            //查找该数据是否有版本相关的数据，有的话填充在该数据的versions字段下
            if (versionMap[id]) {
              //第一层直接查找到
              var versionInfos = versionMap[id];
              item.versions = [];
              versionInfos.forEach(function (versionInfo) {
                if (versionInfo.id != id) {
                  item.versions.push(versionInfo);
                }
              });
            } else {
              //第一层没找到，进入第二层查找
              Object.keys(versionMap).forEach(function (key) {
                versionMap[key].forEach(function (version) {

                  if (version.id == id) {
                    var vversions = versionMap[key].filter(function (vversion) {
                      return vversion.id != id;
                    });
                    item.versions = vversions;
                  }
                });
              });
            }
            selectedData.push(item);
          }
        });
      });
    } else {
      //填充版本数据
      datatypeCloneData.forEach(function (item) {
        if (versionMap[item.id]) {
          var versionInfos = versionMap[item.id];
          item.versions = [];
          versionInfos.forEach(function (versionInfo) {
            if (versionInfo.id != item.id) {
              item.versions.push(versionInfo);
            }
          });
        }
        selectedData.push(item);
      });
    }
    return selectedData;
  };

  /**
   * markdown内容生成
   * @public
   * @params {string}  content -文档内容
   * @return {String}
   */
  p._$getMarkdownContent = function (content) {
    return new markdownit({
      linkify: true,
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value;
          } catch (e) {
          }
        }
        return ''; // use external default escaping
      }
    }).render(content || '');
  };


  p._$initEditor = function (id, md) {
    var editor = editormd(id, {
      width: '100%',
      height: 740,
      path: '/src/lib/editor-md/lib/',
      markdown: md,
      emoji: true,
      onload: function () {
      },
      onfullscreen: function () {
        $('.sidebar').hide();
        $('.sidebar-toggle').hide();
        $('.buttons').hide();
        $('#doc-custom').css('margin-top', 0);
      },
      onfullscreenExit: function () {
        $('.sidebar').show();
        $('.sidebar-toggle').show();
        $('.buttons').show();
        $('#doc-custom').css('margin-top', '70px');
      }
    });
    return editor;
  };


  p._$ajustToPrint = function () {
    $('.markdown-body-doc:not(.hidden) a.stateful').each(function () {
      var href = $(this).attr('href');
      var content = $(this).text();
      var regu = /\/doc\/([a-zA-Z]+)\/\?id=([0-9]+)&resid=([0-9]+)/;
      var matches = href.match(regu);
      if (matches) {
        var type = matches[1];
        var id = matches[3];
        var aTag = '<a class="stateful-print" href="#' + type + '-' + id + '">' + content + '</a>';
        $(this).after(aTag);
      }
      //正则匹配出所有要的数据/doc/(constraints)/?id=(10971)&resid=(10021)
    });
  };

  p._$renderMembers = function () {
    var projectInfo = this.cache._$getProjectInfo();
    return jst._$get(memberTemplate, {
      projectInfo: projectInfo,
      map: map
    });
  };
  p._$renderDefault = function () {
    var projectInfo = this.cache._$getProjectInfo();
    projectInfo.markdown = this._$getMarkdownContent(projectInfo.description);
    return jst._$get(defaultTemplate, {
      projectInfo: projectInfo
    });
  };

  p._$renderInterfacesByRoute = function (route) {
    var selectedData = this._$getInterfaceDataByRoute(route);
    var projectInfo = this.cache._$getProjectInfo();
    return jst._$get(interfaceTemplate, {
      interfaces: selectedData,
      formats: this.formats,
      projectInfo: projectInfo,
      hashFormat: db.MDL_FMT_HASH,
      enumFormat: db.MDL_FMT_ENUM,
      arrayFormat: db.MDL_FMT_ARRAY,
      isNotSystemType: this.isNotSystemType
    });
  };

  p._$renderRpcsByRoute = function (route) {
    var selectedData = this._$getInterfaceDataByRoute(route, db.RES_TYP_RPC);
    var projectInfo = this.cache._$getProjectInfo();
    return jst._$get(rpcTemplate, {
      rpcs: selectedData,
      formats: this.formats,
      projectInfo: projectInfo,
      hashFormat: db.MDL_FMT_HASH,
      enumFormat: db.MDL_FMT_ENUM,
      arrayFormat: db.MDL_FMT_ARRAY,
      isNotSystemType: this.isNotSystemType
    });
  };

  p._$sortDataByGroup = function (data) {
    var sortFunc = function (a, b) {
      return a.localeCompare(b, 'zh-CN');
    };
    var groupNamesObj = {};
    var sortedData = data.sort(
      function (a, b) {
        return sortFunc(a.name, b.name);
      }
    );
    sortedData.forEach(
      function (item) {
        var groupName = item.group.name;
        if (!groupNamesObj[groupName]) {
          // the group does not exist
          groupNamesObj[groupName] = [];
        }
        groupNamesObj[groupName].push(item);
      }
    );
    var sortedArr = [];
    Object.keys(groupNamesObj).sort(sortFunc).forEach(function (key) {
      sortedArr = sortedArr.concat(groupNamesObj[key]);
    });
    return sortedArr;
  };

  p._$renderAllInterfaces = function (interfaceData) {
    var selectedData = interfaceData ? interfaceData : this._$getInterfaceDataByRoute({
      id: 0
    });
    selectedData = this._$sortDataByGroup(selectedData);
    var projectInfo = this.cache._$getProjectInfo();
    return jst._$get(interfaceTemplate, {
      interfaces: selectedData,
      formats: this.formats,
      projectInfo: projectInfo,
      hashFormat: db.MDL_FMT_HASH,
      enumFormat: db.MDL_FMT_ENUM,
      arrayFormat: db.MDL_FMT_ARRAY,
      isNotSystemType: this.isNotSystemType,
      printAll: true
    });
  };


  p._$getInterfaceDataByRoute = function (route, interfaceType) {
    //获取带版本的接口数据
    //根据id降序排列，拿到带版本的最新数据
    var interfaceData = interfaceType === db.RES_TYP_RPC ? this.cache._$getRpcData() : this.cache._$getInterfaceData();

    var interfaceCloneData = util._$clone(interfaceData);

    interfaceCloneData = util._$filterVersion(interfaceCloneData);
    //历史版本列表
    var versionMap = util._$getVersionsMap(interfaceData);
    var selectedData = [];
    var idsArray = route.id;
    if (idsArray != 0) {
      if (!butil._$isArray(idsArray)) {
        idsArray = idsArray.split(',');
      }

      interfaceData.forEach(function (item) {
        idsArray.forEach(function (id) {
          if (id == item.id) {
            //查找该数据是否有版本相关的数据，有的话填充在该数据的versions字段下
            if (versionMap[id]) {
              //第一层直接查找到
              var versionInfos = versionMap[id];
              item.versions = [];
              versionInfos.forEach(function (versionInfo) {
                if (versionInfo.id != id) {
                  item.versions.push(versionInfo);
                }
              });

            } else {

              //第一层没找到，进入第二层查找
              Object.keys(versionMap).forEach(function (key) {
                versionMap[key].forEach(function (version) {

                  if (version.id == id) {
                    var vversions = versionMap[key].filter(function (vversion) {
                      return vversion.id != id;
                    });
                    item.versions = vversions;
                  }
                });
              });
            }

            selectedData.push(item);
          }
        });
      });
    } else {
      //填充版本数据
      interfaceCloneData.forEach(function (item) {

        if (versionMap[item.id]) {
          var versionInfos = versionMap[item.id];
          item.versions = [];
          versionInfos.forEach(function (versionInfo) {

            if (versionInfo.id != item.id) {
              item.versions.push(versionInfo);
            }
          });
        }
        selectedData.push(item);
      });
    }
    return selectedData;
  };

  p._$renderPagesByRoute = function (_options) {
    var projectInfo = this.cache._$getProjectInfo();
    var selectedData = this._$getPageDataByRoute(_options);
    return jst._$get(pageTemplate, {
      data: selectedData,
      projectInfo: projectInfo
    });
  };

  p._$getPageDataByRoute = function (_options) {
    var pageData = this.cache._$getPageData();
    var idsArray = _options.param.resid || 0;
    var selectedData = [];
    if (idsArray != 0) {
      if (!butil._$isArray(idsArray)) {
        idsArray = idsArray.split(',');
      }
      pageData.forEach(function (item) {
        idsArray.forEach(function (id) {
          if (id == item.id) {
            selectedData.push(item);
          }
        });
      });

    } else {
      selectedData = pageData;
    }
    return selectedData;
  };

  p._$renderAllPages = function (pageData) {
    var projectInfo = this.cache._$getProjectInfo();
    var data = pageData ? pageData : this.cache._$getPageData();
    data = this._$sortDataByGroup(data);
    return jst._$get(pageTemplate, {
      data: data,
      projectInfo: projectInfo
    });
  };

  p._$renderTemplatesByRoute = function (_options) {
    var data = this._$getTemplateDataByRoute(_options);
    return this._$renderTemplate(data);
  };

  p._$renderTemplate = function (data) {
    var projectInfo = this.cache._$getProjectInfo();
    var templatesData = data;
    return jst._$get(tplTemplate, {
      data: templatesData,
      projectInfo: projectInfo,
      hashFormat: db.MDL_FMT_HASH,
      enumFormat: db.MDL_FMT_ENUM,
      arrayFormat: db.MDL_FMT_ARRAY,
      isNotSystemType: this.isNotSystemType
    });
  };
  p._$renderAllTemplates = function (templateData) {
    var data = templateData ? templateData : this.cache._$getTemplateData();
    data = this._$sortDataByGroup(data);
    return this._$renderTemplate(data);
  };

  p._$getTemplateDataByRoute = function (_options) {
    var templatesData = this.cache._$getTemplateData();
    var idsArray = _options.param.resid || 0;
    var selectedData = [];
    if (idsArray != 0) {
      if (!butil._$isArray(idsArray)) {
        idsArray = idsArray.split(',');
      }

      templatesData.forEach(function (item) {
        idsArray.forEach(function (id) {
          if (id == item.id) {
            selectedData.push(item);
          }
        });
      });

    } else {
      selectedData = templatesData;
    }
    return selectedData;
  };

  p._$renderConstraintsByRoute = function (_options) {
    var constraintsData = this.cache._$getConstraintData();
    var idsArray = _options.param.resid || 0;
    var selectedData = [];
    if (idsArray != 0) {
      if (!butil._$isArray(idsArray)) {
        idsArray = idsArray.split(',');
      }
      constraintsData.forEach(function (item) {
        idsArray.forEach(function (id) {
          if (id == item.id) {
            selectedData.push(item);
          }
        });
      });

    } else {
      selectedData = constraintsData;
    }
    return jst._$get(constraintTemplate, {
      data: selectedData
    });

  };

  p._$renderAllConstraints = function () {
    var constraintsData = this.cache._$getConstraintData();
    constraintsData = this._$sortDataByGroup(constraintsData);
    return jst._$get(constraintTemplate, {
      data: constraintsData
    });
  };

  return p;

});
