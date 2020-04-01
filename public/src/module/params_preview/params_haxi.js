/*
 * 参数编辑器-哈希组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'util/event/event',
  'pro/params_preview/params_origin',
  'pro/cache/datatype_cache',
  'text!./params_haxi.html',
  'pro/modal/modal',
], function (v, u, e, _, c, Origin, cache, tpl, Modal) {
  var Haxi = Origin.extend({
    name: 'haxiPreview',
    template: tpl,
    config: function () {
      this.supr();
      _._$extend(this.data, {
        verifyName: 'name',
        checkStatus: {},
        isRequire: false,//用来标记是否需要显示是否必须列，接口的请求参数里面是需要显示的，默认不显示
        valueSource: [{id: 1, name: '是'}, {id: 0, name: '否'}]
      });
      if (this.data.action == 'modify') {
        this.data.params = [];
        this.add();
        return;
      }
      //参数没有默认值带上自定义类型的默认值
      this.addDefulatValue();
      this.data.params = this.formatParamsSource(_._$clone(this.data.params));
    },
    init: function () {
      this.supr();
      this.listenHeadStatusChange(false);
    },
    add: function () {
      this.data.params.push({
        isImport: _.db.CMN_BOL_NO,
        isAdding: true,
        name: '',
        type: 10001,
        typeName: 'String',
        isArray: _.db.CMN_BOL_NO,
        defaultValue: '',
        genExpression: '',
        valExpression: '',
        required: _.db.CMN_BOL_YES
      });
      this.data.isAdding = true;
    },
    import: function (type) {
      this.supr(type);
    },
    /**
     *
     * @param item 参数项
     * @param index 参数所在的索引
     * @param field 参数的字段
     * @param type 当前操作的类型，如果是修改则是"modify"
     * @param isImport 当前操作是否是导入的类型
     * @private
     */
    _onRequireSelectChange: function ($event, index, field, type) {
      //索引是二维的说明是导入类型
      var x = (index || '').split('-')[0];
      var y = (index || '').split('-')[1];
      if (type == 'modify') {//修改参数
        if (y !== undefined) {
          var item = this.data.params[x].imports[y];
        } else {
          var item = this.data.params[index];
        }
        var _data = {
          parentId: this.data.parentId,
          parentType: this.data.parentType
        };
        _data[field] = $event.selected.id || 0;
        //datatypeId存在说明是修改导入的参数
        if (item.datatypeId != undefined) {
          _data['datatypeId'] = item.datatypeId;
        }
        this._updateField(item.id, _data, {
          datatypeId: item.datatypeId,
          uuid: this.data.uuid,
          cache: 'parameter',
          index: index
        });
      } else {
        if (y !== undefined) {
          this.data.params[x].imports[y][field] = $event.selected.id;
        } else {
          this.data.params[index][field] = $event.selected.id;
        }
      }

    },

    /**
     *保存参数数据 数据来源为直接添加
     * @param index
     */
    update: function (index) {
      //添加的参数包含有匿名类型
      if ((typeof index == 'number') && this.data.params[index].isObjectType) {
        if (!this.validate(this.data.params[index])) return;
        var _data = this.$refs['editor'].$getEditorParams();
        var _ext = {
          index: index,
          action: 'add'
        };
        this.data.params[index].attrs = _data.result.params;
        this.data.params[index].imports = _data.result.imports;
        this._doUpdateParams([this.data.params[index]], [], _ext);
      } else {
        this.supr(index);
      }
    },
    /**
     *
     * @param index 删除的项索引
     */
    remove: function (index) {
      if (typeof index !== 'number') {//批量删除
        index = {};
        var imports = [], params = [];
        for (var key in this.data.checkStatus) {
          if (this.data.checkStatus[key]) {
            if (key.indexOf('dr') === 0) {
              imports.push(key.slice(2));
            } else {
              params.push(key);
            }
          }
        }
        index.params = params;
        index.imports = imports;
      }
      this.supr(index);
    },
    addDefulatValue: function () {
      //为了实现参数没有默认值带上自定义类型的默认值，好坑
      u._$forEach(this.data.params, function (item) {
        var _dfvalue = this._getCacheInstance('datatype')._$getDefaultValue(item.type);
        if (!item.defaultValue && _dfvalue && !item.isArray && item.type > 10003) {
          item.defaultValue = _dfvalue;
          item.isHerit = true;
        }
      }._$bind(this));
      this.$update();
    },
    /**
     * 转换json
     * @param _json
     * @returns {Array}
     */
    formatJSONData: function (_json) {
      return this.supr(_json);
    },
    /**
     * 修改匿名类型
     * @param event
     * @param id
     * @param index
     */
    modifyAnonymousType: function (event, id, index) {
      this.supr(event, id, index);
    },
    destroy: function () {
      this.supr();
    }
  });
  return Haxi;
});
