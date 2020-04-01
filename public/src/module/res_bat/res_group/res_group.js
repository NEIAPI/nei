/**
 * 资源批量设置分组
 */
NEJ.define([
  'base/element',
  'base/util',
  'pro/modal/modal',
  'pro/select2/select2',
  'pro/cache/group_cache',
  'text!./res_group.html',
  'css!./res_group.css'
], function (_e, _u, modal, select2, groupCache, html, css) {
  _e._$addStyle(css);
  var resGroup = modal.extend({
    name: 'resGroup',
    config: function (data) {
      this.data = _u._$merge({
        'contentTemplate': html,
        'class': 'm-modal-res-group',
        'closeButton': true,
        'okButton': '确定',
        'cancelButton': '取消',
        'noScroll': true,
        title: '设置分组',
        hasCreate: false,
        groups: [],
        ids: []
      }, data);
      this.listCacheKey = this.data.cache._$getListKey(this.data.pid);
      this.supr(data);
    },
    destroy: function () { //销毁时隐藏新建业务分组模块
      if (this.data.hasCreate) {
        this.hideCreate();
      }
      this.supr();
    },
    hideCreate: function () { //隐藏新建业务分组模块
      dispatcher._$hide('/?/progroup/p/res/group/create/');
      _e._$delClassName(this.$refs.modalbd.parentElement, 'f-dn-important');
      this._modal.destroy();
    },
    ok: function () { //确定
      this.$emit('ok', {
        ids: this.data.ids,
        groupId: this.data.group.id
      });
      this.destroy();
    },
    setGroup: function (event) { //选择分组
      this.data.group = event.selected.id;
    },
    showCreate: function () { //显示新建业务分组私有模块
      _e._$addClassName(this.$refs.modalbd.parentElement, 'f-dn-important');
      this._modal = new modal({
        data: {
          'content': '',
          'title': ' ',
          'noTitle': true,
          'class': 'm-modal-group-inline inline-create',
          'noScroll': true,
          'okButton': false,
          'cancelButton': false,
          'closeButton': true
        }
      }).$on('close', function () {
        this.hideCreate();
      }.bind(this));
      dispatcher._$redirect('/?/progroup/p/res/group/create/?pid=' + this.data.pid, {
        input: {
          parent: this._modal.$refs.modalbd,
          listKey: this.listCacheKey,
          done: function () {
            //新建成功后，刷新select的source，并选中新建项(这里由于cache中的add是列表前项追加的，因此选中第一个即可)
            var groups = this.data.cache._$getListInCache(this.listCacheKey);
            this.$refs.group.$updateSource(groups, groups[0]);
            this.hideCreate();
          }.bind(this)
        }
      });
    }
  });
  return resGroup;

});
