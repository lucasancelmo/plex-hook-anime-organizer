import axios from 'axios';


const q = `query($name: String){
  Media(search: $name, type: ANIME) {
    idMal
    title {
      romaji
      english
      native
      userPreferred
    }
  }
}`; 
export class Anilist{


	searchAnime(name: string){
		const url = `${process.env.ANILIST_BASE_URL}`;
		const body = {
			query: q,
			variables: { name: name}
		}
		return axios.post(url, body);
	}
}