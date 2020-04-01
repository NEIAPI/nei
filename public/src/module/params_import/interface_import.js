NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'util/ajax/rest',
  'pro/modal/modal',
  'pro/notify/notify',
  'pro/common/util',
  'pro/select2/select2',
  'text!./interface_import.html',
  'text!./interface_import.css'
], function (e, v, u, j, Modal, Notify, _, Select2, tpl, css) {
  var modal = Modal.extend({
    config: function () {
      var that = this;
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-modal-import',
        'title': '从接口导入类型',
        'closeButton': true,
        'okButton': true,
        'size': 'large',
        'cancelButton': true,
        'editorHide': true
      });
      this.data.method = '';
      this.data.url = '';
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
      e._$addStyle(css);
      this.editor1 = ace.edit('editor1');
      this.editor2 = ace.edit('editor2');

      this.editor1.setTheme('ace/theme/tomorrow');
      this.editor1.setAutoScrollEditorIntoView(true);
      this.editor1.setOption('minLines', 10);
      this.editor1.setOption('maxLines', 10);
      this.editor1.setOption('tabSize', 2);
      this.editor2.setTheme('ace/theme/tomorrow');
      this.editor2.setAutoScrollEditorIntoView(true);
      this.editor2.setOption('minLines', 10);
      this.editor2.setOption('maxLines', 10);
      this.editor2.setOption('tabSize', 2);

      this.editor3 = ace.edit('editor_ace');
      this.editor3.setTheme('ace/theme/tomorrow');
      this.editor3.setAutoScrollEditorIntoView(true);
      this.editor3.setOption('maxLines', 30);
      this.editor3.setOption('minLines', 10);
      this.editor3.setOption('tabSize', 2);

      this.interfaceArea = this.$refs.interfaceArea;
      this.jsonArea = this.$refs.jsonArea;
      this.formatBtn = this.$refs.jsonFormatBtn;
      this.backBtn = this.$refs.backBtn;

      v._$addEvent(this.formatBtn, 'click', this.jsonFormat._$bind(this));
      v._$addEvent(this.backBtn, 'click', this.back._$bind(this));

      this.checkres();
    },
    back: function () {
      e._$delClassName(this.interfaceArea, 'fn');
      e._$addClassName(this.jsonArea, 'fn');
    },
    jsonFormat: function () {
      var _editValue = this.editor3.getValue();
      if (_editValue.length > 0) {
        var _json = _._$getValidJSON(this.editor3.getValue());
        if (_json) {
          this.editor3.setValue(JSON.stringify(_json, null, 4));
        } else {
          Notify.error('文件内容不是有效的JSON，请重新选择!');
        }
      }
    },
    ok: function () {
      //如果接口界面被隐藏，点击确定按钮，直接发送数据给接口，如果是json编辑界面被隐藏，点击确定，却换到json界面
      if (e._$hasClassName(this.interfaceArea, 'fn')) {
        //收集数据并发送到接口
        var editorData = this.editor3.getValue();
        if (editorData.length > 0) {
          this.$emit('ok', JSON.parse(editorData));
          this.destroy();
        }
        return;
      }
      if (this.data.url == '') {
        this.data.isError = true;
        return;
      }

      var v1 = _._$getValidJSON(this.editor1.getValue());
      var v2 = _._$getValidJSON(this.editor2.getValue());
      var _head = v1 || '';
      var _params = v2 || '';
      var that = this;
      if (that.__xhrProxyToolIsInstalled) {
        that.__sendId = Date.now();
        document.dispatchEvent(new CustomEvent('sendto-xhrpt-ext', {
          detail: {
            url: that.data.url,
            method: that.data.method,
            data: _params || {},
            headers: _head || {
              'Content-Type': 'application/json'
            },
            sendId: that.__sendId
          }
        }));
      } else {
        var _opt = {
          data: _params,
          method: that.data.method,
          onload: function (data) {

            var data = JSON.stringify(data);
            var _json = _._$getValidJSON(data);
            if (_json) {
              this.editor3.setValue(JSON.stringify(_json, null, 4));
            } else {
              Notify.error('文件内容不是有效的JSON，请重新选择!');
            }

            e._$addClassName(this.interfaceArea, 'fn');
            e._$delClassName(this.jsonArea, 'fn');
            // this.$emit("ok", data);

            // this.destroy();
          }._$bind(this),
          onerror: function (data) {
            Notify.error('获取数据失败');
          }
        };
        j._$request(this.data.url, _opt);
      }
    },
    checkres: function () {
      if (navigator.userAgent.toLowerCase().indexOf('chrome') < 0) return;
      var sendId = Date.now();
      var that = this;
      document.addEventListener('check-xhrpt-ext-res', function (_evt) {
        if (!_evt.detail || !_evt.detail.reqData || _evt.detail.reqData.sendId !== sendId) return;
        that.__xhrProxyToolIsInstalled = true;
        document.addEventListener('sendto-xhrpt-ext-res', function (_evt) {
          if (!_evt.detail || !_evt.detail.reqData || _evt.detail.reqData.sendId !== that.__sendId) return;
          //that.__displayAPIData(_evt.detail.resData);
          var res = typeof _evt.detail.resData == 'string' ? JSON.parse(_evt.detail.resData || 'null') : _evt.detail.resData;
          //document.removeEventListener(arguments.callee.caller);
          var data = JSON.stringify(res);
          var _json = _._$getValidJSON(data);
          if (_json) {
            that.editor3.setValue(JSON.stringify(_json, null, 4));
          } else {
            Notify.error('文件内容不是有效的JSON，请重新选择!');
          }

          e._$addClassName(that.interfaceArea, 'fn');
          e._$delClassName(that.jsonArea, 'fn');
          // that.$emit("ok", res);
          // that.destroy();
        }, false);
      }, false);
      document.dispatchEvent(new CustomEvent('check-xhrpt-ext', {
        detail: {
          sendId: sendId
        }
      }));
    },
    _onChange: function (item) {
      this.data.method = item.id;
    }

  });
  return modal;
});
