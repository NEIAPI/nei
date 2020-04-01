/*
 * -------------------------------------------------
 * 修改数据模型模块
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/common/util',
  'pro/param_editor/param_editor',
  'text!./modify_datatype.html',
  'css!./modify_datatype.css'
], function (e, v, u, Modal, _, ParamEditor, tpl, css, p) {
  e._$addStyle(css);
  var m = Modal.extend({
    config: function () {
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'inline-modify',
        'title': ' ',
        'closeButton': true,
        'okButton': false,
        'cancelButton': false
      });
      this.supr();
    },
    init: function () {
      this.pamEditor = ParamEditor._$$ParamEditor._$allocate({
        parent: this.$refs.editor,
        parentId: this.data.id,
        parentType: this.data.parentType,
        datatypeId: this.data.datatypeId,
        pid: this.data.pid,
        pattern: this.data.pattern,
        errorMsg: this.data.errorMsg,
        isModifyDatatype: true,
        showRequired: this.data.showRequired,
        param: this.data.param,
        preview: true,
        onChange: this.data.onChange,
        callback: this.data.callback,
        self: this.data.self
      });
      this.supr();
    },
    destroy: function () {
      this.pamEditor && this.pamEditor._$recycle();
      this.supr();
    }
  });
  // 这里和param editor有循环依赖，不能直接返回modal，要挂在p上
  p.modal = m;
  return p;
});
