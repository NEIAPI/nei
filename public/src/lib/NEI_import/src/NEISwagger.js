"use strict";
/**
 * Created by abnerzheng on 2017/10/26.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var SwaggerParser = require("swagger-parser");
var db = require("./db.json");
var NEIInterfaceBean_1 = require("./NEIInterfaceBean");
var pathLib = require("path");
var FAKEINDEX;
function getDataTypeNameFromRef(ref) {
    var temp = ref.split("/");
    return temp[temp.length - 1];
}
function deepClone(parameter) {
    return JSON.parse(JSON.stringify(parameter));
}
/**
 * @param {Schema} schema
 * @return {Array<Parameter>}
 */
function helperParams(name, schema, processed, datatypes) {
    // base case
    var ret = [];
    var format = 0;
    if (!Object.keys(schema).length) {
        return NEIInterfaceBean_1.Parameter.createObjectParameter(name);
    }
    else if (name === null && schema.$ref) {
        // ref具有排他性, 在顶层，无name说明是导入
        return importDataTypeFromRef(schema.$ref, processed);
    }
    else if (name !== null && schema.$ref) {
        // 有名字时，这时候说明是引用, 这是base case之一
        var typeName = getDataTypeNameFromRef(schema.$ref);
        var parameter = new NEIInterfaceBean_1.Parameter();
        parameter.typeName = typeName;
        parameter.name = name;
        ret.push(parameter);
    }
    else if (schema.allOf) {
        schema.allOf.forEach(function (sch) {
            console.log(sch);
            var res = helperParams(null, sch, processed, datatypes);
            ret = ret.concat(res[0]);
        });
    }
    else if (name == null && schema.enum) {
        format = 1;
        ret = schema.enum.map(function (value) {
            var temp = new NEIInterfaceBean_1.Parameter();
            temp.typeName = schema.type;
            temp.defaultValue = value.toString();
            return temp;
        });
    }
    else if (schema.enum) {
        return NEIInterfaceBean_1.Parameter.createParameter(name, schema.type, schema);
    }
    else if (schema.type) {
        var type = schema.type.toLowerCase();
        switch (type) {
            case "array":// name 不为空
                format = db.MDL_FMT_ARRAY;
                var temp = helperParams(name, schema.items, processed, datatypes);
                if (temp[1] == db.MDL_TYP_NORMAL) {
                    if (name != null) {
                        temp[0][0].isArray = true;
                        temp[0][0].description = schema.description || "";
                    }
                }
                ret = temp[0].slice();
                break;
            case "object":
                if (name == null) {
                    if (schema.properties) {
                        Object.keys(schema.properties).forEach(function (name) {
                            // 这里需要判断是否是$ref,直接就能拿到
                            var temp = schema.properties[name];
                            var parameter = helperParams(name, temp, processed, datatypes);
                            ret = ret.concat(parameter[0]);
                        });
                    }
                    if (schema.additionalProperties) {
                        // 暂时不支持additionalProperties
                    }
                }
                else {
                    // 匿名类型
                    // 需要先建一个匿名类型, 不需要放到缓存中，因为不会重复使用，这样就免去了name都为""的slot冲突问题
                    if (!schema.properties) {
                        break;
                    }
                    var d = new NEIInterfaceBean_1.Datatype();
                    d.format = db.MDL_FMT_HASH;
                    d.name = ""; // 匿名类型
                    d.id = -1 * (FAKEINDEX++); // 假的占位符, 保证每次测试都一致
                    d.type = db.MDL_TYP_HIDDEN; // 匿名类型需要隐藏
                    d.params = Object.keys(schema.properties).map(function (p) { return helperParams(p, schema.properties[p], processed, datatypes)[0]; }).reduce(function (pre, cur) { return pre.concat(cur); }, []);
                    datatypes.push(d); // 这个之后也得创建的
                    var p = new NEIInterfaceBean_1.Parameter();
                    p.isArray = false;
                    p.name = name;
                    p.description = schema.description;
                    p.type = d.id;
                    p.typeName = "";
                    p.isObject = true;
                    return [[p], 0];
                }
                break;
            default:
                return NEIInterfaceBean_1.Parameter.createParameter(name, type, schema);
        }
    }
    return [ret, format];
}
/**
 * 可以直接通过递归来处理依赖
 * base case是为没有含有其他数据模型，或者是其他数据模型已经被处理了,避免求拓扑序, 反正无并行优化
 * @param {{[p: string]: Schema}} definitions Swagger 定义文件中的所有datatypes定义
 * @param {{[p: string]: Datatype}} processed 已处理、导入的数据模型
 */
