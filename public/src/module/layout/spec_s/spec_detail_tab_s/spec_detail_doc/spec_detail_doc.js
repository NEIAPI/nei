NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/template/tpl',
  'pro/common/module',
  'pro/cache/spec_cache',
  'pro/cache/user_cache',
  'text!{3rd}/highlight/github.mcss'
], function (_k, _e, _v, _u, _l, _m, sCache, usrCache, _css, _p, _pro) {

  _p._$$ModuleSpecDetailDoc = _k._$klass();
  _pro = _p._$$ModuleSpecDetailDoc._$extend(_m._$$Module);
  /**
   * 创建模块
   * @return {Void}
   */
  _pro.__doBuild = function () {
    this.__super();
    this.__body = _e._$html2node(
      _l._$getTextTemplate('module-spec-detail-doc')
    );
    _e._$addStyle(_css); //code  github样式
    this.__toggleIcon = _e._$getByClassName(this.__body, 'j-toggle-icon')[0];
    this.__editBtn = _e._$getByClassName(this.__body, 'j-edit')[0];
    this.__showWrap = _e._$getByClassName(this.__body, 'show-wrap')[0]; //显示状态节点
    this.__showNode = _e._$getByClassName(this.__body, 'm-doc-show')[0]; //显示内容节点
    this.__nodocNode = _e._$getByClassName(this.__body, 'm-no-doc')[0];//文档内容为空时的提示节点
    this.__editWrap = _e._$getByClassName(this.__body, 'edit-wrap')[0]; //编辑状态节点
    this.__previewWrap = _e._$getByClassName(this.__body, 'm-edit-r')[0];  //预览区节点
    this.__previewNode = _e._$getByClassName(this.__body, 'j-preview')[0]; //预览区内容节点
    this.__editorNode = _e._$getByClassName(this.__body, 'm-doc-editor')[0];
    this.__mode = 'ace/mode/markdown'; //编辑器高亮模式
    this.__markdown = new markdownit({ //markdownit
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
    });
    //a标签添加target='_blank'
    this.__markdown.renderer.rules.link_open = this.__linkOpen.bind(this);
    this.__usrCache = usrCache._$$CacheUser._$allocate();
    this.__specCache = sCache._$$CacheSpec._$allocate({
      onitemload: function (_r) {
        var specData = this.__specCache._$getItemInCache(this.__specId);
        var user = this.__usrCache._$getUserInCache();
        if (user.id == specData.creatorId) {
          _e._$delClassName(this.__editBtn, 'f-dn');//当前用户的规范，可编辑
        } else {
          _e._$addClassName(this.__editBtn, 'f-dn');//当前用户的规范，可编辑
        }
        this.__showNode.innerHTML = this.__markdown.render(specData.document || '');
        if (specData.document) { //项目文档不为空时，显示文档内容
          _e._$addClassName(this.__nodocNode, 'f-dn');
          _e._$delClassName(this.__showNode, 'f-dn');
        } else { //文档内容为空时，显示icon
          _e._$addClassName(this.__showNode, 'f-dn');
          _e._$delClassName(this.__nodocNode, 'f-dn');
        }
        this.__hideEdit(false);
      }.bind(this),
      onitemupdate: function (_r) { //更新成功，隐藏编辑状态，显示展示状态
        this.__hideEdit(true);
      }.bind(this)
    });
  };
  /**
   * 显示模块
   * @param {Object} 配置参数
   * @return {Void}
   */
  _pro.__onShow = function (_options) {
    this.__previewState = true; //是否显示预览区
    this.__doInitDomEvent([
      [this.__body, 'click', function (event) {
        var node = _v._$getElement(event, 'd:click');
        if (!node) return;
        var type = _e._$dataset(node, 'click');
        switch (type) {
          case 'edit':
            this.__showEdit();
            break;
          case 'save':
            this.__save();
            break;
          case 'toggle':
            this.__toggle();
            break;
          default:
            break;
        }
      }.bind(this)]
    ]);
    this.__super(_options);
  };
  /**
   * 刷新模块
   * @param {Object} 配置信息
   * @return {Void}
   */
  _pro.__onRefresh = function (_options) {
    this.__specId = _options.param.id;
    if (this.__specId) {
      this.__specCache._$getItem({
        key: sCache._$cacheKey,
        id: this.__specId
      });
    }
    this.__super(_options);
  };
  /**
   * 隐藏模块
   * @return {Void}
   */
  _pro.__onHide = function () {
    this.__editor && this.__editor.destroy();
    this.__editor = null;
    this.__doClearDomEvent();
    this.__super();
  };
  /**
   * 保存操作
   * @return {Void}
   */
  _pro.__save = function () {
    var newValue = this.__editor.getValue();
    var oldValue = this.__specCache._$getItemInCache(this.__specId).document;
    if (newValue != oldValue) {
      this.__specCache._$updateItem({
        id: this.__specId,
        data: {
          document: newValue
        }
      });
    } else {
      this.__hideEdit(false); //没有修改，不需要发送请求，展示内容不需要更新
    }
  };
  /**
   * 点击编辑按钮，进入编辑状态
   * @return {Void}
   */
  _pro.__showEdit = function () {
    _e._$addClassName(this.__showWrap, 'f-dn');
    _e._$delClassName(this.__editWrap, 'f-dn');
    var specData = this.__specCache._$getItemInCache(this.__specId);
    this.__editor = ace.edit(this.__editorNode);
    this.__editor.$blockScrolling = Infinity;
    this.__editor.setTheme('ace/theme/textmate');
    this.__editor.setOption('tabSize', 2);
    this.__editor.getSession().setMode(this.__mode);
    this.__editor.getSession().setUseWrapMode(true);
    this.__editor.setValue(specData.document || '', 1);
    if (this.__previewState) { //显示预览区
      this.__previewNode.innerHTML = this.__markdown.render(specData.document || '');
    }
    //暂时没有找到ace中提供的获取scrollbar的方法，所以是在dom中自己找出来的（可能需要修改）
    this.__scrollBar = _e._$getByClassName(_e._$getByClassName(this.__body, 'ace_scrollbar-v')[0], 'ace_scrollbar-inner')[0];
    this.__editor.on('change', function (e) {
      if (this.__previewState) { //显示预览区时，更新预览区内容
        this.__updatePreview();
      }
    }.bind(this));
    this.__editor.getSession().on('changeScrollTop', function (e) {
      if (this.__previewState) { //显示预览区时，更新预览区内容
        this.__previewScroll();
      }
    }.bind(this));
  };
  /**
   * 点击保存按钮，隐藏编辑状态
   * @param {Boolean} 是否更新内容
   * @return {Void}
   */
  _pro.__hideEdit = function (flag) {
    if (flag) { //需要更新展示内容
      var specData = this.__specCache._$getItemInCache(this.__specId);
      this.__showNode.innerHTML = this.__markdown.render(specData.document || '');
      if (specData.document) { //项目文档不为空时，显示文档内容
        _e._$addClassName(this.__nodocNode, 'f-dn');
        _e._$delClassName(this.__showNode, 'f-dn');
      } else { //文档内容为空时，显示icon
        _e._$addClassName(this.__showNode, 'f-dn');
        _e._$delClassName(this.__nodocNode, 'f-dn');
      }
    }
    _e._$delClassName(this.__showWrap, 'f-dn');
    _e._$addClassName(this.__editWrap, 'f-dn');
    this.__editor && this.__editor.destroy();
    this.__editor = null;
  };
  /**
   * 预览区展开与收起
   * @return {Void}
   */
  _pro.__toggle = function () {
    if (_e._$hasClassName(this.__previewWrap, 'f-dn')) {
      this.__previewState = true;
      _e._$delClassName(this.__previewWrap, 'f-dn');
      _e._$delClassName(this.__toggleIcon, 'u-icon-fold-up-normal');
      this.__toggleIcon.title = '收起预览';
      //同步滚动条位置和内容
      this.__updatePreview();
      this.__previewScroll();
    } else {
      this.__previewState = false;
      _e._$addClassName(this.__previewWrap, 'f-dn');
      _e._$addClassName(this.__toggleIcon, 'u-icon-fold-up-normal');
      this.__toggleIcon.title = '展开预览';
    }
  };
  /**
   * 滚动编辑器，同步滚动预览区
   * @private
   */
  _pro.__previewScroll = function () {
    var editorTop = this.__editor.getSession().getScrollTop();
    var x = editorTop / this.__scrollBar.scrollHeight;
    this.__previewNode.scrollTop = x * this.__previewNode.scrollHeight;
  };
  /**
   * markdown规则-link_open
   * 为a标签添加target属性
   * @param tokens tokens
   * @param idx    当前token的下标
   * @return {String}
   */
  _pro.__linkOpen = function (tokens, idx) { //为a标签添加target='_blank'
    var esc = this.__markdown.utils.escapeHtml;
    var token = tokens[idx];
    if (!token.attrs) {
      return '';
    }
    var result = '<' + token.tag;
    token.attrs.push(['target', '_blank']);
    for (var i = 0, l = token.attrs.length; i < l; i++) {
      result += ' ' + esc(token.attrs[i][0]) + '="' + esc(token.attrs[i][1]) + '"';
    }
    return result + '>';
  };
  /**
   * markdown highlight
   * 为code添加相关高亮规则
   * @param {String} code字符串
   * @param {String} code语言
   * @return {String}
   */
  _pro.__highLight = function (str, lang) {
    var esc = this.__markdown.utils.escapeHtml;
    try {
      if (lang && lang !== 'auto' && hljs.getLanguage(lang)) {
        return '<pre class="hljs language-' + esc(lang.toLowerCase()) + '"><code>' +
          hljs.highlight(lang, str, true).value +
          '</code></pre>';
      } else if (lang === 'auto') {
        var result = hljs.highlightAuto(str);
        return '<pre class="hljs language-' + esc(result.language) + '"><code>' +
          result.value +
          '</code></pre>';
      }
    } catch (__) { /**/
    }
    return '<pre class="hljs"><code>' + esc(str) + '</code></pre>';
  };
  /**
   * 更新预览内容
   * @return {Void}
   */
  _pro.__updatePreview = function () {
    var value = this.__editor.getValue();
    this.__previewNode.innerHTML = this.__markdown.render(value);
  };
  _m._$regist(
    'spec-detail-doc',
    _p._$$ModuleSpecDetailDoc
  );
});
