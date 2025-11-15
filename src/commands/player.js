import { PlayersManager } from "../managers/players-manager.js";
import { send } from "../utils/send.js";

export function registerPlayer(ws, message) {
  console.log('CHECK registerPlayer!: ', message);
  const res = PlayersManager.registerPlayer(message.data.name, message.data.password);

  send(ws, {
    type: 'reg',
    data: res,
    id: 0
  });
}