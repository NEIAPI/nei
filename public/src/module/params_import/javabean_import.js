/**
 * javabean导入
 */
NEJ.define([
  'base/util',
  'pro/common/regular/regular_base',
  'pro/notify/notify',
  'pro/cache/datatype_cache',
  '{3rd}/jsonbean/src/jsonbean.js',
  'json!{3rd}/fb-modules/config/db.json',
  'text!./javabean_import.html'
], function (_u, Base, Notify, _datatypeCache, jsonbean, db, html) {
  var datatypeCache = _datatypeCache._$$CacheDatatype._$allocate();
  var JavabeanImport = Base.extend({
    template: html,
    config: function () {
      this.data = _u._$merge({
        pid: undefined
      }, this.data);
    },
    init: function () {
      this.$refs.javabean.click();
    },
    select: function () {
      var files = this.$refs.javabean.files;
      if (files.length > 0) {
        var file = files[0];
        if (file.name.match(/.+\.java$/)) {
          var reader = new FileReader();
          reader.readAsText(file);
          var that = this;
          reader.onload = function (e) {
            var data = jsonbean.parse(this.result);
            var items = [];
            if (data.attributes) {
              data.attributes.forEach(function (item) {
                var obj = datatypeCache._$getByJavaDataType(item.typeName, that.data.pid);
                item = _u._$merge(item, {
                  isImport: db.CMN_BOL_NO,
                  type: obj.id,
                  typeName: obj.name,
                  genExpression: '',
                  valExpression: ''
                });
                if (item.isArray && item.defaultValue) {
                  item.defaultValue = JSON.stringify(item.defaultValue);
                }
                item.isArray = item.isArray ? db.CMN_BOL_YES : db.CMN_BOL_NO;
                items.push(item);
              });
            }
            that.$emit('ok', items);
          };
        } else {
          Notify.show('请选择适合的javabean文件', 'error', 2000);
        }
      }
      this.$refs.javabean.value = '';
    }
  });
  return JavabeanImport;
});
