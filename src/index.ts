import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import multer from 'multer';


import {IToken, MAL, Query, Anime, findAnime, Status, Node} from './MAL';
import { Plex, Media, Library } from './Plex';


dotenv.config();
const upload = multer({dest: '/temp/'});
const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.listen(port, () =>{
	console.log(`Server is running on port ${port}`);
})
const api = new MAL();

app.post('/event',upload.single('thumb'), async (req: Request, res: Response) => {
	const payload : Plex = JSON.parse(req.body.payload);
	
	
	if(payload.event === Media.START){
		
		await handlePlay(payload);

	}
	
	if(payload.event === Library.NEW){
		//add to plan to watch only if it is not already in the plan to watch or in watching or on hold list
		await handleNew(payload);
	}
	res.send('ok');
});

app.get('/init', (_req: Request, res: Response) => {
	
	res.redirect(api.generateAuthorizeURL());
})

app.get('/oauth', async (req: Request, res: Response) => {
	
	const code = req.query.code?.toString() || '';

	const data : IToken = await api.getToken(code);
	res.send(data);
	
})


app.get('/refresh', async (_req: Request, res: Response) => {
	

	await api.refreshToken();
	res.send('ok');
	
})


app.get('/search', async (req: Request, res: Response) => {
	
	const name = req.query.q?.toString() || '';
	const limit = req.query.limit?.toString() || '5';
	const fields = req.query.fields?.toString() || 'title,id';
	console.log(name)
	console.log(req.query)
	api.searchAnime(new Query(name, limit, fields)).then(data => {
		//console.log(data)
		res.send(data.data);
	}).catch(err => {
		res.send(err);
	})

	
})

async function handleNew(payload:Plex) {
	const name: string = payload.Metadata.grandparentTitle.replace(/[^\w\s]/gi, '')

	console.log({name})
	try {
		const resp = await api.getAnimeListByStatus('');
		const plan = resp.data.data.filter((item: Anime) => {
			return (item.list_status.status === Status.PLAN_TO_WATCH || item.list_status.status === Status.WATCHING);
		});
		const anime = findAnime(plan, name);

		if(!anime){
			const response = await api.searchAnime(new Query(name, '10'));

			const result = findAnime(response.data.data, name);


			if(result){
				const animeStatus = await api.updateAnimeStatus(result.node.id, Status.PLAN_TO_WATCH, payload.Metadata.index);
				console.log('handleNew data', animeStatus.data);
			}
		}

	} catch (e) {
		console.log('handleNew error', e);
	}
}

async function handlePlay(payload: Plex) {

	const name: string = payload.Metadata.grandparentTitle.replace(/[^\w\s]/gi, '')
	console.log({ name });
	try {
		const response = await api.searchAnime(new Query(name, '10'));

		const result = findAnime(response.data.data, name);
		
		const { id, title } = result?.node || { id: -1, title: '' };
		console.log(response.data.data[0].node);


		if (name === title || title.includes(name) || title.includes(name.split(' ')[0])) {
			const animeStatus = await api.updateAnimeStatus(id, Status.WATCHING, payload.Metadata.index);
			console.log('handlePlay data', animeStatus.data);
		}

	} catch (e) {
		console.log('handlePlay error', e);
	}
}



