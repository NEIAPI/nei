import { Schema } from "swagger-schema-official";
export declare class Parameter {
    datatypeName?: string;
    defaultValue?: string;
    genExpression?: string;
    isArray: boolean;
    isObject?: boolean;
    name: string;
    position: number;
    required: boolean;
    type?: number;
    description: string;
    typeName: string;
    valExpression?: string;
    static createParameter(name: string, type: string, schema: Schema): [[Parameter], number];
    static createObjectParameter(name: string): [[Parameter], number];
}
export declare class Datatype {
    description: string;
    format: number;
    name: string;
    params: Array<Parameter>;
    tag: string;
    type: number;
    id?: number;
}
export declare class NeiInterfaceParams {
    inputs: Array<Parameter>;
    outputs: Array<Parameter>;
}
export declare class NEIInterfaceBean {
    className: string;
    description: string;
    method: string;
    tags: string;
    name: string;
    params: NeiInterfaceParams;
    path: string;
    resFormat: number;
    constructor();
}
