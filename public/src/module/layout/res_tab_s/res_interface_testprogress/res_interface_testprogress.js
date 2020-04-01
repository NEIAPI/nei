/*
 * 接口测试进度模块-------------------------------------------------
 */
NEJ.define([
  'base/element',
  'base/event',
  'base/util',
  'pro/modal/modal',
  'pro/common/util',
  'pro/cache/testcase_cache',
  'pro/cache/interface_cache',
  'text!./res_interface_testprogress.html',
  'css!./res_interface_testprogress.css'
], function (e, v, u, Modal, _, cache, infCache, tpl, css) {
  e._$addStyle(css);
  var modal = Modal.extend({
    config: function () {
      _._$extend(this.data, {
        'contentTemplate': tpl,
        'class': 'm-modal-testprogress',
        'title': '测试进度',
        'closeButton': true,
        'okButton': false,
        'cancelButton': false,
        queue: [],
        finishNum: 0,
        unfinishNum: 0
      });

      //本地cache测试用例列表
      this.__cache = cache._$$CacheTestCase._$allocate({});
      this.data.infCache = infCache._$$CacheInterface._$allocate({});
      this.data.queue = this.__cache._$getAllTestList() || [];
      this.__cache.__doInitDomEvent([
        [cache._$$CacheTestCase, 'update', this._onUpdateCb._$bind(this)]
      ]);
      this._calcState();
      this.supr();
    },
    computed: {
      testcases: {
        get: function (data) {
          return data.queue.map(function (item) {
            return item.testcase;
          });
        }
      }
    },
    remove: function (index) {
      this.data.queue.splice(index, 1);
      this.data.unfinishNum--;
      this.$update();
    },
    _onUpdateCb: function (option) {
      this.data.queue.forEach(function (item, index) {
        if (option.data.id == item.testcase.id && (option.data.state == 1 || option.data.state == 2)) {
          if (this.data.finishNum < this.data.queue.length) {
            this.data.finishNum++;
            this.data.unfinishNum = this.data.queue.length - this.data.finishNum;
          }
        }
      }._$bind(this));
      this.$update();
    },
    _calcState: function () {
      var finishNum = 0;
      this.data.queue.forEach(function (item) {
        if (item.testcase.state == 1 || item.testcase.state == 2) {
          finishNum++;
        }
      }._$bind(this));
      this.data.finishNum = finishNum;
      this.data.unfinishNum = this.data.queue.length - this.data.finishNum;
    },
    _redirect: function (pgid, pid, iid, id) { // @todo 本地测试跳转判断
      dispatcher._$redirect('/test/group/report/?pgid=' + pgid + '&pid=' + pid + '&iid=' + iid + '&id=' + id);
      this.destroy();
    },
    destroy: function () {
      this.__cache._$recycle();
      this.data.infCache._$recycle();
      this.supr();
    }
  });
  return modal;
});
