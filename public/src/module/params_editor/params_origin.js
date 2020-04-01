/*
 * 参数编辑器-基类组件------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'util/cache/share',
  'pro/datatype_select/datatype_select',
  'pro/generate_rule/generate_rule'
], function (base, v, u, e, _, t, DatatypeSelect, GRule) {
  var Origin = base.extend({
    init: function () {

    },
    createExp: function (index, key) {
      var that = this;
      var modal = new GRule({
        data: {
          pid: this.data.pid,
          value: that.data.params[index][key]
        }
      }).$on('ok', function (val) {
        that.data.params[index][key] = val;
        that.$update();
      });
    },
    _onSelectChange: function (item, index) {
      if (!item) return;
      this.data.params[index].type = item.type;
      this.data.params[index].typeName = item.typeName;
      this.data.params[index].isArray = item.isArray;
    },
    validate: function () {
      var _params = this.data.params;
      var tmp = [], tmp2 = [], that = this;
      var verifyName = this.data.verifyName;
      var validateItem = function (verifies, item) {
        if (item[verifyName] == '') {
          return;
        } else if (verifies.indexOf(item[verifyName]) < 0) {
          verifies.push(item[verifyName]);
          item['error'] = false;
        } else {
          that.hasError = true;
          item['error'] = true;
        }
        if (item.hasOwnProperty('params')) {
          item.params.forEach(function (item2) {
            validateItem(tmp2, item2);
          });
        }
      };
      for (var i = 0, len = _params.length; i < len; i++) {
        validateItem(tmp, _params[i]);
      }
      this.$update();
    },
    /**
     * 参数编辑器校验
     * @returns {*}
     */
    checkValidate: function () {
      this.hasError = false;
      this.validate();
      if (this.hasError) {
        return {
          msg: '参数名错误或者重名',
          pass: false
        };
      } else {
        return {
          msg: '',
          pass: true
        };
      }
    },
    /**
     * 返回编辑器参数
     * @returns {Object} 包含format和params
     */
    getParams: function () {
      //遍历，将verifyName不为空的内容提取出来
      var that = this, params = [];
      this.data.params.forEach(function (item) {
        if (item[that.data.verifyName] != '') {
          var obj = u._$merge({}, item);
          delete obj.error;
          if (item.hasOwnProperty('params')) { //这里params可能会有嵌套的情况
            // var list = [];
            // item.params.forEach(function (item2) {
            //     if (item2[that.data.verifyName] != "") {
            //         list.push(u._$merge({}, item2));
            //     }
            // });
            // obj.params = list;
            var _result = this.assortParamsAndImports(item.params);
            item.attrs = _result.attrs;
            item.imports = _result.imports;
            // delete  item.params;
          }
          params.push(obj);
        }
      }, this);
      return {format: this.data.format, params: params};
    },
    /**
     * 删除空行
     * @return {Void}
     */
    removeEmpty: function () {
      var that = this, tml = this.data.params.slice(0);
      u._$reverseEach(this.data.params, function (item, index) {
        if (item[that.data.verifyName] == '') {
          tml.splice(index, 1);
        }
        delete item.error;
        // delete item.typeName;
      });
      this.data.params = tml;
    },
    /**
     * 全屏toggle操作
     */
    doFullScreen: function () {
      var _node = this.parentNode;
      var pnode = _node.parentNode;
      var arrNode = [];
      if (!this.data.isFullScreen) {
        while (pnode && pnode.nodeName.toLowerCase() != 'html') {
          var _value = e._$getStyle(pnode, 'position');
          if (_value == 'relative' || _value == 'absolute') {
            arrNode.push({
              node: pnode,
              prop: _value
            });
          }
          pnode = pnode.parentNode;
        }
        ;
      } else {
        while (pnode && pnode.nodeName.toLowerCase() != 'html') {
          if (e._$hasClassName(pnode, 'full-screen')) {
            arrNode.push({
              node: pnode
            });
          }
          pnode = pnode.parentNode;
        }
        ;
      }
      var that = this;
      var escHandle = function (event) {
        event.witch = event.keyCode || event.witch;
        if (event.witch == 27) {
          that.doFullScreen();
        }
      };
      if (!this.data.isFullScreen) {
        e._$style(_node, {
          'position': 'fixed',
          'width': document.documentElement.clientWidth + 'px',
          'height': document.documentElement.clientHeight + 'px',
          'left': '0px',
          'padding': '30px',
          'top': '0px',
          'background': '#fff',
          'z-index': '99',
          'box-sizing': 'border-box',
          'overflow': 'scroll'
        });
        arrNode.forEach(function (item) {
          e._$setStyle(item.node, 'position', 'static');
          e._$addClassName(item.node, 'full-screen');
        });
        this.data.isFullScreen = true;
        v._$addEvent(window, 'keyup', escHandle);
      } else {
        _node.style = null;
        arrNode.forEach(function (item) {
          item.node.style = null;
          e._$delClassName(item.node, 'full-screen');
        });
        this.data.isFullScreen = false;
        v._$delEvent(window, 'keyup', escHandle);
      }
    },
    /**
     * 将普通参数和导入的参数分类
     * @param attrs
     * @returns {{attrs: Array, imports: ({}|*)}}
     */
    assortParamsAndImports: function (attrs) {
      _imports = {}, _params = [];
      //将导入的参数放进imports里面去
      u._$forEach(attrs, function (item) {
        if (item.parentId) {
          if (_imports.hasOwnProperty(item.parentId)) {
            _imports[item.parentId].push(item);
          } else {
            _imports[item.parentId] = [item];
          }
          //   _imports.push(item);
        } else {
          _params.push(item);
        }
      });
      //将导入的参数进行归类
      _imports = this.getImportsParams(_imports);
      return {
        attrs: _params,
        imports: _imports
      };
    },
    /**
     * 返回编辑器的参数
     * @returns {{result: {format: *, imports: {}, params: Array}, msg: string, pass: boolean}}
     */
    $getEditorParams: function () {
      var _format = this.data.format,
        _validateResult = this.checkValidate(),
        _attributes = this.getParams();
      var _obj = this.assortParamsAndImports(_attributes.params);
      var _imports = _obj.imports;
      var _params = _obj.attrs;
      return {
        result: {
          format: _format,
          imports: _imports,
          params: _params
        },
        msg: _validateResult.msg,
        pass: _validateResult.pass
      };
    },
    /**
     * 添加导入参数的时候进行转换成后端对应的参数格式
     * @param _imports
     * @returns {Array}
     * @private
     */
    getImportsParams: function (_imports) {
      //将导入的参数进行归类
      var _temp = [];
      u._$forIn(_imports, function (value, key) {
        var _obj = {
          id: key,
          vars: []
        };
        value.forEach(function (item) {
          if (item.originals) {
            var varObj = {}, flag = false;
            if (item.attrs) {
              varObj.attrs = item.attrs;
              varObj.imports = item.imports;
              flag = true;
            } else {
              for (var key in item.originals) {
                if (item.originals[key] != item[key]) {
                  varObj[key] = item[key];
                  flag = true;
                }
              }
            }

            if (flag) {
              varObj.id = item.id;
              _obj.vars.push(varObj);
            }

          }
        });

        _temp.push(_obj);
      });
      return _temp;
    },
    destroy: function () {
      this.supr();
      this.__expr = this.__expr && this.__expr._$recycle();
    }
  });
  return Origin;
});
