import { WebSocket } from 'ws';
import { send } from "../utils/send";
import { WebSocketWithPlayer } from '../models/ws-with-player.interface';
import { GamesManager } from '../managers/games-manager';

export function attack(ws: WebSocket, message: any): void {
  const playerName = (ws as WebSocketWithPlayer).playerName;
  const playerGameId = (ws as WebSocketWithPlayer).playerGameId;

  if (!playerName) {
    send(ws, {
      type: 'attack',
      data: JSON.stringify({
        error: true,
        errorText: 'You must register first'
      }),
      id: 0
    });
    return;
  }

  try {
    const parsedData = JSON.parse(message.data);
    const { gameId, x, y, indexPlayer } = parsedData;

    if (!gameId || x === undefined || y === undefined || !indexPlayer) {
      return;
    }

    if (gameId !== gameId || playerGameId !== indexPlayer) {
      send(ws, {
        type: 'attack',
        data: JSON.stringify({
          error: true,
          errorText: 'Invalid game or player'
        }),
        id: 0
      });
      return;
    }

    console.log('BEFORE processAttack!!!');

    GamesManager.processAttack(gameId, indexPlayer, x, y, playerName);

    console.log('AFTER processAttack!!!');
    
  } catch (error) {
    console.error('Attack error:', error);
  }
}

export function randomAttack(ws: WebSocket, message: any): void {

}