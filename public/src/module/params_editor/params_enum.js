/*
 * 参数编辑器-枚举组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/params_editor/params_origin',
  'pro/params_import/datatype_import',
  'pro/params_import/json_import',
  'text!./params_enum.html'
], function (v, u, e, _, Origin, DTImport, JSImport, tpl) {
  var Enum = Origin.extend({
    name: 'enumEditor',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        params: [{
          isImport: _.db.CMN_BOL_NO,
          type: _.db.MDL_SYS_STRING,
          typeName: 'String',
          isArray: _.db.CMN_BOL_NO,
          defaultValue: '',
          name: ''
        }],
        isArray: 0,
        noArray: true,
        noObject: true,
        //校验的项
        verifyName: 'defaultValue'
      });
    },
    init: function () {
      this.supr();
    },
    computed: {
      hasNameError: {
        get: function (data) {
          var _errors = data.params.filter(function (_item) {
            return _item.error;
          });
          return _errors.length;
        }
      }
    },
    add: function (option) {
      this.data.params.push(option || {
          isImport: _.db.CMN_BOL_NO,
          type: _.db.MDL_SYS_STRING,
          typeName: 'String',
          isArray: _.db.CMN_BOL_NO,
          defaultValue: '',
          name: ''
        });
      this.$update();
    },
    import: function (type) {
      var modal = null;
      var that = this;
      if (type == 'type') {
        //只需要把枚举的类型显示出来就行
        modal = new DTImport({
          data: {
            format: 1,
            pid: this.data.pid
          }
        });
        modal.$on('ok', function (list) {
          if (!list) return;
          that.removeEmpty();
          list.forEach(function (item) {
            var arr = _._$clone(item.params);
            arr.map(function (item2) {
              item2.isImport = _.db.CMN_BOL_YES;
              item2.originals = {
                name: item2.name,
                description: item2.description
              };
            });
            that.data.params = that.data.params.concat(arr);
          });
          that.add();
          that.$update();
        });
      } else if (type == 'json') {
        modal = new JSImport({});
        modal.$on('ok', function (json) {
          that.removeEmpty();
          that.addJSONData(json);
          that.add();
        });
      }
    },
    /**
     * select2的change事件
     * @param item
     * @param index
     * @private
     */
    _change: function (item, index) {
      // this.data.params[index].type = item.selected.id;
      // this.data.selected = item.selected;
    },
    remove: function (index) {
      var itm = this.data.params[index];
      if (itm.parentId) {
        this.data.params = this.data.params.filter(function (item) {
          return item.parentId !== itm.parentId;
        });
      } else {
        this.data.params.splice(index, 1);
      }
    },
    addJSONData: function (_json) {
      if (!_json) return;
      if (_json && _json instanceof Array) {
        _json = _json[0];
      }
      var _conf = {
        string: _.db.MDL_SYS_STRING,
        number: _.db.MDL_SYS_NUMBER
      };
      var that = this;
      for (var _p in _json) {
        var _type = typeof _json[_p];
        var _v, _t;
        if (_conf[_type]) {
          _v = _json[_p];
          _t = _type;
        } else {
          _v = _json[_p] === null ? '' : JSON.stringify(_json[_p]);
          _t = 'string';
        }
        _v = (_v.toString() || '').slice(0, 500);//如果默认值过长则直接截断
        that.add({
          isImport: _.db.CMN_BOL_NO,
          typeName: _p,
          type: _conf[_t],
          isArray: _.db.CMN_BOL_NO,
          defaultValue: _v,
          name: _p
        });
      }
    },
    destroy: function () {
      this.supr();
    }
  });
  return Enum;
});
