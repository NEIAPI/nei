import { Datatype, NEIInterfaceBean } from "./NEIInterfaceBean";
export default function processSwagger(content: any): Promise<{
    datatypes: Datatype[];
    interfaces: NEIInterfaceBean[];
}>;
