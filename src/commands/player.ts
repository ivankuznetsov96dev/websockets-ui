import { WebSocket } from 'ws';
import { PlayersManager } from "../managers/players-manager";
import { RoomsManager } from '../managers/rooms-manager';
import { WinnersManager } from '../managers/winners-manager';
import { send, sendToAll } from "../utils/send";
import { DB } from '../db/db';
import { WebSocketWithPlayer } from '../models/ws-with-player.interface';

export function registerPlayer(ws: WebSocket, message: any): void {
  const parsedData = JSON.parse(message.data);
  const name = parsedData?.name;
  const password = parsedData?.password;

  if (!name || !password) {
    send(ws, {
      type: 'reg',
      data: {
        name,
        index: null,
        error: true,
        errorType: 'Name and password are required'
      }
    });
    return;
  }


  PlayersManager.registerPlayer(name, password);

  DB.sockets[name] = ws;
  (ws as WebSocketWithPlayer).playerName = name;


  send(ws, {
    type: 'reg',
    data: {
      name,
      index: name,
      error: false,
      errorText: '',
    },
    id: 0
  });

  sendToAll({
    type: 'update_room',
    data: RoomsManager.getPublicRoomsForUpdate(),
    id: 0
  });

  sendToAll({
    type: 'update_winners',
    data: WinnersManager.getWinnersList(),
    id: 0
  });
}