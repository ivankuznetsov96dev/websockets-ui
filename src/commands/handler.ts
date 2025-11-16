import { WebSocket } from 'ws';
import * as player from './player';

export function handleMessage(ws: WebSocket, message: any) {
  switch (message.type) {
    case 'reg':
      return player.registerPlayer(ws, message);
    case 'create_room':
    case 'add_user_to_room':
    case 'add_ships':
    case 'attack':
    case 'randomAttack':
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
}