function importDataTypes(definitions, processed) {
    /**
     *
     * @param {string} typeName
     * @param {{[p: string]: Datatype}} processed
     */
    function helperDatatype(typeName, processed, datatypes) {
        if (!(typeName in definitions)) {
            // todo 怎样做统一的报错处理
            throw new Error("\u672A\u5728definitions\u4E2D\u627E\u5230\u540D\u4E3A" + typeName + "\u7684\u6570\u636E\u6A21\u578B\u5B9A\u4E49");
        }
        if (typeName in processed) {
            return processed[typeName];
        }
        var d = new NEIInterfaceBean_1.Datatype();
        d.name = typeName;
        // todo 可能以后datatype也需要导入类型的处理
        var definition = definitions[typeName];
        _a = helperParams(null, definition, processed, datatypes), d.params = _a[0], d.format = _a[1];
        d.description = definition.description || "";
        processed[typeName] = d;
        return d;
        var _a;
    }
    // definitions中的每一个DataType都会生成一个导入模型
    var datatypes = [];
    Object.keys(definitions).forEach(function (typeName) {
        var temp = helperDatatype(typeName, processed, datatypes);
        datatypes.push(temp);
    });
    return datatypes;
}
/**
 * 导入数据模型
 * @param {Schema} schema
 * @param {Datatype[]} datatypes
 * @return {[Parameter[], number]}
 */
function importDataTypeFromRef(ref, datatypes) {
    var typeName = getDataTypeNameFromRef(ref);
    if (typeName in datatypes) {
        var dt = datatypes[typeName];
        dt = deepClone(dt); // 拷贝一份,防止修改
        return [dt.params.map(function (p) {
                p.datatypeName = typeName;
                return p;
            }), dt.format];
    }
    //todo 错误处理
}
function isHttpMethod(pathName) {
    return ["post", "get", "put", "head", "patch", "option"].indexOf(pathName.toLowerCase()) != -1;
}
function pathTransform(path) {
    // 不允许嵌套,直接使用正则就好了
    return path.replace(/\{([^\}]*)\}/g, function (a, b, c) { return ":" + b; });
}
function processSwagger(content) {
    return SwaggerParser.parse(content).then(function (api) {
        FAKEINDEX = 1;
        var basePath = api.basePath || "";
        // 首先处理数据模型的导入，处理definitions
        var processed = {};
        var dataTypes = importDataTypes(api.definitions, processed);
        var result = new Array();
        for (var pathName in api.paths) {
            var path = api.paths[pathName];
            for (var methodName in path) {
                if (!isHttpMethod(methodName)) {
                    continue;
                }
                var operation = path[methodName];
                var neiInterfaceBean = new NEIInterfaceBean_1.NEIInterfaceBean;
                neiInterfaceBean.name = operation.summary || operation.operationId || methodName + ":" + pathName;
                neiInterfaceBean.method = methodName.toUpperCase();
                neiInterfaceBean.description = operation.description;
                neiInterfaceBean.className = operation.operationId;
                neiInterfaceBean.path = pathLib.join(basePath, pathName);
                // Nei中tag是以','分割开的
                neiInterfaceBean.tags = operation.tags ? operation.tags.join(",") : "";
                // 处理request
                // nei上有个不同的地方在于，如果这个请求是get请求，则加入到request, 如果是post请求，在header里面的就得放入path中了
                neiInterfaceBean.params.inputs = [];
                if (operation.parameters) {
                    operation.parameters = operation.parameters.filter(function (p) {
                        var wh = p.in.toLowerCase();
                        return wh === "query" || wh === "body"; // NEI上不支持这个信息，只支持放在path上, 所以直接过滤掉
                    });
                    if (methodName.toUpperCase() !== "GET") {
                        neiInterfaceBean.path += operation.parameters.filter(function (p) {
                            return p.in.toLowerCase() === "query";
                        }).map(function (p) {
                            return p.name;
                        }).join("=&");
                        operation.parameters = operation.parameters.filter(function (p) { return p.in.toLowerCase() !== "query"; }); // 剔除
                    }
                    //处理剩下的parameter, 此时这些都应该在params.inputs字段中
                    neiInterfaceBean.params.inputs = operation.parameters.map(function (p) {
                        if (p.in.toLowerCase() === "body") {
                            var realP = p;
                            var item = helperParams(p.name, realP.schema, processed, dataTypes);
                            item[0][0].description = realP.description;
                            if ("required" in p) {
                                item[0][0].required = p.required;
                            }
                            return item[0][0];
                        }
                        else {
                            var realP = p;
                            var item = helperParams(realP.name, realP, processed, dataTypes);
                            if ("required" in p) {
                                item[0][0].required = p.required;
                            }
                            return item[0][0];
                        }
                    });
                }
                // 这里处理path中{}到: 的转换
                neiInterfaceBean.path = pathTransform(neiInterfaceBean.path);
                // 处理response
                var response = operation.responses;
                if ("200" in response) {
                    var successRespons = response["200"];
                    // neiInterfaceBean.responseDatas.description = successRespons.description;
                    // 处理allOf情况
                    // 先简单处理吧
                    var schema = successRespons.schema;
                    if (schema) {
                        neiInterfaceBean.params.outputs = helperParams(null, schema, processed, dataTypes)[0];
                    }
                }
                else {
                    // todo 不为200的情况下如何处理
                }
                result.push(neiInterfaceBean);
            }
        }
        return {
            datatypes: dataTypes,
            interfaces: result
        };
    });
}
exports.default = processSwagger;
//# sourceMappingURL=NEISwagger.js.map