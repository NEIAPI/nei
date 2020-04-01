/*
 * 创建匿名类型组件--------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/common/util',
  'pro/cache/datatype_cache',
  'pro/cache/parameter_cache',
  'pro/params_editor/params_haxi',
  'text!./create_datatype.html',
  'css!./create_datatype.css'
], function (e, v, u, Modal, _, cache, parameterCache, HXEditor, tpl, css) {
  e._$addStyle(css);
  var modal = Modal.extend({
    config: function () {
      var _title = '';
      if (this.data && this.data.action == 'modify') {
        _title = '修改数据模型';
        this.data.originalData = _._$clone(this.data.params.slice(0));
      } else {
        _title = '创建数据模型';
      }
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-modal-create',
        'title': _title,
        'closeButton': true,
        'okButton': true,
        'cancelButton': true,
        format: 0 //0 哈希
      });
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
      this.__cache = cache._$$CacheDatatype._$allocate({
        onitemadd: function (option) {
          this.$emit('ok', option.data);
          this.destroy();
        }._$bind(this)
      });
      this.initEditor();
    },
    initEditor: function () {
      var node = this.$refs.editor;
      this.editor = new HXEditor({
        data: {
          format: this.data.format,
          params: this.data.params,
          hasCreate: false,
          noArray: this.data.noArray || true,
          noObject: this.data.noObject || true,
          pid: this.data.pid,
          btns: ['add', 'datatype2', 'json', 'interface', 'javabean']
        }
      }).$inject(node);
    },
    ok: function () {
      if (this.data.action == 'modify') {
        this.__paramcache = parameterCache._$$CacheParameter._$allocate({});
        this.__paramcache._$updateAnonymousDatatype({
          key: 'anonymous-datatype-modify',
          data: {
            datatypeId: this.data.datatypeId,
            projectId: this.data.pid,
            type: 2,
            params: this.formatParams()
          },
          ext: {
            uuid: this.data.uuid
          }
        });
        this.destroy();
      } else {
        //type:2 匿名数据模型
        this.__cache._$addItem({
          key: this.__cache._$getListKey(this.data.pid),
          data: {
            projectId: this.data.pid,
            type: 2,
            params: this.removeEmpty()
          }
        });
      }
    },
    removeEmpty: function () {
      var tml = this.editor.data.params.slice(0);
      var verifyName = this.editor.data.verifyName;
      u._$reverseEach(this.editor.data.params, function (item, index) {
        if (item[verifyName] == '') {
          tml.splice(index, 1);
        }
        delete item.error;
        // delete item.typeName;
      });
      return tml;
    },
    formatParams: function () {
      var params = this.removeEmpty();
      var newparams = [];
      var delPool = [];//删除的参数列表
      var addPool = []; //增加的参数列表
      var updatePool = [];//修改的参数列表
      var isSame = function (obj1, obj2) {
        var bl = true;
        for (var key in obj1) {
          if (obj1[key] !== obj2[key]) {
            bl = false;
          }
        }
        return bl;
      };
      this.data.originalData.forEach(function (item1) {
        var isExist = false;
        params.forEach(function (item2) {
          if (item1.id == item2.id) {
            isExist = true;
            if (!isSame(item1, item2)) {
              item2.action = 'update';
              updatePool.push(item2);
            }
          }
        });
        if (!isExist) {
          delPool.push({id: item1.id, action: 'delete'});
        }
      });
      params.forEach(function (item) {
        if (!item.id) {
          item.action = 'add';
          addPool.push(item);
        }
      });
      newparams = newparams.concat(addPool).concat(delPool).concat(updatePool);
      return newparams;
    },
    _onclickBody: function ($event) {
      $event.stopPropagation();
    }
  });
  return modal;

});
