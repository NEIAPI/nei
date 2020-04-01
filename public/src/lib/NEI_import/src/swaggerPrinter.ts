// 调试文件
/**
 * Created by abnerzheng on 2017/10/27.
 */

import {readFileSync} from "fs";
import * as SwaggerParser from "swagger-parser";
const path = './test/Swagger.yaml';
SwaggerParser.parse(path).then(api=>{
	console.log(JSON.stringify(api));
});
