/*
 *  添加和修改项目组件-------------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/common/util',
  'pro/cache/pro_cache',
  'pro/cache/pg_cache',
  'pro/cache/user_cache',
  'text!./modal_project.html',
  'css!./modal_project.css',
  'pro/select2/select2'
], function (e, v, u, Modal, _, cache, pgcache, usercache, tpl, css, select2) {
  e._$addStyle(css);

  var modal = Modal.extend({
    config: function () {
      var _title = {
        'modify': '修改',
        'create': '创建',
        'delete': '删除',
        'copy': '复制',
        'transfer': '移交'
      };
      var _t = _title[this.data.method];
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-p-' + this.data.method,
        'title': _t + '项目',
        'closeButton': true,
        'okButton': _t,
        'cancelButton': false,
        //新增modal属性
        'size': 'large',
        inputError: false,
        inputName: '',
        description: '',
        lob: '',
        xlist: []
      });
      if (this.data.method === 'transfer') {
        this.data.noScroll = true;
      }
      this.supr(this.data);
    },
    init: function () {

      this.supr(this.data);
      this.__pgcache = pgcache._$$CacheProGroup._$allocate({});
      this.__usercache = usercache._$$CacheUser._$allocate({});
      //构建markdown编辑区域和预览区域
      if (this.data.method === 'create' || this.data.method === 'modify') {
        //这个dialog比较特殊，宽度和高度都比正常的大
        this.__mDoc = this.$refs.mDoc;
        this.__editorNode = this.$refs.docEditor;//编辑区内容
        this.__previewNode = this.$refs.jPreview; //预览区内容节点
        this.__previewWrap = this.$refs.previewWrap;  //预览区节点
        this.__toggleIcon = this.$refs.toggleIcon;
        // 业务线 下拉框
        var lobList = this.__pgcache._$getLobSelectSource(this.data.pgid);
        this.__lobSelect = new select2({
          data: {
            placeholder: '请输入负责维护该项目的业务线',
            source: lobList,
            choseOnly: false,
            selected: {
              name: this.data.lob,
              id: this.data.lob
            },
            maxLen: 100
          }
        });
        this.__lobSelect.$inject(this.$refs.lobSelect).$on('change', function (result) {
          this.__lob = result.selected.name;
        }.bind(this));

        v._$addEvent(this.__toggleIcon, 'click', function () {
          this.toggle();
        }.bind(this));
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
        // this.__markdown.renderer.rules.link_open = this.__linkOpen.bind(this);

        this.__editor = ace.edit(this.__editorNode);
        this.__editor.$blockScrolling = Infinity;
        this.__editor.setTheme('ace/theme/textmate');
        this.__editor.setOption('tabSize', 2);
        this.__editor.getSession().setMode(this.__mode);
        this.__editor.getSession().setUseWrapMode(true);
        //填充业务数据到编辑区和预览区
        this.__editor.setValue(this.data.description || '', 1);
        this.__previewNode.innerHTML = this.__markdown.render(this.data.description || '');
        //暂时没有找到ace中提供的获取scrollbar的方法，所以是在dom中自己找出来的（可能需要修改）
        this.__scrollBar = e._$getByClassName(e._$getByClassName(this.__mDoc, 'ace_scrollbar-v')[0], 'ace_scrollbar-inner')[0];
        this.__editor.on('change', function (e) {
          this.updatePreview();
        }.bind(this));

        this.__editor.getSession().on('changeScrollTop', function (e) {
          this.previewScroll();
        }.bind(this));
      }
      var that = this;
      this.__cache = cache._$$CachePro._$allocate({
        onitemadd: function () {
          that.destroy();
        },
        onitemupdate: function () {
          that.destroy();
        },
        onitemdelete: function () {
          that.destroy();
        },
        onchangecreator: function () {
          that.destroy();
        }
      });
      var user = this.__usercache._$getUserInCache();
      if (this.data.method == 'copy') {
        this.data.inputName = this.data.name + '副本';
        var list = this.__pgcache._$getListInCache(this.__pgcache.__cacheKey);
        //复制到目标项目组必需拥有创建者或者管理员权限
        list = list.filter(function (item) {
          var _own = false;
          item.admins.forEach(function (item2) {
            if (item2.id == user.id) {
              _own = true;
            }
          });
          if (item.creatorId == user.id) {
            _own = true;
          }
          return _own;
        });
        //如果是复制公共资源库，则要把当前项目组过滤掉
        if (this.data.type == _.db.PRO_TYP_COMMON) {
          list = list.filter(function (item) {
            return item.id !== this.data.pgid;
          }, this);
        }
        this.data.xlist = list.map(function (item) {
          return {
            id: item.id,
            name: item.name
          };
        }, this);
        this.data.targetpgid = this.data.xlist[0].id;
        this.$update();
      }
      if (this.data.method == 'transfer') {
        var pgitem = this.__pgcache._$getItemInCache(this.data.pgid);
        var list = [].concat(pgitem.owner, pgitem.admins);
        this.data.xlist = list.map(function (item) {
          return {
            id: item.id,
            name: item.realname
          };
        });
        this.data.xlist = this.data.xlist.filter(function (item) {
          return item.id !== user.id;
        });
        if (!this.data.xlist.length) {
          this.data.okButton = false;
        }
        this.$update();
      }
    },
    toggle: function () {
      if (e._$hasClassName(this.__previewWrap, 'f-dn')) {
        this.__previewState = true;
        e._$delClassName(this.__previewWrap, 'f-dn');
        e._$delClassName(this.__toggleIcon, 'u-icon-fold-up-normal');
        this.__toggleIcon.title = '收起预览';
        //同步滚动条位置和内容
        this.updatePreview();
        this.previewScroll();
      } else {
        this.__previewState = false;
        e._$addClassName(this.__previewWrap, 'f-dn');
        e._$addClassName(this.__toggleIcon, 'u-icon-fold-up-normal');
        this.__toggleIcon.title = '展开预览';
      }
    },
    ok: function () {
      var option = {
        key: this.__cache._$getListKey(this.data.pgid),
        data: {
          progroupId: this.data.pgid,
          name: this.data.inputName.trim(),
          description: this.data.description.trim(),
          lob: this.__lob || ''
        },
        ext: {
          progroupId: this.data.pgid
        }
      };
      if (this.data.method == 'modify') {
        this.checkVal();
        option.data.description = this.__editor.getValue();
        var sendData = {
          id: this.data.id,
          data: option.data,
          ext: {
            progroupId: this.data.pgid
          }
        };
        if (this.data.inputName.trim() == '') {
          return;
        }
        this.__cache._$updateItem(sendData);
      } else if (this.data.method == 'create') {
        this.checkVal();
        if (this.data.inputName.trim() == '') {
          return;
        }
        this.__cache._$addItem(option);
      } else if (this.data.method == 'copy') {
        this.checkVal();
        if (this.data.inputName.trim() == '') {
          return;
        }

        option.key = this.__cache._$getListKey(this.data.targetpgid);
        option.data.progroupId = this.data.targetpgid;
        option.data.projectId = this.data.id;
        option.ext.progroupId = this.data.targetpgid;
        option.ext.xkey = 'project-clone';

        this.__cache._$addItem(option);

        this.data.isCoping = true;
        this.data.okButton = false;
      } else if (this.data.method == 'transfer') {
        if (!this.data.toId) {
          this.data.inputError = true;
          return;
        }
        var sendData = {
          id: this.data.id,
          action: 'tarnsfer',
          data: {
            toId: this.data.toId
          },
          ext: {
            progroupId: this.data.pgid
          }
        };
        this.__cache._$changeCreator(sendData);
      } else {
        if (this.data.inputName.trim() && this.data.name == this.data.inputName.trim()) {//需要修改
          var _options = {
            key: this.__cache._$getListKey(this.data.pgid),
            id: this.data.id,
            ext: {progroupId: this.data.pgid}
          };
          this.__cache._$deleteItem(_options);
        } else {
          this.data.inputError = true;
          this.$update();
        }

      }
    },
    checkVal: function () {
      if (!!this.data.inputName.trim()) {
        this.data.inputError = false;
      } else {
        this.data.inputError = true;
      }
      this.$update();
    },
    selectProgroup: function (option) {
      this.data.targetpgid = option.selected.id;
    },
    transfer: function (options) {
      this.data.toId = options.selected.id;
      this.data.inputError = false;
    },
    /**
     * 更新预览内容
     * @return {Void}
     */
    updatePreview: function () {
      var value = this.__editor.getValue();
      this.__previewNode.innerHTML = this.__markdown.render(value);
    },

    previewScroll: function () {
      var editorTop = this.__editor.getSession().getScrollTop();
      var x = editorTop / this.__scrollBar.scrollHeight;
      this.__previewNode.scrollTop = x * this.__previewNode.scrollHeight;
    },

    destroy: function () {
      if (!!this.__cache) {
        this.__cache._$recycle();
      }
      if (!!this.__pgcache) {
        this.__pgcache._$recycle();
      }
      if (!!this.__usercache) {
        this.__usercache._$recycle();
      }
      this.supr();
    }
  });
  return modal;
});
