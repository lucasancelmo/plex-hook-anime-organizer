import fs from 'fs';
import { IToken } from './MAL';
const path = './src/config.json'
const savedConfig = JSON.parse(fs.readFileSync(path, 'utf8'));

function saveConfig(data : IToken){

	fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
export  {savedConfig, saveConfig, isTokenExpired};

function isTokenExpired(){

	const savedDate = new Date (savedConfig.requestDate)
	const expires = parseInt(savedConfig.expires_in, 10)
	return new Date().getTime() > savedDate.getTime()  + expires * 1000;
}