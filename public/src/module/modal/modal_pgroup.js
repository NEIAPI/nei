/*
 *  添加和修改项目组件-------------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/common/util',
  'pro/cache/pg_cache',
  'pro/select2/select2',
  'text!./modal_pgroup.html',
  'css!./modal_pgroup.css'
], function (e, v, u, Modal, _, cache, select2, tpl, css) {
  e._$addStyle(css);
  var modal = Modal.extend({
    config: function () {
      var _title = {
        'modify': '修改',
        'create': '创建',
        'delete': '删除',
        'transfer': '移交'
      };
      var _t = _title[this.data.method];
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-pg-' + this.data.method,
        'title': _t + '项目组',
        'closeButton': true,
        'okButton': _t,
        'cancelButton': false,
        inputError: false,
        inputName: '',
        description: '',
        xlist: []
      });
      if (this.data.method === 'modify') {
        this._oriName = this.data.inputName;
        this._oriDescription = this.data.description;
      } else if (this.data.method === 'transfer') {
        this.data.noScroll = true;
      }
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
      var that = this;
      this.__cache = cache._$$CacheProGroup._$allocate({
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
          dispatcher._$redirect('/progroup/home/management/');
        }
      });
      if (this.data.method == 'transfer') {
        var pgitem = this.__cache._$getItemInCache(this.data.id);
        var list = [].concat(pgitem.admins, pgitem.developers, pgitem.testers, pgitem.observers);
        this.data.xlist = list.map(function (item) {
          return {
            id: item.id,
            name: item.realname
          };
        });
        if (!this.data.xlist.length) {
          this.data.okButton = false;
        }
        this.$update();
      }
    },
    ok: function () {
      var option = {
        data: {
          name: this.data.inputName.trim(),
          description: this.data.description.trim()
        }
      };

      if (this.data.method == 'modify') {
        this.checkVal();
        if (!this.data.inputError) {
          var isModified = false;
          ['name', 'description'].forEach(function (key) {
            var oriKey = '_ori' + key.charAt(0).toUpperCase() + key.substr(1);
            if (option.data[key] === this[oriKey]) {
              delete option.data[key];
            } else {
              isModified = true;
            }
          }, this);
          if (isModified) {
            var sendData = {
              id: this.data.id,
              data: option.data
            };
            this.__cache._$updateItem(sendData);
          } else {
            this.destroy();
          }
        }
      } else if (this.data.method == 'create') {
        this.checkVal();
        if (this.data.inputName.trim() == '') return;
        this.__cache._$addItem(option);
      } else if (this.data.method == 'transfer') {
        if (!this.data.toId) {
          this.data.inputError = true;
          return;
        }
        var sendData = {
          id: this.data.id,
          data: {
            toId: this.data.toId
          }
        };
        this.__cache._$changeCreator(sendData);
      } else {
        if (this.data.inputName.trim() && this.data.name == this.data.inputName.trim()) {//需要修改
          var _options = {
            id: this.data.id
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
    transfer: function (options) {
      this.data.toId = options.selected.id;
      this.data.inputError = false;
    },
    destroy: function () {
      if (!!this.__cache) {
        this.__cache._$recycle();
      }
      this.supr();
    }
  });
  return modal;
});
