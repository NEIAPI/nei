/**
 * Created by abnerzheng on 2017/10/26.
 */


import * as SwaggerParser from "swagger-parser";
import * as db from "./db.json";
import {BodyParameter, Operation, QueryParameter, Schema} from 'swagger-schema-official';
import {Datatype, NEIInterfaceBean, Parameter} from "./NEIInterfaceBean";
import * as pathLib from "path";


type NameToDatatypeMap = {[definitionName: string]: Datatype}
type NameToSchemaMap = {[deinitionName: string]: Schema}

let FAKEINDEX;

function getDataTypeNameFromRef(ref: string): string {
	let temp = ref.split("/");
	return temp[temp.length - 1];
}

function deepClone(parameter: any) {
	return JSON.parse(JSON.stringify(parameter));
}

/**
 * @param {Schema} schema
 * @return {Array<Parameter>}
 */
function helperParams(name: string, schema: Schema, processed: NameToDatatypeMap, datatypes: Datatype[]): [Array<Parameter>, number] {
	// base case
	let ret: Array<Parameter> = [];
	let format = 0;
	if(!Object.keys(schema).length){
		return Parameter.createObjectParameter(name);
	} else if(name === null && schema.$ref){
		// ref具有排他性, 在顶层，无name说明是导入
		return importDataTypeFromRef(schema.$ref, processed);
	}else if(name !==null && schema.$ref){
		// 有名字时，这时候说明是引用, 这是base case之一
		let typeName = getDataTypeNameFromRef(schema.$ref);
		let parameter =  new Parameter();
		parameter.typeName = typeName;
		parameter.name = name;
		ret.push(parameter);
	}else if(schema.allOf){
		schema.allOf.forEach(sch=>{
			console.log(sch);
			let res = helperParams(null, sch, processed, datatypes);
			ret = ret.concat(res[0]);
		})
	}else if (name == null && schema.enum) {// 创建enum数据模型
		format = 1;
		ret = schema.enum.map(value => {
			let temp = new Parameter();
			temp.typeName = schema.type;
			temp.defaultValue =  value.toString();
			return temp;
		});
	} else if (schema.enum){ // 匿名enum数据类型现在还不支持，需要前端支持
		return Parameter.createParameter(name, schema.type, schema);
	} else if (schema.type || schema.properties) {
		let type = "";
		if (schema.type) {
			type = schema.type.toLowerCase();
		} else {
			type = "object";
		}
		switch (type) {
			case "array": // name 不为空
				format = (<any>db).MDL_FMT_ARRAY;
				let temp = helperParams(name, <Schema>schema.items, processed, datatypes);
				if(temp[1] == (<any>db).MDL_TYP_NORMAL){
					if(name != null) {
						temp[0][0].isArray = true;
						temp[0][0].description = schema.description || "";
					}
				}
				ret = [...temp[0]];
				break;
			case "object":
				if(name == null) {
					if (schema.properties) {
						Object.keys(schema.properties).forEach(name => {
							// 这里需要判断是否是$ref,直接就能拿到
							let temp = schema.properties[name];
							let parameter = helperParams(name, temp, processed, datatypes);
							ret = ret.concat(parameter[0]);
						});
					}
					if (schema.additionalProperties) {
						// 暂时不支持additionalProperties
					}
				}else{
					// 匿名类型
					// 需要先建一个匿名类型, 不需要放到缓存中，因为不会重复使用，这样就免去了name都为""的slot冲突问题
					if(!schema.properties){
						break;
					}
					let d =  new Datatype();
					d.format = (<any>db).MDL_FMT_HASH;
					d.name = ""; // 匿名类型
					d.id = -1 * (FAKEINDEX++); // 假的占位符, 保证每次测试都一致
					d.type = (<any>db).MDL_TYP_HIDDEN; // 匿名类型需要隐藏
					d.params =Object.keys(schema.properties).map(p => helperParams(p, schema.properties[p], processed, datatypes)[0]).reduce((pre,cur)=>pre.concat(cur), []);
					datatypes.push(d); // 这个之后也得创建的

					let p = new Parameter();
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
				return Parameter.createParameter(name, type, schema);
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
function importDataTypes(definitions: NameToSchemaMap, processed: NameToDatatypeMap):Datatype[]{
	/**
	 *
	 * @param {string} typeName
	 * @param {{[p: string]: Datatype}} processed
	 */
	function helperDatatype(typeName: string, processed: {[definitionName: string]: Datatype}, datatypes:Datatype[]): Datatype {
		if (!(typeName in definitions)) {
			// todo 怎样做统一的报错处理
			throw new Error(`未在definitions中找到名为${typeName}的数据模型定义`);
		}
		if (typeName in processed) { //已处理过
			return processed[typeName];
		}
		let d = new Datatype();
		d.name = typeName;
		// todo 可能以后datatype也需要导入类型的处理
		const definition = definitions[typeName];
		[d.params, d.format] = helperParams(null, definition, processed, datatypes);
		d.description = definition.description || "";
		processed[typeName] = d;
		return d;
	}

	// definitions中的每一个DataType都会生成一个导入模型
	let datatypes: Datatype[] = [];
	Object.keys(definitions).forEach(typeName => {
		let temp = helperDatatype(typeName, processed, datatypes);
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
function importDataTypeFromRef(ref: string, datatypes: NameToDatatypeMap):[Array<Parameter>, number]{
	let typeName = getDataTypeNameFromRef(ref);
	if(typeName in datatypes){
		let dt= datatypes[typeName];
		dt = deepClone(dt); // 拷贝一份,防止修改
		return [dt.params.map(p =>{
			p.datatypeName = typeName;
			return p;
		}), dt.format]
	}
	//todo 错误处理
}

function isHttpMethod(pathName: string) {
	return ["post", "get", "put","head", "patch", "option"].indexOf(pathName.toLowerCase()) != -1;
}

function pathTransform(path: string):string{
	// 不允许嵌套,直接使用正则就好了
	return path.replace(/\{([^\}]*)\}/g, function(a,b,c){return ":"+b;});
}

export default function processSwagger(content) {
	return SwaggerParser.parse(content).then(api => {
		FAKEINDEX = 1;
		const basePath = api.basePath || "";

		// 首先处理数据模型的导入，处理definitions
		let processed = {};
		let dataTypes = importDataTypes(api.definitions, processed);


		let result: Array<NEIInterfaceBean> = new Array<NEIInterfaceBean>();
		for (let pathName in api.paths) {
			const path = api.paths[pathName];
			for (let methodName in path) { // operation could be "GET"/"POST"
				if (!isHttpMethod(methodName)) {
					continue;
				}
				const operation: Operation = path[methodName];
				let neiInterfaceBean = new NEIInterfaceBean;
				neiInterfaceBean.name = operation.summary || operation.operationId || methodName + ":" + pathName;
				neiInterfaceBean.method = methodName.toUpperCase();
				neiInterfaceBean.description = operation.description;
				neiInterfaceBean.className = operation.operationId;
				neiInterfaceBean.path =pathLib.join(basePath,pathName);
				// Nei中tag是以','分割开的
				neiInterfaceBean.tags = operation.tags ? operation.tags.join(",") : "";

				// 处理request
				// nei上有个不同的地方在于，如果这个请求是get请求，则加入到request, 如果是post请求，在header里面的就得放入path中了
				neiInterfaceBean.params.inputs = [];
				if(operation.parameters) {
					operation.parameters = operation.parameters.filter(p => {
						let wh = p.in.toLowerCase();
						return wh === "query" || wh === "body"; // NEI上不支持这个信息，只支持放在path上, 所以直接过滤掉
					});

					if (methodName.toUpperCase() !== "GET") {
						neiInterfaceBean.path += operation.parameters.filter(p => {
							return p.in.toLowerCase() === "query";
						}).map(p => {
							return p.name;
						}).join("=&");
						operation.parameters = operation.parameters.filter(p => p.in.toLowerCase() !== "query"); // 剔除
					}

					//处理剩下的parameter, 此时这些都应该在params.inputs字段中
					neiInterfaceBean.params.inputs = operation.parameters.map(p => {
						if (p.in.toLowerCase() === "body") {
							let realP = <BodyParameter>p;
							let item = helperParams(realP.schema ? null : p.name, realP.schema, processed, dataTypes);
							item[0][0].description = realP.description;
							if("required" in p){
								item[0][0].required = p.required;
							}
							return item[0][0];
						} else {
							let realP = <any>p;
							let item = helperParams(realP.name, <Schema>realP, processed, dataTypes);
							if("required" in p){
								item[0][0].required = p.required;
							}
							return item[0][0];
						}
					});
				}

				// 这里处理path中{}到: 的转换
				neiInterfaceBean.path = pathTransform(neiInterfaceBean.path)

				// 处理response
				let response = operation.responses;
				if ("200" in response) {
					const successRespons = response["200"];
					// neiInterfaceBean.responseDatas.description = successRespons.description;
					// 处理allOf情况
					// 先简单处理吧
					const schema = successRespons.schema;
					if (schema) {
						neiInterfaceBean.params.outputs = helperParams(null, schema, processed, dataTypes)[0];
					}
				} else {
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

