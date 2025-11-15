import * as player from '../commands/player.js';

export function handleMessage(ws, message) {
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