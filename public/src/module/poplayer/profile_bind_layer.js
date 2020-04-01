NEJ.define([
  'base/element',
  'pro/modal/modal',
  'pro/common/util',
  'pro/cache/user_cache',
  'json!{3rd}/fb-modules/config/db.json',
  'text!./profile_bind_layer.html',
  'css!./profile_bind_layer.css'
], function (_e, _Modal, _, _usrCache, _db, _html, _css) {
  _e._$addStyle(_css);
  var PBindLayer = _Modal.extend({
    config: function () {
      _._$extend(this.data, {
        'contentTemplate': _html,
        'title': (this.data.type === 'bind' ? '绑定' : '解绑') + (this.data.key === 'email' ? '邮箱' : '手机'),
        'closeButton': true,
        'okButton': false,
        'cancelButton': false,
        timer: 60,
        valueError: false,
        codeError: false,
        code: '',
        message: '验证码将发送到您' + this.data.value + '的' + (this.data.key == 'email' ? '邮箱里' : '手机上'),
        placeholder: '请输入' + (this.data.key === 'email' ? '邮箱地址' : '手机号码'),
        sendDisabled: false
      });
      this.supr(this.data);
      this.$on('close', function () {
        this.cancel();
      });
    },
    sendcode: function () {//发送验证码
      var data = {
        ext: {
          onerror: this.onerror.bind(this, 'value')
        }
      };
      if (this.data.type == 'bind') {//发送绑定验证码
        if (this.data.key == 'email') {
          data.email = this.data.value;
        } else {
          data.phone = this.data.value;
        }
        this.data.cache._$bind(data);
      } else {//发送解绑验证码
        if (this.data.key == 'email') {
          data = {isEmail: _db.CMN_BOL_YES};
        } else {
          data = {isPhone: _db.CMN_BOL_YES};
        }
        this.data.cache._$unbind(data);
      }
      this.data.sendDisabled = true;
      this.$refs.btn.disabled = true;
      this.data.interval = window.setInterval(this.checkDisable.bind(this), 1000);
    },

    submit: function () { //检查验证码正确性
      this.checkValidate();
      if (!this.data.codeError && !this.data.valueError) {
        this.data.cache._$verify({
          code: this.data.code,
          ext: {
            onerror: this.onerror.bind(this, 'code')
          }
        });
      }
    },
    checkDisable: function () {
      if (this.data.timer == 0) {
        this.data.sendDisabled = false;
        window.clearInterval(this.data.interval);
        this.data.timer = 60;
        this.$refs.btn.disabled = false;
        this.$refs.btn.value = '发送验证码';
      } else {
        this.$refs.btn.value = --this.data.timer + 's后重新发送';
      }
    },
    cancel: function () {
      if (this.data.interval) {
        window.clearInterval(this.data.interval);
      }
      this.supr();
    },
    onerror: function (type, errType) {
      if (type === 'code') {
        this.data.codeError = true;
      } else {
        if (errType == 1) {
          this.data.valueError = true;
        }
        this.data.timer = 0;
        this.checkDisable();
      }
      this.$update();
    },
    checkValidate: function () {
      if (this.data.key == 'email') {
        this.data.valueError = !/^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/.test(this.data.value);
      } else {
        this.data.valueError = !/^1\d{10}$/.test(this.data.value);
      }
      if (this.data.code == '') {
        this.data.codeError = true;
      }
    },
    removeError: function (type) {
      if (type === 'code') {
        this.data.codeError = false;
      } else {
        this.data.valueError = false;
      }
    }
  });
  return PBindLayer;
});
