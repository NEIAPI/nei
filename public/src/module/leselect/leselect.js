/**
 * 实现语言-模板引擎-模板文件后缀级联
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/regular/regular_base',
  'pro/select2/select2',
  'pro/common/util',
  'text!./leselect.html',
  'json!{3rd}/fb-modules/config/db.json'
], function (_v, _u, _e, _re, _select2, _, _html, _db) {
  var langOpt = [{
    id: _db.SPC_LNG_JAVA,
    name: 'Java',
    engines: [{
      id: _db.SPC_ENG_FREEMARK,
      name: 'Freemarker',
      viewExtension: 'ftl'
    }, {
      id: _db.SPC_ENG_VELOCITY,
      name: 'Velocity',
      viewExtension: 'vm'
    }, {
      id: _db.SPC_ENG_NONE,
      name: '无',
      viewExtension: ''
    }]
  }, {
    id: _db.SPC_LNG_NODE,
    name: 'Node.js',
    engines: [{
      id: _db.SPC_ENG_EJS,
      name: 'EJS',
      viewExtension: 'ejs'
    }, {
      id: _db.SPC_ENG_SWIG,
      name: 'Swig',
      viewExtension: 'html'
    }, {
      id: _db.SPC_ENG_NONE,
      name: '无',
      viewExtension: ''
    }]
  }, {
    id: _db.SPC_LNG_PHP,
    name: 'PHP',
    engines: [{
      id: _db.SPC_ENG_SMARTY,
      name: 'Smarty',
      viewExtension: 'tpl'
    }, {
      id: _db.SPC_ENG_NONE,
      name: '无',
      viewExtension: ''
    }]
  }, {
    id: _db.SPC_LNG_SWIFT,
    name: 'Swift',
    engines: []
  }, {
    id: _db.SPC_LNG_OC,
    name: 'Objective-C',
    engines: []
  }, {
    id: _db.SPC_LNG_UNKNOWN,
    name: '其他',
    engines: [{
      id: _db.SPC_ENG_NONE,
      name: '无',
      viewExtension: ''
    }]
  }];
  var webLanguages = [_db.SPC_LNG_JAVA, _db.SPC_LNG_NODE, _db.SPC_LNG_PHP, _db.SPC_LNG_UNKNOWN];
  var iosLanguages = [_db.SPC_LNG_SWIFT, _db.SPC_LNG_OC, _db.SPC_LNG_UNKNOWN];
  var aosLanguages = [_db.SPC_LNG_JAVA, _db.SPC_LNG_UNKNOWN];
  var testLanguages = [_db.SPC_LNG_JAVA, _db.SPC_LNG_NODE, _db.SPC_LNG_PHP, _db.SPC_LNG_UNKNOWN];
  var getLanguage = function (type) {
    var obj = [], source = [];
    switch (type) {
      case 'web':
      case _db.CMN_TYP_WEB:
        obj = webLanguages;
        break;
      case 'ios':
      case _db.CMN_TYP_IOS:
        obj = iosLanguages;
        break;
      case 'aos':
      case _db.CMN_TYP_AOS:
        obj = aosLanguages;
        break;
      case 'test':
      case _db.CMN_TYP_TEST:
        obj = testLanguages;
        break;
      default:
        break;
    }
    obj.forEach(function (item) {
      var ob = langOpt.find(function (item2) {
        return item2.id == item;
      });
      if (ob) {
        source.push(ob);
      }
    });
    return source;
  };
  var LESelect = _re.extend({
    name: 'leselect',
    template: _html,
    config: function () {
      var isWeb = this.data.specType == 'web' || this.data.specType == _db.CMN_TYP_WEB;
      //根据语言和模板id设置参数
      if (this.data.type == 'see') {
        var language = this.findById(langOpt, this.data.lid);
        var engine;
        if (isWeb) {
          engine = this.findById(language.engines, this.data.eid);
        }
        this.data = _u._$merge(this.data, {
          isWeb: isWeb,
          language: language.name,
          engine: engine ? engine.name : '',
          viewExtension: engine ? engine.viewExtension : ''
        });
      } else {
        var language = getLanguage(this.data.specType);
        var lselected, eselected;
        lselected = this.data.lid !== undefined ? this.findById(language, this.data.lid) : language[0];
        if (lselected && isWeb) {
          eselected = this.data.eid !== undefined ? this.findById(lselected.engines, this.data.eid) : lselected.engines[0];
        }
        this.data = _u._$merge(this.data, {
          isWeb: isWeb,
          initSilent1: true,
          initSilent2: true,
          language: language,
          lselected: lselected,
          eselected: eselected,
          engine: lselected.engines,
          viewExtension: this.data.viewExtension != undefined ? this.data.viewExtension : (eselected ? eselected.viewExtension : '')
        });
      }
    },
    //选中变化调用，f=0语言变化，f=1模板引擎变化
    selectChange: function (evt, f) {
      var item = evt.selected;
      if (!item) return;
      if (this.data.isWeb) {
        if (f == 0) {
          this.data.lselected = item;
          var t = [];
          this.data.language.forEach(function (i) {
            if (i.name == item.name) {
              t = i.engines;
              return;
            }
          });
          this.data.engine = t;
          this.data.eselected = t[0];
          this.data.viewExtension = t[0].viewExtension;
          this.$refs.engine.$updateSource(t, t[0]);
          this.update(0);
        } else {
          var e = [];
          this.data.eselected = item;
          this.data.engine.forEach(function (i) {
            if (i.name == item.name) {
              e = i;
              return;
            }
          });
          this.data.viewExtension = e.viewExtension;
          this.update(1);
        }
      } else {
        this.data.lselected = item;
        this.update(0);
      }
    },
    //修改详情时，input变化处理
    inputChange: function (evt) {
      this.data.viewExtension = evt.target.value;
      this.update(2);
    },
    findById: function (data, id) {
      var res;
      data.forEach(function (i) {
        if (i.id == id) {
          res = i;
          return;
        }
      });
      return res;
    },
    update: function (key) { //key表示修改字段 0:实现语言,1:模板引擎,2:扩展名 这里判断只返回修改的字段
      var data;
      switch (key) {
        case 0:
          data = {language: this.data.lselected.id};
          if (this.data.isWeb) {
            _u._$merge(data, {
              engine: this.data.eselected.id,
              viewExtension: this.data.viewExtension
            });
          }
          break;
        case 1:
          data = {
            engine: this.data.eselected.id,
            viewExtension: this.data.viewExtension
          };
          break;
        case 2:
          data = {
            viewExtension: this.data.viewExtension
          };
          break;
      }
      if (data) {
        this.$emit('updateSelect', data);
      }
    }
  });
  return LESelect;

});
