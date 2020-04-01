NEJ.define([
  'base/klass',
  'lib/base/element',
  'lib/base/event',
  'util/ajax/xdr',
  'util/history/history',
  'util/toggle/toggle',
  'index/module',
  'index/validation/validation',
  'index/dropdown/dropdown',
  'index/input2/input2',
  'index/register/register'
], function (k, e, v, j, history, tog, m, validation, Select, input2, Register, p, pro) {

  p._$$Signup = k._$klass();
  pro = p._$$Signup._$extend(m._$$Module);

  pro.__init = function (options) {
    this.__super(options);
    this.__loginForm = e._$get('Login');
    this.__loginSubmit = e._$getByClassName(document.body, 'j-login')[0];
  };

  pro.__reset = function (options) {
    this.__super(options);
    var Book = new BookBlock(document.getElementById('bb-bookblock'), {
      currentIdx: location.pathname === '/register' ? 0 : 1
    });
    this.__register = new Register({}).$inject('#js-register');
    v._$addEvent(document, 'click', function (event) {
      var _type = e._$dataset(event.target, 'active');
      if (_type === 'input') {
        this.__hideNotice();
      } else if (_type === 'button') {
        this.__doLogin();
      }
    }._$bind(this));

    v._$addEvent(e._$get('bb-nav-prev'), 'click', function () {
      window.history.pushState(null, null, '/register');
      Book._action('prev');
    });
    v._$addEvent(e._$get('bb-nav-next'), 'click', function () {
      window.history.pushState(null, null, '/login');
      Book._action('next');
    });
  };

  pro.__sha256 = function (str) {
    var str = CryptoJS.SHA256(str);
    return str.toString(CryptoJS.enc.Hex);
  };

  pro.__doLogin = function () {
    var that = this;
    var _data = {
      username: this.__loginForm.username.value,
      password: this.__sha256(this.__loginForm.password.value)
    };
    var errorHandle = function () {
      e._$delClassName(this.__loginSubmit, 'u-btn-disabled');
      this.__loginSubmit.disabled = false;
    };

    if (_data.username === '' || this.__loginForm.password.value === '') {
      that.__showNotice('用户名或密码不能为空');
      return;
    }
    e._$addClassName(this.__loginSubmit, 'u-btn-disabled');
    this.__loginSubmit.disabled = true;
    var _opt = {
      method: 'post',
      data: _data,
      type: 'json',
      onload: function (option) {
        if (('' + option.code).indexOf('2') >= 0) {
          if (('' + option.code).indexOf('2') === 0) {
            location.href = option.result.url;
          }
        } else {
          this.__showNotice(option.msg);
          errorHandle.call(this);
        }
      }._$bind(this),
      onerror: function (option) {
        that.__showNotice(option.msg);
        errorHandle.call(this);
      }._$bind(this)
    };
    j._$request('/api/login', _opt);
  };

  pro.__showNotice = function (msg) {
    var _eNotice = e._$getByClassName(this.__loginForm, 'notice')[0];
    _eNotice.innerHTML = msg;
    e._$setStyle(_eNotice, 'visibility', 'visible');
  };

  pro.__hideNotice = function () {
    var _eNotice = e._$getByClassName(this.__loginForm, 'notice')[0];
    _eNotice.innerHTML = '';
    e._$setStyle(_eNotice, 'visibility', 'hidden');
  };

  pro.__destroy = function () {
    this.__super();
  };
});
