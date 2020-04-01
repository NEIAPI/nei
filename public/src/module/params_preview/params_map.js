/*
 * 参数编辑器-映射规则组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/cache/varmap_cache',
  'pro/cache/datatype_cache',
  'pro/params_preview/params_origin',
  'pro/select2/select2',
  'text!./params_map.html'
], function (v, u, e, _, cache, datatypeCache, Origin, Select2, tpl) {
  var Map = Origin.extend({
    name: 'mapPreview',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        verifyName: 'orgName',
        entre: [],
        pgroup: [],
        tname: ['工程', '项目组', '项目'],
        isHideFullButton: true
      });
      this.data.params = this.data.params.slice(0);
      if (this.data.shape !== 'standard') {

        u._$reverseEach(this.data.params, function (item, i) {
          if (item.parentType == 0) {
            this.data.entre.push(this.data.params.splice(i, 1)[0]);
          }
        }._$bind(this));
      }
      if (this.data.shape == 'project') {
        u._$reverseEach(this.data.params, function (item, i) {
          if (item.parentType == 1) {
            this.data.pgroup.push(this.data.params.splice(i, 1)[0]);
          }
        }._$bind(this));
      }
      this.supr(this.data);
    },
    add: function (option) {
      this.data.params.push(option || {
          isAdding: true,
          orgName: '',
          varName: ''
        });
      this.data.isAdding = true;
    },
    /**
     *保存参数数据 数据来源为直接添加
     * @param index
     * @param
     */
    update: function (index) {
      if (this.data.isSending) return;
      var item = this.data.params[index];
      var $cache = this._getCacheInstance('varmap');
      var _ext = {
        cache: 'varmap',
        uuid: this.data.uuid,
        index: index
      };
      this.data.isSending = true;
      $cache._$addItems({
        key: this.data.listKey,
        data: {
          orgName: item.orgName || '',
          varName: item.varName,
          parentType: this.data.parentType,
          parentId: this.data.parentId,
          type: this.data.specType
        },
        ext: _ext
      });
    },
    /**
     *
     * @param index 删除的项索引
     */
    remove: function (index) {
      this.supr(index);
    },

    validate: function (item) {
      return this.supr(item);
    }
  }).filter({
    setTitle: function (shape) {
      return shape == 'project' ? '项目' : '项目组';
    }
  });
  return Map;
});
