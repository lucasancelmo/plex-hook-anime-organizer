import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import multer from 'multer';


import {IToken, MAL, Query} from './MAL';
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
		
		await handleStart(payload);

	}

	if(payload.event === Media.STOP){

		await handleStop(payload);

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


async function handleStop(payload: Plex) {
	console.log('stop', payload);
	try {
		const resp = await api.getAnimeListByStatus('');
		const plan = resp.data.data.filter((item: { list_status: any; }) => {
			return (item.list_status.status === 'plan_to_watch' || item.list_status.status === 'watching');
		});
		console.log(plan);

	} catch (e) {
		console.log(e);
	}
}

async function handleNew(payload:Plex) {
	console.log(payload);
	try {
		const resp = await api.getAnimeListByStatus('');
		const plan = resp.data.data.filter((item: { list_status: any; }) => {
			return (item.list_status.status === 'plan_to_watch' || item.list_status.status === 'watching');
		});
		console.log(plan);

	} catch (e) {
		console.log(e);
	}
}

async function handleStart(payload: Plex) {
	const name: string = payload.metadata.grandparentTitle.includes(':') ? payload.metadata.grandparentTitle.split(':')[0].trim() : payload.metadata.grandparentTitle;
	console.log({ name });
	try {
		const response = await api.searchAnime(new Query(name));

		if (response.status !== 200) {
			console.log(response.status);
			console.log(response.data.data);
			//res.status(response.status).send('Error');
		}

		const { id, title } = response.data.data[0].node;
		console.log(response.data.data[0].node);


		if (name === title || title.includes(name)) {
			const animeStatus = await api.updateAnimeStatus(id, 'watching', payload.metadata.index);
			console.log(animeStatus.data);
		}

	} catch (e) {
		console.log(e);
	}
}



