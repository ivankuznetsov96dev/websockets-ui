import { WebSocket } from 'ws';

export interface WebSocketWithPlayer extends WebSocket {
  playerName?: string;
  playerGameId?: string;
  gameId?: string;
}