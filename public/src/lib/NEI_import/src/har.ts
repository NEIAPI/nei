/**
 * Created by abnerzheng on 2017/10/23.
 */

/**
 * har本来就是个json格式的文件，无需转换
 * 由chrome导出的har会将该网页所有的请求都导出来，放在log.entries字段里
 * @param harContent
 */

import {Har} from "har-format";
import {NEIInterfaceBean} from "./NEIInterfaceBean"
import {URL} from "url"

export default function processHar(harContent: Har) {
    let entries = harContent.log.entries;
    let interfaces = entries.filter(it =>
        it.response.content.mimeType.indexOf("json") != -1 //第一轮筛选，我们认为只有json格式才可以被接受为接口
    );

    return interfaces.map(itr => {
        const request = itr.request;
        const method = request.method;
        const urlObj = new URL(request.url);
        let path:string;
        // 如果是GET请求，queryString里面的内容需要放到请求数据中
        // 如果是其他类型的请求，则将queryString都放到path里面
        let requestData:Object;
        if(method == "GET"){
            path = urlObj.pathname;
            requestData =  request.queryString;
        }else{
            path = urlObj.pathname + urlObj.search;
            requestData = JSON.parse(itr.request.postData.text);
        }
        // queryString 不必从path这里拿, har有提供, 这是一个json类型，直接让nei系统去判断类型
        let responseData = JSON.parse(itr.response.content.text);

        let neiBean = new NEIInterfaceBean();
        // neiBean.requestDatas = requestData;
        neiBean.method = method;
        // neiBean.responseDatas = responseData;
        neiBean.path = path;
        return neiBean;
    });
}