/**
 * hosts编辑弹窗
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/host_cache',
  'pro/cache/pro_cache',
  'pro/modal/modal',
  'pro/param_editor/param_editor',
  'pro/common/constants',
  'text!./modal_hosts.html',
  'css!./modal_hosts.css'
], function (_v, _u, _e, _cu, _hostCache, _projCache, _modal, paramEditor, constants, tpl, css) {
  _e._$addStyle(css);

  Regular.filter('format', function (value, format) {
    format = format || 'yyyy-MM-dd HH:mm:ss';
    value = new Date(value);
    return _u._$format(value, format);
  });

  var Modal = _modal.extend({
    config: function () {
      _cu._$extend(this.data, {
        contentTemplate: tpl,
        class: 'm-modal-hosts',
        title: '环境管理',
        size: 'tile',
        closeButton: true,
        okButton: false,
        cancelButton: false,
        allChecked: false,
        hasChecked: false,
        checkStatus: {},
        checkExpand: {}
      }, false);
      this._projCache = _projCache._$$CachePro._$allocate({
        onitemupdate: function (options) {
          this.data.hostId = options.data.hostId;
          this.$update();
        }.bind(this)
      });
      var proj = this._projCache._$getItemInCache(this.data.pid);
      this.data.hostId = proj.hostId || 0;

      this.supr(this.data);
    },
    init: function () {
      var me = this;
      this._hostCache = _hostCache._$$CacheHost._$allocate({
        onitemadd: function (options) {
          delete me.data.addingHost;
          delete me._isAdding;
          me.checkSelectStatus();
          me.$update();
          // 添加时增加请求头的editor
          paramEditor._$$ParamEditor._$allocate({
            parent: me.$refs[options.data.id],
            parentId: options.data.id,
            isHeader: true,
            parentType: constants.PARAM_TYP_TEST_HOST_HEADER,
            format: 0,
            pid: me.data.pid,
            preview: true
          });
        },
        onitemdelete: function (options) {
          delete me.data.checkStatus[options.data.id];
          me.checkSelectStatus();
          me.$update();
        },
        onitemsdelete: function (options) {
          options.data.forEach(function (host) {
            delete me.data.checkStatus[host.id];
          });
          me.checkSelectStatus();
          me.$update();
        }
      });
      this.data.hosts.forEach(function (item) {
        paramEditor._$$ParamEditor._$allocate({
          parent: this.$refs[item.id],
          parentId: item.id,
          isHeader: true,
          parentType: constants.PARAM_TYP_TEST_HOST_HEADER,
          format: 0,
          pid: this.data.pid,
          preview: true
        });
      }, this);
      this.supr();
    },
    switchExpandEditor: function (hostId) {
      this.data.checkExpand[hostId] = !this.data.checkExpand[hostId];
    },
    quickSelect: function (type) {
      var me = this;
      if (type === 'all') {
        this.data.hosts.forEach(function (host) {
          me.data.checkStatus[host.id] = !me.data.allChecked;
        });
      } else if (type === 'clear') {
        this.data.checkStatus = {};
      } else if (type === 'reverse') {
        if (this.data.allChecked) {
          this.data.checkStatus = {};
        } else {
          for (var hostId in this.data.checkStatus) {
            this.data.checkStatus[hostId] = !this.data.checkStatus[hostId];
          }
        }
      }
      this.checkSelectStatus();
    },
    checkSelectStatus: function () {
      var hostLen = this.data.hosts.length;
      var checkNum = 0;
      for (var hostId in this.data.checkStatus) {
        if (this.data.checkStatus[hostId]) {
          checkNum++;
        }
      }
      if (checkNum === 0) {
        this.data.allChecked = false;
      } else {
        this.data.allChecked = checkNum === hostLen;
      }
      this.data.hasChecked = checkNum > 0;
      this.data.checkNum = checkNum;
    },
    selectItem: function (id) {
      this.data.checkStatus[id] = !this.data.checkStatus[id];
      this.checkSelectStatus();
    },
    ok: function () {

    },
    active: function (evt) {
      var elem = _v._$getElement(event, 'd:active');
      if (elem) {
        var actionData;
        try {
          actionData = _u._$query2object(_e._$dataset(elem, 'active'));
        } catch (err) {
          console.error(err);
        }
        if (actionData) {
          switch (actionData.actionType) {
            case 'input':
              this.activeInput(elem, actionData);
              break;
            default:
              break;
          }
        }
      }
    },
    /**
     * 激活输入框
     *
     * @param  {Element} elem       输入框dom节点
     * @param  {Object} actionData 相关数据
     * @return {void}
     */
    activeInput: function (elem, actionData) {
      if (elem.readOnly) {
        elem.readOnly = false;
        _e._$addClassName(elem, 'u-input-editting');
        var blurHandler = this.updateHandler.bind(this, actionData);
        elem.blurHandler = blurHandler;
        elem.oldValue = elem.value;
        elem.select();
        _v._$addEvent(elem, 'blur', blurHandler);
      }
    },
    /**
     * 更新Host事件处理器
     *
     * @param  {Object} actionData 输入框数据
     * @param  {Event} evt        事件
     * @return {void}
     */
    updateHandler: function (actionData, evt) {
      var elem = evt.target;
      elem.readOnly = true;
      _e._$delClassName(elem, 'u-input-editting');
      var newValue = elem.value.trim();
      if (actionData.required === 'true' && !newValue) {
        elem.value = elem.oldValue;
      } else if (newValue !== elem.oldValue) {
        var data = {};
        data[actionData.name] = newValue;
        this.updateHost(actionData.id, data);
      }
      _v._$delEvent(elem, 'blur', elem.blurHandler);
      delete elem.oldValue;
      delete elem.blurHandler;
    },
    enter: function (evt) {
      var elem = _v._$getElement(evt, 'd:enter');
      var action = _e._$dataset(elem, 'enter');
      if (action === 'add') {
        this.addHost();
      } else if (action === 'update') {
        elem.blur();
      }
    },
    add: function () {
      if (!this.data.addingHost) {
        this.data.addingHost = {};
      }
    },
    copy: function (hostId) {
      var host = this._hostCache._$getItemInCache(hostId);
      this._hostCache._$addItem({
        data: {
          name: host.name,
          value: host.value,
          header: host.header,
          projectId: this.data.pid
        },
        key: this._hostCache._$getListKey(this.data.pid)
      });
    },
    remove: function (hostId) {
      if (hostId === 'add') {
        delete this.data.addingHost;
      } else {
        this._hostCache._$deleteItem({
          id: hostId,
          key: this._hostCache._$getListKey(this.data.pid)
        });
      }
    },
    setDefault: function (hostId) {
      this._projCache._$updateItem({
        id: this.data.pid,
        data: {
          hostId: hostId
        }
      });
    },
    batRemove: function () {
      var ids = [];
      for (var hostId in this.data.checkStatus) {
        if (this.data.checkStatus[hostId]) {
          ids.push(hostId);
        }
      }
      this._hostCache._$deleteItems({
        key: this._hostCache._$getListKey(this.data.pid),
        data: {
          ids: ids.join(',')
        }
      });
    },
    updateHost: function (hostId, data) {
      this._hostCache._$updateItem({
        id: hostId,
        data: data
      });
    },
    addHost: function () {
      var hostData = this.data.addingHost;
      if (hostData && !this._isAdding) {
        var hasError = false;
        var formData = {};
        _u._$forIn(['name', 'value'], function (field) {
          if (!hostData[field]) { // 某个字段为空
            hostData[field + 'Error'] = true;
            hasError = true;
          } else {
            formData[field] = hostData[field];
            hostData[field + 'Error'] = false;
          }
        });

        if (!hasError) {
          formData.projectId = this.data.pid;
          formData.header = '';
          this._isAdding = true;  // 正在发送添加请求
          this._hostCache._$addItem({
            data: formData,
            key: this._hostCache._$getListKey(this.data.pid)
          });
        }
      }
    },
    destroy: function () {
      this._hostCache._$recycle();
      this._projCache._$recycle();
      delete this._hostCache;
      delete this._projCache;
      this.supr();
    }
  });

  return Modal;
});
