import * as http from 'http';
import { EventEmitter } from "events";

const emitter = new EventEmitter();
const roomsUserMap: Record<string, Set<string>> = {};

const sendEvent = (res: http.ServerResponse, data: string) => {
	res.write(`data: ${data}\n\n`);

};

const port = process.env.PORT || 3333;

const requestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
	let roomPathRegex = /\/room\/([^/]+)(?:\/([^/]+))?/;
	let match = req.url?.match(roomPathRegex);
	let roomId = match?.[1];
	let username = match?.[2];
	if (match && roomId) {
		switch (req.method) {
			case 'GET':
				if (!username) {
					res.writeHead(401);
					res.end('Unauthorized');
					return;
				}
				res.writeHead(201, {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive'
				});

				let callback = (data: string) => {
					sendEvent(res, data);
				}

				if (roomsUserMap[roomId]) {
					roomsUserMap[roomId].add(username);
				} else {
					roomsUserMap[roomId] = new Set([username]);
				}

				emitter.on(roomId, callback);
				emitter.emit(roomId, `users=${[...(roomsUserMap[roomId] || [])].join(',')}`);

				req.on('close', () => {
					roomsUserMap[roomId]?.delete(username);
					emitter.removeListener(roomId, callback);
				});
				break;
			case 'POST':
				let body = '';

				req.on('data', chunk => {
					body += chunk.toString();
				});

				req.on('end', () => {
					const decodedBody = decodeURIComponent(body.replace(/\+/g, ' '));
					emitter.emit(roomId, decodedBody);
					res.writeHead(200);
					res.end('Event sent');
				});
				break;
		}
	} else {
		res.writeHead(404);
		res.end('Not found');
	};
}

const logger = (fn: (req: http.IncomingMessage, res: http.ServerResponse) => void) => {
	return (req: http.IncomingMessage, res: http.ServerResponse) => {
		const request = `${req.method} ${req.url}`;
		console.time(request);
		fn(req, res);
		console.timeEnd(request);
	}
}

const server = http.createServer(logger(requestHandler));

server.listen(port, () => {
	console.log(`Server is listening on http://localhost:${port}`);
});
