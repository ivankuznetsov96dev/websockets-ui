import { WebSocket } from 'ws';
import { send } from "../utils/send";
import { GamesManager } from '../managers/games-manager';

export function addShips(ws: WebSocket, message: any): void {
  const parsedData = JSON.parse(message.data);
  const { gameId, ships, indexPlayer } = parsedData;

  if (!gameId || !ships || !indexPlayer) {
    send(ws, {
      type: 'add_ships',
      data: JSON.stringify({
        error: true,
        errorText: 'Missing required fields'
      }),
      id: 0
    });

    return;
  }

  console.log('addShips check!: ', gameId, ships, indexPlayer);
  try {
    GamesManager.addShips(gameId, indexPlayer, ships);
    console.log('addShips ADDED!');
    
  } catch (error) {
    console.error('addShips error', error);
  }
}