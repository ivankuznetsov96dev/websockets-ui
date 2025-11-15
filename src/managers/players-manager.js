import { DB } from "../db/db.js";

export class PlayersManager {

  registerPlayer(name, password) {
    if (!DB.players[name]) {
      DB.players[name] = { password, wins: 0 };
    }

    return {
      name,
      index: name,
      error: false,
      errorText: '',
    }
  }
}