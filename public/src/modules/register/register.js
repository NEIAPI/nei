NEJ.define([
  'base/klass',
  'base/element',
  'base/event',
  'base/util',
  'util/ajax/xdr',
  '/src/modules/component/base.js',
  '/src/modules/extend/util.js',
  'text!./register.html'
], function (k, e, v, u, j, b, _, tpl, p, pro) {
  var Base = b.Component;
  var Register = Base.extend({
    name: 'register',
    template: tpl,
    config: function (data) {
      var _data = {
        username: [
          {reg: /^[a-zA-Z]+/, label: '必须以字母开头', pass: false},
          {reg: /\w{6,16}/, label: '长度在6-16位之间', pass: false},
          {reg: /^[\d|a-zA-Z|_]+$/, label: '只能由数字、字母、下划线组成', pass: false}
        ],
        password: [
          {reg: /.{6,16}/, label: '长度在6-16位之间', pass: false},
          {reg: /^(?![a-zA-Z]+$)(?!\d+$)(?![^\da-zA-Z]+$).{2,}$/, label: '至少包含数字、字母、符号中的两种', pass: false}
        ],
        confirmPassword: [
          {
            reg: function (value, globalData) {
              return value && (value === globalData.password);
            }, label: '两次密码必须一致', pass: false
          }
        ],
        realname: [
          {reg: /(.)+/, label: '不能为空', pass: false}
        ],
        company: [
          {reg: /(.){1,50}/, label: '不能为空', pass: false}
        ],
        roleSource: {
          selectSource: [
            {id: 2, name: '项目经理'},
            {id: 3, name: '前端工程师'},
            {id: 4, name: '后端工程师'},
            {id: 5, name: 'iOS工程师'},
            {id: 6, name: 'Android工程师'},
            {id: 7, name: '测试工程师'},
            {id: 8, name: '运维工程师'},
            {id: 1, name: '其他角色'}
          ]
        }
      };
      this.data.unverify = false;
      u._$merge(data, _data);
    },
    sha256: function (str) {
      var str = CryptoJS.SHA256(str);
      return str.toString(CryptoJS.enc.Hex);
    },
    submit: function ($event) {
      var result = this.$refs.validation.validate();
      console.log(result);
      var that = this;

      if (!result.pass) return;

      this.data['disabled'] = true;
      result.data.password = this.sha256(result.data.password);
      result.data.confirmPassword = this.sha256(result.data.confirmPassword);
      var _opt = {
        method: 'post',
        data: result.data,
        type: 'json',
        onload: function (option) {
          if (_._$checkStatusCode(option)) {
            that.data.success = true;
            that.$update();
          } else {
            that.data['disabled'] = false;
            that.data.fail = true;
            that.$update();
          }
        },
        onerror: function (option) {
          that.data['disabled'] = false;
          that.$update();
        }
      };
      j._$request('/api/register', _opt);
    }
  });
  return Register;
});
