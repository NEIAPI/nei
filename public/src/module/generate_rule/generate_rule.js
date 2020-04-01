/*
 * 生成规则组件--------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/select2/select2',
  'pro/common/util',
  'pro/cache/constraint_cache',
  'pro/cache/group_cache',
  'text!./generate_rule.html',
  'css!./generate_rule.css'
], function (e, v, u, Modal, s2, _, cache, groupCache, tpl, css) {

  var modal = Modal.extend({
    config: function () {
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-modal-rule',
        'title': '生成规则',
        'tip': '请输入调用规则函数的 JavaScript 代码, 例如: NEI.chinese(15)',
        'closeButton': true,
        'okButton': true,
        'cancelButton': true
      });
      this.supr(this.data);
    },
    init: function () {
      e._$addStyle(css);
      this.supr(this.data);
      var that = this;
      this.__functionCollect = [{'meta': 'object', 'caption': 'NEI', 'value': 'NEI', 'score': 1}, {
        'meta': 'object',
        'caption': 'Mock',
        'value': 'Mock',
        'score': 0.5
      }];
      ['mock', 'Random'].forEach(function (fun) {
        that.__functionCollect.push({
          meta: 'function',
          caption: fun,
          value: 'Mock.' + fun,
          score: fun == 'mock' ? 0.8 : 0.5
        });
      });
      ['Basic', 'Date', 'Image', 'Color',
        'Text', 'Name', 'Web', 'Address', 'Helper',
        'guid', 'id', 'increment'].forEach(function (fun) {
        that.__functionCollect.push({
          meta: 'function',
          caption: fun,
          value: 'Mock.Random.' + fun,
          score: 0.2
        });
      });
      var loadRequireData = [false, false];
      //规则函数cache
      this.__csCache = cache._$$CacheConstraint._$allocate({
        onlistload: function () {
          this.data.list = this.__csCache._$getListInCache(this.__csListCacheKey);
          this.data.list.forEach(function (item) {
            this.__functionCollect.push({
              'meta': 'function',
              'caption': item.name,
              'value': item.type == 1 ? 'NEI.' + item.name : item.name,
              'score': 1
            });
          }.bind(this));
          loadRequireData[0] = true;
          if (loadRequireData[0] && loadRequireData[1]) {
            this.renderEditor();
          }
        }.bind(this),
        onitemadd: function (result) {
          this.data.list.push(result.data);
          this.__functionCollect.push({
            'meta': 'function',
            'caption': result.data.name,
            'value': result.data.type == 1 ? 'NEI.' + result.data.name : result.data.name,
            'score': 1
          });
          this.setCEditorValue();
          this.$update();
        }.bind(this)
      });
      // 业务分组cache
      this.__groupCache = groupCache._$$CacheGroup._$allocate({
        onlistload: function () {
          this.data.groupList = this.__groupCache._$getGroupSelectSource(+this.data.pid);
          loadRequireData[1] = true;
          if (loadRequireData[0] && loadRequireData[1]) {
            this.renderEditor();
          }
        }.bind(this)
      });
      this.__csListCacheKey = this.__csCache._$getListKey(this.data.pid);
      this.__csCache._$getList({
        key: this.__csListCacheKey,
        data: {
          pid: this.data.pid
        }
      });
      this.__groupCache._$getList({
        key: this.__groupCache._$getListKey(this.data.pid),
        data: {
          pid: this.data.pid
        }
      });
    },
    renderEditor: function () {
      var that = this;
      var langTools = ace.require('ace/ext/language_tools');
      this.editor = ace.edit('editor');
      this.editor.setTheme('ace/theme/eclipse');
      this.editor.getSession().setMode('ace/mode/javascript');
      this.editor.setAutoScrollEditorIntoView(true);
      this.editor.setOption('minLines', 3);
      this.editor.setOption('maxLines', 3);
      this.editor.setOption('tabSize', 2);
      this.editor.setValue(this.data.value || '', -1);
      this.editor.$blockScrolling = Infinity;
      this.editor.on('change', function () {
        this.setCEditorValue();
      }.bind(this));
      this.editor.setOptions({
        // enableBasicAutocompletion: true,
        // enableSnippets: true,
        enableLiveAutocompletion: true
      });

      this.cEditor = ace.edit('c-editor');
      this.cEditor.setTheme('ace/theme/eclipse');
      this.cEditor.getSession().setMode('ace/mode/javascript');
      this.cEditor.setAutoScrollEditorIntoView(true);
      this.cEditor.setOption('minLines', 10);
      this.cEditor.setOption('maxLines', 10);
      this.cEditor.setOption('tabSize', 2);
      this.cEditor.$blockScrolling = Infinity;
      this.cEditor.setOptions({
        enableLiveAutocompletion: true
      });

      var tangideCompleter = {
        getCompletions: function (editor, session, pos, prefix, callback) {
          if (prefix.length === 0) {
            return callback(null, []);
          } else {
            return callback(null, that.__functionCollect);
          }
        }
      };
      langTools.addCompleter(tangideCompleter);

      this.setCEditorValue();
      this.$update();
    },
    changeGroup: function (event) {
      this.data.group = event.selected;
    },
    setCEditorValue: function () {
      var callFun = this.editor.getValue();
      var regex = /(((NEI|Mock)\.)?[a-zA-Z][a-zA-Z0-9]*)/g;
      var match = regex.exec(callFun);
      if (match != null) {
        this.data.hasName = true;
        var funName = match[1];
        if (funName.indexOf('.') !== -1) {
          this.cEditor.setReadOnly(true);
          this.data.isSystemType = true;
        } else {
          this.data.isSystemType = false;
          var constraint = this.data.list.find(function (item) {
            return item.name === funName;
          });
          this.data.funName = funName;
          if (constraint) {
            if (constraint.type === 0) {
              this.cEditor.setReadOnly(false);
              this.data.isCreate = false;
              this.cEditor.setValue(constraint.function, -1);
              this.data.constraint = constraint;
            } else {
              this.data.isSystemType = true;
              this.cEditor.setReadOnly(true);
            }
          } else {
            this.cEditor.setReadOnly(false);
            this.data.isCreate = true;
            this.cEditor.setValue('', -1);
          }
        }
      } else {
        this.cEditor.setReadOnly(true);
        this.data.hasName = false;
        this.cEditor.setValue('', -1);
      }
      this.$update();
    },
    createConstraint: function () {
      this.__csCache._$addItem({
        data: {
          description: '',
          tag: '',
          function: this.cEditor.getValue(),
          name: this.data.funName,
          groupId: this.data.group ? this.data.group.id : this.data.groupList[0].id,
          projectId: this.data.pid
        },
        key: this.__csCache._$getListKey(this.data.pid)
      });
    },
    saveConstraint: function () {
      this.__csCache._$updateItem({
        id: this.data.constraint.id,
        data: {
          function: this.cEditor.getValue(),
          groupId: this.data.group ? this.data.group.id : undefined
        },
        name: 'function'
      });
    },
    ok: function () {
      this.$emit('ok', this.editor.getValue());
      this.__functionCollect = [];
      this.destroy();
    },
    cancel: function () {
      this.$emit('cancel');
      this.__functionCollect = [];
      this.destroy();
    }
  });
  return modal;

});
