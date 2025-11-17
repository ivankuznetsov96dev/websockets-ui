import { DB } from '../db/db';
import { Game, PlacedShip, Ship } from '../models/db.model';
import { sendToAll, sendToPlayer, sendToGamePlayers } from '../utils/send';
import { WinnersManager } from './winners-manager';

export class GamesManager {
  static createGame(roomId: string) {
    const room = DB.rooms[roomId];
    if (!room) {
      throw new Error('Room not found');
    }

    const gameId = 'g_' + Date.now();
    const players = [...room.players];

    const playerGameIds: Record<string, string> = {};
    for (const player of players) {
      playerGameIds[player] = gameId + '_' + Math.random().toString(36).slice(2, 8);
    }

    DB.games[gameId] = {
      id: gameId,
      players,
      playerGameIds,
      ships: {},
      shots: {},
      currentPlayerIndex: null,
      finished: false,
      winner: null
    };

    room.gameId = gameId;

    for (const player of players) {
      const pid = playerGameIds[player];
      DB.games[gameId].ships[pid] = [];
      DB.games[gameId].shots[pid] = [];
    }

    return { gameId, playerGameIds };
  }

  static addShips(gameId: string, playerGameId: string, ships: Ship[]) {
    const game = DB.games[gameId];
    if (!game) return;

    game.ships[playerGameId] = ships.map((ship, idx) => ({
      ...ship,
      id: `ship_${idx}`,
      hits: new Array(ship.length).fill(false),
      cells: this.calculateShipCells(ship)
    }));

    this.checkAndStartGame(gameId);
  }

  static processAttack(gameId: string, attackerId: string, x: number, y: number) {
    const game = DB.games[gameId];
    if (!game || game.finished) {
      return;
    }

    if (game.currentPlayerIndex !== attackerId) {
      return;
    }

    const defenderId = Object.values(game.playerGameIds)
      .find((pid) => pid !== attackerId);

    if (!defenderId) {
      return;
    }

    const already = game.shots[attackerId].some((shot) => shot.x === x && shot.y === y);

    if (already) {
      return;
    }

    const result = this.checkAttack(game, defenderId, x, y);

    game.shots[attackerId].push({ x, y, status: result.status as 'miss' | 'killed' | 'shot'});

    sendToGamePlayers(gameId, {
      type: 'attack',
      data: JSON.stringify({
        position: { x, y },
        currentPlayer: attackerId,
        status: result.status
      }),
      id: 0
    });

    if (result.status === 'killed' && result.ship) {
      for (const cell of result.ship.cells) {
        game.shots[attackerId].push({ 
          x: cell.x, 
          y: cell.y, 
          status: 'killed'
        });
      }
      this.sendMissAroundShip(gameId, result.ship);
    }

    if (this.checkGameFinished(game, defenderId)) {
      game.finished = true;
      game.winner = attackerId;

      const winnerName = Object.entries(game.playerGameIds).find(([_, id]) => {
        return id === attackerId
      })?.[0];

      if (winnerName) {
        WinnersManager.addWin(winnerName);
      }

      sendToGamePlayers(gameId, {
        type: 'finish',
        data: JSON.stringify({ 
          winPlayer: attackerId 
        }),
        id: 0
      });

      sendToAll({
        type: 'update_winners',
        data: JSON.stringify(WinnersManager.getWinnersList()),
        id: 0
      });

      return;
    }

    if (result.status === 'miss') {
      game.currentPlayerIndex = defenderId;
    }

    sendToGamePlayers(gameId, {
      type: 'turn',
      data: JSON.stringify({ currentPlayer: game.currentPlayerIndex }),
      id: 0
    });
  }

  static randomAttack(gameId: string, attackerId: string) {
    const game = DB.games[gameId];
    if (!game || game.finished) {
      return;
    }
    if (game.currentPlayerIndex !== attackerId) {
      return;
    }

    const defenderId = Object.values(game.playerGameIds).find(
      (pid) => pid !== attackerId
    );
    if (!defenderId) {
      return;
    }

    let available: { x: number; y: number }[] = [];

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const hit = game.shots[attackerId].some((c) => c.x === x && c.y === y);
        if (!hit) available.push({ x, y });
      }
    }

    if (available.length === 0) {
      return;
    }

    const cell = available[Math.floor(Math.random() * available.length)];
    this.processAttack(gameId, attackerId, cell.x, cell.y);
  }

  private static calculateShipCells(ship: Ship): { x: number; y: number }[]  {
    const cells: { x: number; y: number }[] = [];
    const { x, y } = ship.position;

    for (let i = 0; i < ship.length; i++) {
      if (ship.direction) {
        cells.push({ x, y: y + i });
      } else {
        cells.push({ x: x + i, y });
      }
    }
    return cells;
  }

  private static checkAndStartGame(gameId: string): void {
    const game = DB.games[gameId];
    if (!game) {
      return;
    }

    const allReady = Object.values(game.playerGameIds).every(
      (pid) => game.ships[pid]?.length > 0
    );

    if (!allReady) {
      return;
    }

    const names = Object.keys(game.playerGameIds);
    const name = names[Math.floor(Math.random() * names.length)];
    game.currentPlayerIndex = game.playerGameIds[name];

    for (const [playerName, pid] of Object.entries(game.playerGameIds)) {
      sendToPlayer(playerName, {
        type: 'start_game',
        data: JSON.stringify({
          ships: game.ships[pid],
          currentPlayerIndex: pid
        }),
        id: 0
      });

      console.log('SUKA CHECK!: ', JSON.stringify(game.ships));

      sendToPlayer(playerName, {
        type: 'turn',
        data: JSON.stringify({ 
          currentPlayer: game.currentPlayerIndex 
        }),
        id: 0
      });
    }
  }

  private static checkAttack(game: Game, defenderId: string, x: number, y: number) {
    const ships = game.ships[defenderId];
    for (const ship of ships) {
      const idx = ship.cells.findIndex((c) => c.x === x && c.y === y);
      if (idx !== -1) {
        ship.hits[idx] = true;
        if (ship.hits.every(Boolean)) {
          return { ship, status: 'killed' };
        }

        return { 
          ship,
          status: 'shot', 
        };
      }
    }
    return { status: 'miss' };
  }

  private static sendMissAroundShip(gameId: string, ship: PlacedShip) {
    const game = DB.games[gameId];
    if (!game) return;

    const used = new Set<string>();

    for (const cell of ship.cells) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const x = cell.x + dx;
          const y = cell.y + dy;

          if (x < 0 || x >= 10 || y < 0 || y >= 10) continue;
          const key = `${x},${y}`;
          if (used.has(key)) continue;

          used.add(key);

          if (!ship.cells.some((c) => c.x === x && c.y === y)) {
            sendToGamePlayers(gameId, {
              type: 'attack',
              data: JSON.stringify({
                position: { x, y },
                currentPlayer: game.currentPlayerIndex,
                status: 'miss'
              }),
              id: 0
            });
          }
        }
      }
    }
  }

  private static checkGameFinished(game: Game, defenderId: string) {
    return game.ships[defenderId].every((s) => s.hits.every(Boolean));
  }
}
