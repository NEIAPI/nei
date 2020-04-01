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
  'pro/layout/doc/util',
  'pro/notify/notify',
  'pro/modal/modal',
  'json!{3rd}/fb-modules/config/db.json'
], function (k, e, v, _m, tpl, jst, cache, u, util, Notify, Modal, db, _p, _pro) {

  /**
   * 项目文档
   *
   * @class   _$$Module
   * @extends pro/widget/module._$$Module
   * @param  {Object} options - 模块输入参数
   */
  _p._$$Module = k._$klass();
  _pro = _p._$$Module._$extend(_m._$$Module);

  _pro.__doBuild = function () {
    this.__super();
    this.__body = e._$html2node(
      tpl._$getTextTemplate('markdown-body')
    );
    this.saveButton = e._$getByClassName(document.body, 'save-doc')[0];
    this.editButton = e._$getByClassName(document.body, 'edit-doc')[0];
    this.printButton = e._$getByClassName(document.body, 'print')[0];
    this.__renderNode = e._$getByClassName(this.__body, 'markdown-body-doc')[0];
    this.__cache = cache._$$CacheDoc._$allocate({});
  };

  _pro.__onShow = function (_options) {
    this.__super(_options);
    var that = this;
    var projectInfo = this.__cache._$getProjectInfo();

    $('.cancle-doc').off('click');
    $('.cancle-doc').click(function () {
      history.back(-1);
    });
    $('.edit-doc').off('click');
    $('.edit-doc').click(function () {
      var src = $(this).attr('data-src');
      dispatcher._$redirect(src);
    });
    $('.del-doc').off('click');
    $('.del-doc').on('click', function () {
      var button = $(this);
      var modal = new Modal({
        data: {
          content: '删除后不可恢复，确定删除吗？',
          closeButton: true
        }
      });
      modal.$on('ok', function () {
        var docId = button.attr('data-docid');
        that.__cache._$delCustomDoc(docId).then(function () {
          //删除成功，调到新增页面
          dispatcher._$redirect('/doc/custom/?id=' + projectInfo.id + '&state=add');
        });
      });

    });

    util._$initPrint(_options);
    $('.save-doc').off('click');
    $('.save-doc').click(function () {
      var params = {};
      params.id = $(this).attr('data-docid');
      params.projectId = projectInfo.id;
      params.name = $('.doc-title').val();
      params.content = that.editor.getMarkdown();
      if (params.name.length == 0 || params.name == '' || params.name == ' ') {
        Notify.show('文档标题不能为空', 'error');
        return;
      } else {
        that.__cache._$saveCustomDoc(params).then(function (res) {
          //保存成功，跳转到对应的页面
          dispatcher._$redirect('/doc/custom/?id=' + projectInfo.id + '&resid=' + res.data.id);
        });
      }

    });

  };

  _pro.__onHide = function () {
    this.__super();
  };

  _pro.__onRefresh = function (_options) {
    this.__super(_options);
    var id = _options.param.id;
    var docId = _options.param.resid || 0;
    var state = _options.param.state || 'view';
    var markdown = '';
    var that = this;
    if (state != 'add') {
      that.__cache._$getCustomDocById({
        id: docId,
        projectId: id
      }).then(function (res) {
        var currentDocInfo = res.data;
        if (state == 'edit') {
          //编辑
          markdown = currentDocInfo.content;
          that.editor = util._$initEditor('doc-custom', markdown);
          $('.doc-title').val(currentDocInfo['name']);
          $('.save-doc').removeClass('btn-hide').addClass('btn-show').attr('data-docid', docId);
          $('.cancle-doc').removeClass('btn-hide').addClass('btn-show');
          $('.print').removeClass('btn-show').addClass('btn-hide');
          $('.edit-doc').removeClass('btn-show').addClass('btn-hide');
          $('.del-doc').removeClass('btn-show').addClass('btn-hide');
          $('.markdown-body-doc').hide();
          $('.markdown-body').show();

        } else {
          //查看状态
          currentDocInfo.content = util._$getMarkdownContent(currentDocInfo.content);
          that.__renderNode.innerHTML = jst._$get('doc-custom', {
            customDocInfo: currentDocInfo,
          });
          $('.save-doc').removeClass('btn-show').addClass('btn-hide');
          $('.print').removeClass('btn-hide').addClass('btn-show');
          $('.cancle-doc').removeClass('btn-show').addClass('btn-hide');
          //更改edit-doc data-src的值
          $('.edit-doc').removeClass('btn-hide').addClass('btn-show').attr('data-src', '/doc/custom/?id=' + id + '&resid=' + docId + '&state=edit');
          $('.markdown-body-doc').show();
          $('.markdown-body').hide();
          $('.del-doc').removeClass('btn-hide').addClass('btn-show').attr('data-docid', docId);
        }
      });
    } else {
      $('#doc-custom').text('');
      $('.doc-title').val('');
      that.editor = util._$initEditor('doc-custom', markdown);
      //事件绑定多次，肯定有问题
      $('.save-doc').removeClass('btn-hide').addClass('btn-show').attr('data-docid', docId);
      $('.cancle-doc').removeClass('btn-hide').addClass('btn-show');
      $('.print').removeClass('btn-show').addClass('btn-hide');
      $('.edit-doc').removeClass('btn-show').addClass('btn-hide');
      $('.markdown-body-doc').hide();
      $('.markdown-body').show();
      $('.del-doc').removeClass('btn-show').addClass('btn-hide');
    }
  };
  _m._$regist(
    'layout-doc-custom',
    _p._$$Module
  );
  return _p;
});
