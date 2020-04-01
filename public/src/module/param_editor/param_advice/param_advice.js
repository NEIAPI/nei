/**
 * 参数词库输入建议框组件
 */
NEJ.define([
  'pro/common/regular/regular_base',
  'base/event',
  'base/util',
  'base/element',
  'pro/common/util',
  'pro/common/jst_extend',
  './algo.js',
  '../param_editor_config.js',
  'json!3rd/fb-modules/config/db.json',
  'text!./param_advice.html',
  'text!./param_advice.css',
], function (rb, v, u, e, util, jstex, algo, editorConfig, dbConst, html, css) {
  // 加载一次
  e._$addStyle(css);

  var defaultOptions = {
    pid: '', // 项目id
    words: [], // 参数字典
    normalWords: [], // 未禁用的参数字典
    userInput: '', // 用户输入
    //errorMsg: editorConfig.editorErrorMap.NOT_IN_WORD_STOCK.msg,
    minLD: 2, // 最小LD距离，大于该距离的不会纳入建议词。
  };

  var ParamAdvice = rb.extend({
    name: 'param-advice',
    template: html,
    config: function () {
      this.data = u._$merge({}, defaultOptions, this.data);

      var tmpMap = {};

      this.data.normalWords = this.data.words.filter(function (w) {
        return w.forbidStatus === dbConst.WORD_STATUS_NORMAL;
      });

      // 建立用户关联词Map。
      this.data.normalWords.forEach(function (word) {
        if (word.associatedWord && word.associatedWord !== '') {
          var targetList = word.associatedWord.split(',');
          targetList
            .map(function (t) {
              return t.trim();
            })
            .forEach(function (target) {
              if (!tmpMap[target]) {
                tmpMap[target] = [];
              }
              tmpMap[target].push(word.name);
            });
        }
      });
      this.data.userDefinedMap = tmpMap;
    },
    init: function () {
      this.clickCallbacker = function (event) {
        const rectObject = this.$refs.layout.getBoundingClientRect();
        var isClickOuter = false;
        if (event.pageX < rectObject.left || event.pageX > rectObject.right) {
          isClickOuter = true;
        }
        if (event.pageY < rectObject.top || event.pageY > rectObject.bottom) {
          isClickOuter = true;
        }
        if (isClickOuter) {
          this.destroy();
        }

      }.bind(this);

      setTimeout(function () {
        window.addEventListener('click', this.clickCallbacker);
      }.bind(this), 200);
    },
    destroy: function () {
      this.supr();
      window.removeEventListener('click', this.clickCallbacker);
    },
    computed: {
      errorMsg: function (data) {
        var word = data.words.find(function (w) {
          return w.name === data.userInput;
        });
        if (word && word.forbidStatus !== dbConst.WORD_STATUS_NORMAL) {
          return '参数名在参数字典内被禁用';
        }
        return editorConfig.editorErrorMap.NOT_IN_WORD_STOCK.msg;
      },
      advices: function (data) {
        if (!data.userInput) {
          return;
        }
        // 如果命中了用户定义的关联词，则直接返回
        if (data.userDefinedMap[data.userInput]) {
          return data.userDefinedMap[data.userInput];
        }

        // 基于字符串的每一位的字符进行基数排序
        function radixSort(list) {
          var compareString = data.userInput;
          var compareLen = compareString.length;

          function getDiff(candidate, index) {
            if (candidate[index]) {
              return Math.abs(compareString.charCodeAt(index) - candidate.charCodeAt(index));
            }
            return 999;
          }

          for (var i = compareLen - 1; i >= 0; i--) {
            list.sort(function (a, b) {
              return getDiff(a.name, i) - getDiff(b.name, i);
            });
          }
        }

        var matchList = this.$get('matchWords')
          .filter(function (w) {
            return w.ld <= data.minLD;
          });

        radixSort(matchList);

        return matchList
          .sort(function (a, b) {
            return a.ld - b.ld;
          })
          .slice(0, 5)
          .map(function (w) {
            return w.name;
          });
      },
      matchWords: function (data) {
        if (!data.userInput) {
          return;
        }

        const matchWords = data.normalWords
          .filter(function (w) {
            return Math.abs(w.name.length - data.userInput.length) <= data.minLD;
          })
          .map(function (w) {
            return {
              name: w.name,
              ld: algo.getLD(w.name, data.userInput)
            };
          })
          .sort(function (a, b) {
            return a.ld - b.ld;
          });
        return matchWords;
      }
    },
    clickAdvice: function (advice) {
      this.$emit('select', {
        advice: advice
      });
    }
  });

  ParamAdvice.getInstance = function (options) {
    ParamAdvice.recycleInstance();
    ParamAdvice._instnace = new ParamAdvice(options);
    return ParamAdvice._instnace;
  };

  ParamAdvice.recycleInstance = function () {
    if (ParamAdvice._instnace) {
      ParamAdvice._instnace.destroy();
      delete ParamAdvice._instnace;
    }
  };

  return ParamAdvice;
});
