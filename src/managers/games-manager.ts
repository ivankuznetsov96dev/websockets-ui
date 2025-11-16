import { DB } from "../db/db";
import { Game, PlacedShip, Ship } from "../models/db.model";
import { WebSocketWithPlayer } from "../models/ws-with-player.interface";
import { sendToAll, sendToPlayer } from "../utils/send";
import { WinnersManager } from "./winners-manager";

export class GamesManager {
  static createGame(roomId: string) {
    const room = DB.rooms[roomId];
    if (!room) {
      throw new Error('Room not found');
    }

    const gameId = 'g_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const players = [...room.players];
    const playerGameIds: Record<string, string> = {};

    for (const player of players) {
      playerGameIds[player] = `${gameId}_p_${Math.random().toString(36).slice(2,8)}`;
    }

    DB.games[gameId] = {
      id: gameId,
      players: [...room.players],
      playerGameIds,
      ships: {},
      shots: {},
      currentPlayerIndex: null,
      finished: false,
      winner: null
    };

    room.gameId = gameId;

    for (const p of players) {
      const pid = playerGameIds[p];
      DB.games[gameId].ships[pid] = [];
      DB.games[gameId].shots[pid] = [];
    }

    return { gameId, playerGameIds };
  }

  static addShips(gameId: string, playerGameId: string, ships: Ship[]): void {
    const game = DB.games[gameId];
    if (!game || game.finished) {
      return;
    }

    console.log('CHECK addShips REAL0!: ');

    const placedShips: PlacedShip[] = ships.map((ship, index) => {
      const cells = this.calculateShipCells(ship);
      return {
        ...ship,
        id: `ship_${index}`,
        hits: new Array(ship.length).fill(false),
        cells
      };
    });

    game.ships[playerGameId] = placedShips;

    this.checkAndStartGame(gameId);
  }


  static processAttack(gameId: string, attackingPlayerGameId: string, x: number, y: number, playerName: string): void {
    const game = DB.games[gameId];
    if (!game || game.finished || game.currentPlayerIndex !== attackingPlayerGameId) return;

    const defendingPlayers = Object.keys(game.playerGameIds)
      .filter(playerGameId => playerGameId !== attackingPlayerGameId);
    
    if (defendingPlayers.length === 0) return;

    const defendingPlayerGameId = defendingPlayers[0];
    const result = this.checkAttack(game, defendingPlayerGameId, x, y);

    game.shots[attackingPlayerGameId].push({ x, y, status: result.status });

    sendToPlayer(playerName, {
      type: 'attack',
      data: JSON.stringify({
        position: { x, y },
        currentPlayer: attackingPlayerGameId,
        status: result.status
      }),
      id: 0
    });

    if (result.status === 'killed' && result.ship) {
      this.sendMissAroundShip(gameId, result.ship, playerName);
    }

    if (this.checkGameFinished(game, defendingPlayerGameId)) {
      game.finished = true;
      game.winner = attackingPlayerGameId;
      
      const winnerName = Object.entries(game.playerGameIds)
        .find(([_, gameId]) => gameId === attackingPlayerGameId)?.[0];
      
      if (winnerName) {
        WinnersManager.addWin(winnerName);
      }

      sendToPlayer(playerName, {
        type: 'finish',
        data: JSON.stringify({
          winPlayer: attackingPlayerGameId
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
      game.currentPlayerIndex = defendingPlayerGameId;
    }

    sendToPlayer(playerName, {
      type: 'turn',
      data: JSON.stringify({
        currentPlayer: game.currentPlayerIndex
      }),
      id: 0
    });
  }

  private static calculateShipCells(ship: Ship): { x: number; y: number }[] {
    const cells = [];
    const { x, y } = ship.position;
    
    for (let i = 0; i < ship.length; i++) {
      if (ship.direction) {
        cells.push({ x: x + i, y });
      } else {
        cells.push({ x, y: y + i });
      }
    }
    
    return cells;
  }

  private static checkAndStartGame(gameId: string): void {
    const game = DB.games[gameId];
    if (!game) {
      return;
    }

    const bothPlayersReady = Object.values(game.playerGameIds).every(playerGameId => 
      game.ships[playerGameId] && game.ships[playerGameId].length > 0
    );

    console.log('bothPlayersReady!!!: ', bothPlayersReady);

    if (bothPlayersReady) {
      const playerNames = Object.keys(game.playerGameIds);
      const randomPlayerName = playerNames[Math.floor(Math.random() * playerNames.length)];
      game.currentPlayerIndex = game.playerGameIds[randomPlayerName];

      console.log(JSON.stringify(game.playerGameIds))

      Object.entries(game.playerGameIds).forEach(([playerName, playerGameId]) => {
        console.log('CHECK START GAME', gameId, playerName, playerGameId);
        sendToPlayer(playerName, {
          type: 'start_game',
          data: JSON.stringify({
            ships: game.ships[playerGameId],
            currentPlayerIndex: playerGameId
          }),
          id: 0
        });

        sendToPlayer(playerName, {
          type: 'turn',
          data: JSON.stringify({
            currentPlayer: game.currentPlayerIndex
          }),
          id: 0
        });
      });
    }
  }

  private static checkAttack(game: Game, defendingPlayerGameId: string, x: number, y: number): 
    { status: 'miss' | 'shot' | 'killed'; 
      ship?: PlacedShip 
    } {
    
    const ships = game.ships[defendingPlayerGameId];
    
    for (const ship of ships) {
      const cellIndex = ship.cells.findIndex((cell) => cell.x === x && cell.y === y);
      if (cellIndex !== -1) {
        ship.hits[cellIndex] = true;
        
        if (ship.hits.every(hit => hit)) {
          return { status: 'killed', ship };
        } else {
          return { status: 'shot', ship };
        }
      }
    }
    
    return { status: 'miss' };
  }

  private static sendMissAroundShip(gameId: string, ship: PlacedShip, playerName: string): void {
    const game = DB.games[gameId];
    if (!game) return;

    const checkedCells = new Set<string>();
    
    ship.cells.forEach(cell => {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const checkX = cell.x + dx;
          const checkY = cell.y + dy;
          
          if (checkX < 0 || checkX >= 10 || checkY < 0 || checkY >= 10) continue;
          
          const cellKey = `${checkX},${checkY}`;
          
          if (checkedCells.has(cellKey) || 
              ship.cells.some(c => c.x === checkX && c.y === checkY)) {
            continue;
          }
          
          checkedCells.add(cellKey);
          
          sendToPlayer(gameId, {
            type: 'attack',
            data: JSON.stringify({
              position: { x: checkX, y: checkY },
              currentPlayer: game.currentPlayerIndex,
              status: 'miss'
            }),
            id: 0
          });
        }
      }
    });
  }

  private static checkGameFinished(game: Game, defendingPlayerGameId: string): boolean {
    const ships = game.ships[defendingPlayerGameId];
    return ships.every(ship => ship.hits.every(hit => hit));
  }

}