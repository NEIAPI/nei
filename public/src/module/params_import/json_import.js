NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/notify/notify',
  'pro/common/util',
  'text!./json_import.html',
  'text!./json_import.css'
], function (e, v, u, Modal, Notify, _, tpl, css) {
  var modal = Modal.extend({
    config: function () {
      var that = this;
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-modal-import',
        'title': '导入JSON',
        'closeButton': true,
        'okButton': true,
        'size': 'large',
        'cancelButton': true
      });
      this.supr(this.data);
    },
    init: function () {
      this.supr(this.data);
      e._$addStyle(css);
      this.formatBtn = this.$refs.jsonFormatBtn;
      this.editor = ace.edit('editor_ace');
      this.editor.setTheme('ace/theme/eclipse');
      this.editor.getSession().setMode('ace/mode/json');
      this.editor.setOptions({
        maxLines: 30,
        minLines: 10,
        tabSize: 2
      });
      this.editor.setAutoScrollEditorIntoView(true);
      var fileInput = this.$refs.upload;
      v._$addEvent(this.formatBtn, 'click', this.jsonFormat._$bind(this));
      v._$addEvent(fileInput, 'change', this.onSelectFile._$bind(this));
    },
    jsonFormat: function () {
      var _editValue = this.editor.getValue();
      if (_editValue.length > 0) {
        var _json = _._$getValidJSON(this.editor.getValue());
        if (_json) {
          this.editor.setValue(JSON.stringify(_json, null, 4));
        } else {
          Notify.error('文件内容不是有效的JSON，请重新选择');
        }
      }
    },
    ok: function () {
      var value = _._$getValidJSON(this.editor.getValue());
      if (value) {
        this.$emit('ok', value);
        this.destroy();
      } else {
        Notify.error('内容不是有效的JSON，请确认');
      }
    },
    onSelectFile: function (event) {
      var file = event.target.files[0];
      var reader = new FileReader();
      reader.onload = function (ev) {
        var text = ev.target.result;
        var json = _._$getValidJSON(text);
        if (json) {
          this.editor.setValue(JSON.stringify(json, null, 2));
        } else {
          this.editor.setValue(text);
          Notify.error('文件内容不是有效的JSON，请重新选择!');
        }
      }._$bind(this);
      if (file && file.size > 0) {
        reader.readAsText(file, 'UTF-8');
      }
    },
    ondragenter: function (event) {
      this.data.isDraging = true;
    },
    ondragleave: function (event) {
      this.data.isDraging = false;
    },
    ondrop: function (event) {
      event.preventDefault();
      this.data.isDraging = false;
      var files = event.event.dataTransfer.files;
      var file = files[0];
      var reader = new FileReader();
      reader.onload = function (ev) {
        var text = ev.target.result;
        var json = _._$getValidJSON(text);
        if (json) {
          this.editor.setValue(JSON.stringify(json, null, 2));
        } else {
          this.editor.setValue(text);
          Notify.error('文件内容不是有效的JSON，请重新选择!');
        }
      }._$bind(this);
      if (file && file.size > 0) {
        reader.readAsText(file, 'UTF-8');
      }
    },
    ondragover: function (event) {
      event.preventDefault();
    }

  });
  return modal;
});
