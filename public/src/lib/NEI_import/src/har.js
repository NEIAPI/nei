"use strict";
/**
 * Created by abnerzheng on 2017/10/23.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var NEIInterfaceBean_1 = require("./NEIInterfaceBean");
var url_1 = require("url");
function processHar(harContent) {
    var entries = harContent.log.entries;
    var interfaces = entries.filter(function (it) {
        return it.response.content.mimeType.indexOf("json") != -1;
    } //第一轮筛选，我们认为只有json格式才可以被接受为接口
    );
    return interfaces.map(function (itr) {
        var request = itr.request;
        var method = request.method;
        var urlObj = new url_1.URL(request.url);
        var path;
        // 如果是GET请求，queryString里面的内容需要放到请求数据中
        // 如果是其他类型的请求，则将queryString都放到path里面
        var requestData;
        if (method == "GET") {
            path = urlObj.pathname;
            requestData = request.queryString;
        }
        else {
            path = urlObj.pathname + urlObj.search;
            requestData = JSON.parse(itr.request.postData.text);
        }
        // queryString 不必从path这里拿, har有提供, 这是一个json类型，直接让nei系统去判断类型
        var responseData = JSON.parse(itr.response.content.text);
        var neiBean = new NEIInterfaceBean_1.NEIInterfaceBean();
        // neiBean.requestDatas = requestData;
        neiBean.method = method;
        // neiBean.responseDatas = responseData;
        neiBean.path = path;
        return neiBean;
    });
}
exports.default = processHar;
//# sourceMappingURL=har.js.map