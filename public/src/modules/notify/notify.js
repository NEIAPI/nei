/*
 * 全局提示组件--------------------------------------------------
 */
NEJ.define([
  'index/component/base',
  'base/event',
  'base/util',
  'base/element',
  'text!./notify.css',
  'text!./notify.html'
], function (base, v, u, e, css, tpl) {
  /**
   * 调用方式 Notify.show("提交成功",'success',2000)
   * 调用方式 Notify.show("提交失败",'error',2000)
   * **/

  e._$addStyle(css);
  var Notify = base.Component.extend({
    name: 'notify',
    template: tpl,
    config: function () {
      u._$merge(this.data, {
        messages: [],
        position: 'topcenter',
        duration: 2000,
        single: true
      });
      this.supr();
    },
    init: function () {
      this.supr();
      //证明不是内嵌组件
      if (this.$root === this) {
        this.$inject(document.body);
      }
    },
    /**
     * 显示消息提示
     * @param text 消息内容
     * @param state 消息类型，可选参数：`info`、`success`、`warning`、`error`
     * @param duration 该条消息的停留毫秒数，如果为0，则表示消息常驻不消失。
     */
    show: function (text, state, duration) {
      var message = {
        text: text,
        state: state,
        duration: duration === 0 ? 0 : (duration || this.data.duration)
      };
      var messages = this.data.messages;
      if (this.data.single && messages[0]) {
        clearTimeout(this.interval);
        messages[0] = message;
      } else {
        messages.unshift(message);
      }
      this.$update();
      if (message.duration) {
        this.interval = setTimeout(function () {
          this.close(message);
        }._$bind(this), message.duration);
      }
      this.$emit('show', {
        sender: this,
        message: message
      });
    },
    /**
     * 关闭消息提示
     * @param index
     */
    close: function (message) {
      var index = this.data.messages.indexOf(message);
      if (index < 0) return;
      this.data.messages.splice(index, 1);
      this.$update();
      this.$emit('close', {
        sender: this,
        index: index
      });
    },
    closeAll: function () {
      this.data.messages = [];
      this.$update();
    },
    _onclick: function (state) {
      if (state != 'tip') return;
      this.$emit('click', {
        sender: this
      });
    }

  });

  //原型增加其他方法
  var STATUS = ['success', 'warning', 'info', 'error', 'tip'];
  STATUS.forEach(function (status) {
    Notify.prototype[status] = function (text, duration) {
      this.show(text, status, duration);
    };
  });
  //直接初始化一个实例
  var notify = new Notify();
  Notify.notify = notify;
  var METHODS = ['show', 'close', 'closeAll', 'success', 'warning', 'info', 'error', 'tip'];
  Notify.methods = METHODS;

  METHODS.forEach(function (method) {
    Notify[method] = notify[method]._$bind(notify);
  });
  Notify.destroy = function () {
    Notify.notify.data.messages = [];

    Notify.notify.$update();
  };

  return Notify;
});
