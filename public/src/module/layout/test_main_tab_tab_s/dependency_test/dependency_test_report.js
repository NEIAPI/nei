/*
 * 依赖测试报告
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/common/jst_extend',
  'pro/cache/testcase_cache',
  'pro/layout/test_main_tab_tab_s/test_report/head',
  'pro/ace/ace',
  'text!./dependency_test_report.html',
  'css!./dependency_test_report.css'
], function (rb, v, u, e, util, jstExt, caseCache, Head, aceEditor, html, css) {
  // 加载一次
  e._$addStyle(css);

  Regular.filter({
    'escape': function (data) {
      return jstExt.escape2(data);
    }
  });

  var DependencyTestReport = rb.extend({
    name: 'dependency-test-report',
    template: html,
    config: function () {
      this._caseCache = caseCache._$$CacheTestCase._$allocate();
      this.data.reports = this.data.reports || [];
      this.data.reports.forEach(function (res, index) {
        this.getDisplayReport(res, index);
      }, this);
    },
    addReport: function (report) {
      this.data.reports.push(this.getDisplayReport(report, this.data.reports.length));
      this.$update();
    },
    getDisplayReport: function (report, index) {
      var getPathHtml = function (paths, stack) {
        var index = -1;
        var layer = [];
        paths.forEach(function (tc, idx) {
          if (Array.isArray(tc)) {
            index = idx;
          } else {
            layer.push(tc.name);
          }
        });
        layer = layer.map(function (name) {
          return '<span class="t-item" title="' + jstExt.escape2(name) + '">' + jstExt.escape2(name) + '</span>';
        });
        stack.push(layer.join('\n'));
        if (index !== -1) {
          getPathHtml(paths[index], stack);
        }
        return stack;
      };
      if (Array.isArray(report.path)) {
        var pHtml = getPathHtml(report.path, []);
        pHtml = pHtml.reverse().map(function (html) {
          return '<div class="layer">' + html + '</div>';
        }).join('<span class="arrow"><i class="glyphicon glyphicon-arrow-right"></i></span>');
        report.path = '执行结果：' + pHtml;
      }
      if (report.testcase && !report.testcase.updatedata.data.report) {
        report.errors = this._caseCache._$check({
          datatypes: this.data.datatypes,
          format: report.interface.resFormat,
          resDefine: report.interface.params.outputs,
          resData: report.testcase.updatedata.data.resData,
          resHeader: report.testcase.updatedata.data.resHeader,
          resExpect: report.testcase.resExpect,
          resHeaderExpect: report.testcase.resExpectHeader,
          checkRequiredParam: this.data.checkRequiredParam
        });
      }
      if (report.testcase) {
        report.index = index;
        report.resHeader = JSON.parse(report.testcase.updatedata.data.resHeader);
        report.resData = report.testcase.updatedata.data.report ? report.testcase.updatedata.data.report : JSON.parse(report.testcase.updatedata.data.resData);
        report.displayResData = JSON.stringify(report.resData, null, '  ');
      }
      return report;
    },
    clear: function () {
      this.data.reports.length = 0;
      this.$update();
    },
    setReports: function (reports) {
      reports.forEach(function (res, index) {
        this.getDisplayReport(res, index);
      }, this);
      this.data.reports = reports;
      this.$update();
    },
    toggleShow: function (report) {
      report.show = !report.show;
      if (report.show) {
        setTimeout(function () {
          if (report.errors) {
            this.$refs['data_' + report.index].$highlight(report.errors[0]);
            this.$refs['header_' + report.index].$highlight(report.errors[1]);
            this.$update();
          }
        }.bind(this), 0);
      }
    },
    destroy: function () {
      this._caseCache._$recycle();
      this.supr();
    }
  });

  return DependencyTestReport;
});
