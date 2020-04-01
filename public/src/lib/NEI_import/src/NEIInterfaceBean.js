"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DB = require("./db.json");
var db = DB;
var Parameter = /** @class */ (function () {
    function Parameter() {
        // ignored 这个字段不需要使用
        this.isArray = false;
        this.name = "";
        this.required = true;
        this.description = "";
    }
    Parameter.createParameter = function (name, type, schema) {
        var parameter = new Parameter();
        parameter.description = schema.description || "";
        parameter.typeName = type;
        var format = 0;
        switch (type) {
            case "string":
                parameter.type = db.MDL_SYS_STRING;
                format = db.MDL_FMT_STRING;
                break;
            case "integer":
                parameter.type = db.MDL_SYS_NUMBER;
                format = db.MDL_FMT_NUMBER;
                break;
            case "boolean":
                parameter.type = db.MDL_SYS_BOOLEAN;
                format = db.MDL_FMT_BOOLEAN;
                break;
        }
        if (name !== null) {
            parameter.name = name;
            format = db.MDL_TYP_NORMAL;
        }
        if (schema.default) {
            parameter.defaultValue = schema.default.toString();
        }
        return [[parameter], format];
    };
    Parameter.createObjectParameter = function (name) {
        var parameter = new Parameter();
        parameter.type = db.MDL_SYS_VARIABLE;
        parameter.name = name;
        return [[parameter], db.MDL_TYP_NORMAL];
    };
    return Parameter;
}());
exports.Parameter = Parameter;
var Datatype = /** @class */ (function () {
    function Datatype() {
        this.type = 0;
    }
    return Datatype;
}());
exports.Datatype = Datatype;
var NeiInterfaceParams = /** @class */ (function () {
    function NeiInterfaceParams() {
        this.inputs = [];
        this.outputs = [];
    }
    return NeiInterfaceParams;
}());
exports.NeiInterfaceParams = NeiInterfaceParams;
var NEIInterfaceBean = /** @class */ (function () {
    function NEIInterfaceBean() {
        this.params = new NeiInterfaceParams();
    }
    return NEIInterfaceBean;
}());
exports.NEIInterfaceBean = NEIInterfaceBean;
//# sourceMappingURL=NEIInterfaceBean.js.map