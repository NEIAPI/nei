/*
 * 数据模型选择组件-------------------------------------------------
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/select2/select2',
  'pro/modal/modal',
  'pro/cache/datatype_cache',
  'text!./datatype_select.html',
  'css!./datatype_select.css'
], function (base, v, u, e, _, select2, modal, cache, tpl, css) {
  e._$addStyle(css);
  //数据模型选择器内部的字段的id,name对应外部的是type和typeName
  var DatatypeSelect = base.extend({
    name: 'DatatypeSelect',
    template: tpl,
    config: function () {
      _._$extend(this.data, {
        source: [],
        selected: undefined,
        hasCreate: true,
        isArray: _.db.CMN_BOL_NO
      });
      if (this.data.type && this.data.typeName) {
        this.data.selected = {
          id: this.data.type,
          name: this.data.typeName
        };
      }
      if (this.data.selected && !this.data.source.length) {
        this.data.source.push(this.data.selected);
      }
      this.__pid = this.data.pid || '';
      // //变量映射不存在pid
      // if (!this.__pid) {
      //     this.supr();
      //     return;
      // }

      this.supr();
    },
    init: function () {
      this.supr();
      var listCacheKey = null;
      this.__cache = cache._$$CacheDatatype._$allocate({
        onlistload: function () {
          var _list = this.__cache._$getListInCache(listCacheKey);
          //过滤掉匿名类型
          _list = _list.filter(function (item) {
            return item.type != 2;
          });
          //如果是哈希类型需要过滤掉枚举类型
          var that = this;
          if (this.data.format == _.db.MDL_FMT_HASH || this.data.format == _.db.MDL_FMT_ARRAY) {
            // _list = _list.filter(function (item) {
            //     return item.format != _.db.MDL_FMT_ENUM;
            // });
          } else if (this.data.format == _.db.MDL_FMT_ENUM) {
            //枚举类型的值可以是自定义的数字或字符,系统类型的字符和数字的format等于0
            _list = _list.filter(function (item) {
              return item.format == _.db.MDL_FMT_STRING || item.format == _.db.MDL_FMT_NUMBER || item.id == _.db.MDL_SYS_STRING || item.id == _.db.MDL_SYS_NUMBER;
            });
          } else {
            _list = _list.filter(function (item) {
              return item.format == that.data.format;
            });
          }
          this.$refs.sel1.$updateSource(_list);
          if (this.data.isArray) {
            this.$refs.sel2.$updateSource(_list);
          }
        }.bind(this)
      });
      listCacheKey = this.__cache._$getListKey(this.__pid);
      this.__cache._$getList({
        key: listCacheKey,
        data: {
          pid: this.__pid
        }
      });

    },
    select: function (item) {
      this.supr(item);
    },
    _watchOpen: function (index) {
      if (index == 1) {
        if (this.$refs.sel2) {
          this.$refs.sel2.data.isOpen = false;
          this.$refs.sel2.$update();
        }
      } else {
        this.$refs.sel1.data.isOpen = false;
      }
    },
    //创建数据模型
    _onCreate: function (ref) {
      this.data.sourceRef = ref;
      var _modal = new modal({
        data: {
          'content': '',
          'title': ' ',
          'noTitle': true,
          'class': 'inline-create',
          'okButton': false,
          'cancelButton': false,
          'closeButton': true
        }
      }).$on('close', function () {
        dispatcher._$hide('/?/progroup/p/res/datatype/create/');
        _modal.destroy();
      });
      //弹窗的新建数据模型没有创建数据模型入口则不需要监听事件
      if (this.data.hasCreate) {
        this.__cache.__doInitDomEvent([
          [cache._$$CacheDatatype, 'add', function (result) {
            this.$refs[this.data.sourceRef].$select(result.data);
            //及时清除事件
            this.__cache.__doClearDomEvent();
          }._$bind(this)]
        ]);
      }
      dispatcher._$redirect('/?/progroup/p/res/datatype/create/?pid=' + this.__pid, {
        input: {
          // format: this.data.format,
          parent: _modal.$refs.modalbd,
          done: function () {
            dispatcher._$hide('/?/progroup/p/res/datatype/create/');
            // this.__cache._$clearEvent("add");
            _modal.destroy();
          }.bind(this)
        }
      });
    },
    _onChange: function (opt, level) {
      var item = opt.selected;
      if (!item) return;
      if (level == 0 && item.id == 'array') {//选择了数组
        this.data.isArray = _.db.CMN_BOL_YES;
        this.data.id = 10001;
        this.data.name = 'String';
      } else if (level == 0 && item.id != 'array') {
        this.data.isArray = _.db.CMN_BOL_NO;
        this.data.name = item.name;
        this.data.id = item.id;
      } else {
        this.data.name = item.name;
        this.data.id = item.id;
      }

      this.data.isOpen = false;

      this.data.selected = {
        id: this.data.id,
        name: this.data.name
      };
      // this.data.selected = item;
      //id,name对外是需要映射为type,typeName
      this.$emit('change', {
        sender: this,
        isArray: this.data.isArray,
        type: this.data.selected.id,
        typeName: this.data.selected.name
      });
    },
    destroy: function () {
      if (!!this.__cache) {
        this.__cache._$recycle();
      }
      this.supr();
    }
  });
  return DatatypeSelect;
});
