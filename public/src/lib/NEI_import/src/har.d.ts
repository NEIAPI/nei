/**
 * Created by abnerzheng on 2017/10/23.
 */
/**
 * har本来就是个json格式的文件，无需转换
 * 由chrome导出的har会将该网页所有的请求都导出来，放在log.entries字段里
 * @param harContent
 */
import { Har } from "har-format";
import { NEIInterfaceBean } from "./NEIInterfaceBean";
export default function processHar(harContent: Har): NEIInterfaceBean[];
