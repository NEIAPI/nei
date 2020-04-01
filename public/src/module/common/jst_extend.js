/*
 * jst 扩展方法
 */
NEJ.define([
  'base/util',
  'util/template/jst',
  'base/element',
  'json!3rd/fb-modules/config/db.json',
  'pro/cache/interface_cache'
], function (util, jst, e, db, _interCache, pro) {

  var cUtil = {

    getColValue: function (config, obj, objState, isPinyin) {
      var value;
      var key = isPinyin ? config.keyPinyin : config.key;
      if (!key) {
        return '';
      }
      switch (config.valueType) {
        case 'method':
          value = this.getMethod(obj[key]);
          break;
        case 'tag':
          value = this.getTag(obj[key]);
          break;
        case 'testcase':
          value = this.getTestcase(obj[key], obj);
          break;

        case 'deepKey':
          if (key === 'status.name') {
            value = this.getStatus(obj['status']);
          } else if (key === 'forbidStatusDisplay.name') {
            value = this.getForbidStatus(obj['forbidStatusDisplay'])
          } else {
            value = this.getDeepValue(key, obj);
            value = config.noEscape ? value : this.escape2(value);
          }
          break;

        case 'time':
          value = this.getTime(obj[key], true);
          break;

        case 'expireTime':
          value = this.getExpireTime(obj[key], true);
          break;

        case 'datatypeFormat':
          value = this.datatypeFormat(obj[key], obj);
          break;

        case '__nei-actions':
          return objState['__nei-actions'] || '';

        case 'auditReason':
          return objState['auditReason'] || '';

        case 'messageContent':
          var content = config.noEscape ? obj[key] : this.escape2(obj[key]);
          return this.getMessageContent(content);

        case 'share':
          value = this.getShare(obj[key]);
          break;

        case 'isConfirmed':
          value = this.getIsConfirmed(obj[key]);
          break;

        case 'lock':
          value = this.getLock(obj[key]);
          break;

        case 'testResult':
          value = this.getTestResultIcon(obj[key]);
          break;

        case 'constraintType':
          value = this.getConstraintType(obj[key]);
          break;

        case 'associatedWord':
          value = this.getAssociateWord(obj[key]);
          break;

        case 'pat-privilege':
          value = this.getPatPrivilege(obj[key]);
          break;

        default:
          value = config.noEscape ? obj[key] : this.escape2(obj[key]);
          break;
      }
      // undefined or null
      if (value == undefined) {
        value = '';
      }
      return String(value);
    },
    //获取消息内容信息
    getMessageContent: function (content) {
      return '<span class="content-title" title="' + content + '">' + content + '</span>';
    },

    getColTitle: function (config, obj) {
      switch (config.valueType) {
        case 'deepKey':
          return this.escape2(this.getDeepValue(config.key, obj));

        case 'tag':
          return '';

        case 'time':
          return this.getTime(obj[config.key]);

        case 'datatypeFormat':
          return this.datatypeFormat(obj[config.key], obj);

        case 'share':
          return this.getShareTitle(obj[config.key]);

        case 'isConfirmed':
          return this.getIsConfirmedTitle(obj[config.key]);

        case 'lock':
          return this.getLockTitle(obj[config.key]);

        case 'constraintType':
          return this.getConstraintType(obj[config.key]);

        case 'testcase':
          return this.getTestcaseInfoTile(obj[config.key]);

        case '__nei-actions':
          return '';

        case 'testResult':
          return this.getTestResult(obj[config.key]);

        case 'notificationTitle':
          // 后端已经转义过, 并且有超链接
          return this.escape2(this.getText(obj[config.key]));

        default:
          return this.escape2(obj[config.key]);
      }
    },
    getMethod: function (method) {
      return method.slice(0, 3);
      // 不同的方法添加不同的颜色
      // var method = method.slice(0, 3);
      // return '<em class="req-method method-' + method.toLowerCase() + '">' + method + '</em>';
    },
    getTestcase: function (testcaseInfo, itf) {
      var href = '/test/group/case?pgid=' + itf.progroupId + '&pid=' + itf.projectId + '&iid=' + itf.id;
      if (testcaseInfo.count === 0) {
        return '<a class="tag-item warn-item test-case-tags stateful" href="' + href + '"><em>无</em></a>';
      }
      return '' +
        '<a class="tag-item tag-group test-case-tags stateful" href="' + href + '">' +
        '<em class="success-item">' + testcaseInfo.passCount + '</em>' +
        '<em class="fail-item">' + testcaseInfo.failedCount + '</em>' +
        '<em class="disable-item">' + testcaseInfo.disabledCount + '</em>' +
        '</a>';
    },
    getShare: function (isShared) {
      var str = '';
      if (isShared) {
        str = '<em class="glyphicon glyphicon-share-alt"></em>';
      }
      return str;
    },
    getIsConfirmed: function (isConfirmed) {
      if (isConfirmed == null || isConfirmed) {
        return '';
      }
      return '<em class="glyphicon glyphicon-warning-sign"></em><div class="u-tooltip top u-tooltip-unconfirmed u-fade"><div class="tooltip-arrow"></div><div class="tooltip-inner">接口变更后还有未确认的关注者，点击查看变更记录</div></div>';

    },
    getLock: function (isLock) {
      var str = '';
      if (isLock) {
        str = '<em class="u-icon-lock-pressed"></em>';
      }
      return str;
    },
    getShareTitle: function (isShared) {
      return isShared ? '共享资源' : '';
    },
    getIsConfirmedTitle: function (isConfirmed) {
      // title 使用气泡提示
      return '';
    },
    getLockTitle: function (isLock) {
      return isLock ? '已被锁定' : '';
    },
    getTag: function (tag) {
      var str = '';
      if (!tag) {
        return str;
      }
      var tags = tag.split(',');
      tags.forEach(function (tag) {
        var escapeTag = this.escape2(tag);
        str += '<span class="tag-item" title="' + escapeTag + '"><em>' + escapeTag + '</em></span>';
      }, this);
      return str;
    },
    getTag2: function (tags, className) {
      className = className || 'tag-item'
      var str = '';
      tags.forEach(function (tag) {
        var tagTitle;
        var tagName;
        if (typeof tag === 'string') {
          tagName = tagTitle = this.escape2(tag);
        } else {
          tagTitle = this.escape2(tag.title);
          tagName = tag.name;
        }
        str += '<span class="' + className +'" title="' + tagTitle + '"><em>' + tagName + '</em></span>';
      }, this);
      return str;
    },
    getAssociateWord: function (word) {
      var str = '';
      if (!word) {
        return str;
      }
      var words = word.split(',');
      words.forEach(function (word) {
        var escapeWord = this.escape2(word);
        str += '<span class="word-item" title="' + escapeWord + '"><em>' + escapeWord + '</em></span>';
      }, this);
      return str;
    },
    getPatPrivilege: function (pat) {
      var privileges = (pat >>> 0).toString(2).padStart(2, 0).split('');
      var result = [];
      if (privileges[0] === '1') {
        result.push('读');
      }
      if (privileges[1] === '1') {
        result.push('写');
      }
      return result.join('，');
    },
    getStatus: function (statusObj) {
      var systemList = _interCache._$systemStatusList;
      var status = systemList.find(function (it) {
        return it.id === statusObj.id;
      });
      var statusContent = '<span class="status-item" title="' + statusObj.name + '" style="background-color:' +
        status.bgColor + '"><em>' + statusObj.name + '</em></span>';
      //审核失败的要写明原因
      if (statusObj.id === db.STATUS_SYS_AUDIT_FAILED) {
        statusContent = '<span class="status-item" title="' + statusObj.name + '" style="background-color:' +
          status.bgColor + '"><div class="u-tooltip u-tooltip-audit right u-fade"><div class="tooltip-arrow"></div><div class="tooltip-inner">失败原因：' + (statusObj.reason ? this.escape2(statusObj.reason) : '未填写') + '</div></div><em>' + statusObj.name + '</em></span>';
      }
      return statusContent;
    },
    getStatus2: function (statusObj, statusName) {
      var bgColor = statusObj.bgColor;
      // 参数词库禁用状态复用该函数，statusObj内已携带bgColor, 无需查询
      if (!statusObj.bgColor) {
        var systemList = _interCache._$systemStatusList;
        var status = systemList.find(function (it) {
          return it.id === statusObj.id;
        });
        bgColor = status.bgColor;
      }
      return '<span class="status-item" title="' + statusObj.name + '" style="background-color:' +
        bgColor + '"><em>' + statusName + '</em></span>';
    },
    getForbidStatus: function(statusObj) {
      return '<span class="status-item" title="' + statusObj.name + '" style="background-color:' +
        statusObj.bgColor + '"><em>' + statusObj.name + '</em></span>';
    },
    getDeepValue: function (key, obj) {
      var keys = key.split('.');
      var value = obj[keys[0]];
      var k;
      keys.shift();
      while (k = keys.shift()) {
        value = value ? value[k] : '';
      }
      return value;
    },
    textClean: function (str) {
      var resultStr = str.replace(/\ +/g, ""); //去掉空格
      resultStr = resultStr.replace(/[ ]/g, ""); //去掉空格
      resultStr = resultStr.replace(/[\r\n]/g, ""); //去掉回车换行
      return resultStr;
    },
    getTime: function (time, short) {
      if (time) {
        return util._$format(new Date(parseInt(time)), 'yyyy/MM/dd HH:mm:ss');
      }
      return '';
    },
    getExpireTime: function (time, short) {
      time = parseInt(time, 10);
      if (isNaN(time)) {
        return '永久有效';
      }
      var date = util._$format(new Date(time), 'yyyy/MM/dd HH:mm:ss');
      if (date && Date.now() > time) {
        return '<span class="expire-time">' + date + '</span>';
      }
      return date;
    },

    getTestResult: function (result) {
      var _resultStr = '';
      switch (result) {
        case db.API_TST_TODO:
          _resultStr = '待开始';
          break;
        case db.API_TST_FAILED:
          _resultStr = '测试失败';
          break;
        case db.API_TST_PASS:
          _resultStr = '测试通过';
          break;
        default:
          _resultStr = '测试失效';
          break;
      }
      return _resultStr;
    },

    datatypeFormat: function (format, obj) {
      var _resultStr = '';
      switch (format) {
        case db.MDL_FMT_HASH:
          if (obj.id === 10000) {
            _resultStr = '可变';
          } else {
            _resultStr = '哈希';
          }
          break;
        case db.MDL_FMT_ENUM:
          _resultStr = '枚举';
          break;
        case db.MDL_FMT_ARRAY:
          _resultStr = '数组';
          break;
        case db.MDL_FMT_STRING:
          _resultStr = '字符';
          break;
        case db.MDL_FMT_NUMBER:
          _resultStr = '数值';
          break;
        case db.MDL_FMT_BOOLEAN:
          _resultStr = '布尔';
          break;
        case db.MDL_FMT_FILE:
          _resultStr = '文件';
          break;
        case db.MDL_FMT_HASHMAP:
          _resultStr = '集合';
          break;
        default:
          _resultStr = '未知';
          break;
      }
      return _resultStr;
    },

    getTestResultIcon: function (result) {
      var _result = '';
      switch (result) {
        case db.API_TST_TODO:
          _result = '<i class="u-icon-waiting-test-normal"></i>';
          break;
        case db.API_TST_FAILED:
          _result = '<i class="u-icon-state-fail-normal"></i>';
          break;
        case db.API_TST_PASS:
          _result = '<i class="u-icon-state-done-normal"></i>';
          break;
        default:
          _result = '<i class="u-icon-alert-normal-2"></i>';
      }
      return _result;
    },

    getConstraintType: function (type) {
      return {
        0: '所有类型'
      }[type || 0];
    },

    getTestcaseInfoTile: function (testcaseInfo) {
      if (testcaseInfo.count === 0) {
        return '该接口没有测试用例。建议给每个接口添加测试用例，保证接口的正确性。选中接口后，点击上方的“新建测试”可以为该接口添加测试用例。';
      }
      return '用例成功数量/失败数量/失效数量(接口有修改，用例未重新运行)';
    },

    escapeHtml: function (str) {
      if (str === undefined) {
        return '';
      }
      var _html_seed = jst._$add('${value|escape}');
      return jst._$get(_html_seed, {
        value: str
      });
    },

    escapeHtml2: function (str) {
      if (str === undefined) {
        return '';
      }
      var _html_seed = jst._$add('${value|escape2}');
      return jst._$get(_html_seed, {
        value: str
      });
    },

    getText: function (str) {
      var div = e._$create('div');
      div.innerHTML = str;
      return div.innerText;
    },

    escape2: function (string) {
      // jst 的 escape 会把换行转成 <br/>, 还会把空格转成 &nbsp;, 有时不适用
      /*
       * from escape-html
       * Copyright(c) 2012-2013 TJ Holowaychuk
       * Copyright(c) 2015 Andreas Lubbe
       * Copyright(c) 2015 Tiancheng "Timothy" Gu
       * MIT Licensed
       */
      if (typeof string === 'undefined') {
        return '';
      }
      var matchHtmlRegExp = /["'&<>]/;
      var str = '' + string;
      var match = matchHtmlRegExp.exec(str);
      if (!match) {
        return str;
      }
      var escape;
      var html = '';
      var index;
      var lastIndex = 0;
      for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
          case 34: // "
            escape = '&quot;';
            break;
          case 38: // &
            escape = '&amp;';
            break;
          case 39: // '
            escape = '&#39;';
            break;
          case 60: // <
            escape = '&lt;';
            break;
          case 62: // >
            escape = '&gt;';
            break;
          default:
            continue;
        }
        if (lastIndex !== index) {
          html += str.substring(lastIndex, index);
        }
        lastIndex = index + 1;
        html += escape;
      }
      return lastIndex !== index ?
        html + str.substring(lastIndex, index) :
        html;
    },
    // 人员列表姓名
    filterUserRealnames: function (users, defaultText) {
      var names = users.map(function (user) {
        return user.realname;
      }).join('、');
      return names.length ? names : defaultText;
    }
  };

  jst._$extend(cUtil);

  util._$merge(pro, cUtil);

});
