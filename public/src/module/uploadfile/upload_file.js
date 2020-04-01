/*
 * 头像上传组件-------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'util/ajax/xdr',
  'pro/notify/notify',
  'pro/cache/cache',
  'text!./upload_file.css',
  'text!./upload_file.html'
], function (base, v, u, e, _, j, Notify, cache, css, tpl) {
  e._$addStyle(css);
  var Upload = base.extend({
    name: 'upload-file',
    template: tpl,
    config: function (data) {
      _._$extend(this.data, {});
      this.supr();
      this.__cache = cache._$$Cache._$allocate({
        ontokensload: function (options) {
          var tokens = this.__cache._$getDataInCache(options.key);
          var formData = new FormData();
          formData.append('x-nos-token', tokens[0].token);
          formData.append('Object', tokens[0].key);
          formData.append('file', options.ext.file);
          var opt = {
            method: 'post',
            data: formData,
            headers: {'Content-Type': 'multipart/form-data'},
            type: 'json',
            onload: function (data) {
              this.$emit('change', {
                file: data.url
              });
            }._$bind(this),
            onerror: function (data) {
              Notify.error('上传失败');
              this.$emit('error');
            }._$bind(this)
          };
          j._$request(window.pageConfig.nosServer, opt);
        }._$bind(this)
      });
    },
    init: function (data) {
      this.supr();

    },
    uploadFile: function (event) {
      var file = event.target.files[0];
      if (!/\.(gif|jpg|jpeg|png|GIF|JPG|PNG)$/.test(file.name)) {
        Notify.error('请上传图片文件');
        return;
      }
      this.__cache._$getTokens({
        key: 'upload-file-image',
        ext: {file: file}
      });
    }
  });
  return Upload;

});
