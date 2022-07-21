import fs from 'fs';
import { IToken } from './MAL';
const path = 'config.json';
let file = '{}';
if(fs.existsSync(path)){

	file = fs.readFileSync(path, 'utf8');
}

const savedConfig : IToken = () => JSON.parse(file);

function saveConfig(data : IToken){

	fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
export  {savedConfig, saveConfig, isTokenExpired};

function isTokenExpired(): boolean{

	const savedDate = new Date (savedConfig.requestDate)
	const expires = parseInt(savedConfig.expires_in, 10)
	return new Date().getTime() > savedDate.getTime()  + expires * 1000;
}