import processSwagger from "./NEISwagger";
import {YAML} from "swagger-parser";

addEventListener('message', (message) => {
	let data = JSON.parse(message.data);
	if(data[0].file.name.endsWith("yaml")){
		processSwagger(YAML.parse(data[0].content)).then(inters => {
			postMessage(inters);
		});
	}else{
		processSwagger(JSON.parse(data[0].content)).then(inters => {
			postMessage(inters);
		});
	}
});

