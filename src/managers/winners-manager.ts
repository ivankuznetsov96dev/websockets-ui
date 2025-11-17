import { DB } from "../db/db";

export class WinnersManager {
  static addWin(name: string): void {
    if (!DB.players[name]) {
      DB.players[name] = { name, password: '', wins: 0 };
    }

    DB.players[name].wins = (DB.players[name].wins || 0) + 1;
  }

  static getWinnersList(): { name: string; password: string; wins: number }[] {
    return Object.values(DB.players)
      .map((val) => ({ name: val.name, password: val.password, wins: val.wins }))
      .sort((a, b) => b.wins - a.wins);
  }
}