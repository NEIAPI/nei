/**
 * 资源版本创建弹框
 */
NEJ.define([
  'base/element',
  'base/util',
  'pro/modal/modal',
  'pro/select2/select2',
  'pro/tagme/tagme',
  'pro/cache/group_cache',
  'pro/common/util',
  'text!./res_version.html',
  'css!./res_version.css'
], function (_e, _u, modal, select2, tagme, groupCache, _util, html, css) {
  _e._$addStyle(css);
  var resVersion = modal.extend({
    name: 'resVersion',
    config: function (data) {
      this.data = _u._$merge({
        contentTemplate: html,
        class: 'm-modal-res-version',
        closeButton: true,
        okButton: '确定',
        cancelButton: '取消',
        noScroll: true,
        title: '版本创建',
        label: '基于该版本创建: ',
        versionList: [],
        currentItem: null,
        pid: {},
        // version name
        version: '',
        // resource name
        name: ''
      }, data);

      this.groupCache = groupCache._$$CacheGroup._$allocate({
        onlistload: function () {
          //获取当前项目的分组信息
          var groups = this.groupCache._$getGroupSelectSource(this.data.pid);
          this.$refs.group.$updateSource(groups);
          this.data.gid = groups[0].id;
          this.updateParentSource();
        }.bind(this)
      });
      this.setupNames();
      this.data.parentId = this.data.currentItem.id;
      this.supr(this.data);
    },
    updateParentSource: function () {
      var source = (this.data._versionList || []).concat([this.data._currentItem]);
      source.sort(function (itemA, itemB) {
        return itemB.id - itemA.id;
      });
      this.data.parentId = this.data.currentItem.id;
      this.$refs.parent.$updateSource(
        source,
        this.data.currentItem);
    },
    setupNames: function () {
      this.data.name = this.data.currentItem.name;
      this.data._currentItem = Object.assign(
        {},
        this.data.currentItem,
        {name: this.data.currentItem.version && this.data.currentItem.version.name || '初始版本'}
      );
      this.data._versionList = (this.data.versionList || []).map(function (it) {
        return Object.assign({}, it, {
          name: (it.version && it.version.name) || '初始版本'
        });
      });
    },
    destroy: function () { //销毁时回收tagme组件
      this.tag && this.tag._$recycle();
      this.tag = null;
      this.supr();
    },
    init: function () {
      //资源和分组的listCacheKey
      this.groupListCacheKey = this.groupCache._$getListKey(this.data.pid);
      //加载业务分组列表
      this.groupCache._$getList({
        key: this.groupListCacheKey,
        data: {
          pid: this.data.pid
        }
      });
      //重新初始化tagme组件
      this.tag && this.tag._$recycle();
      this.tag = tagme._$$ModuleTagme._$allocate({
        parent: this.$refs.tag,
        searchCache: this.data.searchCache,
        searchCacheKey: this.data.cache.__cacheKey,
        searchResultFilter: function () {
          return this.data.cache._$getTagList(this.data.cache.__cacheKey);
        }.bind(this),
        preview: false,
        choseOnly: false,
        editable: true,
        tags: [],
        done: function (data) {
          this.data.tags = data.tags;
        }.bind(this),
        queryData: {
          pid: this.data.pid
        }
      });
      this.supr();
    },
    ok: function () {
      var tags = (this.data.tags || []).map(function (item) {
        return item.name;
      });
      if (!this.data.name.trim() || !this.data.version.trim()) {
        return;
      }
      this.$emit('ok', {
        tag: tags.join(','),
        parent: this.data.parentId,
        groupId: this.data.gid,
        name: this.data.name,
        version: this.data.version
      });
      this.destroy();
    },
    cancel: function () {
      this.tag && this.tag._$recycle();
      this.supr();
    },
    setGroup: function (event) {
      this.data.gid = event.selected.id;
    },
    setParent: function (event) {
      this.data.parentId = event.selected.id;
    }
  });

  return resVersion;
});
