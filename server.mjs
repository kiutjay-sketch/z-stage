import { WebSocketServer } from 'ws';
import http from 'http';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import {awarenessProtocol} from 'y-protocols/awareness';

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Z-Stage WebSocket Server is running.\n');
});

const wss = new WebSocketServer({ server });

// Map to store rooms and their docs/connections
const rooms = new Map();

function getOrCreateRoom(roomName) {
  let room = rooms.get(roomName);
  if (!room) {
    const doc = new Y.Doc();
    const conns = new Map();
    room = { doc, conns };
    rooms.set(roomName, room);
  }
  return room;
}

wss.on('connection', (conn, req) => {
  const urlParams = new URL(req.url, 'http://localhost').pathname.split('/');
  const roomName = urlParams[urlParams.length - 1] || 'z-stage-room-1';
  
  const room = getOrCreateRoom(roomName);
  room.conns.set(conn, new Set());

  conn.binaryType = 'arraybuffer';

  conn.on('message', (message) => {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    if (messageType === syncProtocol.messageYjsSyncStep1) {
      encoding.writeVarUint(encoder, syncProtocol.messageYjsSyncStep1);
      syncProtocol.readSyncStep1(decoder, encoder, room.doc);
      conn.send(encoding.toUint8Array(encoder));
    } else if (messageType === syncProtocol.messageYjsSyncStep2) {
      syncProtocol.readSyncStep2(decoder, room.doc, conn);
    } else if (messageType === syncProtocol.messageYjsUpdate) {
      syncProtocol.readUpdate(decoder, room.doc, conn);
    }
  });

  // Send initial sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, syncProtocol.messageYjsSyncStep1);
  syncProtocol.writeSyncStep1(encoder, room.doc);
  conn.send(encoding.toUint8Array(encoder));

  conn.on('close', () => {
    room.conns.delete(conn);
    if (room.conns.size === 0) {
      rooms.delete(roomName);
    }
  });
});

const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log(`Z-Stage WebSocket server running on port ${PORT}`);
});