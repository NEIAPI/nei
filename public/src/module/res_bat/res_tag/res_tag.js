/**
 * 资源批量设置标签
 */
NEJ.define([
  'base/element',
  'base/util',
  'pro/modal/modal',
  'pro/tagme/tagme',
  'text!./res_tag.html',
  'css!./res_tag.css'
], function (_e, _u, modal, tagme, html, css) {
  _e._$addStyle(css);
  var resTag = modal.extend({
    name: 'resTag',
    config: function (data) {
      this.data = _u._$merge({
        'contentTemplate': html,
        'class': 'm-modal-res-tag',
        'closeButton': true,
        'okButton': '确定',
        'cancelButton': '取消',
        'noScroll': true,
        title: '设置标签',
        list: []
      }, data);
      var list = this.data.list.map(function (res) {
        return res.tag ? res.tag.trim().split(',') : [];
      });
      this.data.tagList = (list[0] || []).filter(function (tag) {
        return list.every(function (tags) {
          return tags.indexOf(tag) !== -1;
        });
      });
      this.supr(data);
    },
    init: function () {
      this.__tag = tagme._$$ModuleTagme._$allocate({
        parent: this.$refs.tag,
        searchCache: this.data.searchCache,
        searchCacheKey: this.data.cache.__cacheKey,
        searchResultFilter: function () {
          return this.data.cache._$getTagList(this.data.cache.__cacheKey);
        }.bind(this),
        preview: false,
        choseOnly: false,
        editable: true,
        tags: this.data.tagList,
        done: function (data) {
          if (!!data.change) {
            this.data.tagList = data.tags;
          }
        }.bind(this),
        queryData: {
          pid: this.data.pid
        }
      });
      this.supr();
    },
    destroy: function () {
      this.supr();
    },
    ok: function () {
      // 调用ok前手动失焦，以防止获取不到焦点
      this.__tag.tagList.focus();
      this.__tag.tagList.blur();
      this.$emit('ok', {
        tags: this.data.tagList
      });
      this.destroy();
    }
  });
  return resTag;
});
