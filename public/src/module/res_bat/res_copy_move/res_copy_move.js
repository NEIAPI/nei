/**
 * 资源复制和移动弹框
 */
NEJ.define([
  'base/element',
  'base/util',
  'pro/modal/modal',
  'pro/cascade_select/cascade_select',
  'pro/select2/select2',
  'pro/tagme/tagme',
  'pro/cache/group_cache',
  'text!./res_copy_move.html',
  'css!./res_copy_move.css'
], function (_e, _u, modal, cascadeSelect, select2, tagme, groupCache, html, css) {
  _e._$addStyle(css);
  var resCopyMove = modal.extend({
    name: 'resCopyMove',
    config: function (data) {
      this.data = _u._$merge({
        'contentTemplate': html,
        'class': 'm-modal-res-cm',
        'closeButton': true,
        'okButton': '确定',
        'cancelButton': '取消',
        'noScroll': true,
        type: 'move',
        xlist: [],
        tags: [],
        project: {},
        errorList: []
      }, data);
      this.data.label = this.data.type == 'copy' ? '复制到：' : '移动到：';
      this.data.title = this.data.type == 'copy' ? '复制资源' : '移动资源';
      this.groupCache = groupCache._$$CacheGroup._$allocate({
        onlistload: function () {
          //获取当前项目的分组信息
          var groups = this.groupCache._$getGroupSelectSource(this.data.project.id);
          var groupId = groups[0].id;
          this.$refs.group.$updateSource(groups, groups[0]);
          this.data.gid = groupId;
        }.bind(this)
      });

      this.supr(this.data);
    },
    destroy: function () { //销毁时回收tagme组件
      this.tag && this.tag._$recycle();
      this.tag = null;
      this.supr();
    },
    init: function () {
      this.changeProject(this.data.initData);
      this.supr();
    },
    changeProject: function (event) { //切换项目，需要更新标签和分组的数据
      this.data.project = event.project;
      //资源和分组的listCacheKey
      this.resListCacheKey = this.data.cache._$getListKey(this.data.project.id);
      this.groupListCacheKey = this.groupCache._$getListKey(this.data.project.id);
      //加载业务分组列表
      this.groupCache._$getList({
        key: this.groupListCacheKey,
        data: {
          pid: this.data.project.id
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
          if (!!data.change) {
            this.data.tags = data.tags;
          }
        }.bind(this),
        queryData: {
          pid: this.data.project.id
        }
      });
    },
    checkInput: function (event, index) { //检查input是否为空
      if (/^\s*$/.test(event.target.value)) {
        this.data.xlist[index].error = true;
        this.data.errorList.push(index);
      } else {
        this.data.xlist[index].error = false;
        var errIndex = this.data.errorList.indexOf(index);
        errIndex != -1 && this.data.errorList.splice(errIndex, 1);
      }
    },
    initData: function (event) {//初始化时级联组件选中数据
      this.data.initData = event;
    },
    ok: function () {
      if (!this.data.errorList.length) {
        var arr = [], data = {
          pid: this.data.project.id,
          gid: this.data.gid
        };
        if (this.data.type == 'copy') { //复制资源，
          this.data.xlist.forEach(function (item) {
            if (item.selected) {
              arr.push({
                id: item.id,
                name: item.name
              });
            }
          });
          data.copys = arr;
        } else { //移动资源
          this.data.xlist.forEach(function (item) {
            if (item.selected) {
              arr.push(item.id);
            }
          });
          data.moves = arr;
        }
        if (arr.length) { //有选中，才触发submit
          var tags = this.data.tags.map(function (item) {
            return item.name;
          });
          data.tag = tags.join(',');
          this.$emit('ok', {
            type: this.data.type,
            data: data
          });
        }
        this.destroy();
      }
    },
    cancel: function () {
      this.tag && this.tag._$recycle();
      this.supr();
    },
    select: function (index) { //checkbox选中状态切换
      var item = this.data.xlist[index];
      item.selected = !item.selected;
    },
    setGroup: function (event) { //选择分组
      this.data.gid = event.selected.id;
    }
  });

  return resCopyMove;
});
