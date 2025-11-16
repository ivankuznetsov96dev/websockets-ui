import { DB } from "../db/db";

export class PlayersManager {

  static registerPlayer(name: string, password: string) {
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