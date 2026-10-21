import { WebSocketServer } from 'ws';
import http from 'http';
import pkg from 'y-websocket/bin/utils.js';
const { setupWSConnection } = pkg;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Z-Stage WebSocket Server is running.\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true });
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`Z-Stage WebSocket server running on port ${PORT}`);
});