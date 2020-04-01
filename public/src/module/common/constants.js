/**
 * 一些常量
 * */
NEJ.define(function () {
  return {
    // 接口测试中环境管理的请求头参数类型
    PARAM_TYP_TEST_HOST_HEADER: 'PARAM_TYP_TEST_HOST_HEADER',
    // 接口修改数据模型，需要展示一个还未被插入的
    PARAM_TYP_MODIFY_DATATYPE: 'PARAM_TYP_MODIFY_DATATYPE',
    // JS保留字取值为es5严格模式，数据来自https://github.com/zxqfox/reserved-words/blob/master/lib/reserved-words.js
    CONSTRAINT_NAME_REGEX: '(?=(^[A-Za-z\u9fa5_\u9fa5-]+[A-Za-z0-9\u9fa5_\u9fa5-]*$))(?=(^(?!(break|do|instanceof|typeof|case|else|new|var|catch|finally|return|void|continue|for|switch|while|debugger|function|this|with|default|if|throw|delete|in|try|class|enum|extends|super|const|export|import|null|true|false|implements|let|private|public|yield|interface|package|protected|static)$)))'
  };
});
