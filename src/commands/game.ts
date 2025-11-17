import { WebSocket } from 'ws';
import { WebSocketWithPlayer } from '../models/ws-with-player.interface';
import { GamesManager } from '../managers/games-manager';

export function attack(ws: WebSocket, message: any): void {
  const playerName = (ws as WebSocketWithPlayer).playerName;
  const playerGameId = (ws as WebSocketWithPlayer).playerGameId;

  if (!playerName || !playerGameId) {
    return;
  }

  try {
    const parsedData = JSON.parse(message.data);
    const { gameId, x, y, indexPlayer } = parsedData;

    if (!gameId || x === undefined || y === undefined || !indexPlayer) {
      return;
    }

    if (playerGameId !== indexPlayer) {
      return;
    }

    console.log('BEFORE processAttack!!!', playerName);

    GamesManager.processAttack(gameId, indexPlayer, x, y);

    // console.log('AFTER processAttack!!!');
    
  } catch (error) {
    console.error('Attack error:', error);
  }
}

export function randomAttack(ws: WebSocket, message: any): void {
  try {
    const parsedData = JSON.parse(message.data);
    const { gameId, indexPlayer } = parsedData;
    const playerGameId = (ws as WebSocketWithPlayer).playerGameId;

    if (!playerGameId || indexPlayer !== playerGameId) {
      return;
    }

    GamesManager.randomAttack(gameId, indexPlayer);
  } catch (error) {
    console.error('randomAttack error', error);
  }
}