import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' });
});

export function start(port = 3002) {
	app.listen(port, () => {
		console.log(`Orchestrator listening on port ${port}`);
	});
}

export { app };
