import { WebSocket } from 'ws';
import { send, sendToAll } from "../utils/send";
import { RoomsManager } from '../managers/rooms-manager';
import { DB } from '../db/db';
import { GamesManager } from '../managers/games-manager';
import { WebSocketWithPlayer } from '../models/ws-with-player.interface';

export function createRoom(ws: WebSocket, message: any): void {
  const playerName = (ws as WebSocketWithPlayer).playerName;
  
  if (!playerName) {
    send(ws, {
      type: 'create_room',
      data: {
        name,
        id: 0,
        error: true,
        errorType: 'You must register first'
      }
    });
    return;
  }

  const roomId = RoomsManager.createRoom(playerName);

  sendToAll({
    type: 'update_room',
    data: RoomsManager.getPublicRoomsForUpdate(),
    id: 0
  })
}

export function addUserToRoom(ws: WebSocket, message: any): void {
  const parsedData = JSON.parse(message.data);
  const playerName = (ws as WebSocketWithPlayer).playerName;
  const indexRoom = parsedData?.indexRoom;

  if (!playerName || !indexRoom) {
    return;
  }

  try {
    const count = RoomsManager.addUserToRoom(indexRoom, playerName);
    const room = DB.rooms[indexRoom];

    if (room.players.length === 2) {
      const { gameId, playerGameIds } = GamesManager.createGame(indexRoom);

      for (const player of room.players) {
        const wsPlayer = DB.sockets[player];
        if (!wsPlayer) {
          continue;
        }

        sendToAll({
          type: 'update_room',
          data: RoomsManager.getPublicRoomsForUpdate(),
          id: 0
        });

        send(wsPlayer, {
          type: 'create_game',
          data: {
            idGame: gameId,
            idPlayer: playerGameIds[player],
            id: 0
          }
        });

        (wsPlayer as WebSocketWithPlayer).playerGameId = playerGameIds[player];
        (wsPlayer as WebSocketWithPlayer).gameId = gameId;
      }
    }

  } catch (error) {
    console.error('addUserToRoom error!: ', error);
  }
}