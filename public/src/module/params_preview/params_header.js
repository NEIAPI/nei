/*
 * 请求头参数编辑器----------------------------------------------
 */

NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/params_preview/params_origin',
  'text!./params_header.html'
], function (v, u, e, _, Origin, tpl) {
  var Header = Origin.extend({
    name: 'headerPreview',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        verifyName: 'name',
        checkStatus: {}
      });
      this.data.nameSource = this.convertSource(_.headname);
      this.data.valueSource = [];
      this.data.valueTempSource = this.convertSource(_.headvalue);
      this.data.params = this.formatParamsSource(_._$clone(this.data.params));
      // this.data.params.forEach(function (item) {
      //     if(item.datatypeId) {//是导入类型
      //         item.imports.forEach(function (itm) {
      //             itm.nameSelected = {
      //                 id:itm.name,
      //                 name:itm.name
      //             }
      //             itm.defaultValueSelected = {
      //                 id:itm.defaultValue,
      //                 name:itm.defaultValue
      //             }
      //         });
      //     } else {
      //         item.nameSelected = {
      //             id:item.name,
      //             name:item.name
      //         };
      //         item.defaultValueSelected = {
      //             id:item.defaultValue,
      //             name:item.defaultValue
      //         }
      //     }
      //
      // });
      this.supr();
    },
    init: function () {
      this.supr();
      this.listenHeadStatusChange(false);
    },
    add: function (option) {
      if (this.data.isAdding) return;
      this.data.params.push(option || {
          isImport: _.db.CMN_BOL_NO,
          isAdding: true,
          name: '',
          defaultValue: '',
          description: ''
        });
      // this.data.isAdding = true;
    },
    import: function (type) {
      this.supr(type);
    },
    /**
     *保存参数数据 数据来源为直接添加
     * @param index
     */
    update: function (index) {
      if (this.data.params[index] && this.data.params[index].isAdding) {
        this.data.params[index]['defaultValue'] = this.$refs.vele.data.inputValue;
        this.data.params[index]['name'] = this.$refs.nele.data.inputValue;
      }
      this.supr(index);
    },
    listenFocus: function (item, index) {
      //在修改参数属性之后，这里的属性变成了字符类型而不是一个object
      var pname = (this.data.params[index].name && typeof this.data.params[index].name === 'object') ? this.data.params[index].name.id : this.data.params[index].name;
      if ((pname || '').toLowerCase() == 'content-type') {
        this.data.valueSource = this.data.valueTempSource;
      } else {
        this.data.valueSource = [];
      }
    },
    //select2组件的change事件
    /**
     *
     * @param item 参数项
     * @param index 参数所在的索引
     * @param field 参数的字段
     * @param type 当前操作的类型，如果是修改则是"modify"
     * @param isImport 当前操作是否是导入的类型
     * @private
     */
    _onSelectChange: function ($event, index, field, type) {
      if (type == 'modify') {//修改参数
        if (typeof index == 'object') {
          var index1 = index.x;
          var index2 = index.y;
          var item = this.data.params[index1].imports[index2];
        } else {
          var item = this.data.params[index];
        }
        this._modifyRequestHead({
          datatypeId: item.datatypeId,
          id: item.id,
          name: field,
          value: $event.selected.name || '',
          index: index
        });
      } else {
        if ($event.selected && $event.selected.name.toLowerCase() == 'content-type') {
          this.data.valueSource = this.data.valueTempSource;
        } else {
          this.data.valueSource = [];
        }
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
    /**
     * 转换json
     * @param _json
     * @returns {Array}
     */
    formatJSONData: function (_json) {
      return this.supr(_json);
    },
    convertSource: function (source) {
      var _source = [];
      source.forEach(function (item) {
        _source.push({
          id: item,
          name: item
        });
      });
      return _source;
    },
    /**
     *修改请求头的值
     * */
    _modifyRequestHead: function (actionData) {
      var _data = {
        parentId: this.data.parentId,
        parentType: this.data.parentType
      };
      //datatypeId存在说明是修改导入的参数
      if (actionData.datatypeId) {
        _data['datatypeId'] = actionData.datatypeId;
      }
      _data[actionData.name] = actionData.value;
      this._updateField(actionData.id, _data, {
        uuid: this.data.uuid,
        cache: 'iHeader',
        index: actionData.index
      });
    },
    destroy: function () {
      this.supr();
    }
  });
  return Header;
});
