import { WebSocketWithPlayer } from "./ws-with-player.interface";

export interface DBModel {
  players: Record<string, Player>;
  rooms: Record<string, Room>;
  games: Record<string, Game>;
  sockets: Record<string, WebSocketWithPlayer>;
}

export interface Player {
  name: string;
  password: string;
  wins: number;
}

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface PlacedShip extends Ship {
  id: string;
  hits: boolean[];
  cells: { x: number; y: number }[];
}

export interface Room {
  roomId: string;
  players: string[];
  gameId?: string | null;
}

export interface Game {
  id: string;
  players: string[];
  playerGameIds: Record<string, string>;
  ships: Record<string, PlacedShip[]>;
  shots: Record<string, { x: number; y: number; status: 'miss' | 'shot' | 'killed' }[]>;
  currentPlayerIndex: string | null;
  finished: boolean;
  winner: string | null;
}