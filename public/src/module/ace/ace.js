/*
 * 初始化一个ace编辑器
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/util'
], function (rb, u) {
  // 默认选项
  var defaultOptions = {
    // 自定义类名
    className: '',
    // 可设置默认值
    defaultValue: '',
    // 为空时展示的文字
    empty: '',
    // 需要高亮行的关键字，1~2个，以空格隔开
    highlight: [],
    // 显示行数侧栏
    showGutter: false,
    // 高亮选中行
    highlightActiveLine: false,
    // 高亮行使用的类名
    highlightClazz: 'marker-err',
    // 是否只读
    readOnly: false,
    // 最大行数
    maxLines: 20,
    // 缩进
    tabSize: 2,
    // 当前编辑器中的内容
    value: ''
  };
  // 支持的事件：input,blur,focus

  var AceEditor = rb.extend({
    name: 'aceEditor',

    template: '{#if !value && !!empty}{empty}{/if}<div ref="con" r-hide={!value&&!!empty} class={className} on-blur={this._emitChange()}></div>',

    config: function () {
      this.data = u._$merge({}, defaultOptions, this.data);
    },

    init: function () {
      this.supr();
      // 初始化代码编辑器
      this.editor = ace.edit(this.$refs.con);
      this.editor.setTheme('ace/theme/eclipse');
      this.editor.getSession().setMode('ace/mode/json');
      this.editor.renderer.setShowGutter(this.data.showGutter);
      this.editor.setHighlightActiveLine(this.data.highlightActiveLine);
      this.editor.$blockScrolling = Infinity;
      this.editor.setOption('maxLines', this.data.maxLines);
      this.editor.setOption('showPrintMargin', false);
      this.editor.setOption('tabSize', this.data.tabSize);
      this.editor.setReadOnly(this.data.readOnly);
      // 设置默认值
      this.data.value = this.data.defaultValue;
      this.$show(this.data.defaultValue);
      if (this.data.readOnly) {
        this.$watch('defaultValue', function (newValue, oldValue) {
          oldValue = oldValue || '';
          if (newValue !== oldValue) {
            this.$show(newValue);
          }
        }.bind(this));
      }
      this.editor.on('change', function () {
        this.data.value = this.editor.getValue();
        // 模拟input事件
        this.$emit('input', {
          data: this.data.value
        });
      }.bind(this));
      this.editor.on('blur', function () {
        // 触发blur事件
        this.$emit('blur', {
          data: this.data.value
        });
      }.bind(this));
      this.editor.on('focus', function () {
        // 触发focus事件
        this.$emit('focus', {
          data: this.data.value
        });
        if (!this.data.readOnly) {
          this._removeHighlight();
        }
      }.bind(this));
      // 处理高亮
      this.$watch('highlight', function (highlight) {
        this.$highlight(highlight);
      }.bind(this));
    },

    _highlight: function (errstr, key) {
      var Search = ace.require('ace/search').Search;
      var search = new Search();
      var editSession = ace.createEditSession(this.editor.getValue());
      var keylist, errslist, row;
      search.set({needle: '' + errstr});
      errslist = search.findAll(editSession);
      if (key) {
        search.set({needle: new RegExp('\\"' + key + '\\"\\s*\\:\\s*'), regExp: true});
        keylist = search.findAll(editSession);
      }
      if (errslist.length > 0 && keylist && keylist.length > 0) {
        errslist.forEach(function (err) {
          keylist.forEach(function (key) {
            if (key.start.row === err.start.row) {
              this.editor.session.addMarker(err, this.data.highlightClazz, 'fullLine');
              row = 1 + err.start.row;
            }
          }.bind(this));
        }.bind(this));
      } else if (errslist.length === 1 || keylist && keylist.length === 1) {
        this.editor.session.addMarker(errslist[0] || keylist[0], this.data.highlightClazz, 'fullLine');
        row = 1 + (errslist[0] ? errslist[0].start.row : keylist[0].start.row);
      }
      return row;
    },

    _removeHighlight: function () {
      var markers = this.editor.session.getMarkers(false);
      for (var key in markers) {
        if (markers[key].clazz === this.data.highlightClazz) {
          this.editor.session.removeMarker(markers[key].id);
        }
      }
    },

    $highlight: function (highlight) {
      if (highlight && highlight.length > 0) {
        highlight.forEach(function (item) {
          item.row = this._highlight(item.data, item.keys && item.keys.slice(-1)[0]);
        }.bind(this));
      }
      return highlight;
    },

    $show: function (value, showEmpty) {
      this.data.value = value;
      if (!value && showEmpty) {
        this.$update();
        this.editor.setValue(value, -1);
      } else if (value) {
        this.$update();
        if (typeof value !== 'string') {
          value = JSON.stringify(this.data.defaultValue, null, '\t');
        }
        this.editor.setValue(value, -1);
      }
    },

    destroy: function () {
      this.supr();
    }
  });
  return AceEditor;
});
