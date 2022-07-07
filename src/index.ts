import express, {Express, Request, Response} from 'express';
import dotenv from 'dotenv';
import multer from 'multer';


import {IToken, MAL} from './MAL';



dotenv.config();
const upload = multer({dest: '/temp/'});
const app: Express = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.listen(port, () =>{
	console.log(`Server is running on port ${port}`);
})


app.post('/event',upload.single('thumb'), async (req: Request, res: Response) => {
	const payload = JSON.parse(req.body.payload);
	//console.log(payload)
	const api = new MAL();
	if(payload.event === 'media.play'){
		//console.log('start',payload.Metadata)
		console.log(payload.Metadata.grandparentTitle)
		const animeId = await api.searchAnime(payload.Metadata.grandparentTitle).then(response => response.data.data[0].node.id).catch(err => {
			console.log(err);
		});
		console.log(animeId)
		await api.updateAnimeStatus(animeId, 'watching', payload.Metadata.index)
			.then(r => { console.log(r.data) })
			.catch(err => {console.log('update error', err.response.data)});

	}

	if(payload.event === 'media.stop'){
		//console.log('stop', payload.Metadata)

	}

	if(payload.event === 'library.new'){

		let animeId = -1;

		api.searchAnime(payload.Metadata.title).then(resp => { 
			const data = resp.data.data
			animeId = data[0].node.id;
			console.log('animeId', animeId)
		}).catch(err => { console.log('search error',err) })

		await api.updateAnimeStatus(animeId, 'plan_to_watch')
			.then(r => { console.log(r) })
			.catch(err => {console.log('update error', err)});
	}
	res.send('ok');
});

app.get('/init', (_req: Request, res: Response) => {
	const api = new MAL()
	res.redirect(api.generateAuthorizeURL());
})

app.get('/oauth', async (req: Request, res: Response) => {
	const api = new MAL();
	const code = req.query.code?.toString() || '';

	const data : IToken = await api.getToken(code);
	res.send(data);
	
})


app.get('/refresh', async (_req: Request, res: Response) => {
	const api = new MAL();
	

	await api.refreshToken();
	res.send('ok');
	
})


app.get('/search', async (req: Request, res: Response) => {
	const api = new MAL();
	const name = req.query.q?.toString() || '';

	api.searchAnime(name).then(data => {
		res.send(data.data);
	}).catch(err => {
		res.send(err);
	})

	
})


