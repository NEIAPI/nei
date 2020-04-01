"use strict";
// 调试文件
/**
 * Created by abnerzheng on 2017/10/27.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var SwaggerParser = require("swagger-parser");
var path = './test/Swagger.yaml';
SwaggerParser.parse(path).then(function (api) {
    console.log(JSON.stringify(api));
});
//# sourceMappingURL=swaggerPrinter.js.map