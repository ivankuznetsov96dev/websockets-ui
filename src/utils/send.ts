import { WebSocket } from 'ws';
import { DB } from '../db/db';

export function send(ws: WebSocket, message: any): void {
  ws.send(JSON.stringify({
    ...message,
    data: typeof message.data === 'string' ? message.data : JSON.stringify(message.data)
  }))
}

export function sendToPlayer(playerName: string, data: unknown): void {
  const ws = DB.sockets[playerName];
  if (ws) {
    send(ws, data);
  }
}

export function sendToAll(data: unknown): void {
  for (const key of Object.keys(DB.sockets)) {
    const ws = DB.sockets[key];
    if (ws) {
      send(ws, data);
    }
  }
}

export function sendToGamePlayers(gameId: string, data: unknown): void {
  console.log('sendToGamePlayers FUCK!');
  const game = DB.games[gameId];

  if (!game) {
    return;
  }

  for (const player of game.players) {
    const ws = DB.sockets[player];

    console.log('CHECK ROOM SEND!: ', player, JSON.stringify(data));
    if (ws) {
      send(ws, data);
    }
  }
}