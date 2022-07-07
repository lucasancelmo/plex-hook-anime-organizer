import axios from 'axios';
import { isTokenExpired, saveConfig, savedConfig } from './config';
export class MAL {

	generateAuthorizeURL() : string {
		let url = `${process.env.MAL_API_URL}${'/authorize?'}`;

		url += `client_id=${process.env.MAL_CLIENT_ID}&`;
		url += `client_secret=${process.env.MAL_CLIENT_SECRET}&`;
		url += 'response_type=code&';
		url += `code_challenge=${process.env.MAL_CODE_CHALLENGE}`; 

		return url;
	}

	async getToken(code : string) : Promise<IToken> {
		const url = `${process.env.MAL_API_URL}${'/token'}`;

		const data = new URLSearchParams();
		data.append('grant_type', 'authorization_code')
		data.append('code', code);
		data.append('client_id', process.env.MAL_CLIENT_ID?.toString() || '');
		data.append('client_secret', process.env.MAL_CLIENT_SECRET?.toString() || '');
		data.append('code_verifier', process.env.MAL_CODE_CHALLENGE?.toString() || '');


		const resdata = await axios.post(url, data);
		saveConfig({...resdata.data, requestDate: new Date()});
		return resdata.data;


	}

	async refreshToken() : Promise<void> {
		const url = `${process.env.MAL_API_URL}${'/token'}`;

		const data = new URLSearchParams();
		data.append('grant_type', 'refresh_token')
		data.append('refresh_token', savedConfig.refresh_token);
		data.append('client_id', process.env.MAL_CLIENT_ID?.toString() || '');
		data.append('client_secret', process.env.MAL_CLIENT_SECRET?.toString() || '');
		const resdata = await axios.post(url, data);
		
		
		saveConfig({...resdata.data, requestDate: new Date()});
		
	}

	searchAnime(name : string){

		if(this.isTokenExpired()){
			this.refreshToken();
		}
		const url = `${process.env.MAL_BASE_URL}${'/anime?q='}${name}&limit=1`;

		return axios.get(url, {headers: {'Authorization': `Bearer ${savedConfig.access_token}`}});
	}

	async updateAnimeStatus(id : number, status : string, num_watched_episodes = '0' ){

		if(this.isTokenExpired()){
			this.refreshToken();
		}
		const url = `${process.env.MAL_BASE_URL}${'/anime/'}${id}${'/my_list_status'}`;
		const data = new URLSearchParams({status: status, num_watched_episodes: num_watched_episodes})
		return axios.put(url, data , {headers: {'Authorization': `Bearer ${savedConfig.access_token}`}});
	}

	isTokenExpired() : boolean {
		return isTokenExpired();
	}
}

export interface IToken{
	access_token : string;
	expires_in : string;
	refresh_token : string;
	token_type : string;
	requestDate : Date;
}

