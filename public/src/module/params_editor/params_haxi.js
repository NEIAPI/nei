/*
 * 参数编辑器-哈希组件------------------------------------------------
 */
NEJ.define([
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/notify/notify',
  'pro/params_editor/params_origin',
  'pro/params_import/datatype_import',
  'pro/params_import/json_import',
  'pro/params_import/interface_import',
  'pro/params_import/javabean_import',
  'text!./params_haxi.html'
], function (v, u, e, _, _notify, Origin, DTImport, JSImport, INTImport, JBImport, tpl) {
  var Haxi = Origin.extend({
    name: 'haxiEditor',
    template: tpl,
    config: function () {
      this.defaultParam = {
        isImport: _.db.CMN_BOL_NO,
        name: '',
        type: _.db.MDL_SYS_STRING,
        typeName: 'String',
        isArray: _.db.CMN_BOL_NO,
        description: '',
        defaultValue: '',
        genExpression: '',
        valExpression: ''
      };
      this.data.btns2 = ['add', 'datatype', 'json', 'interface', 'javabean']; //匿名类型btn
      if (this.data.params && this.data.params.length === 0) {
        this.data.params = null;
      }
      _._$extend(this.data, {
        params: [u._$merge({}, this.defaultParam)],
        hideTip: true,
        hasTip: true,
        isArray: 0,
        noArray: false,
        noObject: false,
        //校验的项
        verifyName: 'name',
        btns: ['add', 'datatype', 'json', 'interface', 'javabean'] //add 添加按钮暂时注释
      });
    },
    init: function () {
      this.supr();
      this.$on('changeObjectType', function (index, result) {
        this.data.params[index].type = result.id;
      });
    },
    add: function (items, position) { //position是添加位置，默认添加到最后
      items = items || [u._$merge({}, this.defaultParam)];
      items.forEach(function (item) {
        if (position != undefined) {
          this.data.params.splice(position++, 0, item);
        } else {
          this.data.params.push(item);
        }
      }.bind(this));
      this.$update();
    },
    import: function (type) {
      var modal = null;
      var that = this;
      switch (type) {
        case 'type':
          var getImportTypeList = function () {
            //只需要把哈希的类型显示出来就行,同时把已经导入的过滤掉(含嵌套导入)
            var arr = [];
            //把已经导入的过滤掉
            this.data.params.forEach(function (item) {
              if (item.parentId) {
                if (arr.indexOf(item.parentId) == -1) {
                  arr.push(item.parentId);
                }
              }
            }.bind(this));
            return arr;
          };
          var datatypeIdList = getImportTypeList.call(this);
          modal = new DTImport({
            data: {
              format: 0,
              pid: this.data.pid,
              noObject: this.data.noObject,
              hasImportList: datatypeIdList
            }
          });
          modal.$on('ok', function (list) {
            if (!list) return;
            that.removeEmpty();
            list.forEach(function (item) {
              var arr = _._$clone(item.params);
              //标记是否是导入类型 并且记录原始数据，可能有被复写的字段
              arr.map(function (item2) {
                item2.isImport = _.db.CMN_BOL_YES;
                item2.originals = {
                  type: item2.type,
                  defaultValue: item2.defaultValue,
                  genExpression: item2.genExpression,
                  valExpression: item2.valExpression,
                  description: item2.description
                };
                if (item2.type == _.db.MDL_SYS_VARIABLE) {
                  item2.originalType = item2.type;
                }
              });
              that.data.params = that.data.params.concat(arr);
            });
            that.add();
          });
          break;
        case 'json':
          modal = new JSImport({});
          modal.$on('ok', function (json) {
            that.removeEmpty();
            that.addJSONData(json);
            that.add();
          });
          break;
        case 'interface':
          modal = new INTImport({
            data: {
              source: [{
                name: 'GET', id: 'get'
              }, {
                name: 'POST', id: 'post'
              }]
            }
          });
          modal.$on('ok', function (json) {
            that.removeEmpty();
            that.addJSONData(json);
            that.add();
          });
          break;
        case 'javabean':
          modal = new JBImport({
            data: {
              pid: that.data.pid
            }
          });
          modal.$on('ok', function (javabean) {
            that.removeEmpty();
            that.add(javabean);
            that.add();
          });
          break;
        case 'type2': //匿名类型中，导入类型数据
          modal = new DTImport({
            data: {
              format: 0,
              pid: this.data.pid
            }
          });
          modal.$on('ok', function (list) {
            if (!list) return;
            var addList = [];
            that.removeEmpty();
            list.forEach(function (item) {
              item.params.forEach(function (param) {
                addList.push({
                  isImport: _.db.CMN_BOL_NO,
                  name: param.name,
                  type: param.type,
                  typeName: param.typeName,
                  isArray: _.db.CMN_BOL_NO,
                  description: param.description,
                  defaultValue: param.defaultValue,
                  genExpression: param.genExpression,
                  valExpression: param.valExpression
                });
              });
            });
            that.data.params = that.data.params.concat(addList);
            that.add();
          });
          break;

        default:
          break;
      }
    },
    remove: function (index) {
      var item = this.data.params[index];
      var that = this;
      if (item.isImport) {
        u._$reverseEach(that.data.params, function (item2, i) {
          //添加状态
          if (item.originals) {
            if (item2.parentId == item.parentId) {
              that.data.params.splice(i, 1);
            }
          } else {//修改状态
            if (item2.datatypeId == item.datatypeId) {
              that.data.params.splice(i, 1);
            }
          }

        });
      } else {
        that.data.params.splice(index, 1);
      }
      if (that.data.params.length == 0) {
        that.add();
      }
    },
    addJSONData: function (_json, position) {
      if (!_json) return;
      if (_json && _json instanceof Array) {
        _json = _json[0];
      }
      var _conf = {
        string: _.db.MDL_SYS_STRING,
        boolean: _.db.MDL_SYS_BOOLEAN,
        number: _.db.MDL_SYS_NUMBER
      };
      var items = [];
      for (var _p in _json) {
        var _type = typeof _json[_p];
        var _v, _t;
        if (_conf[_type]) {
          _v = _json[_p];
          _t = _type;
        } else {
          _v = _json[_p] === null ? '' : JSON.stringify(_json[_p]);
          _t = 'string';
        }
        _v = (_v.toString() || '').slice(0, 500);//如果默认值过长则直接截断
        items.push({
          name: _p,
          isImport: _.db.CMN_BOL_NO,
          typeName: _p,
          type: _conf[_t],
          isArray: _.db.CMN_BOL_NO,
          defaultValue: _v,
          description: '',
          genExpression: '',
          valExpression: ''
        });
      }
      this.add(items, position);
    },
    parseJson: function (event, index) { //name中输入json,直接解析json添加
      var value = event.target.value;
      try {
        var json = JSON.parse(value);
        if (typeof json === 'object') {
          this.remove(index);
          this.addJSONData(json, index);
        }
      } catch (er) {
      }
    },
    _onSelectChange: function (event, index) {
      this.supr(event, index);
      if (event.typeName == 'Object') { //进入匿名类型创建流程
        this.data.params[index].isObject = true;
        this.data.params[index].type = 0;//匿名类型的type设置为0
        this.data.params[index].params = [u._$merge({}, this.defaultParam)];
      } else {
        this.data.params[index].isObject = false;
        delete this.data.params[index].params;
      }
    },
    showTip: function () {
      this.data.hideTip = !this.data.hideTip;
    },
    destroy: function () {
      this.supr();
    }
  });
  return Haxi;
});
