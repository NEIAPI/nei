/**
 * 级联下拉选择框
 */
NEJ.define([
  'base/util',
  'base/element',
  'pro/common/regular/regular_base',
  'pro/select2/select2',
  'text!./cascade_select.html',
  'css!./cascade_select.css'
], function (_u, _e, _re, select2, html, css) {
  _e._$addStyle(css);
  var cascadeSelect = _re.extend({
    name: 'cascadeSelect',
    template: html,
    config: function (data) {
      this.data = _u._$merge({
        progroupError: false,
        projectError: false,
        progroups: [],
        projects: []
      }, data);
      if (this.data.progroupEditable) { //项目组可选的情况下
        this.data.progroups = [].concat(this.data.progroups);
      }
      this.sort(this.data.progroups);
      this.data.progroupSelected = this.data.progroupSelected ? _u._$merge({}, this.data.progroupSelected) : this.data.progroups[0];
      this.data.projects = this.data.projects ? this.data.projects : this.data.progroupSelected.projects;
      this.sort(this.data.projects);
      this.data.projectSelected = this.data.projectSelected ? this.data.projectSelected : this.data.progroupSelected.projects[0];
      this.$emit('initData', { //初始化数据
        progroup: this.data.progroupSelected,
        project: this.data.projectSelected
      });
      this.supr(this.data);
    },
    changeProject: function () { //切换项目列表
      this.data.projects = [].concat(this.data.progroupSelected.projects);
      this.sort(this.data.projects);
      this.data.projectSelected = this.data.projects[0];
    },
    findProgroupById: function (id) { //根据id查找progroup
      return this.data.progroups.find(function (item) {
        return item.id === id;
      });
    },
    select: function (event, key) { //select2的change事件处理（key=0:项目组选择框,key=1:项目选择框）
      switch (key) {
        case 0 :
          if (this.data.progroupError && event.selected.id) {
            this.data.progroupError = false;
          }
          this.data.progroupSelected = this.findProgroupById(event.selected.id);
          this.changeProject();
          this.$refs.select2.$updateSource(this.data.projects, this.data.projectSelected);
          this.$emit('changeProject', { //更改项目
            project: this.data.projectSelected
          });
          break;
        case 1:
          if (this.data.projectError && event.selected.id) {
            this.data.projectError = false;
          }
          this.data.projectSelected = event.selected;
          this.$emit('changeProject', {//更改项目
            project: this.data.projectSelected
          });
          break;
        default:
          break;
      }
    },
    sort: function (list) {
      list.sort(function (a, b) {
        return a.type !== b.type ? a.type - b.type : a.name.localeCompare(b.name, 'zh-CN');
      });
    }
  });
  return cascadeSelect;

});
