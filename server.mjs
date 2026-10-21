import { WebSocketServer } from 'ws';
import http from 'http';

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Z-Stage WebSocket Server is running.\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Broadcast incoming Yjs sync/awareness messages to all other clients in the room
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  });
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`Z-Stage WebSocket server running on port ${PORT}`);
});