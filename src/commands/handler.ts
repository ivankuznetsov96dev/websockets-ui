import { WebSocket } from 'ws';
import * as player from './player';
import * as room from './room';
import * as ships from './ships';
import * as game from './game';

export function handleMessage(ws: WebSocket, message: any) {
  switch (message.type) {
    case 'reg':
      return player.registerPlayer(ws, message);
    case 'create_room':
      return room.createRoom(ws, message);
    case 'add_user_to_room':
      return room.addUserToRoom(ws, message);
    case 'add_ships':
      return ships.addShips(ws, message);
    case 'attack':
      return game.attack(ws, message);
    case 'randomAttack':
      return game.randomAttack(ws, message);
    default:
      console.log('Unknown message type:', message.type);
  }
}