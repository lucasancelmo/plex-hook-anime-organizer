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

	searchAnime(query : Query){

		if(this.isTokenExpired()){
			this.refreshToken();
		}
		const url = `${process.env.MAL_BASE_URL}${'/anime?q='}${query.build()}`;

		return axios.get(url, {headers: {'Authorization': `Bearer ${savedConfig.access_token}`}});
	}

	updateAnimeStatus(id : number, status : string, num_watched_episodes = 0 ){

		if(this.isTokenExpired()){
			this.refreshToken();
		}
		const url = `${process.env.MAL_BASE_URL}${'/anime/'}${id}${'/my_list_status'}`;
		const data = new URLSearchParams({status: status, num_watched_episodes: num_watched_episodes.toString()})
		return axios.put(url, data , {headers: {'Authorization': `Bearer ${savedConfig.access_token}`}});
	}

	getAnimeListByStatus(lists : string){
		if(this.isTokenExpired()){
			this.refreshToken();
		}
		const status = { status : lists };
		const statusParam = new URLSearchParams(status);
		const url = `${process.env.MAL_BASE_URL}${'/users/@me/animelist?fields=list_status'}&${statusParam.toString()}&limit=1000`;
		return axios.get(url, {headers: {'Authorization': `Bearer ${savedConfig.access_token}`}});
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

export class Query{
	q: string;
	limit: string;
	offset?: string;
	fields?: string;
	constructor(public qparam: string, public limitparam = '1', public fieldsparam?: string, public offsetparam = '0'){
		this.q = qparam;
		this.limit = limitparam;
		this.offset = offsetparam;
		this.fields = fieldsparam;
	}

	build(){
		let q = {q: this.q.substring(0,64), limit: this.limit};

		if(this.fields){
			q = {...q, fields: this.fields} as Query;
		}
		
		return new URLSearchParams(q)
	}
}

export interface Node{
	id:number;
	title:string;
	main_picture:{
		medium: string;
		large: string;
	}

}

export interface ListStatus{
	status: Status;
	score: number;
	num_watched_episodes: number;
	is_rewatching: boolean;
	updated_at: Date;
}

export enum Status{
	WATCHING = 'watching',
	COMPLETED = 'completed',
	ON_HOLD = 'on_hold',
	DROPPED = 'dropped',
	PLAN_TO_WATCH = 'plan_to_watch'
}

export interface Anime{
	node: Node;
	list_status: ListStatus;
}

export interface MALResponse{
	data: Anime[];
	paging: {
		next:string;
	}
}

