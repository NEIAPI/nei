/**
 * 添加/修改测试集
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/common/util',
  'pro/cache/testcollection_cache',
  'text!./modal_collection.html',
  'css!./modal_collection.css'
], function (_e, _v, _u, _modal, _cu, _collectCache, tpl, css) {
  _e._$addStyle(css);

  var Modal = _modal.extend({
    config: function () {
      var titleMap = {
        modify: '修改',
        create: '创建',
        delete: '删除'
      };
      var title = titleMap[this.data.action];
      _cu._$extend(this.data, {
        title: title + '测试集',
        contentTemplate: tpl,
        class: 'm-modal-collection m-modal-collection-' + this.data.action,
        closeButton: true,
        okButton: true,
        cancelButton: false,
        nameError: false,
        nameOrigin: this.data.name,
        descriptionOrigin: this.data.description,
        name: '',
        description: ''
      }, false);
      if (this.data.action === 'delete') {
        this.data.name = '';
      }
      this.supr(this.data);
    },
    init: function () {
      var me = this;
      this._cache = _collectCache._$$CacheTestcollection._$allocate({
        onitemadd: function (options) {
          delete me.ajaxLoading;
          me.destroy();
        },
        onitemupdate: function (options) {
          delete me.ajaxLoading;
          me.destroy();
        },
        onitemdelete: function (options) {
          delete me.ajaxLoading;
          me.destroy();
        },
        onerror: function () {
          delete me.ajaxLoading;
        }
      });
      this.supr(this.data);
    },
    ok: function () {
      if (this.ajaxLoading) {
        return;
      }
      var me = this;
      var hasError = false;
      _u._$forIn(['name'], function (keyName) {
        me.validateEmpty(keyName);
        if (me.data[keyName + 'Error']) {
          hasError = true;
          return true;
        }
      });
      if (!hasError) {
        var data = {};
        var action = this.data.action;
        if (action === 'create' || action === 'modify') {
          _u._$forIn(['name', 'description'], function (keyName) {
            var keyVal = me.data[keyName].trim();
            if (keyVal !== me.data[keyName + 'Origin']) {
              data[keyName] = me.data[keyName].trim();
            }
          });
        }
        if (action === 'create') {
          data.projectId = this.data.pid;
          data.type = this.data.type;
          this.ajaxLoading = true;
          this._cache._$addItem({
            key: this._cache._$getListKey(data.projectId),
            data: data
          });
        } else if (action === 'modify') {
          if (Object.keys(data).length) {
            this.ajaxLoading = true;
            this._cache._$updateItem({
              id: this.data.cid,
              data: data
            });
          } else {
            this.supr();
          }
        } else if (action === 'delete') {
          if (this.data.name.trim() === this.data.nameOrigin) {
            this._cache._$deleteItem({
              key: this._cache._$getListKey(this.data.pid),
              id: this.data.cid
            });
          }
        }
      }
    },
    validateEmpty: function (keyName) {
      this.data[keyName + 'Error'] = !this.data[keyName].trim();
    },
    destroy: function () {
      this._cache._$recycle();
      this.supr();
    }
  });
  return Modal;
});
