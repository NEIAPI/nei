import * as DB from "./db.json";
import {Schema} from "swagger-schema-official";
let db = <any> DB;

export class Parameter {
	datatypeName?: string;
	defaultValue?: string;
	genExpression?: string; // 预留
	// ignored 这个字段不需要使用
	isArray: boolean = false;
	isObject?: boolean;
	name: string = "";
	// parentId: number;
	// parentType: number;
	position: number;
	required: boolean = true;
	type?: number;
	description: string="";
	typeName: string;
	valExpression?: string; // 预留
	static createParameter(name: string, type: string, schema: Schema):[[Parameter], number] {
		let parameter = new Parameter();
		parameter.description = schema.description || "";
		parameter.typeName = type;
		let format = 0;
		switch (type){
			case "string":
				parameter.type =  db.MDL_SYS_STRING;
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
		if(name !== null){
			parameter.name = name;
			format = db.MDL_TYP_NORMAL;
		}
		if(schema.default){
			parameter.defaultValue = schema.default.toString();
		}

		return [[parameter], format];
	}

	static createObjectParameter(name: string):[[Parameter], number] {
		let parameter = new Parameter();
		parameter.type = db.MDL_SYS_VARIABLE;
		parameter.name = name;
		return [[parameter], db.MDL_TYP_NORMAL];
	}
}

export class Datatype{
	description: string;
	format: number;
	name: string;
	params: Array<Parameter>;
	tag: string;
	type: number = 0;
	id?: number;
}

export class NeiInterfaceParams{
	inputs: Array<Parameter> = [];
	outputs: Array<Parameter> = [];
}

export class NEIInterfaceBean {
	className: string;
	description: string;
	method: string;
	tags: string;
	name: string;
	params: NeiInterfaceParams;
	path: string;
	resFormat: number;
	constructor(){
		this.params = new NeiInterfaceParams();
	}
}