import { WebSocket } from 'ws';
import { PlayersManager } from "../managers/players-manager";
import { send } from "../utils/send";

export function registerPlayer(ws: WebSocket, message: any) {
  console.log('CHECK registerPlayer!: ', message);
  const parsedData = JSON.parse(message.data);
  const res = PlayersManager.registerPlayer(parsedData.name, parsedData.password);

  console.log('CHECK registerPlay 2!: ', res);

  send(ws, {
    type: 'reg',
    data: res,
    // data: {name: 'FUCK', password: 'FUCKING!'},
    id: 0
  });
}