"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var NEISwagger_1 = require("./NEISwagger");
var swagger_parser_1 = require("swagger-parser");
addEventListener('message', function (message) {
    var data = JSON.parse(message.data);
    if (data[0].file.name.endsWith("yaml")) {
        NEISwagger_1.default(swagger_parser_1.YAML.parse(data[0].content)).then(function (inters) {
            postMessage(inters);
        });
    }
    else {
        NEISwagger_1.default(JSON.parse(data[0].content)).then(function (inters) {
            postMessage(inters);
        });
    }
});
//# sourceMappingURL=NEISwaggerWorker.js.map