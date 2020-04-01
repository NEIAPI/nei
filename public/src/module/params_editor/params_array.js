/*
 * 参数编辑器-数组组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/datatype_cache',
  'pro/params_editor/params_origin',
  'pro/params_import/json_import',
  'pro/params_import/interface_import',
  'pro/create_datatype/create_datatype',
  'text!./params_array.html'
], function (v, u, e, _, cache, Origin, JSImport, INTImport, DataModel, tpl) {
  var Array2 = Origin.extend({
    name: 'arrayEditor',
    template: tpl,
    config: function () {
      this.defaultParam = {
        type: _.db.MDL_SYS_STRING,
        isImport: _.db.CMN_BOL_NO,
        isArray: _.db.CMN_BOL_NO,
        typeName: 'String',
        genExtension: '',
        valExtension: '',
        description: ''
      };
      _._$extend(this.data, {
        params: [u._$merge({}, this.defaultParam)]
      });
    },
    init: function () {
      this.$on('changeObjectType', function (index, result) {
        this.$refs.sel.$refs.sel1.$select({
          id: 'object',
          name: 'Object'
        });
        this.data.params[index].type = result.id;
        this.$update();
      });
    },
    /**
     * select2的change事件
     * @param item
     * @param index
     * @private
     */
    _change: function (item, index) {
      if (item.typeName == 'Object') {
        this.createModel();
      } else {
        this.data.params[index].type = item.type;
        this.data.params[index].typeName = item.typeName;
      }
    },
    import: function (type) {
      var that = this;
      if (type == 'json') {
        var modal = new JSImport({});
        modal.$on('ok', function (json) {
          var data = that.formatJSONData(json);
          that.createModel(data);
        });
      } else if (type == 'interface') {
        modal = new INTImport({
          data: {
            source: [{
              name: 'GET', id: 'get'
            }, {
              name: 'POST', id: 'post'
            }]
          }
        });
        modal.$on('ok', function (json) {
          var data = that.formatJSONData(json);
          that.createModel(data);
        });
      }
    },
    formatJSONData: function (_json) {
      if (!_json) return;
      //如果是数组则只取第一层
      if (_json && _json instanceof Array) {
        _json = _json[0];
      }
      var _conf = {
        string: _.db.MDL_FMT_STRING,
        number: _.db.MDL_FMT_NUMBER,
        boolean: _.db.MDL_FMT_BOOLEAN
      };
      var _params = [];
      for (var _p in _json) {
        if (_p) {
          var _type = typeof _json[_p];
          var _v, _t;
          if (_conf[_type]) {
            _v = _json[_p];
            _t = _type;
          } else {
            _v = JSON.stringify(_json[_p]);
            _t = 'string';
          }
          _params.push({
            isImport: _.db.CMN_BOL_NO,
            name: _p,
            typeName: _p,
            type: _conf[_t],
            isArray: _.db.CMN_BOL_NO,
            defaultValue: _v,
            genExpression: '',
            valExpression: ''
          });
        }
      }
      return _params;
    },
    // validate: function () {
    //
    // },
    destroy: function () {
      this.supr();
    },
    _onSelectChange: function (event, index) {
      this.supr(event, index);
      if (event.typeName == 'Object') { //进入匿名类型创建流程
        this.data.params[index].isObject = true;
        this.data.params[index].type = -1;
        this.data.params[index].params = [u._$merge({}, this.defaultParam)];
      } else {
        this.data.params[index].isObject = false;
        delete this.data.params[index].params;
      }
    }
  });
  return Array2;
})
;
